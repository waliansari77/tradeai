import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth, onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, updateProfile
} from "firebase/auth";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy
} from "firebase/firestore";

// ── Firebase ─────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCOyR4hfM4YjuFG2qte5SFljspZwQYpaug",
  authDomain: "tradeai-af801.firebaseapp.com",
  projectId: "tradeai-af801",
  storageBucket: "tradeai-af801.firebasestorage.app",
  messagingSenderId: "425197538307",
  appId: "1:425197538307:web:f1321f1a70a53389c11236",
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// ── OpenRouter ───────────────────────────────────────────────
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_KEY; // 🔑 Replace with your OpenRouter key

// ── Styles ───────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #080c0f; --surface: #0d1318; --surface2: #111920;
    --border: #1a2530; --border2: #243040;
    --accent: #00e5a0; --accent2: #00b8ff; --red: #ff4560; --yellow: #ffd166;
    --text: #e8f0f8; --muted: #5a7a8a; --muted2: #3a5060;
    --font: 'Syne', sans-serif; --mono: 'JetBrains Mono', monospace;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font); min-height: 100vh; overflow-x: hidden; }
  .app { display: flex; min-height: 100vh; }

  /* AUTH */
  .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); position:relative; overflow:hidden; }
  .auth-bg-glow { position:absolute; width:600px; height:600px; border-radius:50%; background:radial-gradient(circle,rgba(0,229,160,0.07) 0%,transparent 70%); top:50%; left:50%; transform:translate(-50%,-50%); pointer-events:none; }
  .auth-card { background:var(--surface); border:1px solid var(--border2); border-radius:20px; padding:40px 36px; width:420px; max-width:95vw; position:relative; z-index:1; }
  .auth-logo { font-size:26px; font-weight:800; letter-spacing:-0.5px; margin-bottom:4px; }
  .auth-logo span { color:var(--accent); }
  .auth-subtitle { font-family:var(--mono); font-size:11px; color:var(--muted); margin-bottom:28px; }
  .auth-tabs { display:flex; background:var(--surface2); border-radius:10px; padding:3px; margin-bottom:24px; }
  .auth-tab { flex:1; padding:8px; text-align:center; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; color:var(--muted); transition:all 0.15s; }
  .auth-tab.active { background:var(--surface); color:var(--text); box-shadow:0 1px 4px rgba(0,0,0,0.3); }
  .auth-field { margin-bottom:14px; }
  .auth-field label { display:block; font-family:var(--mono); font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
  .auth-field input { width:100%; background:var(--surface2); border:1px solid var(--border2); border-radius:10px; padding:11px 14px; color:var(--text); font-family:var(--font); font-size:14px; outline:none; transition:border-color 0.15s; }
  .auth-field input:focus { border-color:var(--accent); }
  .auth-field input::placeholder { color:var(--muted2); }
  .auth-btn { width:100%; padding:12px; border-radius:10px; border:none; cursor:pointer; font-family:var(--font); font-size:15px; font-weight:700; transition:all 0.15s; margin-top:4px; }
  .auth-btn-primary { background:var(--accent); color:#000; }
  .auth-btn-primary:hover { background:#00ffb3; transform:translateY(-1px); }
  .auth-btn-primary:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
  .auth-divider { display:flex; align-items:center; gap:12px; margin:16px 0; }
  .auth-divider-line { flex:1; height:1px; background:var(--border); }
  .auth-divider-text { font-size:11px; color:var(--muted); font-family:var(--mono); }
  .auth-btn-google { width:100%; padding:11px; border-radius:10px; border:1px solid var(--border2); background:var(--surface2); color:var(--text); cursor:pointer; font-family:var(--font); font-size:14px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:10px; transition:all 0.15s; }
  .auth-btn-google:hover { border-color:var(--accent2); background:rgba(0,184,255,0.05); }
  .auth-error { background:rgba(255,69,96,0.1); border:1px solid rgba(255,69,96,0.3); border-radius:8px; padding:10px 13px; font-size:12px; color:var(--red); margin-bottom:14px; }

  /* SIDEBAR */
  .sidebar { width:220px; min-height:100vh; background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; position:fixed; top:0; left:0; z-index:100; padding:24px 0; }
  .logo { padding:0 24px 28px; border-bottom:1px solid var(--border); }
  .logo-text { font-size:20px; font-weight:800; letter-spacing:-0.5px; }
  .logo-text span { color:var(--accent); }
  .logo-sub { font-family:var(--mono); font-size:10px; color:var(--muted); margin-top:2px; }
  .nav { padding:20px 12px; flex:1; }
  .nav-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; cursor:pointer; font-size:14px; font-weight:500; color:var(--muted); transition:all 0.15s; margin-bottom:2px; }
  .nav-item:hover { background:var(--surface2); color:var(--text); }
  .nav-item.active { background:rgba(0,229,160,0.1); color:var(--accent); }
  .nav-icon { font-size:16px; width:20px; text-align:center; }
  .sidebar-bottom { padding:14px 16px; border-top:1px solid var(--border); }
  .sidebar-pnl-label { font-size:11px; font-family:var(--mono); color:var(--muted); margin-bottom:4px; }
  .sidebar-pnl { font-size:20px; font-weight:800; margin-bottom:14px; }
  .sidebar-user-name { font-size:13px; font-weight:700; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sidebar-user-email { font-family:var(--mono); font-size:10px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:10px; }
  .sign-out-btn { width:100%; padding:7px; border-radius:8px; border:1px solid var(--border2); background:transparent; color:var(--muted); font-family:var(--font); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s; }
  .sign-out-btn:hover { color:var(--red); border-color:rgba(255,69,96,0.4); background:rgba(255,69,96,0.05); }

  /* MAIN */
  .main { margin-left:220px; flex:1; padding:32px 36px; }
  .page-header { margin-bottom:32px; display:flex; align-items:flex-start; justify-content:space-between; }
  .page-title { font-size:28px; font-weight:800; letter-spacing:-0.5px; }
  .page-sub { color:var(--muted); font-size:14px; margin-top:4px; font-family:var(--mono); }

  /* STATS */
  .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px; }
  .stat-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:20px; position:relative; overflow:hidden; }
  .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
  .stat-card.green::before { background:var(--accent); }
  .stat-card.blue::before { background:var(--accent2); }
  .stat-card.red::before { background:var(--red); }
  .stat-card.yellow::before { background:var(--yellow); }
  .stat-label { font-family:var(--mono); font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; }
  .stat-value { font-size:26px; font-weight:800; margin-top:6px; }
  .stat-value.green{color:var(--accent);} .stat-value.red{color:var(--red);} .stat-value.blue{color:var(--accent2);} .stat-value.yellow{color:var(--yellow);}
  .stat-change { font-family:var(--mono); font-size:11px; margin-top:4px; color:var(--muted); }

  /* TRADE CARDS */
  .trade-cards-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; }
  .trade-card { background:var(--surface); border:1px solid var(--border); border-radius:14px; overflow:hidden; cursor:pointer; transition:border-color 0.18s,transform 0.18s; position:relative; }
  .trade-card:hover { border-color:var(--accent2); transform:translateY(-2px); }
  .trade-card-img { width:100%; height:130px; object-fit:cover; display:block; }
  .trade-card-img-placeholder { width:100%; height:130px; display:flex; align-items:center; justify-content:center; background:var(--surface2); border-bottom:1px solid var(--border); font-size:32px; color:var(--muted2); }
  .trade-card-top-badge { position:absolute; top:10px; left:10px; padding:3px 9px; border-radius:6px; font-size:11px; font-weight:700; font-family:var(--mono); backdrop-filter:blur(6px); }
  .trade-card-top-badge.long { background:rgba(0,229,160,0.85); color:#000; }
  .trade-card-top-badge.short { background:rgba(255,69,96,0.85); color:#fff; }
  .trade-card-actions { position:absolute; top:8px; right:8px; display:flex; gap:4px; opacity:0; transition:opacity 0.15s; }
  .trade-card:hover .trade-card-actions { opacity:1; }
  .card-action-btn { width:28px; height:28px; border-radius:6px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:13px; }
  .card-action-btn.edit { background:rgba(0,184,255,0.9); color:#000; }
  .card-action-btn.del { background:rgba(255,69,96,0.9); color:#fff; }
  .trade-card-body { padding:14px; }
  .trade-card-ticker { font-family:var(--mono); font-weight:800; font-size:18px; margin-bottom:4px; }
  .trade-card-pnl { font-family:var(--mono); font-size:15px; font-weight:700; margin-bottom:8px; }
  .trade-card-pnl.pos{color:var(--accent);} .trade-card-pnl.neg{color:var(--red);}
  .trade-card-meta { display:flex; gap:6px; flex-wrap:wrap; }
  .meta-chip { font-size:10px; font-family:var(--mono); padding:2px 7px; border-radius:4px; background:var(--surface2); color:var(--muted); border:1px solid var(--border); }

  /* PANEL */
  .panel { background:var(--surface); border:1px solid var(--border); border-radius:12px; }
  .panel-header { padding:18px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
  .panel-title { font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:1px; }

  /* BUTTONS */
  .btn { padding:8px 16px; border-radius:8px; border:none; cursor:pointer; font-family:var(--font); font-size:13px; font-weight:600; transition:all 0.15s; }
  .btn-primary { background:var(--accent); color:#000; }
  .btn-primary:hover { background:#00ffb3; transform:translateY(-1px); }
  .btn-ghost { background:transparent; color:var(--muted); border:1px solid var(--border2); }
  .btn-ghost:hover { color:var(--text); background:var(--surface2); }
  .btn-danger { background:rgba(255,69,96,0.15); color:var(--red); border:1px solid rgba(255,69,96,0.3); }
  .btn-danger:hover { background:rgba(255,69,96,0.25); }
  .btn-blue { background:rgba(0,184,255,0.15); color:var(--accent2); border:1px solid rgba(0,184,255,0.3); }
  .btn-blue:hover { background:rgba(0,184,255,0.25); }
  .btn-sm { padding:5px 12px; font-size:12px; }
  .badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; font-family:var(--mono); }
  .badge.long{background:rgba(0,229,160,0.15);color:var(--accent);}
  .badge.short{background:rgba(255,69,96,0.15);color:var(--red);}

  /* AI CHAT */
  .ai-chat { flex:1; padding:16px; overflow-y:auto; max-height:440px; display:flex; flex-direction:column; gap:12px; }
  .ai-msg { display:flex; gap:10px; }
  .ai-avatar { width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,var(--accent),var(--accent2)); display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; margin-top:2px; }
  .user-avatar { width:28px; height:28px; border-radius:50%; background:var(--surface2); border:1px solid var(--border2); display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; margin-top:2px; }
  .msg-bubble { background:var(--surface2); border:1px solid var(--border); border-radius:10px; padding:10px 13px; font-size:13px; line-height:1.6; color:var(--text); flex:1; }
  .msg-bubble.user { background:rgba(0,229,160,0.08); border-color:rgba(0,229,160,0.2); }
  .ai-input-row { padding:14px; border-top:1px solid var(--border); display:flex; gap:8px; }
  .ai-input { flex:1; background:var(--surface2); border:1px solid var(--border2); border-radius:8px; padding:9px 13px; color:var(--text); font-family:var(--font); font-size:13px; outline:none; transition:border-color 0.15s; }
  .ai-input:focus { border-color:var(--accent); }
  .ai-input::placeholder { color:var(--muted2); }
  .typing { display:flex; gap:4px; align-items:center; padding:4px 0; }
  .dot { width:6px; height:6px; border-radius:50%; background:var(--accent); animation:bounce 1.2s infinite; }
  .dot:nth-child(2){animation-delay:0.2s;} .dot:nth-child(3){animation-delay:0.4s;}
  @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}

  /* MODALS */
  .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:200; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px); }
  .modal { background:var(--surface); border:1px solid var(--border2); border-radius:16px; padding:28px; width:600px; max-width:96vw; max-height:92vh; overflow-y:auto; }
  .modal-title { font-size:18px; font-weight:800; margin-bottom:20px; }
  .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .form-group { display:flex; flex-direction:column; gap:6px; }
  .form-group.full { grid-column:1/-1; }
  label { font-size:11px; font-family:var(--mono); color:var(--muted); text-transform:uppercase; letter-spacing:1px; }
  input,select,textarea { background:var(--surface2); border:1px solid var(--border2); border-radius:8px; padding:9px 13px; color:var(--text); font-family:var(--font); font-size:14px; outline:none; transition:border-color 0.15s; }
  input:focus,select:focus,textarea:focus { border-color:var(--accent); }
  select option { background:var(--surface2); }
  textarea { resize:vertical; min-height:80px; }
  .modal-actions { display:flex; gap:10px; margin-top:20px; justify-content:flex-end; }
  .upload-zone { border:2px dashed var(--border2); border-radius:10px; padding:20px; text-align:center; cursor:pointer; transition:all 0.15s; position:relative; }
  .upload-zone:hover { border-color:var(--accent); background:rgba(0,229,160,0.04); }
  .upload-zone input[type=file] { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
  .upload-zone-text { font-size:13px; color:var(--muted); }
  .upload-zone-icon { font-size:24px; margin-bottom:6px; }
  .screenshot-preview { position:relative; border-radius:8px; overflow:hidden; border:1px solid var(--border2); }
  .screenshot-preview img { width:100%; max-height:200px; object-fit:cover; display:block; }
  .screenshot-remove { position:absolute; top:6px; right:6px; background:rgba(0,0,0,0.75); border:none; color:white; border-radius:50%; width:26px; height:26px; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; }

  /* DETAIL MODAL */
  .detail-modal { background:var(--surface); border:1px solid var(--border2); border-radius:16px; width:640px; max-width:96vw; max-height:92vh; overflow-y:auto; }
  .detail-header { padding:22px 24px 0; display:flex; justify-content:space-between; align-items:flex-start; }
  .detail-chart { width:100%; max-height:260px; object-fit:cover; display:block; cursor:pointer; }
  .detail-chart-placeholder { width:100%; height:160px; background:var(--surface2); display:flex; align-items:center; justify-content:center; font-size:40px; color:var(--muted2); }
  .detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:20px 24px; }
  .detail-cell { background:var(--surface2); border-radius:8px; padding:10px 14px; }
  .detail-cell-label { font-family:var(--mono); font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; }
  .detail-cell-val { font-weight:700; margin-top:4px; font-size:15px; }
  .detail-notes { margin:0 24px 16px; background:var(--surface2); border-radius:8px; padding:14px; font-size:13px; line-height:1.7; }
  .detail-actions { padding:0 24px 24px; display:flex; gap:10px; }

  /* CONFIRM */
  .confirm-box { background:var(--surface); border:1px solid var(--red); border-radius:14px; padding:28px; width:360px; max-width:95vw; text-align:center; }
  .confirm-title { font-size:17px; font-weight:800; margin-bottom:8px; }
  .confirm-sub { font-size:13px; color:var(--muted); margin-bottom:22px; }
  .confirm-actions { display:flex; gap:10px; justify-content:center; }

  /* PERF */
  .perf-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; }
  .bar-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; font-size:12px; }
  .bar-track { flex:1; height:6px; background:var(--border); border-radius:3px; overflow:hidden; }
  .bar-fill { height:100%; border-radius:3px; }
  .equity-chart { padding:20px; }

  /* LIGHTBOX */
  .lightbox { position:fixed; inset:0; background:rgba(0,0,0,0.93); z-index:400; display:flex; align-items:center; justify-content:center; }
  .lightbox img { max-width:90vw; max-height:90vh; border-radius:8px; }
  .lightbox-close { position:absolute; top:20px; right:24px; background:none; border:none; color:white; font-size:30px; cursor:pointer; }

  /* TOAST */
  .toast { position:fixed; bottom:24px; right:24px; background:var(--surface); border:1px solid var(--accent); border-radius:10px; padding:12px 18px; font-size:13px; color:var(--accent); z-index:999; animation:slideIn 0.3s ease; }
  @keyframes slideIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}

  .empty { padding:40px; text-align:center; color:var(--muted); }
  .empty-icon { font-size:36px; margin-bottom:10px; }
  ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px;}
  .loading-screen { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); font-family:var(--mono); color:var(--muted); font-size:14px; flex-direction:column; gap:12px; }
  .spinner { width:32px; height:32px; border:3px solid var(--border2); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite; }
  @keyframes spin{to{transform:rotate(360deg)}}
  .saving-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--accent); margin-left:6px; animation:pulse 1.2s infinite; }
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
`;

const EMOTIONS = ["Confident","Calm","Disciplined","FOMO","Anxious","Greedy","Revenge","Patient"];
const SETUPS   = ["Trend Follow","Breakout","Breakdown","Momentum","Reversal","Catalyst","Scalp","Swing"];
const WELCOME_MSG = { role:"ai", text:"👋 Hi! I'm your AI trading coach. Ask me about your trades, patterns, or psychology — or use 'Quick Analyze' below!" };
const EMPTY_FORM  = { date:new Date().toISOString().slice(0,10), ticker:"", direction:"long", entry:"", exit:"", shares:"", emotion:"Confident", setup:"Breakout", notes:"", screenshot:null };

const callAI = async (messages) => {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method:"POST",
    headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${OPENROUTER_KEY}`, "HTTP-Referer":"http://localhost:5173" },
    body: JSON.stringify({ model:"anthropic/claude-sonnet-4", max_tokens:1000, messages }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Unable to get a response. Check your API key.";
};

