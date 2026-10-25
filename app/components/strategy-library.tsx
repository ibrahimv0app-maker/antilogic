"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, Plus, Trash2, Waypoints } from "lucide-react";
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const KEY = "anti-logic:strategy-drafts:v1";
type SavedRule = { id: number; indicator: string; operator: string; threshold: string };
type Draft = { id: string; name: string; symbol: string; contractType: string; duration: string; stake: string; rules: SavedRule[]; savedAt: string };
type RemoteRow = { id: string; name: string; symbol: string; contract_type: string; configuration: Record<string, unknown>; updated_at: string };

export function StrategyLibrary() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [cloud, setCloud] = useState(false);
  const configured = isSupabaseBrowserConfigured();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (configured) {
        const supabase = createClient();
        const { data: { user }, error: authError } = supabase ? await supabase.auth.getUser() : { data: { user: null }, error: new Error("Supabase configuration missing") };
        if (cancelled) return;
        if (authError || !user || !supabase) {
          setMessage("Sign in and configure the dedicated Anti Logic database to load account strategies.");
          setDrafts([]);
          setLoaded(true);
          return;
        }
        const { data, error } = await supabase.from("strategies").select("id,name,symbol,contract_type,configuration,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
        if (cancelled) return;
        if (error) {
          setMessage("Could not load account strategies. Confirm the Anti Logic migration and row-level-security policies are applied.");
          setDrafts([]);
        } else {
          const rows = (data || []) as RemoteRow[];
          setDrafts(rows.map((row) => {
            const config = row.configuration || {};
            const rules = Array.isArray(config.rules) ? config.rules as Array<Record<string, unknown>> : [];
            return {
              id: row.id,
              name: row.name,
              symbol: row.symbol,
              contractType: row.contract_type,
              duration: String(config.duration_seconds || 60),
              stake: String(config.stake || 1),
              rules: rules.map((rule, index) => ({ id: index + 1, indicator: String(rule.indicator || "RSI"), operator: String(rule.operator || "below"), threshold: String(rule.threshold ?? "30") })),
              savedAt: row.updated_at,
            };
          }));
          setCloud(true);
          setMessage("");
        }
        setLoaded(true);
        return;
      }

      try {
        const data = JSON.parse(window.localStorage.getItem(KEY) || "[]") as Draft[];
        setDrafts(Array.isArray(data) ? data.filter((item) => item && typeof item.name === "string") : []);
      } catch { setDrafts([]); }
      setCloud(false);
      setLoaded(true);
    }
    void load();
    return () => { cancelled = true; };
  }, [configured]);

  async function deleteDraft(draft: Draft) {
    setMessage("");
    if (cloud) {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMessage("Your session expired. Sign in again."); return; }
      const { error } = await supabase.from("strategies").delete().eq("id", draft.id).eq("user_id", user.id);
      if (error) { setMessage("The strategy could not be deleted from your account."); return; }
    }
    const next = drafts.filter((item) => item.id !== draft.id);
    try {
      if (!cloud) window.localStorage.setItem(KEY, JSON.stringify(next));
      setDrafts(next);
      setMessage(cloud ? "Strategy removed from your account." : "Draft removed from this browser.");
    } catch { setMessage("Could not update local drafts."); }
  }

  async function duplicateDraft(draft: Draft) {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "draft-" + Date.now();
    const copy: Draft = { ...draft, id, name: draft.name + " copy", savedAt: new Date().toISOString() };
    if (cloud) {
      const supabase = createClient();
      const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
      if (!supabase || !user) { setMessage("Sign in again to duplicate the strategy."); return; }
      const { error } = await supabase.from("strategies").insert({
        id,
        user_id: user.id,
        name: copy.name,
        description: "",
        symbol: copy.symbol,
        contract_type: copy.contractType,
        configuration: { duration_seconds: Number(copy.duration), stake: Number(copy.stake), rules: copy.rules.map(({ indicator, operator, threshold }) => ({ indicator, operator, threshold: Number(threshold) })) },
        status: "draft",
        current_version: 1,
      });
      if (error) { setMessage("The strategy copy could not be saved to your account."); return; }
    }
    const next = [copy, ...drafts.filter((item) => item.id !== copy.id)].slice(0, 20);
    try {
      if (!cloud) window.localStorage.setItem(KEY, JSON.stringify(next));
      setDrafts(next);
      setMessage(cloud ? "A strategy copy was added to your account." : "A local copy was created.");
    } catch { setMessage("Could not save the copy."); }
  }

  return <div>
    <div className="notice" style={{marginBottom:16}}>{cloud ? "Showing strategies saved to your authenticated Anti Logic account." : "These drafts are saved in this browser only. They are not synced to an account or executable."}</div>
    <div className="card-heading"><div><h2>Saved strategies</h2><p className="muted" style={{fontSize:11,margin:"6px 0 0"}}>{loaded ? drafts.length + (cloud ? " account strategy(s)" : " local draft(s)") : "Loading strategies…"}</p></div><Link className="btn btn-primary" href="/app/strategy-maker"><Plus size={14}/> New strategy</Link></div>
    {message && <div role="status" className="success-note" style={{marginBottom:12}}>{message}</div>}
    {!loaded ? <div className="empty-note">Loading strategy drafts…</div> : drafts.length === 0 ? <div className="empty-note"><Waypoints size={24} style={{margin:"0 auto 12px",color:"var(--lime)"}}/><strong style={{display:"block",color:"var(--text)",marginBottom:5}}>No strategies saved yet</strong>Create a draft in Strategy Maker. {cloud ? "It will be stored with your account." : "It will remain on this device until server storage is configured."}<div style={{marginTop:14}}><Link className="btn btn-primary" href="/app/strategy-maker"><Plus size={14}/> Build your first strategy</Link></div></div> :
      <div className="strategy-list">{drafts.map((draft) => <article className="panel strategy-card" key={draft.id}>
        <div className="strategy-card-main"><div className="feature-icon" style={{margin:0}}><Waypoints size={17}/></div><div><h3>{draft.name}</h3><p className="muted">{draft.symbol} · {draft.contractType} · {draft.duration}s · {draft.rules?.length || 0} rule(s)</p><span className="status">{cloud ? "ACCOUNT DRAFT" : "LOCAL DRAFT"}</span></div></div>
        <div className="strategy-card-actions"><Link className="btn" href={"/app/strategy-maker?draft=" + encodeURIComponent(draft.id)}>Edit</Link><button className="icon-action" aria-label={"Duplicate " + draft.name} onClick={() => void duplicateDraft(draft)}><Copy size={14}/></button><button className="icon-action danger-action" aria-label={"Delete " + draft.name} onClick={() => void deleteDraft(draft)}><Trash2 size={14}/></button></div>
      </article>)}</div>}
  </div>;
}
