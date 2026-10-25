"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Save, ShieldAlert } from "lucide-react";
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const KEY = "anti-logic:risk-preferences:v1";
type Risk = { maxStake: string; dailyLossLimit: string; maxOpenContracts: string; cooldownMinutes: string };
const defaults: Risk = { maxStake: "1", dailyLossLimit: "10", maxOpenContracts: "1", cooldownMinutes: "10" };

export function RiskPreferences() {
  const [values, setValues] = useState<Risk>(defaults);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [accountSynced, setAccountSynced] = useState(false);
  const configured = isSupabaseBrowserConfigured();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (configured) {
        const supabase = createClient();
        if (!supabase) { setMessage("Supabase configuration is incomplete."); setLoaded(true); return; }
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          if (!cancelled) setMessage("Sign in to load your account risk preferences.");
          if (!cancelled) setLoaded(true);
          return;
        }
        const { data, error } = await supabase.from("user_preferences").select("risk_preferences").eq("user_id", user.id).maybeSingle();
        if (cancelled) return;
        if (error) {
          setMessage("Risk preferences could not be loaded. Confirm that the Anti Logic migration is applied to the dedicated Supabase project.");
        } else if (data?.risk_preferences && typeof data.risk_preferences === "object") {
          const stored = data.risk_preferences as Record<string, unknown>;
          setValues({ maxStake: String(stored.max_stake ?? 1), dailyLossLimit: String(stored.daily_loss_limit ?? 10), maxOpenContracts: String(stored.max_open_contracts ?? 1), cooldownMinutes: String(stored.cooldown_minutes ?? 10) });
          setAccountSynced(true);
        }
      } else {
        try {
          const stored = JSON.parse(window.localStorage.getItem(KEY) || "null") as Partial<Risk> | null;
          if (stored) setValues((old) => ({ ...old, ...stored }));
        } catch {}
      }
      if (!cancelled) setLoaded(true);
    }
    void load();
    return () => { cancelled = true; };
  }, [configured]);

  async function save() {
    if (!Number.isFinite(Number(values.maxStake)) || Number(values.maxStake) <= 0 || !Number.isFinite(Number(values.dailyLossLimit)) || Number(values.dailyLossLimit) <= 0 || !Number.isInteger(Number(values.maxOpenContracts)) || Number(values.maxOpenContracts) < 1 || Number(values.maxOpenContracts) > 20 || !Number.isFinite(Number(values.cooldownMinutes)) || Number(values.cooldownMinutes) < 0) {
      setMessage("Enter positive numeric limits and an open-contract limit between 1 and 20.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      if (configured) {
        const supabase = createClient();
        if (!supabase) throw new Error("Supabase configuration is incomplete.");
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Your session expired. Sign in again.");
        const { error } = await supabase.from("user_preferences").upsert({
          user_id: user.id,
          risk_preferences: { max_stake: Number(values.maxStake), daily_loss_limit: Number(values.dailyLossLimit), max_open_contracts: Number(values.maxOpenContracts), cooldown_minutes: Number(values.cooldownMinutes) },
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        if (error) throw new Error("Could not save risk preferences. Check the dedicated Anti Logic schema and row-level-security policies.");
        setAccountSynced(true);
        setMessage("Risk preferences saved to your Anti Logic account. The current UI does not enforce these settings against trades.");
      } else {
        window.localStorage.setItem(KEY, JSON.stringify(values));
        setAccountSynced(false);
        setMessage("Preferences saved locally. They are not synced or enforced by a trading engine.");
      }
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Preferences could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="panel card-pad">
    <div className="card-heading"><h2>Risk preference draft</h2><span className={"status " + (accountSynced ? "demo" : "")}>{accountSynced ? "ACCOUNT SYNC" : "DEMO FIRST"}</span></div>
    <div className="notice" style={{marginBottom:14}}><strong>Important:</strong> these are saved planning preferences only. They are not enforced by a server-side risk engine, and they do not protect a live trading account in this milestone.</div>
    <div className="form-grid">
      <div className="form-field"><label htmlFor="risk-stake">Max stake per contract</label><input id="risk-stake" type="number" min="0.01" step="0.01" value={values.maxStake} onChange={(e) => setValues({ ...values, maxStake: e.target.value })}/></div>
      <div className="form-field"><label htmlFor="risk-daily">Daily loss threshold</label><input id="risk-daily" type="number" min="0.01" step="0.01" value={values.dailyLossLimit} onChange={(e) => setValues({ ...values, dailyLossLimit: e.target.value })}/></div>
      <div className="form-field"><label htmlFor="risk-open">Max open contracts</label><input id="risk-open" type="number" min="1" max="20" step="1" value={values.maxOpenContracts} onChange={(e) => setValues({ ...values, maxOpenContracts: e.target.value })}/></div>
      <div className="form-field"><label htmlFor="risk-cooldown">Cooldown (minutes)</label><input id="risk-cooldown" type="number" min="0" step="1" value={values.cooldownMinutes} onChange={(e) => setValues({ ...values, cooldownMinutes: e.target.value })}/></div>
    </div>
    <button className="btn btn-primary" onClick={() => void save()} disabled={!loaded || saving}>{saving ? <LoaderCircle className="spin" size={14}/> : <Save size={14}/>} Save risk preferences</button>
    {message && <div className={accountSynced ? "success-note" : "notice"} role="status" style={{marginTop:12}}>{message}</div>}
    <div className="list-row" style={{marginTop:15}}><span style={{display:"flex",alignItems:"center",gap:8}}><ShieldAlert size={15} color="var(--lime)"/> Live trading</span><span className="status off">DISABLED</span></div>
    <p className="field-hint" style={{marginTop:12}}>{configured ? "Account settings are loaded from Supabase when the schema is present." : "Supabase is not configured, so this draft is stored in this browser."}</p>
  </div>;
}