// ── AUTH PAGE ─────────────────────────────────────────────────
function AuthPage() {
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const friendlyError = (code) => ({
    "auth/email-already-in-use":"This email is already registered. Try logging in.",
    "auth/invalid-email":"Please enter a valid email address.",
    "auth/weak-password":"Password must be at least 6 characters.",
    "auth/user-not-found":"No account found with this email.",
    "auth/wrong-password":"Incorrect password. Try again.",
    "auth/invalid-credential":"Invalid email or password.",
    "auth/popup-closed-by-user":"Google sign-in was cancelled.",
  }[code] || "Something went wrong. Please try again.");

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      if (tab==="signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch(e) { setError(friendlyError(e.code)); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try { await signInWithPopup(auth, googleProvider); }
    catch(e) { setError(friendlyError(e.code)); }
    setLoading(false);
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="auth-page">
        <div className="auth-bg-glow"/>
        <div className="auth-card">
          <div className="auth-logo">Trade<span>AI</span></div>
          <div className="auth-subtitle">// your ai-powered trading journal</div>
          <div className="auth-tabs">
            <div className={`auth-tab ${tab==="login"?"active":""}`} onClick={()=>{setTab("login");setError("");}}>Sign In</div>
            <div className={`auth-tab ${tab==="signup"?"active":""}`} onClick={()=>{setTab("signup");setError("");}}>Sign Up</div>
          </div>
          {error && <div className="auth-error">⚠️ {error}</div>}
          {tab==="signup" && <div className="auth-field"><label>Full Name</label><input placeholder="John Doe" value={name} onChange={e=>setName(e.target.value)}/></div>}
          <div className="auth-field"><label>Email</label><input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/></div>
          <div className="auth-field"><label>Password</label><input type="password" placeholder={tab==="signup"?"At least 6 characters":"••••••••"} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/></div>
          <button className="auth-btn auth-btn-primary" onClick={handleSubmit} disabled={loading}>{loading?"Please wait...":tab==="signup"?"Create Account":"Sign In"}</button>
          <div className="auth-divider"><div className="auth-divider-line"/><div className="auth-divider-text">OR</div><div className="auth-divider-line"/></div>
          <button className="auth-btn-google" onClick={handleGoogle} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>
        </div>
      </div>
    </>
  );
}

