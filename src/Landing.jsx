import { PublicNav, PublicFooter } from "./Legal";

const FEATURES = [
  ["Log in seconds", "Ticker, entry, exit, size, setup and the emotion you felt. P&L is calculated for you."],
  ["Chart screenshots", "Attach the chart to every trade so you can review exactly what you saw."],
  ["Clear analytics", "Equity curve, win rate, profit factor, and results by setup and by emotion."],
  ["AI trading coach", "Ask about your patterns. Get direct feedback on each trade and your habits."],
  ["Private by design", "Your journal is yours. Export everything or delete your account any time."],
  ["Works on any screen", "A clean layout for desktop and phone, so you can journal right after a trade."],
];
const FAQ = [
  ["Is this financial advice?", "No. TradeAI is a journaling and education tool. The AI coach can be wrong, and every decision stays yours."],
  ["Is my data private?", "Your trades are tied to your account and only you can read them. You can export or delete them in Settings."],
  ["Can I cancel Pro?", "Yes, any time in Settings. You keep Pro until the end of the period you paid for."],
];

export default function Landing() {
  return (
    <div className="pub">
      <PublicNav />
      <div className="hero">
        <div className="hero-tag">AI TRADE JOURNAL</div>
        <h1>Know why you win.<br /><em>Fix why you lose.</em></h1>
        <p>TradeAI records your trades, reveals patterns in your setups and emotions, and coaches you with AI, so every trade teaches you something.</p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="/signup">Start free · 10 trades included</a>
          <a className="btn btn-ghost" href="/login">Sign in</a>
        </div>
      </div>

      <div className="pub-sec">
        <div className="feat-grid">
          {FEATURES.map(([t, d]) => (<div key={t} className="feat"><h3>{t}</h3><p>{d}</p></div>))}
        </div>
      </div>

      <div className="pub-sec" id="pricing">
        <h2 className="pub-h2">Simple pricing</h2>
        <div className="price-grid">
          <div className="price-card">
            <div className="price-name">Free</div>
            <div className="price-amt">$0</div>
            <ul><li>10 trades</li><li>Analytics and screenshots</li><li>15 AI messages per day</li></ul>
            <a className="btn btn-ghost" href="/signup">Start free</a>
          </div>
          <div className="price-card pro">
            <div className="price-name">Pro</div>
            <div className="price-amt">$4.99<span>/month</span></div>
            <ul><li>Unlimited trades</li><li>Analytics and screenshots</li><li>100 AI messages per day</li><li>Cancel any time</li></ul>
            <a className="btn btn-primary" href="/signup">Get Pro</a>
          </div>
        </div>
      </div>

      <div className="pub-sec narrow">
        <h2 className="pub-h2">Questions</h2>
        {FAQ.map(([q, a]) => (<div key={q} className="faq"><h3>{q}</h3><p>{a}</p></div>))}
      </div>
      <PublicFooter />
    </div>
  );
}
