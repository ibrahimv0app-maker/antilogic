"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, Plus, Trash2, Waypoints } from "lucide-react";

const KEY = "anti-logic:strategy-drafts:v1";
type SavedRule = { id: number; indicator: string; operator: string; threshold: string };
type Draft = { name: string; symbol: string; contractType: string; duration: string; stake: string; rules: SavedRule[]; savedAt: string };

export function StrategyLibrary() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  function readDrafts() {
    try {
      const data = JSON.parse(window.localStorage.getItem(KEY) || "[]") as Draft[];
      setDrafts(Array.isArray(data) ? data.filter((item) => item && typeof item.name === "string") : []);
    } catch { setDrafts([]); }
    setLoaded(true);
  }

  useEffect(() => { readDrafts(); }, []);

  function deleteDraft(name: string) {
    const next = drafts.filter((draft) => draft.name !== name);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
      setDrafts(next);
      setMessage("Draft removed from this browser.");
    } catch { setMessage("Could not update local drafts."); }
  }

  function duplicateDraft(draft: Draft) {
    const copy = { ...draft, name: draft.name + " copy", savedAt: new Date().toISOString() };
    const next = [copy, ...drafts.filter((item) => item.name !== copy.name)].slice(0, 20);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
      setDrafts(next);
      setMessage("A local copy was created.");
    } catch { setMessage("Could not save the copy."); }
  }

  return <div>
    <div className="notice" style={{marginBottom:16}}>These are strategy drafts stored in this browser only. They are not synced to an account, validated against live API capabilities, or executable.</div>
    <div className="card-heading"><div><h2>Saved strategy drafts</h2><p className="muted" style={{fontSize:11,margin:"6px 0 0"}}>{loaded ? drafts.length + " local draft(s)" : "Loading drafts…"}</p></div><Link className="btn btn-primary" href="/app/strategy-maker"><Plus size={14}/> New strategy</Link></div>
    {message && <div role="status" className="success-note" style={{marginBottom:12}}>{message}</div>}
    {!loaded ? <div className="empty-note">Loading local drafts…</div> : drafts.length === 0 ? <div className="empty-note"><Waypoints size={24} style={{margin:"0 auto 12px",color:"var(--lime)"}}/><strong style={{display:"block",color:"var(--text)",marginBottom:5}}>No strategies saved yet</strong>Create a draft in Strategy Maker. It will remain on this device until account persistence is implemented.<div style={{marginTop:14}}><Link className="btn btn-primary" href="/app/strategy-maker"><Plus size={14}/> Build your first strategy</Link></div></div> :
      <div className="strategy-list">{drafts.map((draft) => <article className="panel strategy-card" key={draft.name}>
        <div className="strategy-card-main"><div className="feature-icon" style={{margin:0}}><Waypoints size={17}/></div><div><h3>{draft.name}</h3><p className="muted">{draft.symbol} · {draft.contractType} · {draft.duration}s · {draft.rules?.length || 0} rule(s)</p><span className="status">LOCAL DRAFT</span></div></div>
        <div className="strategy-card-actions"><Link className="btn" href={"/app/strategy-maker?draft=" + encodeURIComponent(draft.name)}>Edit</Link><button className="icon-action" aria-label={"Duplicate " + draft.name} onClick={() => duplicateDraft(draft)}><Copy size={14}/></button><button className="icon-action danger-action" aria-label={"Delete " + draft.name} onClick={() => deleteDraft(draft.name)}><Trash2 size={14}/></button></div>
      </article>)}</div>}
  </div>;
}
