import Stripe from "stripe";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { credential } from "firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!getApps().length) {
  initializeApp({ credential: credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY)) });
}
const db = getFirestore();

export default async function handler(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.userId;
    await db.collection("users").doc(userId).set({ isPro: true, subscriptionId: session.subscription }, { merge: true });
  }
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    const snap = await db.collection("users").where("subscriptionId", "==", sub.id).get();
    snap.forEach(d => d.ref.set({ isPro: false }, { merge: true }));
  }
  res.json({ received: true });
}