// ── ROOT ─────────────────────────────────────────────────────
export default function Root() {
  const [user, setUser] = useState(undefined);
  useEffect(() => { const unsub = onAuthStateChanged(auth, u => setUser(u)); return unsub; }, []);
  if (user === undefined) return (<><style>{STYLES}</style><div className="loading-screen"><div className="spinner"/><span>Loading TradeAI...</span></div></>);
  if (!user) return <AuthPage/>;
  return <Journal user={user}/>;
}

// ── JOURNAL ───────────────────────────────────────────────────
function Journal({ user }) {
  const [page, setPage]               = useState("journal");
  const [trades, setTrades]           = useState([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [detailTrade, setDetailTrade] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [messages, setMessages]       = useState([WELCOME_MSG]);
  const [input, setInput]             = useState("");
  const [aiLoading, setAiLoading]     = useState(false);
  const [toast, setToast]             = useState(null);
  const [lightbox, setLightbox]       = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const chatRef = useRef(null);

  // ── Firestore: real-time listener for this user's trades ──
  useEffect(() => {
    const q = query(
      collection(db, "users", user.uid, "trades"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setTrades(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTradesLoading(false);
    });
    return unsub;
  }, [user.uid]);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages, aiLoading]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const openAdd  = () => { setEditingTrade(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (trade, e) => { e?.stopPropagation(); setEditingTrade(trade); setForm({ ...trade }); setShowModal(true); };

  const handleScreenshot = (file, cb) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => cb(e.target.result);
    r.readAsDataURL(file);
  };

  // ── Save trade to Firestore ───────────────────────────────
  const saveTrade = async () => {
    if (!form.ticker || !form.entry || !form.exit || !form.shares) return;
    const pnl = Math.round(
      (parseFloat(form.exit) - parseFloat(form.entry)) *
      parseInt(form.shares) *
      (form.direction === "short" ? -1 : 1)
    );
    setSaving(true);
    try {
      const tradeData = {
        ...form,
        entry: +form.entry, exit: +form.exit, shares: +form.shares, pnl,
        uid: user.uid,
      };
      if (editingTrade) {
        await updateDoc(doc(db, "users", user.uid, "trades", editingTrade.id), { ...tradeData, updatedAt: Date.now() });
        showToast("✓ Trade updated");
        // update detailTrade if open
        if (detailTrade?.id === editingTrade.id) setDetailTrade({ id: editingTrade.id, ...tradeData });
      } else {
        tradeData.createdAt = Date.now();
        const ref = await addDoc(collection(db, "users", user.uid, "trades"), tradeData);
        showToast("✓ Trade saved to database");
        setTimeout(() => analyzeTradeAI({ id: ref.id, ...tradeData }), 600);
      }
    } catch(e) {
      showToast("❌ Save failed: " + e.message);
    }
    setSaving(false);
    setShowModal(false);
    setForm(EMPTY_FORM);
    setEditingTrade(null);
  };

  // ── Delete trade from Firestore ───────────────────────────
  const deleteTrade = async (id) => {
    try {
      await deleteDoc(doc(db, "users", user.uid, "trades", id));
      showToast("🗑 Trade deleted");
    } catch(e) { showToast("❌ Delete failed"); }
    setConfirmDelete(null);
    setDetailTrade(null);
  };

  // ── AI ────────────────────────────────────────────────────
  const analyzeTradeAI = async (trade) => {
    setPage("ai"); setDetailTrade(null);
    setMessages(prev => [...prev, { role:"user", text:`Analyze my ${trade.ticker} trade (P&L: ${trade.pnl>=0?"+":""}$${trade.pnl})` }]);
    setAiLoading(true);
    try {
      const reply = await callAI([
        { role:"system", content:"You are an expert stock trading coach. Be concise (3-4 sentences), direct, and actionable." },
        { role:"user", content:`Analyze this trade:\n\n${trade.ticker} | ${trade.direction.toUpperCase()} | Entry: $${trade.entry} | Exit: $${trade.exit} | Shares: ${trade.shares} | P&L: $${trade.pnl} | Setup: ${trade.setup} | Emotion: ${trade.emotion} | Notes: "${trade.notes}"` }
      ]);
      setMessages(prev => [...prev, { role:"ai", text:reply }]);
    } catch { setMessages(prev => [...prev, { role:"ai", text:"Connection error. Check your OPENROUTER_KEY." }]); }
    setAiLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || aiLoading) return;
    const msg = input.trim(); setInput("");
    setMessages(prev => [...prev, { role:"user", text:msg }]);
    setAiLoading(true);
    const ctx = `${trades.length} trades. Win rate:${winRate}%. P&L:$${totalPnl}. Avg win:$${avgWin}. Avg loss:$${avgLoss}. R:R:${rr}.`;
    try {
      const reply = await callAI([
        { role:"system", content:`Expert stock trading coach. Concise, direct, actionable. Trader context: ${ctx}` },
        { role:"user", content:msg }
      ]);
      setMessages(prev => [...prev, { role:"ai", text:reply }]);
    } catch { setMessages(prev => [...prev, { role:"ai", text:"Connection error." }]); }
    setAiLoading(false);
  };

  // ── Stats ─────────────────────────────────────────────────
  const totalPnl = trades.reduce((s,t) => s+t.pnl, 0);
  const wins     = trades.filter(t => t.pnl>0);
  const losses   = trades.filter(t => t.pnl<0);
  const winRate  = trades.length ? Math.round((wins.length/trades.length)*100) : 0;
  const avgWin   = wins.length ? Math.round(wins.reduce((s,t)=>s+t.pnl,0)/wins.length) : 0;
  const avgLoss  = losses.length ? Math.round(losses.reduce((s,t)=>s+t.pnl,0)/losses.length) : 0;
  const rr       = avgLoss ? Math.abs((avgWin/avgLoss).toFixed(2)) : 0;

  // Equity curve
  const eqPts = (() => { let c=0; return [...trades].reverse().map((t,i)=>({x:i,y:(c+=t.pnl)})); })();
  const minY=Math.min(0,...eqPts.map(p=>p.y)), maxY=Math.max(1,...eqPts.map(p=>p.y));
  const W=320, H=80;
  const tx = x => (x/Math.max(1,eqPts.length-1))*W;
  const ty = y => H-((y-minY)/(maxY-minY))*H;
  const pathD = eqPts.map((p,i)=>`${i===0?"M":"L"}${tx(p.x)},${ty(p.y)}`).join(" ");
  const fillD = pathD+` L${tx(eqPts.length-1)},${H} L0,${H} Z`;

  const emotionBd = EMOTIONS.map(e=>({label:e,pnl:trades.filter(t=>t.emotion===e).reduce((s,t)=>s+t.pnl,0)})).filter(e=>trades.some(t=>t.emotion===e)).sort((a,b)=>b.pnl-a.pnl);
  const setupBd   = SETUPS.map(s=>({label:s,pnl:trades.filter(t=>t.setup===s).reduce((s,t)=>s+t.pnl,0)})).filter(s=>trades.some(t=>t.setup===s)).sort((a,b)=>b.pnl-a.pnl);
  const estPnl    = form.entry&&form.exit&&form.shares ? Math.round((parseFloat(form.exit)-parseFloat(form.entry))*parseInt(form.shares)*(form.direction==="short"?-1:1)) : null;
  const displayName = user.displayName || user.email?.split("@")[0] || "Trader";

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">

        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="logo"><div className="logo-text">Trade<span>AI</span></div><div className="logo-sub">// ai journal v1.0</div></div>
          <div className="nav">
            {[{id:"journal",icon:"📋",label:"Journal"},{id:"performance",icon:"📊",label:"Performance"},{id:"ai",icon:"🤖",label:"AI Coach"}].map(item=>(
              <div key={item.id} className={`nav-item ${page===item.id?"active":""}`} onClick={()=>setPage(item.id)}>
                <span className="nav-icon">{item.icon}</span>{item.label}
              </div>
            ))}
          </div>
          <div className="sidebar-bottom">
            <div className="sidebar-pnl-label">TOTAL P&L</div>
            <div className="sidebar-pnl" style={{color:totalPnl>=0?"var(--accent)":"var(--red)"}}>{totalPnl>=0?"+":""}${totalPnl.toLocaleString()}</div>
            <div className="sidebar-user-name">{displayName}</div>
            <div className="sidebar-user-email">{user.email}</div>
            <button className="sign-out-btn" onClick={()=>signOut(auth)}>Sign Out</button>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">

          {/* JOURNAL */}
          {page==="journal" && <>
            <div className="page-header">
              <div>
                <div className="page-title">Trade Journal</div>
                <div className="page-sub">// {trades.length} trades · welcome back, {displayName.split(" ")[0]}{saving&&<span className="saving-dot" title="Saving..."/>}</div>
              </div>
              <button className="btn btn-primary" onClick={openAdd}>+ Log Trade</button>
            </div>
            <div className="stats-row">
              <div className="stat-card green"><div className="stat-label">Total P&L</div><div className={`stat-value ${totalPnl>=0?"green":"red"}`}>{totalPnl>=0?"+":""}${totalPnl}</div><div className="stat-change">{trades.length} trades</div></div>
              <div className="stat-card blue"><div className="stat-label">Win Rate</div><div className="stat-value blue">{winRate}%</div><div className="stat-change">{wins.length}W / {losses.length}L</div></div>
              <div className="stat-card green"><div className="stat-label">Avg Win</div><div className="stat-value green">+${avgWin}</div><div className="stat-change">per winning trade</div></div>
              <div className="stat-card red"><div className="stat-label">Risk:Reward</div><div className="stat-value yellow">{rr}:1</div><div className="stat-change">avg loss ${Math.abs(avgLoss)}</div></div>
            </div>
            {tradesLoading
              ? <div className="loading-screen" style={{minHeight:200}}><div className="spinner"/><span>Loading your trades...</span></div>
              : trades.length===0
                ? <div className="empty"><div className="empty-icon">📋</div><div>No trades yet.</div><div style={{fontSize:12,marginTop:6}}>Log your first trade and it will be saved to your account!</div></div>
                : <div className="trade-cards-grid">
                    {trades.map(t=>(
                      <div key={t.id} className="trade-card" onClick={()=>setDetailTrade(t)}>
                        <div className="trade-card-actions" onClick={e=>e.stopPropagation()}>
                          <button className="card-action-btn edit" title="Edit" onClick={e=>openEdit(t,e)}>✏️</button>
                          <button className="card-action-btn del" title="Delete" onClick={e=>{e.stopPropagation();setConfirmDelete(t);}}>🗑</button>
                        </div>
                        <div className={`trade-card-top-badge ${t.direction}`}>{t.direction.toUpperCase()}</div>
                        {t.screenshot?<img className="trade-card-img" src={t.screenshot} alt="chart"/>:<div className="trade-card-img-placeholder">📈</div>}
                        <div className="trade-card-body">
                          <div className="trade-card-ticker">{t.ticker}</div>
                          <div className={`trade-card-pnl ${t.pnl>=0?"pos":"neg"}`}>{t.pnl>=0?"+":""}${t.pnl}</div>
                          <div className="trade-card-meta">
                            <span className="meta-chip">{t.date?.slice(5)}</span>
                            <span className="meta-chip">{t.setup}</span>
                            <span className="meta-chip">{t.emotion}</span>
                            <span className="meta-chip">{t.shares} sh</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
            }
          </>}

          {/* PERFORMANCE */}
          {page==="performance" && <>
            <div className="page-header"><div><div className="page-title">Performance</div><div className="page-sub">// analytics & insights</div></div></div>
            <div className="stats-row">
              <div className="stat-card green"><div className="stat-label">Net P&L</div><div className={`stat-value ${totalPnl>=0?"green":"red"}`}>{totalPnl>=0?"+":""}${totalPnl}</div></div>
              <div className="stat-card blue"><div className="stat-label">Win Rate</div><div className="stat-value blue">{winRate}%</div></div>
              <div className="stat-card yellow"><div className="stat-label">Profit Factor</div><div className="stat-value yellow">{rr}</div></div>
              <div className="stat-card red"><div className="stat-label">Total Trades</div><div className="stat-value blue">{trades.length}</div></div>
            </div>
            <div className="perf-grid">
              <div className="panel">
                <div className="panel-header"><div className="panel-title">Equity Curve</div></div>
                <div className="equity-chart">
                  <svg width="100%" viewBox={`0 0 ${W} ${H+20}`}>
                    <defs><linearGradient id="eq" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00e5a0" stopOpacity="0.3"/><stop offset="100%" stopColor="#00e5a0" stopOpacity="0"/></linearGradient></defs>
                    {eqPts.length>1&&<><path d={fillD} fill="url(#eq)"/><path d={pathD} stroke="#00e5a0" strokeWidth="2" fill="none"/>{eqPts.map((p,i)=><circle key={i} cx={tx(p.x)} cy={ty(p.y)} r="3" fill="#00e5a0"/>)}</>}
                    <text x="0" y={H+15} fontSize="9" fill="#5a7a8a">Start</text><text x={W-20} y={H+15} fontSize="9" fill="#5a7a8a">Now</text>
                  </svg>
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><div className="panel-title">P&L by Emotion</div></div>
                <div style={{padding:"16px 20px"}}>
                  {emotionBd.length===0?<div style={{color:"var(--muted)",fontSize:13}}>No data yet.</div>:emotionBd.map(e=>(
                    <div key={e.label} className="bar-row">
                      <div style={{width:80,fontSize:12}}>{e.label}</div>
                      <div className="bar-track"><div className="bar-fill" style={{width:`${Math.min(100,Math.abs(e.pnl)/Math.max(...emotionBd.map(x=>Math.abs(x.pnl)))*100)}%`,background:e.pnl>=0?"var(--accent)":"var(--red)"}}/></div>
                      <div style={{width:60,textAlign:"right",fontFamily:"var(--mono)",fontSize:11,color:e.pnl>=0?"var(--accent)":"var(--red)"}}>{e.pnl>=0?"+":""}${e.pnl}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><div className="panel-title">P&L by Setup</div></div>
                <div style={{padding:"16px 20px"}}>
                  {setupBd.length===0?<div style={{color:"var(--muted)",fontSize:13}}>No data yet.</div>:setupBd.map(s=>(
                    <div key={s.label} className="bar-row">
                      <div style={{width:90,fontSize:12}}>{s.label}</div>
                      <div className="bar-track"><div className="bar-fill" style={{width:`${Math.min(100,Math.abs(s.pnl)/Math.max(...setupBd.map(x=>Math.abs(x.pnl)))*100)}%`,background:s.pnl>=0?"var(--accent2)":"var(--red)"}}/></div>
                      <div style={{width:55,textAlign:"right",fontFamily:"var(--mono)",fontSize:11,color:s.pnl>=0?"var(--accent2)":"var(--red)"}}>{s.pnl>=0?"+":""}${s.pnl}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><div className="panel-title">Trade Breakdown</div></div>
                <div style={{padding:"16px 20px"}}>
                  {[["Winning Trades",wins.length,"var(--accent)"],["Losing Trades",losses.length,"var(--red)"],["Avg Win",`+$${avgWin}`,"var(--accent)"],["Avg Loss",`-$${Math.abs(avgLoss)}`,"var(--red)"],["Best Trade",trades.length?`+$${Math.max(...trades.map(t=>t.pnl))}`:"—","var(--accent)"],["Worst Trade",trades.length?`$${Math.min(...trades.map(t=>t.pnl))}`:"—","var(--red)"]].map(([k,v,c])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid var(--border)",fontSize:13}}>
                      <span style={{color:"var(--muted)"}}>{k}</span><span style={{fontFamily:"var(--mono)",color:c,fontWeight:600}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>}

          {/* AI COACH */}
          {page==="ai" && <>
            <div className="page-header"><div><div className="page-title">AI Coach</div><div className="page-sub">// powered by claude via openrouter</div></div></div>
            <div className="panel" style={{display:"flex",flexDirection:"column",height:560}}>
              <div className="panel-header">
                <div className="panel-title">💬 Chat with AI Coach</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {["Analyze my win rate","Best setup?","Review my psychology"].map(q=>(
                    <button key={q} className="btn btn-ghost btn-sm" onClick={()=>setInput(q)}>{q}</button>
                  ))}
                </div>
              </div>
              <div className="ai-chat" ref={chatRef}>
                {messages.map((m,i)=>(
                  <div key={i} className="ai-msg" style={{flexDirection:m.role==="user"?"row-reverse":"row"}}>
                    {m.role==="ai"?<div className="ai-avatar">🤖</div>:<div className="user-avatar">👤</div>}
                    <div className={`msg-bubble ${m.role==="user"?"user":""}`}>{m.text}</div>
                  </div>
                ))}
                {aiLoading&&<div className="ai-msg"><div className="ai-avatar">🤖</div><div className="msg-bubble"><div className="typing"><div className="dot"/><div className="dot"/><div className="dot"/></div></div></div>}
              </div>
              <div className="ai-input-row">
                <input className="ai-input" placeholder="Ask about your trades, patterns, psychology..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()}/>
                <button className="btn btn-primary" onClick={sendMessage} disabled={aiLoading}>{aiLoading?"...":"Send"}</button>
              </div>
            </div>
            <div className="panel" style={{marginTop:20}}>
              <div className="panel-header"><div className="panel-title">Quick Analyze a Trade</div></div>
              <div style={{padding:"8px 0"}}>
                {trades.slice(0,6).map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 20px",borderBottom:"1px solid var(--border)",fontSize:13}}>
                    <div style={{display:"flex",gap:12,alignItems:"center"}}>
                      <span style={{fontFamily:"var(--mono)",fontWeight:700}}>{t.ticker}</span>
                      <span className={`badge ${t.direction}`}>{t.direction.toUpperCase()}</span>
                      <span style={{fontFamily:"var(--mono)",color:t.pnl>=0?"var(--accent)":"var(--red)"}}>{t.pnl>=0?"+":""}${t.pnl}</span>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={()=>analyzeTradeAI(t)}>Analyze →</button>
                  </div>
                ))}
                {trades.length===0&&<div style={{padding:"20px",color:"var(--muted)",fontSize:13}}>No trades to analyze yet.</div>}
              </div>
            </div>
          </>}
        </div>

        {/* TRADE DETAIL */}
        {detailTrade&&(
          <div className="overlay" onClick={()=>setDetailTrade(null)}>
            <div className="detail-modal" onClick={e=>e.stopPropagation()}>
              <div className="detail-header">
                <div>
                  <div style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)",marginBottom:4}}>{detailTrade.date}</div>
                  <div style={{fontSize:24,fontWeight:800}}>{detailTrade.ticker}</div>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginTop:6}}>
                    <span className={`badge ${detailTrade.direction}`}>{detailTrade.direction.toUpperCase()}</span>
                    <span style={{fontFamily:"var(--mono)",fontWeight:700,fontSize:16,color:detailTrade.pnl>=0?"var(--accent)":"var(--red)"}}>{detailTrade.pnl>=0?"+":""}${detailTrade.pnl}</span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={()=>setDetailTrade(null)}>✕</button>
              </div>
              {detailTrade.screenshot
                ?<img className="detail-chart" src={detailTrade.screenshot} alt="chart" style={{marginTop:16}} onClick={()=>setLightbox(detailTrade.screenshot)}/>
                :<div className="detail-chart-placeholder" style={{marginTop:16}}>📈</div>
              }
              <div className="detail-grid">
                {[["Entry","$"+detailTrade.entry],["Exit","$"+detailTrade.exit],["Shares",detailTrade.shares],["Setup",detailTrade.setup],["Emotion",detailTrade.emotion],["P&L",(detailTrade.pnl>=0?"+":"")+"$"+detailTrade.pnl]].map(([k,v])=>(
                  <div key={k} className="detail-cell">
                    <div className="detail-cell-label">{k}</div>
                    <div className="detail-cell-val" style={{color:k==="P&L"?(detailTrade.pnl>=0?"var(--accent)":"var(--red)"):"var(--text)"}}>{v}</div>
                  </div>
                ))}
              </div>
              {detailTrade.notes&&<div className="detail-notes"><div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Notes</div>{detailTrade.notes}</div>}
              <div className="detail-actions">
                <button className="btn btn-primary" style={{flex:1}} onClick={()=>analyzeTradeAI(detailTrade)}>🤖 AI Analysis</button>
                <button className="btn btn-blue" onClick={e=>openEdit(detailTrade,e)}>✏️ Edit</button>
                <button className="btn btn-danger" onClick={()=>setConfirmDelete(detailTrade)}>🗑 Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* ADD / EDIT MODAL */}
        {showModal&&(
          <div className="overlay" onClick={()=>setShowModal(false)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-title">{editingTrade?"Edit Trade":"Log New Trade"}</div>
              <div className="form-grid">
                <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
                <div className="form-group"><label>Ticker</label><input placeholder="AAPL" value={form.ticker} onChange={e=>setForm(f=>({...f,ticker:e.target.value.toUpperCase()}))}/></div>
                <div className="form-group"><label>Direction</label><select value={form.direction} onChange={e=>setForm(f=>({...f,direction:e.target.value}))}><option value="long">Long</option><option value="short">Short</option></select></div>
                <div className="form-group"><label>Setup</label><select value={form.setup} onChange={e=>setForm(f=>({...f,setup:e.target.value}))}>{SETUPS.map(s=><option key={s}>{s}</option>)}</select></div>
                <div className="form-group"><label>Entry Price</label><input type="number" placeholder="0.00" value={form.entry} onChange={e=>setForm(f=>({...f,entry:e.target.value}))}/></div>
                <div className="form-group"><label>Exit Price</label><input type="number" placeholder="0.00" value={form.exit} onChange={e=>setForm(f=>({...f,exit:e.target.value}))}/></div>
                <div className="form-group"><label>Shares</label><input type="number" placeholder="0" value={form.shares} onChange={e=>setForm(f=>({...f,shares:e.target.value}))}/></div>
                <div className="form-group"><label>Emotion</label><select value={form.emotion} onChange={e=>setForm(f=>({...f,emotion:e.target.value}))}>{EMOTIONS.map(e=><option key={e}>{e}</option>)}</select></div>
                <div className="form-group full"><label>Notes / Rationale</label><textarea placeholder="Why did you take this trade? What did you see?" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
                <div className="form-group full">
                  <label>Chart Screenshot (optional)</label>
                  {form.screenshot
                    ?<div className="screenshot-preview"><img src={form.screenshot} alt="preview"/><button className="screenshot-remove" onClick={()=>setForm(f=>({...f,screenshot:null}))}>✕</button></div>
                    :<div className="upload-zone"><input type="file" accept="image/*" onChange={e=>handleScreenshot(e.target.files[0],src=>setForm(f=>({...f,screenshot:src})))}/><div className="upload-zone-icon">📷</div><div className="upload-zone-text">Click to upload chart screenshot</div></div>
                  }
                </div>
              </div>
              {estPnl!==null&&<div style={{marginTop:12,padding:"10px 14px",background:"var(--surface2)",borderRadius:8,fontFamily:"var(--mono)",fontSize:13}}>Estimated P&L: <span style={{color:estPnl>=0?"var(--accent)":"var(--red)",fontWeight:700}}>{estPnl>=0?"+":""}${estPnl}</span></div>}
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveTrade} disabled={saving}>{saving?"Saving...":(editingTrade?"Save Changes":"Log Trade"+(editingTrade?"":" + AI Analysis"))}</button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRM DELETE */}
        {confirmDelete&&(
          <div className="overlay" onClick={()=>setConfirmDelete(null)}>
            <div className="confirm-box" onClick={e=>e.stopPropagation()}>
              <div className="confirm-title">Delete this trade?</div>
              <div className="confirm-sub">{confirmDelete.ticker} · {confirmDelete.date} · {confirmDelete.pnl>=0?"+":""}${confirmDelete.pnl}<br/>This cannot be undone.</div>
              <div className="confirm-actions">
                <button className="btn btn-ghost" onClick={()=>setConfirmDelete(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={()=>deleteTrade(confirmDelete.id)}>Yes, Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* LIGHTBOX */}
        {lightbox&&(
          <div className="lightbox" onClick={()=>setLightbox(null)}>
            <button className="lightbox-close" onClick={()=>setLightbox(null)}>✕</button>
            <img src={lightbox} alt="screenshot" onClick={e=>e.stopPropagation()}/>
          </div>
        )}

        {toast&&<div className="toast">{toast}</div>}
      </div>
    </>
  );
}
