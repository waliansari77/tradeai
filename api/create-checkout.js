import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { userId, email } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: process.env.VITE_STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${req.headers.origin}/?success=true&uid=${userId}`,
      cancel_url: `${req.headers.origin}/?cancelled=true`,
      customer_email: email,
      metadata: { userId },
    });
    res.status(200).json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}