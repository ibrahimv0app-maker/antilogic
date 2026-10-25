"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle, Save, UserRound } from "lucide-react";
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const KEY = "anti-logic:profile-draft:v1";
type Profile = { displayName: string; username: string; language: string; timezone: string };

export function ProfilePreferences() {
  const [profile, setProfile] = useState<Profile>({ displayName: "", username: "", language: "en", timezone: "Asia/Karachi" });
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [source, setSource] = useState<"local" | "account" | "none">("none");
  const configured = isSupabaseBrowserConfigured();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (configured) {
        const supabase = createClient();
        if (!supabase) { setMessage("Supabase configuration is incomplete."); setLoaded(true); return; }
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          if (!cancelled) { setMessage("Sign in to load your server profile."); setLoaded(true); }
          return;
        }
        const { data, error } = await supabase.from("profiles").select("display_name,username,preferred_language,time_zone").eq("id", user.id).maybeSingle();
        if (cancelled) return;
        if (error) {
          setMessage("Could not load the profile table. Confirm that the Anti Logic migration has been applied to the dedicated Supabase project.");
        } else if (data) {
          setProfile({ displayName: data.display_name || "", username: data.username || "", language: data.preferred_language || "en", timezone: data.time_zone || "Asia/Karachi" });
          setSource("account");
        } else {
          const initial = { displayName: String(user.user_metadata?.display_name || ""), username: "", language: "en", timezone: "Asia/Karachi" };
          const { error: createError } = await supabase.from("profiles").insert({ id: user.id, display_name: initial.displayName, preferred_language: initial.language, time_zone: initial.timezone });
          if (!cancelled) {
            if (createError) setMessage("The server profile could not be initialized. Confirm the migration and row-level-security policies.");
            else { setProfile(initial); setSource("account"); }
          }
        }
      } else {
        try {
          const raw = window.localStorage.getItem(KEY);
          if (raw) setProfile((old) => ({ ...old, ...(JSON.parse(raw) as Partial<Profile>) }));
          setSource("local");
        } catch { setSource("local"); }
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
        if (authError || !user) throw new Error("Your session is not available. Sign in again.");
        const { error } = await supabase.from("profiles").upsert({
          id: user.id,
          display_name: profile.displayName.trim(),
          username: profile.username.trim() || null,
          preferred_language: profile.language,
          time_zone: profile.timezone,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });
        if (error) throw new Error("Profile could not be saved. Check the Anti Logic schema, row-level-security policies, and username availability.");
        setSource("account");
        setMessage("Profile saved to your Anti Logic account.");
      } else {
        window.localStorage.setItem(KEY, JSON.stringify(profile));
        setSource("local");
        setMessage("Preferences saved in this browser only.");
      }
      setSaved(true);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel card-pad">
      <div className="card-heading"><h2>Personal preferences</h2><span className={"status " + (source === "account" ? "demo" : "")}>{source === "account" ? "ACCOUNT SYNC" : source === "local" ? "LOCAL PREVIEW" : "NOT LOADED"}</span></div>
      <div className="profile-summary"><div className="profile-avatar-large"><UserRound size={23}/></div><div><strong>{profile.displayName || "Your display name"}</strong><p className="muted">{profile.username ? "@" + profile.username : "Choose a username"} · {source === "account" ? "Authenticated profile" : "Local preview"}</p></div></div>
      <div className="form-grid">
        <div className="form-field"><label htmlFor="profile-display">Display name</label><input id="profile-display" maxLength={80} value={profile.displayName} onChange={(e) => { setProfile({ ...profile, displayName: e.target.value }); setSaved(false); }}/></div>
        <div className="form-field"><label htmlFor="profile-username">Username</label><input id="profile-username" maxLength={24} value={profile.username} onChange={(e) => { setProfile({ ...profile, username: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") }); setSaved(false); }}/><span className="field-hint">3–24 letters, numbers, underscores, or hyphens.</span></div>
        <div className="form-field"><label htmlFor="profile-language">Language</label><select id="profile-language" value={profile.language} onChange={(e) => { setProfile({ ...profile, language: e.target.value }); setSaved(false); }}><option value="en">English</option><option value="ur">Urdu</option></select></div>
        <div className="form-field"><label htmlFor="profile-timezone">Time zone</label><select id="profile-timezone" value={profile.timezone} onChange={(e) => { setProfile({ ...profile, timezone: e.target.value }); setSaved(false); }}><option value="Asia/Karachi">Asia/Karachi (PKT)</option><option value="UTC">UTC</option><option value="Europe/London">Europe/London</option><option value="America/New_York">America/New_York</option></select></div>
      </div>
      {!configured && <div className="notice" style={{marginBottom:14}}>Supabase is not configured for Anti Logic. These preferences are stored locally in this browser and are not synced across devices.</div>}
      {message && <div role={saved ? "status" : "alert"} className={saved ? "success-note" : "notice"} style={{marginBottom:14}}>{saved && <Check size={15}/>} {message}</div>}
      <div className="builder-footer"><span className="field-hint">{loaded ? source === "account" ? "Changes will be saved to your authenticated profile." : "Local preview only — no server account is connected." : "Loading preferences…"}</span><button className="btn btn-primary" onClick={save} disabled={!loaded || saving}>{saving ? <LoaderCircle className="spin" size={14}/> : <Save size={14}/>} Save preferences</button></div>
    </section>
  );
}
