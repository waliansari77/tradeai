import Stripe from "stripe";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    const price = process.env.STRIPE_PRICE_ID || process.env.VITE_STRIPE_PRICE_ID;

    if (!secret) {
      return res.status(500).json({ error: "STRIPE_SECRET_KEY is missing in Vercel environment variables" });
    }
    if (!price) {
      return res.status(500).json({ error: "VITE_STRIPE_PRICE_ID is missing in Vercel environment variables" });
    }

    const stripe = new Stripe(secret);
    const { userId, email } = req.body || {};
    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${origin}/?success=true&uid=${userId}`,
      cancel_url: `${origin}/?cancelled=true`,
      customer_email: email,
      metadata: { userId },
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Unknown server error" });
  }
}
