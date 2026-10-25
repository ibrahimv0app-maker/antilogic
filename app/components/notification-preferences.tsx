"use client";

import { useEffect, useState } from "react";
import { Bell, Check, LoaderCircle, Save, ShieldCheck } from "lucide-react";
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const KEY = "anti-logic:notification-preferences:v1";
type Preferences = { in_app: boolean; email: boolean; telegram: boolean; security: boolean; risk_events: boolean; contract_results: boolean };
const defaults: Preferences = { in_app: true, email: false, telegram: false, security: true, risk_events: true, contract_results: true };
const options: { key: keyof Preferences; title: string; desc: string }[] = [
  { key: "in_app", title: "In-app notifications", desc: "Show events inside the Anti Logic workspace." },
  { key: "email", title: "Email notifications", desc: "Email delivery is unavailable until an email provider is configured." },
  { key: "telegram", title: "Telegram alerts", desc: "Delivery requires the separate authorized Telegram connection." },
  { key: "security", title: "Security events", desc: "Sign-in, session, and authorization alerts." },
  { key: "risk_events", title: "Risk and system alerts", desc: "Warnings when risk checks or service health need attention." },
  { key: "contract_results", title: "Confirmed contract outcomes", desc: "Never treat a prediction as a confirmed outcome." },
];

export function NotificationPreferences() {
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
        const { data: { user }, error: authError } = supabase ? await supabase.auth.getUser() : { data: { user: null }, error: new Error("Supabase not configured") };
        if (cancelled) return;
        if (!supabase || authError || !user) {
          setMessage("Sign in to load account notification preferences.");
          setLoaded(true);
          return;
        }
        const { data, error } = await supabase.from("user_preferences").select("notification_preferences").eq("user_id", user.id).maybeSingle();
        if (cancelled) return;
        if (error) setMessage("Could not load preferences. Confirm the Anti Logic migration and row-level-security policy.");
        else {
          const raw = data?.notification_preferences && typeof data.notification_preferences === "object" ? data.notification_preferences as Record<string, unknown> : {};
          setPrefs({ ...defaults, ...raw, ...((raw.alerts && typeof raw.alerts === "object") ? raw.alerts as Partial<Preferences> : {}) });
        }
      } else {
        try {
          const raw = JSON.parse(window.localStorage.getItem(KEY) || "null") as Partial<Preferences> | null;
          if (raw) setPrefs({ ...defaults, ...raw });
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
        const { data: existing } = await supabase.from("user_preferences").select("notification_preferences").eq("user_id", user.id).maybeSingle();
        const base = existing?.notification_preferences && typeof existing.notification_preferences === "object" ? existing.notification_preferences as Record<string, unknown> : {};
        const { error } = await supabase.from("user_preferences").upsert({ user_id: user.id, notification_preferences: { ...base, ...prefs, alerts: prefs }, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
        if (error) throw new Error("Could not save notification preferences. Check the Anti Logic schema and RLS policies.");
        setMessage("Preferences saved to your account. Delivery channels remain unavailable until configured.");
      } else {
        window.localStorage.setItem(KEY, JSON.stringify(prefs));
        setMessage("Preferences saved on this device only. No notifications were sent.");
      }
      setSaved(true);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Preferences could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="panel card-pad">
    <div className="card-heading"><div><h2>Notification preferences</h2><p className="muted" style={{fontSize:11,margin:"6px 0 0"}}>Select the events that matter to you.</p></div><Bell size={17} color="var(--lime)"/></div>
    <div className="notice" style={{marginBottom:14}}>Preferences do not send notifications by themselves. Email, browser push, and Telegram delivery each require their own working provider integration.</div>
    {options.map((option) => <label className="preference-row" key={option.key}><span><strong>{option.title}</strong><small>{option.desc}</small></span><input type="checkbox" checked={prefs[option.key]} onChange={(e) => { setPrefs({ ...prefs, [option.key]: e.target.checked }); setSaved(false); }}/></label>)}
    {message && <div className={saved ? "success-note" : "notice"} role="status" style={{marginTop:14}}>{saved && <Check size={15}/>} {message}</div>}
    <div className="builder-footer"><span className="field-hint">{loaded ? configured ? "Account preferences" : "Local preferences" : "Loading preferences…"}</span><button className="btn btn-primary" onClick={() => void save()} disabled={!loaded || saving}>{saving ? <LoaderCircle className="spin" size={14}/> : <Save size={14}/>} Save preferences</button></div>
    <p className="field-hint" style={{marginTop:15}}><ShieldCheck size={12} style={{verticalAlign:"middle"}}/> Notification content must use confirmed outcomes from a permitted source.</p>
  </section>;
}
