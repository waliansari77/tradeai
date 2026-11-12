import { useState, useRef } from "react";
import { collection, doc, writeBatch } from "firebase/firestore";

export const EMPTY_FILTERS = { q: "", dir: "all", res: "all", setup: "all", from: "", to: "" };

export function applyFilters(trades, f) {
  const q = f.q.trim().toLowerCase();
  return trades.filter(t =>
    (!q || (t.ticker || "").toLowerCase().includes(q) || (t.notes || "").toLowerCase().includes(q) || (t.tags || []).some(x => x.includes(q))) &&
    (f.dir === "all" || t.direction === f.dir) &&
    (f.res === "all" || (f.res === "win" ? t.pnl > 0 : t.pnl < 0)) &&
    (f.setup === "all" || t.setup === f.setup) &&
    (!f.from || t.date >= f.from) && (!f.to || t.date <= f.to)
  );
}

// ── CSV import ────────────────────────────────────────────────
function parseCSV(text) {
  const first = text.split(/\r?\n/)[0] || "";
  const d = [",", ";", "\t"].sort((a, b) => first.split(b).length - first.split(a).length)[0];
  const rows = []; let row = [], cur = "", q = false;
  const push = () => { row.push(cur); cur = ""; if (row.some(x => x.trim() !== "")) rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === d) { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; push(); }
    else cur += c;
  }
  push();
  return rows;
}

