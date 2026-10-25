"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle, Save, SunMoon } from "lucide-react";
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const KEY = "anti-logic:general-preferences:v1";
type Preferences = { theme: "dark" | "light" | "system"; symbol: string; timeZone: string };
const defaults: Preferences = { theme: "dark", symbol: "R_100", timeZone: "Asia/Karachi" };

export function GeneralPreferences() {
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const configured = isSupabaseBrowserConfigured();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (configured) {
        const supabase = createClient();
        const { data: { user }, error: authError } = supabase ? await supabase.auth.getUser() : { data: { user: null }, error: new Error("Configuration unavailable") };
        if (cancelled) return;
        if (!supabase || authError || !user) {
          setMessage("Sign in to load saved workspace preferences from your Anti Logic account.");
          setLoaded(true);
          return;
        }
        const { data, error } = await supabase.from("user_preferences").select("theme,preferred_symbol").eq("user_id", user.id).maybeSingle();
        if (cancelled) return;
        if (error) {
          setMessage("Could not load preferences. Confirm the dedicated Anti Logic migration and RLS policies.");
        } else {
          const { data: profile } = await supabase.from("profiles").select("time_zone").eq("id", user.id).maybeSingle();
          setPrefs({ theme: data?.theme === "light" || data?.theme === "system" ? data.theme : "dark", symbol: data?.preferred_symbol || "R_100", timeZone: profile?.time_zone || "Asia/Karachi" });
          if (data?.theme && data.theme !== "system") document.documentElement.dataset.theme = data.theme;
          setSaved(false);
        }
      } else {
        try {
          const raw = JSON.parse(window.localStorage.getItem(KEY) || "null") as Partial<Preferences> | null;
          if (raw) setPrefs((old) => ({ ...old, ...raw }));
        } catch {}
      }
      if (!cancelled) setLoaded(true);
    }
    void load();
    return () => { cancelled = true; };
  }, [configured]);

  async function save() {
    setSaving(true);
    setSaved(false);
    setMessage("");
    try {
      if (configured) {
        const supabase = createClient();
        if (!supabase) throw new Error("Supabase configuration is incomplete.");
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Your session expired. Sign in again.");
        const { error: prefsError } = await supabase.from("user_preferences").upsert({ user_id: user.id, theme: prefs.theme, preferred_symbol: prefs.symbol, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
        if (prefsError) throw new Error("Could not save workspace preferences. Confirm the Anti Logic schema and RLS policies.");
        const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, time_zone: prefs.timeZone, updated_at: new Date().toISOString() }, { onConflict: "id" });
        if (profileError) throw new Error("Workspace preferences saved, but the time zone could not be saved to the profile.");
        setMessage("Preferences saved to your account.");
      } else {
        window.localStorage.setItem(KEY, JSON.stringify(prefs));
        setMessage("Preferences saved on this device only.");
      }
      if (prefs.theme !== "system") document.documentElement.dataset.theme = prefs.theme;
      else document.documentElement.dataset.theme = "dark";
      setSaved(true);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Preferences could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="panel card-pad">
    <div className="card-heading"><div><h2>General preferences</h2><p className="muted" style={{fontSize:11,margin:"6px 0 0"}}>Personalize your research workspace.</p></div><SunMoon size={17} color="var(--lime)"/></div>
    <div className="form-grid">
      <div className="form-field"><label htmlFor="general-theme">Appearance</label><select id="general-theme" value={prefs.theme} onChange={(e) => { setPrefs({ ...prefs, theme: e.target.value as Preferences["theme"] }); setSaved(false); }}><option value="dark">Dark theme</option><option value="light">Light theme</option><option value="system">System default (dark fallback)</option></select></div>
      <div className="form-field"><label htmlFor="general-timezone">Time zone</label><select id="general-timezone" value={prefs.timeZone} onChange={(e) => { setPrefs({ ...prefs, timeZone: e.target.value }); setSaved(false); }}><option value="Asia/Karachi">Asia/Karachi (PKT)</option><option value="UTC">UTC</option><option value="Europe/London">Europe/London</option><option value="America/New_York">America/New_York</option></select></div>
      <div className="form-field"><label htmlFor="general-symbol">Preferred research symbol</label><select id="general-symbol" value={prefs.symbol} onChange={(e) => { setPrefs({ ...prefs, symbol: e.target.value }); setSaved(false); }}><option value="R_100">R_100 (example)</option><option value="R_50">R_50 (example)</option><option value="R_25">R_25 (example)</option><option value="R_10">R_10 (example)</option></select><span className="field-hint">Availability must be verified with Deriv before use.</span></div>
      <div className="form-field"><label>Default execution mode</label><div className="mode-lock"><span className="status demo">DEMO FIRST</span><span className="field-hint">Live execution is disabled in this foundation.</span></div></div>
    </div>
    {message && <div className={saved ? "success-note" : "notice"} role="status" style={{marginBottom:14}}>{saved && <Check size={15}/>} {message}</div>}
    <div className="builder-footer"><span className="field-hint">{loaded ? configured ? "Saved preferences sync with your Anti Logic account." : "Local-only mode. No account is connected." : "Loading preferences…"}</span><button className="btn btn-primary" onClick={() => void save()} disabled={!loaded || saving}>{saving ? <LoaderCircle className="spin" size={14}/> : <Save size={14}/>} Save preferences</button></div>
  </section>;
}
