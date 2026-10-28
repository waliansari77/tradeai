import { useState } from "react";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendEmailVerification, deleteUser, signOut } from "firebase/auth";
import { doc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

export default function SettingsPage({ user, auth, db, isPro, trades, onDone }) {
  const [name, setName] = useState(user.displayName || "");
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState("");
  const hasPassword = user.providerData.some(p => p.providerId === "password");

  const run = async (key, fn) => {
    setBusy(key);
    try { await fn(); }
    catch (e) {
      const m = e.code === "auth/requires-recent-login" ? "Please sign out, sign in again, then retry."
        : (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") ? "Current password is incorrect."
        : e.message;
      onDone(m);
    }
    setBusy("");
  };

  const saveName = () => run("name", async () => {
    await updateProfile(auth.currentUser, { displayName: name.trim() });
    await setDoc(doc(db, "users", user.uid), { displayName: name.trim() }, { merge: true });
    onDone("✓ Profile saved");
    setTimeout(() => window.location.reload(), 700);
  });

  const verify = () => run("verify", async () => {
    await sendEmailVerification(auth.currentUser);
    onDone("✓ Verification email sent");
  });

  const changePw = () => run("pw", async () => {
    if (pw.length < 6) throw new Error("New password must be at least 6 characters.");
    await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(user.email, cur));
    await updatePassword(auth.currentUser, pw);
    setCur(""); setPw("");
    onDone("✓ Password updated");
  });

  const portal = () => run("portal", async () => {
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch("/api/create-portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) });
    const text = await res.text();
    let d; try { d = JSON.parse(text); } catch { throw new Error("Server error: " + text.slice(0, 80)); }
    if (!res.ok || !d.url) throw new Error(d.error || "Could not open billing");
    window.location.href = d.url;
  });

  const exportCsv = () => {
    const cols = ["date", "ticker", "direction", "entry", "exit", "shares", "pnl", "setup", "emotion", "notes"];
    const esc = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const csv = [cols.join(","), ...trades.map(t => cols.map(c => esc(t[c])).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "tradeai-trades.csv";
    a.click();
  };

  const deleteAccount = () => run("del", async () => {
    if (isPro) throw new Error("Cancel your subscription first (Manage billing), then delete your account.");
    const snap = await getDocs(collection(db, "users", user.uid, "trades"));
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    await deleteDoc(doc(db, "users", user.uid));
    await deleteUser(auth.currentUser);
  });

  return (
    <div className="set-wrap">
      <div className="page-header"><div><div className="page-title">Settings</div><div className="page-sub">// ACCOUNT, BILLING & DATA</div></div></div>

      <div className="panel set-section">
        <div className="panel-header"><div className="panel-title">Profile</div></div>
        <div className="set-body">
          <div className="form-group"><label>Display name</label><input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="form-group"><label>Email</label><input value={user.email || ""} disabled /></div>
          <div className="set-row">
            <span style={{ fontSize: 13, color: user.emailVerified ? "var(--accent)" : "var(--text2)" }}>{user.emailVerified ? "Email verified" : "Email not verified"}</span>
            {!user.emailVerified && <button className="btn btn-ghost btn-sm" onClick={verify} disabled={busy === "verify"}>Send verification email</button>}
          </div>
          <div><button className="btn btn-primary" onClick={saveName} disabled={busy === "name" || !name.trim()}>{busy === "name" ? "Saving..." : "Save profile"}</button></div>
        </div>
      </div>

      <div className="panel set-section">
        <div className="panel-header"><div className="panel-title">Password</div></div>
        <div className="set-body">
          {hasPassword ? (<>
            <div className="form-group"><label>Current password</label><input type="password" value={cur} onChange={e => setCur(e.target.value)} /></div>
            <div className="form-group"><label>New password</label><input type="password" placeholder="At least 6 characters" value={pw} onChange={e => setPw(e.target.value)} /></div>
            <div><button className="btn btn-primary" onClick={changePw} disabled={busy === "pw" || !cur || !pw}>{busy === "pw" ? "Updating..." : "Update password"}</button></div>
          </>) : (<div style={{ fontSize: 13, color: "var(--text2)" }}>You signed in with Google, so your password is managed in your Google account.</div>)}
        </div>
      </div>

      <div className="panel set-section">
        <div className="panel-header"><div className="panel-title">Subscription</div></div>
        <div className="set-body">
          <div className="set-row"><span>Plan</span><strong>{isPro ? "Pro · $4.99/month" : `Free · ${trades.length}/10 trades`}</strong></div>
          {isPro
            ? <div><button className="btn btn-primary" onClick={portal} disabled={busy === "portal"}>{busy === "portal" ? "Opening..." : "Manage billing & cancel"}</button></div>
            : <div style={{ fontSize: 13, color: "var(--text2)" }}>Upgrade from the sidebar (or the Upgrade button on mobile) for unlimited trades.</div>}
        </div>
      </div>

      <div className="panel set-section">
        <div className="panel-header"><div className="panel-title">Your data</div></div>
        <div className="set-body">
          <div className="set-row"><span style={{ fontSize: 13, color: "var(--text2)" }}>Download all your trades as a CSV file.</span><button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={!trades.length}>Export CSV</button></div>
          <div className="set-row"><span style={{ fontSize: 13, color: "var(--text2)" }}>Leave TradeAI on this device.</span><button className="btn btn-ghost btn-sm" onClick={() => signOut(auth)}>Sign out</button></div>
        </div>
      </div>

      <div className="panel set-section" style={{ borderColor: "rgba(217,130,130,.3)" }}>
        <div className="panel-header"><div className="panel-title" style={{ color: "var(--red)" }}>Delete account</div></div>
        <div className="set-body">
          <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>This permanently deletes your trades, your profile and your login. It cannot be undone.</div>
          <div className="form-group"><label>Type DELETE to confirm</label><input value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
          <div><button className="btn btn-danger" onClick={deleteAccount} disabled={confirm !== "DELETE" || busy === "del"}>{busy === "del" ? "Deleting..." : "Delete my account"}</button></div>
        </div>
      </div>
    </div>
  );
}
