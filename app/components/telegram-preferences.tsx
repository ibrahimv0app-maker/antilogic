"use client";

import { useEffect, useState } from "react";
import { BellRing, Check, LoaderCircle, Send, ShieldCheck } from "lucide-react";
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const KEY = "anti-logic:telegram-preferences:v1";
type Preferences = { wins: boolean; losses: boolean; contractClosed: boolean; automation: boolean; connection: boolean };
type NotificationMap = Record<string, unknown>;
const defaults: Preferences = { wins: true, losses: true, contractClosed: true, automation: true, connection: true };
const options: { key: keyof Preferences; title: string; description: string }[] = [
  { key: "wins", title: "Confirmed win results", description: "Notify only after a contract result is confirmed." },
  { key: "losses", title: "Confirmed loss results", description: "Notify only after a contract result is confirmed." },
  { key: "contractClosed", title: "Contract closed", description: "Status changes for a contract where supported." },
  { key: "automation", title: "Automation status", description: "Start, pause, stop, or risk-lock events." },
  { key: "connection", title: "Connection health", description: "Disconnect and reconnection notices." },
];

export function TelegramPreferences() {
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [configuredInAccount, setConfiguredInAccount] = useState(false);
  const [basePreferences, setBasePreferences] = useState<NotificationMap>({});
  const [loaded, setLoaded] = useState(false);
  const configured = isSupabaseBrowserConfigured();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (configured) {
        const supabase = createClient();
        const { data: { user }, error: authError } = supabase ? await supabase.auth.getUser() : { data: { user: null }, error: new Error("Supabase is not configured") };
        if (cancelled) return;
        if (authError || !user || !supabase) {
          setMessage("Sign in to load alert preferences from your Anti Logic account.");
          setLoaded(true);
          return;
        }
        const { data, error } = await supabase.from("user_preferences").select("notification_preferences").eq("user_id", user.id).maybeSingle();
        if (cancelled) return;
        if (error) {
          setMessage("Could not load notification preferences. Confirm the dedicated Anti Logic migration and row-level-security policy.");
        } else {
          const base = (data?.notification_preferences && typeof data.notification_preferences === "object" ? data.notification_preferences : {}) as NotificationMap;
          setBasePreferences(base);
          const savedTelegram = base.telegram_alerts;
          if (savedTelegram && typeof savedTelegram === "object") {
            setPrefs({ ...defaults, ...(savedTelegram as Partial<Preferences>) });
            setConfiguredInAccount(true);
          }
        }
      } else {
        try {
          const value = JSON.parse(window.localStorage.getItem(KEY) || "null") as Partial<Preferences> | null;
          if (value) setPrefs({ ...defaults, ...value });
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
        const { error } = await supabase.from("user_preferences").upsert({
          user_id: user.id,
          notification_preferences: { ...basePreferences, telegram_alerts: prefs },
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        if (error) throw new Error("Alert preferences could not be saved. Check the Anti Logic schema and row-level-security policies.");
        setConfiguredInAccount(true);
        setMessage("Alert preferences saved to your account. Telegram delivery remains disconnected.");
      } else {
        window.localStorage.setItem(KEY, JSON.stringify(prefs));
        setMessage("Preferences saved on this device. Telegram messages are not being sent.");
      }
      setSaved(true);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Preferences could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="panel card-pad">
    <div className="card-heading"><div><h2>Telegram notifications</h2><p className="muted" style={{fontSize:11,margin:"6px 0 0"}}>Choose which events you want to receive.</p></div><span className="status off">BOT NOT CONNECTED</span></div>
    <div className="notice" style={{marginBottom:15}}>A Telegram bot has not been connected. These preferences define what you want later; they do not send messages.</div>
    <div className="list-row"><div style={{display:"flex",alignItems:"center",gap:10}}><Send size={17} color="var(--lime)"/><div><strong>Telegram bot connection</strong><div className="muted" style={{fontSize:10,marginTop:4}}>Requires a verified connection flow and protected server-side bot configuration.</div></div></div><span className="status off">SETUP REQUIRED</span></div>
    {options.map((item) => <label key={item.key} className="preference-row"><span><strong>{item.title}</strong><small>{item.description}</small></span><input type="checkbox" checked={prefs[item.key]} onChange={(event) => { setPrefs((old) => ({ ...old, [item.key]: event.target.checked })); setSaved(false); }}/></label>)}
    <button className="btn btn-primary" onClick={() => void save()} disabled={!loaded || saving}>{saving ? <LoaderCircle className="spin" size={14}/> : <BellRing size={14}/>} Save alert preferences</button>
    {message && <div className={saved ? "success-note" : "notice"} role="status" style={{marginTop:12}}>{saved && <Check size={15}/>}{message}</div>}
    <p className="field-hint" style={{marginTop:14}}><ShieldCheck size={12} style={{verticalAlign:"middle"}}/> Never paste a Telegram bot token into the browser. It belongs in a protected server-side environment variable.</p>
    <p className="field-hint" style={{marginTop:6}}>{configuredInAccount ? "Your alert preferences are associated with your authenticated account." : configured ? "Preferences will sync when the database is configured." : "Supabase is not configured; preferences are stored locally."}</p>
  </div>;
}
