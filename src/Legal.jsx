export const SUPPORT_EMAIL = "ahmadwaliansari98@gmail.com"; // TODO: replace with your real support email
export const BUSINESS = "TradeAI";                      // TODO: replace with your legal/business name
export const LEGAL_PATHS = ["/terms", "/privacy", "/refund"];
const UPDATED = "November 2026";

const DOCS = {
  terms: { title: "Terms of Service", sections: [
    ["What TradeAI is", "TradeAI is a trading journal. You record your trades, notes and chart screenshots, view statistics, and chat with an AI coach about your own trading."],
    ["Not financial advice", "TradeAI and its AI coach provide educational information only. Nothing here is investment, financial, tax or legal advice. AI answers can be wrong or incomplete. Trading involves risk of loss, and you alone are responsible for your trading decisions."],
    ["Your account", "You must provide accurate information and keep your login secure. You are responsible for activity under your account. You must be at least 18 years old to use TradeAI."],
    ["Acceptable use", "Do not misuse the service: no attempts to break, overload or bypass its limits, no sharing of accounts, and no unlawful content."],
    ["Plans and billing", "The Free plan includes 10 trades. The Pro plan costs $4.99 per month and renews automatically every month until you cancel. Payments are processed by Stripe. You can cancel at any time in Settings under Manage billing. We may change prices with advance notice before your next renewal."],
    ["Your content", "You own your trades, notes and screenshots. You give us permission to store and process them only to provide the service to you."],
    ["Availability and liability", "The service is provided as is, without guarantees of uninterrupted operation. To the extent allowed by law, we are not liable for indirect losses, including trading losses, arising from use of the service."],
    ["Termination", "You can delete your account at any time in Settings. We may suspend accounts that break these terms."],
    ["Changes and contact", `We may update these terms and will change the date above when we do. Questions: ${SUPPORT_EMAIL}.`],
  ]},
  privacy: { title: "Privacy Policy", sections: [
    ["What we collect", "Your email and display name; the trades, notes and screenshots you enter; feedback you send; and usage counts such as daily AI messages. If you sign in with Google, we receive your name and email from Google."],
    ["Payments", "Payments are handled by Stripe. We never see or store your card number. We keep a Stripe customer ID and your subscription status."],
    ["AI processing", "When you use the AI coach, your message and related trade details are sent to third-party AI providers (through OpenRouter) to generate an answer. Do not put information in your notes that you do not want processed this way."],
    ["Where your data lives", "Accounts and data are stored with Google Firebase. The website runs on Vercel. These providers process data on our behalf."],
    ["What we do not do", "We do not sell your personal data and we do not use advertising trackers. We use only the storage needed to keep you signed in."],
    ["Your choices", "In Settings you can edit your profile, export all trades as CSV and permanently delete your account and data. You can also contact us to request access or deletion."],
    ["Retention", "We keep your data while your account is open. When you delete your account, your trades and profile are removed."],
    ["Contact", `Privacy questions: ${SUPPORT_EMAIL}.`],
  ]},
  refund: { title: "Refund & Cancellation Policy", sections: [
    ["Cancel any time", "You can cancel your Pro subscription at any time in Settings under Manage billing. Your Pro access continues until the end of the period you already paid for, and you will not be charged again."],
    ["Refunds", "Because Pro is a monthly digital service, we do not refund partial months after a renewal, except where the law requires it."],
    ["Charged by mistake", `If you were charged by mistake or twice, contact ${SUPPORT_EMAIL} within 14 days of the charge and we will review it and refund you where appropriate.`],
    ["Free plan", "You can try TradeAI free with up to 10 trades before deciding to upgrade."],
  ]},
};

export function PublicNav() {
  return (
    <div className="pub-nav">
      <a className="pub-logo" href="/">TradeAI</a>
      <div className="pub-links">
        <a href="/#pricing">Pricing</a>
        <a href="/login">Sign in</a>
        <a className="btn btn-primary btn-sm" href="/signup">Get started</a>
      </div>
    </div>
  );
}

export function PublicFooter() {
  return (
    <div className="pub-foot">
      <div className="pub-foot-links">
        <a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/refund">Refunds</a><a href={`mailto:${SUPPORT_EMAIL}`}>Contact</a>
      </div>
      <div>TradeAI is a journaling tool, not financial advice. Trading involves risk. © {new Date().getFullYear()} {BUSINESS}</div>
    </div>
  );
}

export default function LegalPage({ page }) {
  const doc = DOCS[page];
  return (
    <div className="pub">
      <PublicNav />
      <div className="legal">
        <h1>{doc.title}</h1>
        <div className="legal-date">Last updated: {UPDATED}</div>
        {doc.sections.map(([h, p]) => (<div key={h}><h2>{h}</h2><p>{p}</p></div>))}
      </div>
      <PublicFooter />
    </div>
  );
}
