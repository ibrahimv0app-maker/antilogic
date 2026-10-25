"use client";

import { useEffect, useState } from "react";
import { BellRing, Check, Send, ShieldCheck } from "lucide-react";

const KEY = "anti-logic:telegram-preferences:v1";
type Preferences = { wins: boolean; losses: boolean; contractClosed: boolean; automation: boolean; connection: boolean };

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

  useEffect(() => {
    try {
      const value = JSON.parse(window.localStorage.getItem(KEY) || "null") as Partial<Preferences> | null;
      if (value) setPrefs({ ...defaults, ...value });
    } catch {}
  }, []);

  function save() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(prefs));
      setSaved(true);
    } catch { setSaved(false); }
  }

  return <div className="panel card-pad">
    <div className="card-heading"><div><h2>Telegram notifications</h2><p className="muted" style={{fontSize:11,margin:"6px 0 0"}}>Choose the events you want to receive.</p></div><span className="status off">NOT CONNECTED</span></div>
    <div className="notice" style={{marginBottom:15}}>A Telegram bot has not been configured or connected. These preferences are saved locally only and will not send messages.</div>
    <div className="list-row"><div style={{display:"flex",alignItems:"center",gap:10}}><Send size={17} color="var(--lime)"/><div><strong>Telegram bot connection</strong><div className="muted" style={{fontSize:10,marginTop:4}}>Requires a verified connection flow and server-side bot configuration.</div></div></div><span className="status off">SETUP REQUIRED</span></div>
    {options.map((item) => <label key={item.key} className="preference-row"><span><strong>{item.title}</strong><small>{item.description}</small></span><input type="checkbox" checked={prefs[item.key]} onChange={(event) => { setPrefs((old) => ({ ...old, [item.key]: event.target.checked })); setSaved(false); }}/></label>)}
    <button className="btn btn-primary" onClick={save}><BellRing size={14}/> Save local preferences</button>
    {saved && <div className="success-note" role="status" style={{marginTop:12}}><Check size={15}/> Preferences saved on this device.</div>}
    <p className="field-hint" style={{marginTop:14}}><ShieldCheck size={12} style={{verticalAlign:"middle"}}/> Never paste a Telegram bot token into the browser. It belongs in a protected server-side environment variable.</p>
  </div>;
}
