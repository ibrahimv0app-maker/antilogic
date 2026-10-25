"use client";

import { useEffect, useState } from "react";
import { Check, Save, UserRound } from "lucide-react";

const KEY = "anti-logic:profile-draft:v1";
type Profile = { displayName: string; username: string; language: string; timezone: string };

export function ProfilePreferences() {
  const [profile, setProfile] = useState<Profile>({ displayName: "", username: "", language: "en", timezone: "Asia/Karachi" });
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setProfile((old) => ({ ...old, ...(JSON.parse(raw) as Partial<Profile>) }));
    } catch {}
    setLoaded(true);
  }, []);

  function save() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(profile));
      setSaved(true);
    } catch { setSaved(false); }
  }

  return (
    <section className="panel card-pad">
      <div className="card-heading"><h2>Personal preferences</h2><span className="status">LOCAL PREVIEW</span></div>
      <div className="profile-summary"><div className="profile-avatar-large"><UserRound size={23}/></div><div><strong>{profile.displayName || "Your display name"}</strong><p className="muted">{profile.username ? "@" + profile.username : "Choose a username"} · Not authenticated</p></div></div>
      <div className="form-grid">
        <div className="form-field"><label htmlFor="profile-display">Display name</label><input id="profile-display" maxLength={60} value={profile.displayName} onChange={(e) => { setProfile({ ...profile, displayName: e.target.value }); setSaved(false); }}/></div>
        <div className="form-field"><label htmlFor="profile-username">Username</label><input id="profile-username" maxLength={24} value={profile.username} onChange={(e) => { setProfile({ ...profile, username: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") }); setSaved(false); }}/></div>
        <div className="form-field"><label htmlFor="profile-language">Language</label><select id="profile-language" value={profile.language} onChange={(e) => { setProfile({ ...profile, language: e.target.value }); setSaved(false); }}><option value="en">English</option><option value="ur">Urdu</option></select></div>
        <div className="form-field"><label htmlFor="profile-timezone">Time zone</label><select id="profile-timezone" value={profile.timezone} onChange={(e) => { setProfile({ ...profile, timezone: e.target.value }); setSaved(false); }}><option value="Asia/Karachi">Asia/Karachi (PKT)</option><option value="UTC">UTC</option><option value="Europe/London">Europe/London</option><option value="America/New_York">America/New_York</option></select></div>
      </div>
      <div className="notice" style={{marginBottom:14}}>No dedicated Anti Logic Supabase project is configured yet. These preferences are stored in this browser only; they are not linked to an authenticated user or synced across devices.</div>
      <div className="builder-footer"><span className="field-hint">{loaded ? "No server profile is connected." : "Loading local preferences…"}</span><button className="btn btn-primary" onClick={save}><Save size={14}/> Save on this device</button></div>
      {saved && <div className="success-note" role="status"><Check size={16}/> Preferences saved in this browser.</div>}
    </section>
  );
}
