"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie, Settings2, X } from "lucide-react";

type Consent = { necessary: true; analytics: boolean; savedAt: string };
const STORAGE_KEY = "anti-logic:cookie-consent:v1";

export function CookieConsent() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    try { setVisible(!window.localStorage.getItem(STORAGE_KEY)); }
    catch { setVisible(true); }
    setReady(true);
  }, []);

  function save(allowAnalytics: boolean) {
    const consent: Consent = { necessary: true, analytics: allowAnalytics, savedAt: new Date().toISOString() };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent)); }
    finally { setVisible(false); setShowSettings(false); }
  }

  if (!ready || !visible) return null;
  return (
    <aside role="dialog" aria-label="Cookie preferences" aria-live="polite" className="cookie-banner">
      <div className="cookie-copy">
        <div className="cookie-icon"><Cookie size={18} /></div>
        <div>
          <strong>Privacy, by design.</strong>
          <p>Necessary storage supports core preferences. Optional analytics are off by default in this foundation.</p>
          <Link href="/legal/cookies">Read the cookie policy</Link>
        </div>
      </div>
      {showSettings && <label className="cookie-option"><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /> Allow optional analytics</label>}
      <div className="cookie-actions">
        {showSettings ? <>
          <button className="btn" onClick={() => save(false)}>Necessary only</button>
          <button className="btn btn-primary" onClick={() => save(analytics)}>Save preferences</button>
        </> : <>
          <button className="btn" onClick={() => save(false)}>Necessary only</button>
          <button className="btn" onClick={() => setShowSettings(true)}><Settings2 size={14} /> Preferences</button>
          <button className="btn btn-primary" onClick={() => save(true)}>Accept all</button>
        </>}
      </div>
      <button aria-label="Close cookie banner" className="cookie-close" onClick={() => save(false)}><X size={15}/></button>
    </aside>
  );
}

export function CookiePreferencesButton() {
  function openPreferences() {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
    window.location.reload();
  }
  return <button className="btn" onClick={openPreferences}>Manage cookie preferences</button>;
}
