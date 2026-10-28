import { useState, useEffect, useRef } from "react";
import SettingsPage from "./Settings";
import { loadStripe } from "@stripe/stripe-js";
import { initializeApp } from "firebase/app";
import {
  getAuth, onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, updateProfile, sendPasswordResetEmail
} from "firebase/auth";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, setDoc
} from "firebase/firestore";

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
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_KEY;
const FREE_LIMIT = 10;
const AI_MODEL = "anthropic/claude-sonnet-5.5"; // change this line to switch models

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Instrument+Serif:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #02040a;
    --bg2: #060a12;
    --surface: #0a0f1c;
    --surface2: #0e1528;
    --surface3: #131d35;
    --border: #1a2540;
    --border2: #243560;
    --accent: #7ec9a0;
    --accent2: #38bdf8;
    --accent3: #a78bfa;
    --red: #f87171;
    --yellow: #fbbf24;
    --text: #f0f6ff;
    --text2: #8ba4cc;
    --muted: #4a6080;
    --muted2: #2a3a55;
    --font: 'Space Grotesk', 'Inter', sans-serif;
    --mono: 'Space Mono', monospace;
    --bottom-nav-h: 68px;
    --sidebar-w: 240px;
    --radius: 16px;
    --radius-sm: 10px;
    --glow-green: 0 0 40px rgba(74,222,128,0.15);
    --glow-blue: 0 0 40px rgba(56,189,248,0.15);
  }

  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    min-height: 100vh;
    overflow-x: hidden;
    background-image:
      radial-gradient(ellipse at 20% 0%, rgba(74,222,128,0.04) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 0%, rgba(56,189,248,0.04) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 100%, rgba(167,139,250,0.03) 0%, transparent 50%);
  }
  .app { display: flex; min-height: 100vh; }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes slideRight { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(74,222,128,0.1)} 50%{box-shadow:0 0 40px rgba(74,222,128,0.25)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-8px)} }
  @keyframes slideIn { from{transform:translateX(120px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes scaleIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
  @keyframes countUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  .animate-fade-up { animation: fadeUp 0.5s ease forwards; }
  .animate-fade-in { animation: fadeIn 0.4s ease forwards; }
  .animate-scale-in { animation: scaleIn 0.3s ease forwards; }

  /* ── SIDEBAR ── */
  .sidebar {
    width: var(--sidebar-w);
    min-height: 100vh;
    background: linear-gradient(180deg, var(--surface) 0%, var(--bg2) 100%);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; z-index: 100;
    padding: 0;
    backdrop-filter: blur(20px);
  }
  .sidebar-logo-wrap {
    padding: 28px 24px 24px;
    border-bottom: 1px solid var(--border);
    position: relative; overflow: hidden;
  }
  .sidebar-logo-wrap::after {
    content: ''; position: absolute; bottom: 0; left: 24px; right: 24px; height: 1px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    opacity: 0.4;
  }
  .logo-text {
    font-size: 22px; font-weight: 800; letter-spacing: -0.5px;
    background: linear-gradient(135deg, #fff 40%, var(--accent));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .logo-text span { -webkit-text-fill-color: transparent; }
  .logo-sub { font-family: var(--mono); font-size: 10px; color: var(--muted); margin-top: 4px; letter-spacing: 2px; }
  .nav { padding: 16px 12px; flex: 1; }
  .nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 14px; border-radius: var(--radius-sm);
    cursor: pointer; font-size: 14px; font-weight: 500;
    color: var(--text2); transition: all 0.2s ease;
    margin-bottom: 2px; position: relative; overflow: hidden;
  }
  .nav-item::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(74,222,128,0.08), rgba(56,189,248,0.05));
    opacity: 0; transition: opacity 0.2s;
    border-radius: var(--radius-sm);
  }
  .nav-item:hover { color: var(--text); transform: translateX(3px); }
  .nav-item:hover::before { opacity: 1; }
  .nav-item.active {
    color: var(--accent);
    background: rgba(74,222,128,0.08);
    border: 1px solid rgba(74,222,128,0.15);
    box-shadow: var(--glow-green);
  }
  .nav-item.active::before { opacity: 1; }
  .nav-icon { font-size: 17px; width: 22px; text-align: center; }
  .nav-badge {
    margin-left: auto; background: var(--accent); color: #000;
    font-size: 10px; font-weight: 800; padding: 2px 7px;
    border-radius: 20px; font-family: var(--mono);
  }

  .sidebar-bottom {
    padding: 16px;
    border-top: 1px solid var(--border);
    background: rgba(0,0,0,0.2);
  }
  .sidebar-pnl-card {
    background: linear-gradient(135deg, rgba(74,222,128,0.08), rgba(56,189,248,0.05));
    border: 1px solid rgba(74,222,128,0.15);
    border-radius: var(--radius-sm); padding: 14px; margin-bottom: 14px;
  }
  .sidebar-pnl-label { font-family: var(--mono); font-size: 9px; color: var(--muted); letter-spacing: 2px; margin-bottom: 4px; }
  .sidebar-pnl { font-size: 22px; font-weight: 800; letter-spacing: -1px; }
  .sidebar-user { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .sidebar-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 13px; color: #000; flex-shrink: 0;
  }
  .sidebar-user-info { flex: 1; min-width: 0; }
  .sidebar-user-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sidebar-user-email { font-family: var(--mono); font-size: 9px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
  .pro-badge {
    display: inline-flex; align-items: center; gap: 4px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: #000; font-size: 10px; font-weight: 800;
    padding: 3px 10px; border-radius: 20px; font-family: var(--mono);
    margin-bottom: 10px; animation: glow 3s infinite;
  }
  .free-badge {
    display: inline-block; background: var(--surface3); color: var(--text2);
    font-size: 10px; font-weight: 600; padding: 3px 10px;
    border-radius: 20px; font-family: var(--mono);
    border: 1px solid var(--border2); margin-bottom: 8px;
  }
  .usage-bar-wrap { margin-bottom: 10px; }
  .usage-bar-label { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 9px; color: var(--muted); margin-bottom: 5px; }
  .usage-bar-track { height: 5px; background: var(--surface3); border-radius: 3px; overflow: hidden; }
  .usage-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--accent), var(--accent2)); transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }
  .upgrade-btn {
    width: 100%; padding: 10px; border-radius: var(--radius-sm); border: none;
    cursor: pointer; font-family: var(--font); font-size: 13px; font-weight: 700;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: #000; transition: all 0.2s; margin-bottom: 8px;
    box-shadow: 0 4px 15px rgba(74,222,128,0.2);
  }
  .upgrade-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(74,222,128,0.3); }
  .sign-out-btn {
    width: 100%; padding: 8px; border-radius: var(--radius-sm);
    border: 1px solid var(--border2); background: transparent;
    color: var(--text2); font-family: var(--font); font-size: 12px;
    font-weight: 500; cursor: pointer; transition: all 0.2s;
  }
  .sign-out-btn:hover { color: var(--red); border-color: rgba(248,113,113,0.4); background: rgba(248,113,113,0.05); }

  /* ── MOBILE HEADER ── */
  .mobile-header {
    display: none; position: fixed; top: 0; left: 0; right: 0; height: 58px;
    background: rgba(10,15,28,0.9); border-bottom: 1px solid var(--border);
    z-index: 99; padding: 0 16px; align-items: center; justify-content: space-between;
    backdrop-filter: blur(20px);
  }
  .mobile-logo {
    font-size: 19px; font-weight: 800;
    background: linear-gradient(135deg, #fff 40%, var(--accent));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .mobile-pnl { font-family: var(--mono); font-size: 13px; font-weight: 700; }

  /* ── BOTTOM NAV ── */
  .bottom-nav {
    display: none; position: fixed; bottom: 0; left: 0; right: 0;
    height: var(--bottom-nav-h);
    background: rgba(10,15,28,0.95); border-top: 1px solid var(--border);
    z-index: 100; backdrop-filter: blur(20px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .bottom-nav-inner { display: flex; height: 100%; align-items: center; justify-content: space-around; padding: 0 8px; }
  .bottom-nav-item {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 8px 16px; border-radius: var(--radius-sm); cursor: pointer;
    color: var(--muted); transition: all 0.2s; flex: 1;
  }
  .bottom-nav-item.active { color: var(--accent); }
  .bottom-nav-icon { font-size: 20px; transition: transform 0.2s; }
  .bottom-nav-item.active .bottom-nav-icon { transform: scale(1.15); }
  .bottom-nav-label { font-size: 10px; font-weight: 600; font-family: var(--mono); }

  /* ── FAB ── */
  .fab {
    display: none; position: fixed;
    bottom: calc(var(--bottom-nav-h) + 14px); right: 16px;
    width: 54px; height: 54px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: #000; font-size: 26px; font-weight: 300; border: none; cursor: pointer;
    box-shadow: 0 4px 20px rgba(74,222,128,0.4); z-index: 99;
    align-items: center; justify-content: center; transition: all 0.2s;
    animation: float 3s ease-in-out infinite;
  }
  .fab:hover { transform: scale(1.08) translateY(-2px); box-shadow: 0 8px 30px rgba(74,222,128,0.5); }

  /* ── MAIN ── */
  .main { margin-left: var(--sidebar-w); flex: 1; padding: 36px 40px; }
  .page-header { margin-bottom: 32px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; animation: fadeUp 0.4s ease; }
  .page-title { font-size: 30px; font-weight: 800; letter-spacing: -1px; line-height: 1.1; }
  .page-title-gradient {
    background: linear-gradient(135deg, var(--text) 50%, var(--accent));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .page-sub { color: var(--text2); font-size: 13px; margin-top: 5px; font-family: var(--mono); letter-spacing: 0.5px; }

  /* ── STATS ── */
  .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 28px; }
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius); padding: 22px 20px;
    position: relative; overflow: hidden;
    transition: all 0.3s ease; cursor: default;
    animation: fadeUp 0.5s ease both;
  }
  .stat-card:nth-child(1){animation-delay:0.05s}
  .stat-card:nth-child(2){animation-delay:0.1s}
  .stat-card:nth-child(3){animation-delay:0.15s}
  .stat-card:nth-child(4){animation-delay:0.2s}
  .stat-card:hover { transform: translateY(-3px); border-color: var(--border2); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
  .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
  .stat-card::after {
    content: ''; position: absolute; top: 0; right: 0; width: 80px; height: 80px;
    border-radius: 50%; opacity: 0.04; transition: opacity 0.3s;
  }
  .stat-card:hover::after { opacity: 0.08; }
  .stat-card.green::before{background:linear-gradient(90deg,var(--accent),transparent);}
  .stat-card.blue::before{background:linear-gradient(90deg,var(--accent2),transparent);}
  .stat-card.purple::before{background:linear-gradient(90deg,var(--accent3),transparent);}
  .stat-card.red::before{background:linear-gradient(90deg,var(--red),transparent);}
  .stat-card.green::after{background:var(--accent);right:-20px;top:-20px;}
  .stat-card.blue::after{background:var(--accent2);right:-20px;top:-20px;}
  .stat-card.purple::after{background:var(--accent3);right:-20px;top:-20px;}
  .stat-card.red::after{background:var(--red);right:-20px;top:-20px;}
  .stat-label { font-family: var(--mono); font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
  .stat-value { font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1; }
  .stat-value.green{color:var(--accent);} .stat-value.red{color:var(--red);}
  .stat-value.blue{color:var(--accent2);} .stat-value.purple{color:var(--accent3);}
  .stat-value.yellow{color:var(--yellow);}
  .stat-change { font-family: var(--mono); font-size: 10px; margin-top: 6px; color: var(--muted); }

  /* ── TRADE CARDS ── */
  .trade-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px,1fr)); gap: 18px; }
  .trade-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius); overflow: hidden; cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
    position: relative;
    animation: fadeUp 0.4s ease both;
  }
  .trade-card:hover {
    transform: translateY(-5px) scale(1.01);
    border-color: rgba(74,222,128,0.3);
    box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,222,128,0.1);
  }
  .trade-card-img { width:100%; height:135px; object-fit:cover; display:block; }
  .trade-card-img-placeholder {
    width:100%; height:135px; display:flex; align-items:center; justify-content:center;
    background: linear-gradient(135deg, var(--surface2), var(--surface3));
    border-bottom: 1px solid var(--border); font-size:36px;
    position: relative; overflow: hidden;
  }
  .trade-card-img-placeholder::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(74,222,128,0.03), rgba(56,189,248,0.03));
  }
  .trade-card-top-badge {
    position:absolute; top:10px; left:10px;
    padding:3px 10px; border-radius:6px; font-size:11px;
    font-weight:700; font-family:var(--mono); backdrop-filter:blur(8px);
    letter-spacing: 1px;
  }
  .trade-card-top-badge.long{background:rgba(74,222,128,0.9);color:#000;}
  .trade-card-top-badge.short{background:rgba(248,113,113,0.9);color:#fff;}
  .trade-card-actions {
    position:absolute; top:8px; right:8px;
    display:flex; gap:5px; opacity:0; transition:opacity 0.2s;
  }
  .trade-card:hover .trade-card-actions { opacity:1; }
  .card-action-btn {
    width:30px; height:30px; border-radius:8px; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center; font-size:13px;
    backdrop-filter:blur(8px); transition: transform 0.15s;
  }
  .card-action-btn:hover { transform: scale(1.1); }
  .card-action-btn.edit{background:rgba(56,189,248,0.9);color:#000;}
  .card-action-btn.del{background:rgba(248,113,113,0.9);color:#fff;}
  .trade-card-body { padding:16px; }
  .trade-card-ticker { font-family:var(--mono); font-weight:700; font-size:19px; margin-bottom:5px; letter-spacing:-0.5px; }
  .trade-card-pnl { font-family:var(--mono); font-size:16px; font-weight:700; margin-bottom:10px; }
  .trade-card-pnl.pos{color:var(--accent);} .trade-card-pnl.neg{color:var(--red);}
  .trade-card-meta { display:flex; gap:6px; flex-wrap:wrap; }
  .meta-chip {
    font-size:10px; font-family:var(--mono); padding:3px 8px;
    border-radius:6px; background:var(--surface2); color:var(--text2);
    border:1px solid var(--border); letter-spacing:0.3px;
  }

  /* ── PANEL ── */
  .panel {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); overflow: hidden;
    transition: border-color 0.2s;
  }
  .panel:hover { border-color: var(--border2); }
  .panel-header {
    padding: 18px 22px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
    background: linear-gradient(90deg, var(--surface), var(--surface2));
  }
  .panel-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: var(--text2); }

  /* ── BUTTONS ── */
  .btn {
    padding: 9px 18px; border-radius: var(--radius-sm); border: none; cursor: pointer;
    font-family: var(--font); font-size: 13px; font-weight: 600; transition: all 0.2s;
    position: relative; overflow: hidden;
  }
  .btn::after {
    content:''; position:absolute; inset:0;
    background: rgba(255,255,255,0.08); opacity:0; transition:opacity 0.2s;
  }
  .btn:hover::after { opacity:1; }
  .btn-primary {
    background: linear-gradient(135deg, var(--accent), #22d3ee);
    color: #000; font-weight: 700;
    box-shadow: 0 4px 15px rgba(74,222,128,0.25);
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(74,222,128,0.35); }
  .btn-ghost { background: var(--surface2); color: var(--text2); border: 1px solid var(--border2); }
  .btn-ghost:hover { color: var(--text); border-color: var(--border2); background: var(--surface3); }
  .btn-danger { background: rgba(248,113,113,0.1); color: var(--red); border: 1px solid rgba(248,113,113,0.25); }
  .btn-danger:hover { background: rgba(248,113,113,0.2); }
  .btn-blue { background: rgba(56,189,248,0.1); color: var(--accent2); border: 1px solid rgba(56,189,248,0.25); }
  .btn-blue:hover { background: rgba(56,189,248,0.2); }
  .btn-sm { padding: 5px 13px; font-size: 12px; }
  .badge { display:inline-block; padding:3px 9px; border-radius:6px; font-size:11px; font-weight:700; font-family:var(--mono); }
  .badge.long{background:rgba(74,222,128,0.12);color:var(--accent);border:1px solid rgba(74,222,128,0.2);}
  .badge.short{background:rgba(248,113,113,0.12);color:var(--red);border:1px solid rgba(248,113,113,0.2);}

  /* ── AI CHAT ── */
  .ai-chat { flex:1; padding:16px; overflow-y:auto; max-height:440px; display:flex; flex-direction:column; gap:14px; }
  .ai-msg { display:flex; gap:10px; animation: fadeUp 0.3s ease; }
  .ai-avatar {
    width:30px; height:30px; border-radius:50%;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    display:flex; align-items:center; justify-content:center;
    font-size:14px; flex-shrink:0; margin-top:2px;
    box-shadow: 0 0 15px rgba(74,222,128,0.3);
  }
  .user-avatar {
    width:30px; height:30px; border-radius:50%; background:var(--surface3);
    border:1px solid var(--border2); display:flex; align-items:center;
    justify-content:center; font-size:14px; flex-shrink:0; margin-top:2px;
  }
  .msg-bubble {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 12px; padding: 11px 14px; font-size:13px;
    line-height:1.65; color:var(--text); flex:1;
  }
  .msg-bubble.user {
    background: linear-gradient(135deg, rgba(74,222,128,0.07), rgba(56,189,248,0.05));
    border-color: rgba(74,222,128,0.15);
  }
  .ai-input-row { padding:14px 16px; border-top:1px solid var(--border); display:flex; gap:8px; background: var(--surface2); }
  .ai-input {
    flex:1; background:var(--surface3); border:1px solid var(--border2);
    border-radius:var(--radius-sm); padding:10px 14px; color:var(--text);
    font-family:var(--font); font-size:13px; outline:none; transition:all 0.2s;
  }
  .ai-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(74,222,128,0.08); }
  .ai-input::placeholder { color:var(--muted); }
  .typing { display:flex; gap:5px; align-items:center; padding:4px 0; }
  .dot { width:7px; height:7px; border-radius:50%; background:var(--accent); animation:bounce 1.2s infinite; }
  .dot:nth-child(2){animation-delay:0.2s;} .dot:nth-child(3){animation-delay:0.4s;}

  /* ── MODALS ── */
  .overlay {
    position:fixed; inset:0; background:rgba(2,4,10,0.85); z-index:200;
    display:flex; align-items:center; justify-content:center;
    backdrop-filter:blur(8px); padding:16px; animation: fadeIn 0.2s ease;
  }
  .modal {
    background: var(--surface); border:1px solid var(--border2);
    border-radius:20px; padding:28px; width:600px; max-width:100%;
    max-height:92vh; overflow-y:auto;
    animation: scaleIn 0.25s ease;
    box-shadow: 0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(74,222,128,0.05);
  }
  .modal-title { font-size:19px; font-weight:800; margin-bottom:22px; letter-spacing:-0.5px; }
  .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .form-group { display:flex; flex-direction:column; gap:7px; }
  .form-group.full { grid-column:1/-1; }
  label { font-size:11px; font-family:var(--mono); color:var(--text2); text-transform:uppercase; letter-spacing:1.5px; font-weight:700; }
  input,select,textarea {
    background:var(--surface2); border:1px solid var(--border2);
    border-radius:var(--radius-sm); padding:10px 14px; color:var(--text);
    font-family:var(--font); font-size:14px; outline:none; transition:all 0.2s; width:100%;
  }
  input:focus,select:focus,textarea:focus {
    border-color:var(--accent); box-shadow: 0 0 0 3px rgba(74,222,128,0.08);
  }
  select option { background:var(--surface2); }
  textarea { resize:vertical; min-height:80px; }
  .modal-actions { display:flex; gap:10px; margin-top:22px; justify-content:flex-end; flex-wrap:wrap; }
  .upload-zone {
    border:2px dashed var(--border2); border-radius:var(--radius-sm);
    padding:24px; text-align:center; cursor:pointer; transition:all 0.2s; position:relative;
    background: var(--surface2);
  }
  .upload-zone:hover { border-color:var(--accent); background:rgba(74,222,128,0.04); }
  .upload-zone input[type=file] { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
  .upload-zone-icon { font-size:28px; margin-bottom:8px; }
  .upload-zone-text { font-size:13px; color:var(--text2); }
  .screenshot-preview { position:relative; border-radius:var(--radius-sm); overflow:hidden; border:1px solid var(--border2); }
  .screenshot-preview img { width:100%; max-height:200px; object-fit:cover; display:block; }
  .screenshot-remove {
    position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.8);
    border:none; color:white; border-radius:50%; width:28px; height:28px;
    cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center;
  }

  /* ── DETAIL MODAL ── */
  .detail-modal {
    background:var(--surface); border:1px solid var(--border2);
    border-radius:20px; width:660px; max-width:100%; max-height:92vh; overflow-y:auto;
    animation: scaleIn 0.25s ease;
    box-shadow: 0 25px 80px rgba(0,0,0,0.6);
  }
  .detail-header { padding:24px 26px 0; display:flex; justify-content:space-between; align-items:flex-start; }
  .detail-chart { width:100%; max-height:260px; object-fit:cover; display:block; cursor:pointer; }
  .detail-chart-placeholder {
    width:100%; height:150px; display:flex; align-items:center; justify-content:center;
    background:linear-gradient(135deg, var(--surface2), var(--surface3));
    font-size:44px; margin-top:16px;
  }
  .detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:20px 26px; }
  .detail-cell { background:var(--surface2); border-radius:var(--radius-sm); padding:12px 15px; border:1px solid var(--border); }
  .detail-cell-label { font-family:var(--mono); font-size:9px; color:var(--muted); text-transform:uppercase; letter-spacing:2px; }
  .detail-cell-val { font-weight:700; margin-top:5px; font-size:15px; }
  .detail-notes { margin:0 26px 16px; background:var(--surface2); border-radius:var(--radius-sm); padding:15px; font-size:13px; line-height:1.7; border:1px solid var(--border); }
  .detail-actions { padding:0 26px 26px; display:flex; gap:10px; flex-wrap:wrap; }

  /* ── CONFIRM ── */
  .confirm-box {
    background:var(--surface); border:1px solid rgba(248,113,113,0.3);
    border-radius:20px; padding:32px; width:380px; max-width:100%; text-align:center;
    animation: scaleIn 0.25s ease;
    box-shadow: 0 0 60px rgba(248,113,113,0.1);
  }
  .confirm-title { font-size:18px; font-weight:800; margin-bottom:10px; }
  .confirm-sub { font-size:13px; color:var(--text2); margin-bottom:24px; line-height:1.6; }
  .confirm-actions { display:flex; gap:10px; justify-content:center; }

  /* ── PERF ── */
  .perf-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:20px; }
  .bar-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; font-size:12px; }
  .bar-track { flex:1; height:6px; background:var(--surface3); border-radius:3px; overflow:hidden; }
  .bar-fill { height:100%; border-radius:3px; transition: width 1s cubic-bezier(0.4,0,0.2,1); }
  .equity-chart { padding:20px; }

  /* ── PAYWALL ── */
  .paywall-overlay {
    position:fixed; inset:0; background:rgba(2,4,10,0.9); z-index:300;
    display:flex; align-items:center; justify-content:center;
    backdrop-filter:blur(12px); padding:16px; animation: fadeIn 0.2s ease;
  }
  .paywall-card {
    background: linear-gradient(160deg, var(--surface) 0%, var(--surface2) 100%);
    border:1px solid rgba(74,222,128,0.2);
    border-radius:24px; padding:44px 36px; width:500px; max-width:100%;
    text-align:center; position:relative; overflow:hidden; max-height:92vh; overflow-y:auto;
    animation: scaleIn 0.3s ease;
    box-shadow: 0 0 100px rgba(74,222,128,0.08), 0 30px 80px rgba(0,0,0,0.5);
  }
  .paywall-glow {
    position:absolute; width:500px; height:500px; border-radius:50%;
    background:radial-gradient(circle,rgba(74,222,128,0.06) 0%,transparent 70%);
    top:50%; left:50%; transform:translate(-50%,-50%); pointer-events:none;
  }
  .paywall-close-btn {
    position:absolute; top:16px; right:16px;
    background:var(--surface3); border:1px solid var(--border2);
    color:var(--text2); border-radius:50%; width:34px; height:34px;
    cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center;
    transition: all 0.2s; z-index:1;
  }
  .paywall-close-btn:hover { color:var(--red); border-color:rgba(248,113,113,0.4); }
  .paywall-icon { font-size:48px; margin-bottom:16px; animation: float 3s ease-in-out infinite; }
  .paywall-title { font-size:26px; font-weight:800; margin-bottom:8px; letter-spacing:-0.5px; }
  .paywall-title span { background: linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .paywall-sub { color:var(--text2); font-size:14px; margin-bottom:24px; line-height:1.65; }
  .paywall-price-wrap { margin-bottom:24px; }
  .paywall-price { font-size:52px; font-weight:900; letter-spacing:-2px; background:linear-gradient(135deg,var(--accent),var(--accent2)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .paywall-price-sub { font-family:var(--mono); font-size:12px; color:var(--muted); margin-top:2px; }
  .paywall-features { text-align:left; margin-bottom:24px; display:flex; flex-direction:column; gap:12px; }
  .paywall-feature { display:flex; align-items:center; gap:12px; font-size:14px; }
  .paywall-feature-icon { color:var(--accent); font-size:16px; flex-shrink:0; }
  .paywall-btn {
    width:100%; padding:16px; border-radius:var(--radius); border:none; cursor:pointer;
    font-family:var(--font); font-size:15px; font-weight:800;
    background:linear-gradient(135deg,var(--accent),var(--accent2));
    color:#000; transition:all 0.2s; margin-bottom:12px;
    box-shadow: 0 8px 30px rgba(74,222,128,0.3);
  }
  .paywall-btn:hover { transform:translateY(-2px); box-shadow:0 12px 40px rgba(74,222,128,0.4); }
  .paywall-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
  .paywall-cancel { font-size:12px; color:var(--muted); font-family:var(--mono); cursor:pointer; }
  .paywall-cancel:hover { color:var(--text2); }

  /* ── AUTH ── */
  .auth-page {
    min-height:100vh; display:flex; align-items:center; justify-content:center;
    background:var(--bg); position:relative; overflow:hidden; padding:16px;
  }
  .auth-bg {
    position:absolute; inset:0; pointer-events:none;
    background:
      radial-gradient(ellipse at 30% 20%, rgba(74,222,128,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 80%, rgba(56,189,248,0.05) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(167,139,250,0.03) 0%, transparent 60%);
  }
  .auth-grid {
    position:absolute; inset:0; pointer-events:none;
    background-image: linear-gradient(rgba(26,37,64,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(26,37,64,0.3) 1px, transparent 1px);
    background-size: 60px 60px; opacity:0.5;
  }
  .auth-card {
    background: rgba(10,15,28,0.9); border:1px solid var(--border2);
    border-radius:24px; padding:40px 36px; width:440px; max-width:100%;
    position:relative; z-index:1; backdrop-filter:blur(20px);
    box-shadow: 0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(74,222,128,0.05);
    animation: scaleIn 0.4s ease;
  }
  .auth-logo {
    font-size:28px; font-weight:900; letter-spacing:-1px; margin-bottom:4px;
    background:linear-gradient(135deg,#fff 40%,var(--accent));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .auth-subtitle { font-family:var(--mono); font-size:11px; color:var(--muted); margin-bottom:28px; letter-spacing:1.5px; }
  .auth-tabs {
    display:flex; background:var(--surface2); border-radius:var(--radius-sm);
    padding:4px; margin-bottom:24px; gap:4px;
  }
  .auth-tab {
    flex:1; padding:9px; text-align:center; border-radius:8px;
    cursor:pointer; font-size:13px; font-weight:600; color:var(--muted); transition:all 0.2s;
  }
  .auth-tab.active {
    background:var(--surface3); color:var(--text);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .auth-field { margin-bottom:14px; }
  .auth-field label { display:block; font-family:var(--mono); font-size:10px; color:var(--text2); text-transform:uppercase; letter-spacing:1.5px; margin-bottom:7px; font-weight:700; }
  .auth-field input {
    width:100%; background:var(--surface2); border:1px solid var(--border2);
    border-radius:var(--radius-sm); padding:12px 14px; color:var(--text);
    font-family:var(--font); font-size:14px; outline:none; transition:all 0.2s;
  }
  .auth-field input:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(74,222,128,0.08); }
  .auth-field input::placeholder { color:var(--muted); }
  .auth-btn {
    width:100%; padding:13px; border-radius:var(--radius-sm); border:none; cursor:pointer;
    font-family:var(--font); font-size:15px; font-weight:700; transition:all 0.2s; margin-top:4px;
  }
  .auth-btn-primary {
    background:linear-gradient(135deg,var(--accent),var(--accent2)); color:#000;
    box-shadow: 0 6px 20px rgba(74,222,128,0.3);
  }
  .auth-btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 25px rgba(74,222,128,0.4); }
  .auth-btn-primary:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
  .auth-divider { display:flex; align-items:center; gap:12px; margin:18px 0; }
  .auth-divider-line { flex:1; height:1px; background:var(--border); }
  .auth-divider-text { font-size:11px; color:var(--muted); font-family:var(--mono); }
  .auth-btn-google {
    width:100%; padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border2);
    background:var(--surface2); color:var(--text); cursor:pointer; font-family:var(--font);
    font-size:14px; font-weight:600; display:flex; align-items:center; justify-content:center;
    gap:10px; transition:all 0.2s;
  }
  .auth-btn-google:hover { border-color:var(--accent2); background:rgba(56,189,248,0.05); transform:translateY(-1px); }
  .auth-error {
    background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.25);
    border-radius:var(--radius-sm); padding:11px 14px; font-size:13px;
    color:var(--red); margin-bottom:16px; animation: fadeIn 0.2s;
  }
  .auth-success {
    background:rgba(74,222,128,0.08); border:1px solid rgba(74,222,128,0.25);
    border-radius:var(--radius-sm); padding:11px 14px; font-size:13px;
    color:var(--accent); margin-bottom:16px; animation: fadeIn 0.2s;
  }

  /* ── MISC ── */
  .lightbox { position:fixed; inset:0; background:rgba(2,4,10,0.95); z-index:400; display:flex; align-items:center; justify-content:center; animation: fadeIn 0.2s; }
  .lightbox img { max-width:90vw; max-height:90vh; border-radius:var(--radius); box-shadow:0 0 80px rgba(0,0,0,0.8); }
  .lightbox-close { position:absolute; top:20px; right:24px; background:var(--surface2); border:1px solid var(--border2); color:var(--text); font-size:20px; cursor:pointer; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
  .lightbox-close:hover { background:var(--red); border-color:var(--red); color:#fff; }
  .toast {
    position:fixed; bottom:calc(var(--bottom-nav-h) + 12px); right:20px;
    background:var(--surface2); border:1px solid rgba(74,222,128,0.3);
    border-radius:var(--radius-sm); padding:13px 18px; font-size:13px;
    color:var(--accent); z-index:999; animation:slideIn 0.3s ease;
    box-shadow: 0 8px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,222,128,0.1);
    backdrop-filter: blur(10px);
  }
  .empty { padding:50px; text-align:center; color:var(--muted); animation: fadeIn 0.4s; }
  .empty-icon { font-size:40px; margin-bottom:12px; animation: float 3s ease-in-out infinite; }
  .empty-title { font-size:16px; font-weight:600; color:var(--text2); margin-bottom:6px; }
  .empty-sub { font-size:13px; }
  ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}
  .loading-screen { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); font-family:var(--mono); color:var(--muted); font-size:13px; flex-direction:column; gap:16px; letter-spacing:2px; }
  .spinner { width:36px; height:36px; border:2px solid var(--border2); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite; }
  .est-pnl-bar { margin-top:14px; padding:12px 16px; background:var(--surface2); border-radius:var(--radius-sm); font-family:var(--mono); font-size:13px; border:1px solid var(--border); }

  /* ── RESPONSIVE ── */
  @media (max-width: 1100px) {
    .stats-row { grid-template-columns: repeat(2,1fr); }
    .perf-grid { grid-template-columns: 1fr; }
    .main { padding: 28px 24px; }
  }
  @media (max-width: 768px) {
    .sidebar { display: none; }
    .mobile-header { display: flex; }
    .bottom-nav { display: block; }
    .fab { display: flex; }
    .main { margin-left:0; padding:16px; padding-top:calc(58px + 16px); padding-bottom:calc(var(--bottom-nav-h) + 16px); }
    .page-title { font-size:22px; }
    .stats-row { grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:16px; }
    .stat-card { padding:14px; }
    .stat-value { font-size:22px; }
    .trade-cards-grid { grid-template-columns:repeat(2,1fr); gap:12px; }
    .trade-card-img,.trade-card-img-placeholder { height:105px; }
    .trade-card-ticker { font-size:16px; }
    .trade-card-actions { opacity:1; }
    .panel-header { flex-direction:column; align-items:flex-start; }
    .ai-chat { max-height:300px; }
    .detail-grid { grid-template-columns:1fr 1fr; gap:8px; }
    .detail-actions { flex-direction:column; }
    .detail-actions .btn { width:100%; text-align:center; }
    .form-grid { grid-template-columns:1fr; }
    .form-group.full { grid-column:1; }
    .modal { padding:20px 16px; border-radius:16px; }
    .modal-actions { flex-direction:column-reverse; }
    .modal-actions .btn { width:100%; text-align:center; padding:13px; }
    .page-header { flex-direction:column; }
    .page-header .btn-desktop { display:none; }
    .perf-grid { gap:12px; }
    .toast { bottom:calc(var(--bottom-nav-h) + 8px); left:16px; right:16px; }
    .paywall-card { padding:30px 20px; }
  }
  @media (max-width: 400px) {
    .trade-cards-grid { grid-template-columns:1fr; }
  }
  /* ── REFINED MONOCHROME THEME ── */
  :root{--bg:#0b0b0c;--bg2:#0b0b0c;--surface:#111113;--surface2:#161618;--surface3:#1c1c1f;--border:#222226;--border2:#2e2e33;--accent:#7ec9a0;--accent2:#9a9aa3;--accent3:#9a9aa3;--red:#d98282;--yellow:#ededee;--text:#ededee;--text2:#a0a0a8;--muted:#6b6b73;--muted2:#45454c;--font:'Inter',system-ui,sans-serif;--mono:'JetBrains Mono',monospace;--display:'Instrument Serif',Georgia,serif;--radius:12px;--radius-sm:8px}
  body{background:var(--bg);background-image:none}
  .auth-bg,.auth-grid,.paywall-glow,.sidebar-logo-wrap::after,.nav-item::before,.stat-card::before,.stat-card::after,.btn::after{display:none}
  .logo-text,.mobile-logo,.auth-logo,.page-title,.page-title-gradient,.paywall-title,.paywall-price,.modal-title,.confirm-title{background:none;-webkit-text-fill-color:currentColor;color:var(--text);font-family:var(--display);font-weight:400;letter-spacing:-.01em}
  .paywall-title span{background:none;-webkit-text-fill-color:currentColor;color:var(--text2);font-style:italic}
  .page-title{font-size:34px}.logo-text{font-size:26px}.auth-logo{font-size:36px}.paywall-title{font-size:30px}.modal-title{font-size:22px}
  .btn-primary,.auth-btn-primary,.upgrade-btn,.paywall-btn,.fab{background:var(--text);color:var(--bg);box-shadow:none;animation:none}
  .btn-primary:hover,.auth-btn-primary:hover,.upgrade-btn:hover,.paywall-btn:hover,.fab:hover{background:#fff;box-shadow:none;transform:none}
  .btn-blue{background:var(--surface2);color:var(--text);border:1px solid var(--border2)}.btn-blue:hover{background:var(--surface3)}
  .btn-danger{background:transparent;color:var(--red);border:1px solid rgba(217,130,130,.3)}
  .btn-ghost{background:transparent}
  .sidebar{background:var(--surface)}
  .nav-item:hover{transform:none;background:var(--surface2)}
  .nav-item.active{background:var(--surface2);color:var(--text);border:1px solid var(--border);box-shadow:none}
  .sidebar-pnl-card{background:var(--surface2);border-color:var(--border)}
  .sidebar-avatar,.ai-avatar{background:var(--surface3);color:var(--text);border:1px solid var(--border2);box-shadow:none}
  .pro-badge{background:transparent;color:var(--text);border:1px solid var(--border2);animation:none;font-weight:500;letter-spacing:.1em}
  .usage-bar-fill{background:var(--text)}
  .stat-card:hover,.trade-card:hover{transform:translateY(-2px);box-shadow:none;border-color:var(--border2)}
  .stat-value.blue,.stat-value.purple,.stat-value.yellow{color:var(--text)}
  .trade-card-top-badge.long{background:rgba(11,11,12,.85);color:var(--accent);border:1px solid rgba(126,201,160,.35)}
  .trade-card-top-badge.short{background:rgba(11,11,12,.85);color:var(--red);border:1px solid rgba(217,130,130,.35)}
  .card-action-btn.edit,.card-action-btn.del{background:rgba(11,11,12,.85);color:var(--text);border:1px solid var(--border2)}
  .badge.long{background:transparent;border-color:rgba(126,201,160,.3)}.badge.short{background:transparent;border-color:rgba(217,130,130,.3)}
  .trade-card-img-placeholder,.detail-chart-placeholder{background:var(--surface2);color:var(--muted2)}
  .msg-bubble.user{background:var(--surface3);border-color:var(--border2)}
  input:focus,select:focus,textarea:focus,.ai-input:focus,.auth-field input:focus{border-color:var(--text2);box-shadow:none}
  .paywall-card,.modal,.detail-modal,.auth-card,.confirm-box{box-shadow:none;border-color:var(--border2);background:var(--surface)}
  .paywall-icon,.empty-icon{animation:none;color:var(--muted)}
  .toast{border-color:var(--border2);color:var(--text);box-shadow:none}
  .auth-success{background:transparent;color:var(--accent);border-color:rgba(126,201,160,.3)}
  .upload-zone:hover{border-color:var(--text2);background:transparent}
  .mobile-header{background:rgba(11,11,12,.92)}.bottom-nav{background:rgba(11,11,12,.96)}
  .bottom-nav-item{padding:8px 4px}.bottom-nav-item.active{color:var(--text)}
  .mobile-right{display:flex;align-items:center;gap:12px}
  .mobile-upgrade{padding:7px 14px;border-radius:999px;border:none;background:var(--text);color:var(--bg);font-size:12px;font-weight:600;font-family:var(--font);cursor:pointer}
  .mobile-pro{font-family:var(--mono);font-size:10px;letter-spacing:.1em;border:1px solid var(--border2);padding:4px 10px;border-radius:999px;color:var(--text2)}
  .fb-wrap{max-width:660px}
  .fb-chips{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 22px}
  .chip{padding:8px 16px;border-radius:999px;border:1px solid var(--border2);background:transparent;color:var(--text2);cursor:pointer;font-size:13px;font-family:var(--font);transition:all .2s}
  .chip:hover{color:var(--text);border-color:var(--text2)}
  .chip.on{background:var(--text);color:var(--bg);border-color:var(--text)}
  .fb-foot{display:flex;justify-content:space-between;align-items:center;margin-top:16px;font-family:var(--mono);font-size:11px;color:var(--muted)}
  .fb-sent{text-align:center;padding:36px 12px}
  .fb-sent-title{font-family:var(--display);font-size:30px}
  @media (max-width:768px){.page-title{font-size:28px}.fb-wrap{max-width:100%}}

  .set-wrap{max-width:720px}.set-section{margin-bottom:20px}.set-body{padding:22px;display:grid;gap:14px}.set-row{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
  input:disabled{opacity:.55;cursor:not-allowed}

`;

const EMOTIONS = ["Confident","Calm","Disciplined","FOMO","Anxious","Greedy","Revenge","Patient"];
const SETUPS   = ["Trend Follow","Breakout","Breakdown","Momentum","Reversal","Catalyst","Scalp","Swing"];
const WELCOME_MSG = { role:"ai", text:"Hello. I'm your AI trading coach powered by Claude. Ask me anything about your trades, patterns, or psychology!" };
const EMPTY_FORM  = { date:new Date().toISOString().slice(0,10), ticker:"", direction:"long", entry:"", exit:"", shares:"", emotion:"Confident", setup:"Breakout", notes:"", screenshot:null };

const callAI = async (messages) => {
  if (!OPENROUTER_KEY) throw new Error("VITE_OPENROUTER_KEY is missing. Add it in Vercel (or your .env file) and redeploy.");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method:"POST",
    headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${OPENROUTER_KEY.trim()}`, "HTTP-Referer":window.location.origin },
    body: JSON.stringify({ model:AI_MODEL, max_tokens:2000, messages }),
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok || data.error) throw new Error(data.error?.message || ("OpenRouter error " + res.status));
  return data.choices?.[0]?.message?.content || "The model returned an empty answer. Please try again.";
};

// ── AUTH ──────────────────────────────────────────────────────
function AuthPage() {
  const [tab, setTab] = useState("login");
  const [view, setView] = useState("auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const friendlyError = (code) => ({
    "auth/email-already-in-use":"This email is already registered.",
    "auth/invalid-email":"Please enter a valid email address.",
    "auth/weak-password":"Password must be at least 6 characters.",
    "auth/user-not-found":"No account found with this email.",
    "auth/wrong-password":"Incorrect password.",
    "auth/invalid-credential":"Invalid email or password.",
    "auth/popup-closed-by-user":"Google sign-in was cancelled.",
  }[code] || "Something went wrong. Please try again.");

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      if (tab==="signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName:name });
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

  const handleReset = async () => {
    setError(""); setSuccess(""); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("✓ Reset email sent! Check your inbox.");
    } catch(e) { setError(friendlyError(e.code)); }
    setLoading(false);
  };

  if (view==="reset") return (
    <>
      <style>{STYLES}</style>
      <div className="auth-page">
        <div className="auth-bg"/><div className="auth-grid"/>
        <div className="auth-card">
          <div className="auth-logo">TradeAI</div>
          <div className="auth-subtitle">// RESET YOUR PASSWORD</div>
          {error&&<div className="auth-error">{error}</div>}
          {success&&<div className="auth-success">{success}</div>}
          {!success&&<>
            <div className="auth-field"><label>Email address</label><input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleReset()}/></div>
            <button className="auth-btn auth-btn-primary" onClick={handleReset} disabled={loading}>{loading?"Sending...":"Send Reset Email"}</button>
          </>}
          <div style={{textAlign:"center",marginTop:18}}>
            <span style={{fontSize:13,color:"var(--text2)",cursor:"pointer",fontFamily:"var(--mono)"}} onClick={()=>{setView("auth");setError("");setSuccess("");}}>← Back to Sign In</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="auth-page">
        <div className="auth-bg"/><div className="auth-grid"/>
        <div className="auth-card">
          <div className="auth-logo">TradeAI</div>
          <div className="auth-subtitle">// AI-POWERED TRADING JOURNAL</div>
          <div className="auth-tabs">
            <div className={`auth-tab ${tab==="login"?"active":""}`} onClick={()=>{setTab("login");setError("");}}>Sign In</div>
            <div className={`auth-tab ${tab==="signup"?"active":""}`} onClick={()=>{setTab("signup");setError("");}}>Sign Up</div>
          </div>
          {error&&<div className="auth-error">{error}</div>}
          {tab==="signup"&&<div className="auth-field"><label>Full Name</label><input placeholder="John Doe" value={name} onChange={e=>setName(e.target.value)}/></div>}
          <div className="auth-field"><label>Email</label><input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/></div>
          <div className="auth-field">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
              <label style={{margin:0}}>Password</label>
              {tab==="login"&&<span style={{fontSize:11,color:"var(--accent)",cursor:"pointer",fontFamily:"var(--mono)"}} onClick={()=>{setView("reset");setError("");}}>Forgot password?</span>}
            </div>
            <input type="password" placeholder={tab==="signup"?"At least 6 characters":"••••••••"} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
          </div>
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

// ── PAYWALL ───────────────────────────────────────────────────
function Paywall({ user, onClose }) {
  const [loading, setLoading] = useState(false);
  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ userId:user.uid, email:user.email }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error("Server crashed: " + text.slice(0, 120)); }
      if (!res.ok || !data.url) throw new Error(data.error || "Could not start checkout");
      window.location.href = data.url;
    } catch(e) { alert("Payment error: "+e.message); }
    setLoading(false);
  };
  return (
    <div className="paywall-overlay" onClick={onClose}>
      <div className="paywall-card" onClick={e=>e.stopPropagation()}>
        <div className="paywall-glow"/>
        <button className="paywall-close-btn" onClick={onClose}>✕</button>
        <div className="paywall-icon">◆</div>
        <div className="paywall-title">Unlock <span>TradeAI Pro</span></div>
        <div className="paywall-sub">You've used all {FREE_LIMIT} free trades. Upgrade for unlimited journaling and full AI coaching.</div>
        <div className="paywall-price-wrap">
          <div className="paywall-price">$4.99</div>
          <div className="paywall-price-sub">per month · cancel anytime</div>
        </div>
        <div className="paywall-features">
          {["Unlimited trade logging","Full AI coach access","Advanced performance analytics","Chart screenshot uploads","Priority support"].map(f=>(
            <div key={f} className="paywall-feature"><span className="paywall-feature-icon">✓</span><span>{f}</span></div>
          ))}
        </div>
        <button className="paywall-btn" onClick={handleSubscribe} disabled={loading}>{loading?"Redirecting to payment...":"Upgrade to Pro — $4.99/mo"}</button>
        <div className="paywall-cancel" onClick={onClose}>Maybe later</div>
      </div>
    </div>
  );
}

