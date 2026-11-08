import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot, updateDoc, deleteDoc, doc } from "firebase/firestore";

// Firebase Console → Authentication → Users → copy YOUR "User UID". Must match the Firestore rule too.
export const ADMIN_UID = "cNMghMfx9LSKsh9VvsSOVx56A053";

const TYPES = ["All", "Suggestion", "Bug", "Complaint", "Other"];

export default function AdminPage({ db, onDone }) {
  const [items, setItems] = useState([]);
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("open");
  const [err, setErr] = useState("");

  useEffect(() => {
    const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"), limit(200));
    return onSnapshot(q, s => { setErr(""); setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, e => setErr(e.message));
  }, [db]);

  const list = items.filter(i => (type === "All" || i.type === type) && (status === "all" || (status === "done") === !!i.resolved));
  const openCount = items.filter(i => !i.resolved).length;

  const toggle = i => updateDoc(doc(db, "feedback", i.id), { resolved: !i.resolved }).catch(e => onDone(e.message));
  const remove = i => { if (window.confirm("Delete this feedback permanently?")) deleteDoc(doc(db, "feedback", i.id)).catch(e => onDone(e.message)); };

  return (
    <div>
      <div className="page-header"><div><div className="page-title">Feedback inbox</div><div className="page-sub">// {openCount} OPEN · {items.length} TOTAL</div></div></div>
      {err && <div className="auth-error">Cannot read feedback: {err}. Check that ADMIN_UID in Admin.jsx matches the Firestore rule.</div>}
      <div className="fb-chips" style={{ marginBottom: 8 }}>{TYPES.map(t => <button key={t} className={"chip " + (type === t ? "on" : "")} onClick={() => setType(t)}>{t}</button>)}</div>
      <div className="fb-chips">{[["open", "Open"], ["done", "Resolved"], ["all", "All"]].map(([k, l]) => <button key={k} className={"chip " + (status === k ? "on" : "")} onClick={() => setStatus(k)}>{l}</button>)}</div>
      <div className="panel">
        {list.length === 0 && <div className="empty"><div className="empty-title">Nothing here</div></div>}
        {list.map(i => (
          <div key={i.id} className="fb-item" style={{ opacity: i.resolved ? 0.55 : 1 }}>
            <div className="fb-meta">
              <span className="badge">{i.type}</span>
              {i.isPro && <span className="badge long">PRO</span>}
              <span>{i.name || "—"} · {i.email}</span>
              <span style={{ marginLeft: "auto" }}>{i.createdAt ? new Date(i.createdAt).toLocaleString() : ""}</span>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.65, margin: "10px 0 14px", whiteSpace: "pre-wrap" }}>{i.message}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => toggle(i)}>{i.resolved ? "Reopen" : "Mark resolved"}</button>
              {i.email && <a className="btn btn-ghost btn-sm" href={`mailto:${i.email}?subject=${encodeURIComponent("Re: your TradeAI feedback")}&body=${encodeURIComponent("Hi " + (i.name || "") + ",\n\n")}`}>Reply by email</a>}
              <button className="btn btn-danger btn-sm" onClick={() => remove(i)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
