import Stripe from "stripe";

const clean = (v) => (v || "").trim().replace(/^["']+|["']+$/g, "").trim();
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyCOyR4hfM4YjuFG2qte5SFljspZwQYpaug"; // public web key

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const secret = clean(process.env.STRIPE_SECRET_KEY);
    if (!secret) return res.status(500).json({ error: "STRIPE_SECRET_KEY is missing in Vercel" });

    // Verify who is calling: ask Firebase to validate the login token
    const { idToken } = req.body || {};
    if (!idToken) return res.status(401).json({ error: "Not signed in" });
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const info = await r.json();
    const email = info.users?.[0]?.email;
    if (!email) return res.status(401).json({ error: "Invalid login session" });

    const stripe = new Stripe(secret);
    const found = await stripe.customers.list({ email, limit: 1 });
    if (!found.data.length) return res.status(404).json({ error: "No billing account found for this email yet" });

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.billingPortal.sessions.create({ customer: found.data[0].id, return_url: origin + "/" });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Unknown server error" });
  }
}
