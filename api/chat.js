import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const clean = (v) => (v || "").trim().replace(/^["']+|["']+$/g, "").trim();
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(clean(process.env.FIREBASE_ADMIN_KEY))) });
const db = getFirestore();

const MODEL = "anthropic/claude-sonnet-5.5"; // change here to switch models
const LIMITS = { free: 15, pro: 100 };        // AI messages per user per day
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyCOyR4hfM4YjuFG2qte5SFljspZwQYpaug"; // public web key

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const key = clean(process.env.OPENROUTER_API_KEY);
    if (!key) return res.status(500).json({ error: "OPENROUTER_API_KEY is missing in Vercel" });

    const { idToken, messages } = req.body || {};
    const who = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }),
    }).then((r) => r.json());
    const uid = who.users?.[0]?.localId;
    if (!uid) return res.status(401).json({ error: "Please sign in again" });

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 12 ||
        messages.some((m) => !["system", "user", "assistant"].includes(m.role) || typeof m.content !== "string" || m.content.length > 4000)) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const user = await db.collection("users").doc(uid).get();
    const limit = user.exists && user.data().isPro ? LIMITS.pro : LIMITS.free;
    const ref = db.collection("aiUsage").doc(`${uid}_${new Date().toISOString().slice(0, 10)}`);
    try {
      await db.runTransaction(async (t) => {
        const s = await t.get(ref);
        const n = s.exists ? s.data().count : 0;
        if (n >= limit) throw new Error("LIMIT");
        t.set(ref, { uid, count: n + 1 }, { merge: true });
      });
    } catch (e) {
      if (e.message === "LIMIT") return res.status(429).json({ error: `Daily AI limit reached (${limit} messages). Try again tomorrow.` });
      throw e;
    }

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: MODEL, max_tokens: 2000, messages }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.error) return res.status(502).json({ error: d.error?.message || `OpenRouter error ${r.status}` });
    return res.status(200).json({ content: d.choices?.[0]?.message?.content || "" });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Unknown server error" });
  }
}