const num = v => parseFloat(String(v ?? "").replace(/[$\s]/g, "").replace(/,(?=\d{1,2}$)/, ".").replace(/,/g, ""));
const normDate = v => {
  const s = String(v || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const dt = new Date(s);
  return isNaN(dt) ? new Date().toISOString().slice(0, 10) : dt.toISOString().slice(0, 10);
};

function readTrades(text) {
  const all = parseCSV(text.replace(/^\uFEFF/, ""));
  if (all.length < 2) return { rows: [], skipped: 0 };
  const head = all[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const col = names => head.findIndex(h => names.includes(h));
  const C = {
    date: col(["date", "tradedate", "closedate", "exitdate", "datetime", "time"]),
    ticker: col(["ticker", "symbol", "instrument", "stock"]),
    side: col(["direction", "side", "type", "action"]),
    entry: col(["entry", "entryprice", "buyprice", "openprice", "avgentry"]),
    exit: col(["exit", "exitprice", "sellprice", "closeprice", "avgexit"]),
    shares: col(["shares", "qty", "quantity", "size", "volume"]),
    pnl: col(["pnl", "profit", "netpnl", "realizedpnl", "profitloss"]),
  };
  const rows = []; let skipped = 0;
  all.slice(1).forEach(r => {
    const ticker = (r[C.ticker] || "").trim().toUpperCase();
    const entry = num(r[C.entry]), exit = num(r[C.exit]), shares = num(r[C.shares]);
    if (!ticker || [entry, exit, shares].some(isNaN)) { skipped++; return; }
    const direction = /^(s|sell|short)/i.test((r[C.side] || "").trim()) ? "short" : "long";
    const given = num(r[C.pnl]);
    const pnl = !isNaN(given) ? Math.round(given) : Math.round((exit - entry) * shares * (direction === "short" ? -1 : 1));
    rows.push({ date: normDate(r[C.date]), ticker, direction, entry, exit, shares, pnl, setup: "Other", emotion: "Neutral", notes: "Imported", screenshot: null });
  });
  return { rows, skipped };
}

// ── Search, filters, view switch, import ──────────────────────
export function Toolbar({ filters: f, setFilters, view, setView, setups, shown, total, db, user, trades, isPro, limit, onPaywall, onDone }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setFilters(x => ({ ...x, [k]: v }));
  const active = JSON.stringify(f) !== JSON.stringify(EMPTY_FILTERS);

  const onFile = async e => {
    const file = e.target.files[0]; e.target.value = "";
    if (!file) return;
    try {
      const { rows, skipped } = readTrades(await file.text());
      if (!rows.length) { onDone("No valid trades found. Needed columns: date, ticker, direction, entry, exit, shares"); return; }
      if (rows.length > 500) { onDone("Max 500 trades per file. Please split the file."); return; }
      const left = limit - trades.length;
      if (!isPro && rows.length > left) { onDone(`Free plan has ${Math.max(left, 0)} slots left, this file has ${rows.length}. Upgrade to import.`); onPaywall(); return; }
      if (!window.confirm(`Import ${rows.length} trades${skipped ? ` (${skipped} unreadable rows skipped)` : ""}?`)) return;
      setBusy(true);
      const batch = writeBatch(db), base = Date.now();
      rows.forEach((r, i) => batch.set(doc(collection(db, "users", user.uid, "trades")), { ...r, uid: user.uid, createdAt: base + i }));
      await batch.commit();
      onDone(`✓ Imported ${rows.length} trades`);
    } catch (err) { onDone("Import failed: " + err.message); }
    setBusy(false);
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <div className="tb">
        <input className="grow" placeholder="Search ticker, notes or tag" value={f.q} onChange={e => set("q", e.target.value)} />
        <select value={f.dir} onChange={e => set("dir", e.target.value)}><option value="all">Long + Short</option><option value="long">Long</option><option value="short">Short</option></select>
        <select value={f.res} onChange={e => set("res", e.target.value)}><option value="all">Wins + Losses</option><option value="win">Wins</option><option value="loss">Losses</option></select>
        <select value={f.setup} onChange={e => set("setup", e.target.value)}><option value="all">All setups</option>{setups.map(s => <option key={s}>{s}</option>)}</select>
        <input type="date" title="From" value={f.from} onChange={e => set("from", e.target.value)} />
        <input type="date" title="To" value={f.to} onChange={e => set("to", e.target.value)} />
      </div>
      <div className="tb">
        <div className="seg">
          <button className={view === "cards" ? "on" : ""} onClick={() => setView("cards")}>Cards</button>
          <button className={view === "calendar" ? "on" : ""} onClick={() => setView("calendar")}>Calendar</button>
        </div>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{shown} of {total} trades</span>
        {active && <button className="btn btn-ghost btn-sm" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</button>}
        <span style={{ flex: 1 }} />
        <input ref={ref} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={onFile} />
        <button className="btn btn-ghost btn-sm" title="CSV columns: date, ticker, direction (long/short), entry, exit, shares" disabled={busy} onClick={() => ref.current.click()}>{busy ? "Importing..." : "Import CSV"}</button>
      </div>
    </div>
  );
}

// ── Calendar of daily P&L ─────────────────────────────────────
export function CalendarView({ trades, onSelect }) {
  const latest = trades.map(t => t.date).filter(Boolean).sort().pop();
  const start = latest ? new Date(latest + "T00:00:00") : new Date();
  const [ym, setYm] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const by = {};
  trades.forEach(t => { if (!t.date) return; const x = (by[t.date] = by[t.date] || { p: 0, n: 0 }); x.p += t.pnl; x.n++; });
  const first = new Date(ym.y, ym.m, 1), lead = (first.getDay() + 6) % 7, days = new Date(ym.y, ym.m + 1, 0).getDate();
  const key = d => `${ym.y}-${String(ym.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  let tp = 0, tn = 0, wd = 0, ld = 0;
  for (let d = 1; d <= days; d++) { const x = by[key(d)]; if (x) { tp += x.p; tn += x.n; if (x.p > 0) wd++; else if (x.p < 0) ld++; } }
  const move = n => setYm(v => { const d = new Date(v.y, v.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const sign = n => (n >= 0 ? "+" : "-") + "$" + Math.abs(n);

  return (
    <div className="cal">
      <div className="cal-head">
        <button className="btn btn-ghost btn-sm" onClick={() => move(-1)}>‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--display)", fontSize: 26 }}>{first.toLocaleString("en-US", { month: "long", year: "numeric" })}</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            <span style={{ color: tp >= 0 ? "var(--accent)" : "var(--red)" }}>{sign(tp)}</span> · {tn} trades · {wd} green / {ld} red days
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => move(1)}>›</button>
      </div>
      <div className="cal-grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <div key={d} className="cal-dow">{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={"e" + i} />;
          const x = by[key(d)];
          return (
            <div key={d} className={"cal-day" + (x ? " has " + (x.p >= 0 ? "pos" : "neg") : "")} onClick={() => x && onSelect(key(d))}>
              <div className="cal-n">{d}</div>
              {x && <><div className="cal-pnl" style={{ color: x.p >= 0 ? "var(--accent)" : "var(--red)" }}>{sign(x.p)}</div><div className="cal-cnt">{x.n} {x.n === 1 ? "trade" : "trades"}</div></>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
