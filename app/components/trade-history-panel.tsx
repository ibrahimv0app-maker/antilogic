"use client";

import { useMemo, useState } from "react";
import { Download, Filter, Search } from "lucide-react";

export function TradeHistoryPanel() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("all");
  const [outcome, setOutcome] = useState("all");
  const [period, setPeriod] = useState("30");
  const [showFilters, setShowFilters] = useState(true);

  const sourceStatus = "No Deriv account connected";
  const helper = useMemo(() => {
    const parts = [];
    if (query.trim()) parts.push("Search: " + query.trim());
    if (mode !== "all") parts.push("Mode: " + mode);
    if (outcome !== "all") parts.push("Outcome: " + outcome);
    parts.push("Period: " + period + " days");
    return parts.join(" · ");
  }, [query, mode, outcome, period]);

  return <div className="panel card-pad">
    <div className="card-heading"><div><h2>Confirmed contract records</h2><p className="muted" style={{fontSize:11,margin:"6px 0 0"}}>Only records confirmed by an authorized source should appear here.</p></div><button className="btn" disabled title="Export becomes available when permitted history is connected"><Download size={13}/> Export</button></div>
    <div className="notice" style={{marginBottom:16}}>History is not connected. This screen will not invent trades, P/L, wins, losses, or balances.</div>
    <div className="history-toolbar"><label className="market-search"><Search size={14}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search symbol or contract reference…" aria-label="Search history"/></label><button className="btn" onClick={() => setShowFilters((old) => !old)}><Filter size={13}/> Filters</button></div>
    {showFilters && <div className="history-filters"><div className="form-field"><label htmlFor="history-mode">Account mode</label><select id="history-mode" value={mode} onChange={(e) => setMode(e.target.value)}><option value="all">All modes</option><option value="demo">Demo</option><option value="live">Live</option></select></div><div className="form-field"><label htmlFor="history-outcome">Outcome</label><select id="history-outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)}><option value="all">All outcomes</option><option value="won">Won</option><option value="lost">Lost</option><option value="open">Open</option></select></div><div className="form-field"><label htmlFor="history-period">Date range</label><select id="history-period" value={period} onChange={(e) => setPeriod(e.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option></select></div></div>}
    <div className="history-summary-line"><span className="status">{sourceStatus}</span><span className="field-hint">{helper}</span></div>
    <div className="table-wrap"><table className="table history-table"><thead><tr><th>Contract</th><th>Symbol</th><th>Mode</th><th>Stake</th><th>Expiry</th><th>Status</th><th>Net result</th></tr></thead><tbody><tr><td colSpan={7}><div className="empty-note history-empty"><strong style={{display:"block",color:"var(--text)",marginBottom:6}}>No records available</strong>Connect an authorized account and verify history access before displaying contract records.</div></td></tr></tbody></table></div>
  </div>;
}