const FB_TYPES = ["Suggestion","Bug","Complaint","Other"];
function FeedbackPage({ user, isPro, displayName, onDone }) {
  const [type, setType] = useState("Suggestion");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async () => {
    const text = message.trim();
    if (text.length < 5) { onDone("Please write a few more words"); return; }
    setSending(true);
    try {
      await addDoc(collection(db, "feedback"), { uid:user.uid, email:user.email||"", name:displayName, type, message:text.slice(0,2000), isPro, createdAt:Date.now() });
      setSent(true); setMessage("");
    } catch(e) { onDone("Could not send: " + e.message); }
    setSending(false);
  };
  return (
    <div className="fb-wrap">
      <div className="page-header"><div><div className="page-title">Feedback</div><div className="page-sub">// TELL US WHAT TO IMPROVE</div></div></div>
      <div className="panel" style={{padding:24}}>
        {sent ? (
          <div className="fb-sent">
            <div className="fb-sent-title">Thank you.</div>
            <div style={{color:"var(--text2)",fontSize:14,margin:"8px 0 22px"}}>Your message reached us. We read every one.</div>
            <button className="btn btn-ghost" onClick={()=>setSent(false)}>Send another</button>
          </div>
        ) : (<>
          <label>Type</label>
          <div className="fb-chips">{FB_TYPES.map(t=>(<button key={t} className={"chip "+(type===t?"on":"")} onClick={()=>setType(t)}>{t}</button>))}</div>
          <label>Your message</label>
          <textarea style={{marginTop:8,minHeight:150}} maxLength={2000} placeholder="Tell us what is not working, or what you would love to see..." value={message} onChange={e=>setMessage(e.target.value)}/>
          <div className="fb-foot"><span>{message.length}/2000</span><button className="btn btn-primary" onClick={submit} disabled={sending}>{sending?"Sending...":"Send feedback"}</button></div>
        </>)}
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────
export default function Root() {
  const [user, setUser] = useState(undefined);
  useEffect(()=>{ const u = onAuthStateChanged(auth, u=>setUser(u)); return u; },[]);
  useEffect(()=>{
    const p = new URLSearchParams(window.location.search);
    if (p.get("success")==="true") {
      const uid = p.get("uid");
      if (uid) { setDoc(doc(db,"users",uid),{isPro:true},{merge:true}); window.history.replaceState({},"","/"); }
    }
  },[]);
  if (user===undefined) return (<><style>{STYLES}</style><div className="loading-screen"><div className="spinner"/><span>LOADING TRADEAI</span></div></>);
  if (!user) return <AuthPage/>;
  return <Journal user={user}/>;
}

// ── JOURNAL ───────────────────────────────────────────────────
function Journal({ user }) {
  const [page, setPage]               = useState("journal");
  const [trades, setTrades]           = useState([]);
  const [userDoc, setUserDoc]         = useState({ isPro:false });
  const [tradesLoading, setTradesLoading] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
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

  const isPro = userDoc?.isPro === true;

  useEffect(()=>{ const u = onSnapshot(doc(db,"users",user.uid),snap=>{ if(snap.exists()) setUserDoc(snap.data()); }); return u; },[user.uid]);
  useEffect(()=>{
    const q = query(collection(db,"users",user.uid,"trades"),orderBy("createdAt","desc"));
    const u = onSnapshot(q,snap=>{ setTrades(snap.docs.map(d=>({id:d.id,...d.data()}))); setTradesLoading(false); });
    return u;
  },[user.uid]);
  useEffect(()=>{ if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight; },[messages,aiLoading]);

  const showToast = (msg)=>{ setToast(msg); setTimeout(()=>setToast(null),3000); };

  const openAdd = ()=>{
    if (!isPro&&trades.length>=FREE_LIMIT){ setShowPaywall(true); return; }
    setEditingTrade(null); setForm(EMPTY_FORM); setShowModal(true);
  };
  const openEdit = (trade,e)=>{ e?.stopPropagation(); setEditingTrade(trade); setForm({...trade}); setShowModal(true); };

  const handleScreenshot = (file,cb)=>{
    if (!file) return;
    const r = new FileReader();
    r.onload = e=>{ const img=new Image(); img.onload=()=>{ const k=Math.min(1,1000/img.width); const c=document.createElement("canvas"); c.width=Math.round(img.width*k); c.height=Math.round(img.height*k); c.getContext("2d").drawImage(img,0,0,c.width,c.height); cb(c.toDataURL("image/jpeg",0.72)); }; img.src=e.target.result; };
    r.readAsDataURL(file);
  };

  const saveTrade = async ()=>{
    if (!form.ticker||!form.entry||!form.exit||!form.shares) return;
    const pnl = Math.round((parseFloat(form.exit)-parseFloat(form.entry))*parseInt(form.shares)*(form.direction==="short"?-1:1));
    setSaving(true);
    try {
      const td = { ...form, entry:+form.entry, exit:+form.exit, shares:+form.shares, pnl, uid:user.uid };
      if (editingTrade) {
        await updateDoc(doc(db,"users",user.uid,"trades",editingTrade.id),{...td,updatedAt:Date.now()});
        showToast("✓ Trade updated");
        if(detailTrade?.id===editingTrade.id) setDetailTrade({id:editingTrade.id,...td});
      } else {
        td.createdAt=Date.now();
        const ref = await addDoc(collection(db,"users",user.uid,"trades"),td);
        showToast("✓ Trade saved");
        setTimeout(()=>analyzeTradeAI({id:ref.id,...td}),600);
      }
    } catch(e){ showToast("Error: "+e.message); }
    setSaving(false); setShowModal(false); setForm(EMPTY_FORM); setEditingTrade(null);
  };

  const deleteTrade = async (id)=>{
    try{ await deleteDoc(doc(db,"users",user.uid,"trades",id)); showToast("Trade deleted"); }
    catch{ showToast("Delete failed"); }
    setConfirmDelete(null); setDetailTrade(null);
  };

  const analyzeTradeAI = async (trade)=>{
    setPage("ai"); setDetailTrade(null);
    setMessages(prev=>[...prev,{role:"user",text:`Analyze my ${trade.ticker} trade (P&L: ${trade.pnl>=0?"+":""}$${trade.pnl})`}]);
    setAiLoading(true);
    try {
      const reply = await callAI([
        {role:"system",content:"You are an expert stock trading coach. Be concise (3-4 sentences), direct, and actionable."},
        {role:"user",content:`Analyze:\n${trade.ticker} | ${trade.direction.toUpperCase()} | Entry:$${trade.entry} | Exit:$${trade.exit} | Shares:${trade.shares} | P&L:$${trade.pnl} | Setup:${trade.setup} | Emotion:${trade.emotion} | Notes:"${trade.notes}"`}
      ]);
      setMessages(prev=>[...prev,{role:"ai",text:reply}]);
    } catch(e){ setMessages(prev=>[...prev,{role:"ai",text:"AI error: "+e.message}]); }
    setAiLoading(false);
  };

  const sendMessage = async ()=>{
    if (!input.trim()||aiLoading) return;
    const msg=input.trim(); setInput("");
    setMessages(prev=>[...prev,{role:"user",text:msg}]);
    setAiLoading(true);
    try {
      const reply = await callAI([
        {role:"system",content:`Expert stock trading coach. Concise, direct, actionable. Trader: ${trades.length} trades, win rate ${winRate}%, P&L $${totalPnl}.`},
        {role:"user",content:msg}
      ]);
      setMessages(prev=>[...prev,{role:"ai",text:reply}]);
    } catch(e){ setMessages(prev=>[...prev,{role:"ai",text:"AI error: "+e.message}]); }
    setAiLoading(false);
  };

  const totalPnl = trades.reduce((s,t)=>s+t.pnl,0);
  const wins = trades.filter(t=>t.pnl>0);
  const losses = trades.filter(t=>t.pnl<0);
  const winRate = trades.length?Math.round((wins.length/trades.length)*100):0;
  const avgWin = wins.length?Math.round(wins.reduce((s,t)=>s+t.pnl,0)/wins.length):0;
  const avgLoss = losses.length?Math.round(losses.reduce((s,t)=>s+t.pnl,0)/losses.length):0;
  const rr = avgLoss?Math.abs((avgWin/avgLoss).toFixed(2)):0;
  const gp=wins.reduce((a,t)=>a+t.pnl,0), gl=Math.abs(losses.reduce((a,t)=>a+t.pnl,0));
  const pf = gl?(gp/gl).toFixed(2):(gp?"∞":"0");
  const usagePct = Math.min(100,(trades.length/FREE_LIMIT)*100);

  const eqPts=(()=>{ let c=0; return [...trades].reverse().map((t,i)=>({x:i,y:(c+=t.pnl)})); })();
  const minY=Math.min(0,...eqPts.map(p=>p.y)),maxY=Math.max(1,...eqPts.map(p=>p.y));
  const W=320,H=80;
  const tx=x=>(x/Math.max(1,eqPts.length-1))*W;
  const ty=y=>H-((y-minY)/(maxY-minY))*H;
  const pathD=eqPts.map((p,i)=>`${i===0?"M":"L"}${tx(p.x)},${ty(p.y)}`).join(" ");
  const fillD=pathD+` L${tx(eqPts.length-1)},${H} L0,${H} Z`;
  const emotionBd=EMOTIONS.map(e=>({label:e,pnl:trades.filter(t=>t.emotion===e).reduce((s,t)=>s+t.pnl,0)})).filter(e=>trades.some(t=>t.emotion===e)).sort((a,b)=>b.pnl-a.pnl);
  const setupBd=SETUPS.map(s=>({label:s,pnl:trades.filter(t=>t.setup===s).reduce((s,t)=>s+t.pnl,0)})).filter(s=>trades.some(t=>t.setup===s)).sort((a,b)=>b.pnl-a.pnl);
  const estPnl=form.entry&&form.exit&&form.shares?Math.round((parseFloat(form.exit)-parseFloat(form.entry))*parseInt(form.shares)*(form.direction==="short"?-1:1)):null;
  const displayName=user.displayName||user.email?.split("@")[0]||"Trader";
  const initials=(displayName[0]||"T").toUpperCase();
  const NAV=[{id:"journal",icon:"▤",label:"Journal"},{id:"performance",icon:"◐",label:"Stats"},{id:"ai",icon:"✦",label:"AI"},{id:"feedback",icon:"✎",label:"Feedback"},{id:"settings",icon:"⚙",label:"Settings"}];

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">

        {/* MOBILE HEADER */}
        <div className="mobile-header">
          <div className="mobile-logo">TradeAI</div>
          <div className="mobile-right">
            <div className="mobile-pnl" style={{color:totalPnl>=0?"var(--accent)":"var(--red)"}}>{totalPnl>=0?"+":""}${totalPnl.toLocaleString()}</div>
            {isPro?<div className="mobile-pro">PRO</div>:<button className="mobile-upgrade" onClick={()=>setShowPaywall(true)}>Upgrade</button>}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-logo-wrap">
            <div className="logo-text">TradeAI</div>
            <div className="logo-sub">AI JOURNAL · v1.0</div>
          </div>
          <div className="nav">
            {NAV.map(item=>(
              <div key={item.id} className={`nav-item ${page===item.id?"active":""}`} onClick={()=>setPage(item.id)}>
                <span className="nav-icon">{item.icon}</span>{item.label}
              </div>
            ))}
          </div>
          <div className="sidebar-bottom">
            <div className="sidebar-pnl-card">
              <div className="sidebar-pnl-label">TOTAL P&L</div>
              <div className="sidebar-pnl" style={{color:totalPnl>=0?"var(--accent)":"var(--red)"}}>{totalPnl>=0?"+":""}${totalPnl.toLocaleString()}</div>
            </div>
            <div className="sidebar-user">
              <div className="sidebar-avatar">{initials}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{displayName}</div>
                <div className="sidebar-user-email">{user.email}</div>
              </div>
            </div>
            {isPro
              ?<div className="pro-badge">PRO</div>
              :<>
                <div className="free-badge">FREE · {trades.length}/{FREE_LIMIT} trades</div>
                <div className="usage-bar-wrap">
                  <div className="usage-bar-label"><span>Usage</span><span>{trades.length}/{FREE_LIMIT}</span></div>
                  <div className="usage-bar-track"><div className="usage-bar-fill" style={{width:`${usagePct}%`}}/></div>
                </div>
                <button className="upgrade-btn" onClick={()=>setShowPaywall(true)}>Upgrade to Pro</button>
              </>
            }
            <button className="sign-out-btn" onClick={()=>signOut(auth)}>Sign Out</button>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">

          {/* JOURNAL */}
          {page==="journal"&&<>
            <div className="page-header">
              <div>
                <div className="page-title"><span className="page-title-gradient">Trade Journal</span></div>
                <div className="page-sub">// {trades.length} TRADES · WELCOME BACK, {displayName.split(" ")[0].toUpperCase()}</div>
              </div>
              <button className="btn btn-primary btn-desktop" onClick={openAdd}>+ Log Trade</button>
            </div>
            <div className="stats-row">
              <div className="stat-card green"><div className="stat-label">Total P&L</div><div className={`stat-value ${totalPnl>=0?"green":"red"}`}>{totalPnl>=0?"+":""}${totalPnl}</div><div className="stat-change">{trades.length} trades total</div></div>
              <div className="stat-card blue"><div className="stat-label">Win Rate</div><div className="stat-value blue">{winRate}%</div><div className="stat-change">{wins.length}W / {losses.length}L</div></div>
              <div className="stat-card purple"><div className="stat-label">Avg Win</div><div className="stat-value purple">+${avgWin}</div><div className="stat-change">per winning trade</div></div>
              <div className="stat-card red"><div className="stat-label">Risk : Reward</div><div className="stat-value yellow">{rr}:1</div><div className="stat-change">avg loss ${Math.abs(avgLoss)}</div></div>
            </div>
            {tradesLoading
              ?<div className="loading-screen" style={{minHeight:200}}><div className="spinner"/></div>
              :trades.length===0
                ?<div className="empty">
                  <div className="empty-icon">▤</div>
                  <div className="empty-title">No trades yet</div>
                  <div className="empty-sub">{FREE_LIMIT} free trades included — log your first one!</div>
                </div>
                :<div className="trade-cards-grid">
                  {trades.map((t,i)=>(
                    <div key={t.id} className="trade-card" style={{animationDelay:`${i*0.05}s`}} onClick={()=>setDetailTrade(t)}>
                      <div className="trade-card-actions" onClick={e=>e.stopPropagation()}>
                        <button className="card-action-btn edit" onClick={e=>openEdit(t,e)}>✎</button>
                        <button className="card-action-btn del" onClick={e=>{e.stopPropagation();setConfirmDelete(t);}}>⌫</button>
                      </div>
                      <div className={`trade-card-top-badge ${t.direction}`}>{t.direction.toUpperCase()}</div>
                      {t.screenshot?<img className="trade-card-img" src={t.screenshot} alt="chart"/>:<div className="trade-card-img-placeholder">◢</div>}
                      <div className="trade-card-body">
                        <div className="trade-card-ticker">{t.ticker}</div>
                        <div className={`trade-card-pnl ${t.pnl>=0?"pos":"neg"}`}>{t.pnl>=0?"+":""}${t.pnl}</div>
                        <div className="trade-card-meta">
                          <span className="meta-chip">{t.date?.slice(5)}</span>
                          <span className="meta-chip">{t.setup}</span>
                          <span className="meta-chip">{t.emotion}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </>}

          {/* PERFORMANCE */}
          {page==="performance"&&<>
            <div className="page-header">
              <div><div className="page-title"><span className="page-title-gradient">Performance</span></div><div className="page-sub">// ANALYTICS & INSIGHTS</div></div>
            </div>
            <div className="stats-row">
              <div className="stat-card green"><div className="stat-label">Net P&L</div><div className={`stat-value ${totalPnl>=0?"green":"red"}`}>{totalPnl>=0?"+":""}${totalPnl}</div></div>
              <div className="stat-card blue"><div className="stat-label">Win Rate</div><div className="stat-value blue">{winRate}%</div></div>
              <div className="stat-card yellow"><div className="stat-label">Profit Factor</div><div className="stat-value yellow">{pf}</div></div>
              <div className="stat-card purple"><div className="stat-label">Total Trades</div><div className="stat-value purple">{trades.length}</div></div>
            </div>
            <div className="perf-grid">
              <div className="panel">
                <div className="panel-header"><div className="panel-title">Equity Curve</div></div>
                <div className="equity-chart">
                  <svg width="100%" viewBox={`0 0 ${W} ${H+20}`}>
                    <defs>
                      <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7ec9a0" stopOpacity="0.3"/><stop offset="100%" stopColor="#7ec9a0" stopOpacity="0"/></linearGradient>
                      <filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    </defs>
                    {eqPts.length>1&&<>
                      <path d={fillD} fill="url(#eq)"/>
                      <path d={pathD} stroke="#7ec9a0" strokeWidth="2.5" fill="none" filter="url(#glow)"/>
                      {eqPts.map((p,i)=><circle key={i} cx={tx(p.x)} cy={ty(p.y)} r="3.5" fill="#7ec9a0" opacity="0.8"/>)}
                    </>}
                    <text x="0" y={H+16} fontSize="9" fill="var(--muted)" fontFamily="var(--mono)">START</text>
                    <text x={W-24} y={H+16} fontSize="9" fill="var(--muted)" fontFamily="var(--mono)">NOW</text>
                  </svg>
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><div className="panel-title">P&L by Emotion</div></div>
                <div style={{padding:"16px 20px"}}>
                  {emotionBd.length===0?<div style={{color:"var(--muted)",fontSize:13}}>No data yet.</div>:emotionBd.map(e=>(
                    <div key={e.label} className="bar-row">
                      <div style={{width:82,fontSize:12,color:"var(--text2)"}}>{e.label}</div>
                      <div className="bar-track"><div className="bar-fill" style={{width:`${Math.min(100,Math.abs(e.pnl)/Math.max(...emotionBd.map(x=>Math.abs(x.pnl)))*100)}%`,background:e.pnl>=0?"linear-gradient(90deg,var(--accent),var(--accent2))":"linear-gradient(90deg,var(--red),var(--red))"}}/></div>
                      <div style={{width:64,textAlign:"right",fontFamily:"var(--mono)",fontSize:11,color:e.pnl>=0?"var(--accent)":"var(--red)",fontWeight:700}}>{e.pnl>=0?"+":""}${e.pnl}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><div className="panel-title">P&L by Setup</div></div>
                <div style={{padding:"16px 20px"}}>
                  {setupBd.length===0?<div style={{color:"var(--muted)",fontSize:13}}>No data yet.</div>:setupBd.map(s=>(
                    <div key={s.label} className="bar-row">
                      <div style={{width:92,fontSize:12,color:"var(--text2)"}}>{s.label}</div>
                      <div className="bar-track"><div className="bar-fill" style={{width:`${Math.min(100,Math.abs(s.pnl)/Math.max(...setupBd.map(x=>Math.abs(x.pnl)))*100)}%`,background:s.pnl>=0?"linear-gradient(90deg,var(--accent2),var(--accent3))":"linear-gradient(90deg,var(--red),var(--red))"}}/></div>
                      <div style={{width:58,textAlign:"right",fontFamily:"var(--mono)",fontSize:11,color:s.pnl>=0?"var(--accent2)":"var(--red)",fontWeight:700}}>{s.pnl>=0?"+":""}${s.pnl}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><div className="panel-title">Trade Breakdown</div></div>
                <div style={{padding:"16px 20px"}}>
                  {[["Winning Trades",wins.length,"var(--accent)"],["Losing Trades",losses.length,"var(--red)"],["Avg Win",`+$${avgWin}`,"var(--accent)"],["Avg Loss",`-$${Math.abs(avgLoss)}`,"var(--red)"],["Best Trade",trades.length?`+$${Math.max(...trades.map(t=>t.pnl))}`:"—","var(--accent)"],["Worst Trade",trades.length?`$${Math.min(...trades.map(t=>t.pnl))}`:"—","var(--red)"]].map(([k,v,c])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)",fontSize:13}}>
                      <span style={{color:"var(--text2)"}}>{k}</span>
                      <span style={{fontFamily:"var(--mono)",color:c,fontWeight:700}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>}

          {/* AI */}
          {page==="ai"&&<>
            <div className="page-header">
              <div><div className="page-title"><span className="page-title-gradient">AI Coach</span></div><div className="page-sub">// POWERED BY CLAUDE · OPENROUTER</div></div>
            </div>
            <div className="panel" style={{display:"flex",flexDirection:"column",height:"min(580px,72vh)"}}>
              <div className="panel-header">
                <div className="panel-title">Chat with AI Coach</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["My win rate","Best setup?","My psychology"].map(q=>(
                    <button key={q} className="btn btn-ghost btn-sm" onClick={()=>setInput(q)}>{q}</button>
                  ))}
                </div>
              </div>
              <div className="ai-chat" ref={chatRef}>
                {messages.map((m,i)=>(
                  <div key={i} className="ai-msg" style={{flexDirection:m.role==="user"?"row-reverse":"row"}}>
                    {m.role==="ai"?<div className="ai-avatar">✦</div>:<div className="user-avatar">{initials}</div>}
                    <div className={`msg-bubble ${m.role==="user"?"user":""}`}>{m.text}</div>
                  </div>
                ))}
                {aiLoading&&<div className="ai-msg"><div className="ai-avatar">✦</div><div className="msg-bubble"><div className="typing"><div className="dot"/><div className="dot"/><div className="dot"/></div></div></div>}
              </div>
              <div className="ai-input-row">
                <input className="ai-input" placeholder="Ask about your trades, patterns, psychology..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()}/>
                <button className="btn btn-primary" onClick={sendMessage} disabled={aiLoading}>{aiLoading?"...":"Send"}</button>
              </div>
            </div>
            <div className="panel" style={{marginTop:18}}>
              <div className="panel-header"><div className="panel-title">Quick Analyze</div></div>
              <div style={{padding:"8px 0"}}>
                {trades.slice(0,5).map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 20px",borderBottom:"1px solid var(--border)",fontSize:13,transition:"background 0.15s",cursor:"default"}} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                    <div style={{display:"flex",gap:12,alignItems:"center"}}>
                      <span style={{fontFamily:"var(--mono)",fontWeight:700,fontSize:14}}>{t.ticker}</span>
                      <span className={`badge ${t.direction}`}>{t.direction.toUpperCase()}</span>
                      <span style={{fontFamily:"var(--mono)",color:t.pnl>=0?"var(--accent)":"var(--red)",fontWeight:700}}>{t.pnl>=0?"+":""}${t.pnl}</span>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={()=>analyzeTradeAI(t)}>Analyze →</button>
                  </div>
                ))}
                {trades.length===0&&<div style={{padding:"20px",color:"var(--muted)",fontSize:13,textAlign:"center"}}>No trades to analyze yet.</div>}
              </div>
            </div>
          </>}
          {page==="settings"&&<SettingsPage user={user} auth={auth} db={db} isPro={isPro} trades={trades} onDone={showToast}/>}
          {page==="feedback"&&<FeedbackPage user={user} isPro={isPro} displayName={displayName} onDone={showToast}/>}
        </div>

        {/* MOBILE BOTTOM NAV */}
        <div className="bottom-nav">
          <div className="bottom-nav-inner">
            {NAV.map(item=>(
              <div key={item.id} className={`bottom-nav-item ${page===item.id?"active":""}`} onClick={()=>setPage(item.id)}>
                <span className="bottom-nav-icon">{item.icon}</span>
                <span className="bottom-nav-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MOBILE FAB */}
        <button className="fab" onClick={openAdd} aria-label="Log trade">+</button>

        {/* PAYWALL */}
        {showPaywall&&<Paywall user={user} onClose={()=>setShowPaywall(false)}/>}

        {/* DETAIL */}
        {detailTrade&&(
          <div className="overlay" onClick={()=>setDetailTrade(null)}>
            <div className="detail-modal" onClick={e=>e.stopPropagation()}>
              <div className="detail-header">
                <div>
                  <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)",marginBottom:5,letterSpacing:"2px"}}>{detailTrade.date}</div>
                  <div style={{fontSize:26,fontWeight:900,letterSpacing:"-1px"}}>{detailTrade.ticker}</div>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginTop:8}}>
                    <span className={`badge ${detailTrade.direction}`}>{detailTrade.direction.toUpperCase()}</span>
                    <span style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:17,color:detailTrade.pnl>=0?"var(--accent)":"var(--red)"}}>{detailTrade.pnl>=0?"+":""}${detailTrade.pnl}</span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={()=>setDetailTrade(null)}>✕</button>
              </div>
              {detailTrade.screenshot?<img className="detail-chart" src={detailTrade.screenshot} alt="chart" style={{marginTop:16}} onClick={()=>setLightbox(detailTrade.screenshot)}/>:<div className="detail-chart-placeholder">◢</div>}
              <div className="detail-grid">
                {[["Entry","$"+detailTrade.entry],["Exit","$"+detailTrade.exit],["Shares",detailTrade.shares],["Setup",detailTrade.setup],["Emotion",detailTrade.emotion],["P&L",(detailTrade.pnl>=0?"+":"")+"$"+detailTrade.pnl]].map(([k,v])=>(
                  <div key={k} className="detail-cell">
                    <div className="detail-cell-label">{k}</div>
                    <div className="detail-cell-val" style={{color:k==="P&L"?(detailTrade.pnl>=0?"var(--accent)":"var(--red)"):"var(--text)"}}>{v}</div>
                  </div>
                ))}
              </div>
              {detailTrade.notes&&<div className="detail-notes"><div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"2px",marginBottom:9}}>Notes</div>{detailTrade.notes}</div>}
              <div className="detail-actions">
                <button className="btn btn-primary" style={{flex:1}} onClick={()=>analyzeTradeAI(detailTrade)}>AI Analysis</button>
                <button className="btn btn-blue" onClick={e=>openEdit(detailTrade,e)}>Edit</button>
                <button className="btn btn-danger" onClick={()=>setConfirmDelete(detailTrade)}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* ADD/EDIT */}
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
                    :<div className="upload-zone"><input type="file" accept="image/*" onChange={e=>handleScreenshot(e.target.files[0],src=>setForm(f=>({...f,screenshot:src})))}/><div className="upload-zone-icon">↥</div><div className="upload-zone-text">Click to upload chart screenshot</div></div>
                  }
                </div>
              </div>
              {estPnl!==null&&<div className="est-pnl-bar">Estimated P&L: <span style={{color:estPnl>=0?"var(--accent)":"var(--red)",fontWeight:800}}>{estPnl>=0?"+":""}${estPnl}</span></div>}
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
              <div className="confirm-sub">{confirmDelete.ticker} · {confirmDelete.date}<br/><span style={{color:confirmDelete.pnl>=0?"var(--accent)":"var(--red)",fontWeight:700}}>{confirmDelete.pnl>=0?"+":""}${confirmDelete.pnl}</span><br/><br/>This action cannot be undone.</div>
              <div className="confirm-actions">
                <button className="btn btn-ghost" onClick={()=>setConfirmDelete(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={()=>deleteTrade(confirmDelete.id)}>Yes, Delete</button>
              </div>
            </div>
          </div>
        )}

        {lightbox&&(<div className="lightbox" onClick={()=>setLightbox(null)}><button className="lightbox-close" onClick={()=>setLightbox(null)}>✕</button><img src={lightbox} alt="screenshot" onClick={e=>e.stopPropagation()}/></div>)}
        {toast&&<div className="toast">{toast}</div>}
      </div>
    </>
  );
}
