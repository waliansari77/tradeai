import Stripe from "stripe";

// Removes spaces, line breaks and quotes that sneak in when pasting values
const clean = (v) => (v || "").trim().replace(/^["']+|["']+$/g, "").trim();

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const secret = clean(process.env.STRIPE_SECRET_KEY);
    const price = clean(process.env.STRIPE_PRICE_ID || process.env.VITE_STRIPE_PRICE_ID);

    if (!secret) {
      return res.status(500).json({ error: "STRIPE_SECRET_KEY is missing in Vercel environment variables" });
    }
    if (!secret.startsWith("sk_")) {
      return res.status(500).json({ error: "STRIPE_SECRET_KEY must start with sk_test_ (you may have pasted the publishable pk_ key)" });
    }
    if (!price) {
      return res.status(500).json({ error: "VITE_STRIPE_PRICE_ID is missing in Vercel environment variables" });
    }
    if (!price.startsWith("price_")) {
      return res.status(500).json({ error: "VITE_STRIPE_PRICE_ID must start with price_ (not prod_)" });
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
    const detail = e.detail?.message || e.raw?.message || "";
    return res.status(500).json({
      error: (e.message || "Unknown server error") + (detail ? " | " + detail : ""),
    });
  }
}
