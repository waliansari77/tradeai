import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const clean = (v) => (v || "").trim().replace(/^["']+|["']+$/g, "").trim();
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(clean(process.env.FIREBASE_ADMIN_KEY))) });
const db = getFirestore();

export const config = { api: { bodyParser: false } };

const raw = (req) => new Promise((ok, bad) => {
  const c = [];
  req.on("data", (d) => c.push(d));
  req.on("end", () => ok(Buffer.concat(c)));
  req.on("error", bad);
});

async function setBySub(subId, data) {
  const snap = await db.collection("users").where("subscriptionId", "==", subId).get();
  const b = db.batch();
  snap.forEach((d) => b.set(d.ref, data, { merge: true }));
  await b.commit();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const stripe = new Stripe(clean(process.env.STRIPE_SECRET_KEY));
  let event;
  try {
    event = stripe.webhooks.constructEvent(await raw(req), req.headers["stripe-signature"], clean(process.env.STRIPE_WEBHOOK_SECRET));
  } catch (e) {
    return res.status(400).send("Webhook Error: " + e.message);
  }
  try {
    const o = event.data.object;
    if (event.type === "checkout.session.completed") {
      const uid = o.metadata?.userId;
      if (uid) await db.collection("users").doc(uid).set({ isPro: true, subscriptionId: o.subscription, stripeCustomerId: o.customer, subscribedAt: Date.now() }, { merge: true });
    } else if (event.type === "customer.subscription.updated") {
      await setBySub(o.id, { isPro: ["active", "trialing"].includes(o.status) });
    } else if (event.type === "customer.subscription.deleted") {
      await setBySub(o.id, { isPro: false });
    } else if (event.type === "invoice.paid") {
      const sub = o.subscription || o.parent?.subscription_details?.subscription;
      if (sub) await setBySub(sub, { isPro: true });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
  res.json({ received: true });
}
