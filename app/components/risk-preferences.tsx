"use client";

import { useEffect, useState } from "react";
import { Save, ShieldAlert } from "lucide-react";

const KEY = "anti-logic:risk-preferences:v1";
type Risk = { maxStake: string; dailyLossLimit: string; maxOpenContracts: string; cooldownMinutes: string };
const defaults: Risk = { maxStake: "1", dailyLossLimit: "10", maxOpenContracts: "1", cooldownMinutes: "10" };

export function RiskPreferences() {
  const [values, setValues] = useState<Risk>(defaults);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(KEY) || "null") as Partial<Risk> | null;
      if (stored) setValues((old) => ({ ...old, ...stored }));
    } catch {}
  }, []);

  function save() {
    if (!Number.isFinite(Number(values.maxStake)) || Number(values.maxStake) <= 0 || !Number.isFinite(Number(values.dailyLossLimit)) || Number(values.dailyLossLimit) <= 0 || !Number.isInteger(Number(values.maxOpenContracts)) || Number(values.maxOpenContracts) < 1 || Number(values.maxOpenContracts) > 20 || !Number.isFinite(Number(values.cooldownMinutes)) || Number(values.cooldownMinutes) < 0) {
      setMessage("Enter positive numeric limits and an open-contract limit between 1 and 20.");
      return;
    }
    try {
      window.localStorage.setItem(KEY, JSON.stringify(values));
      setMessage("Preferences saved locally. These are not yet enforced by a server-side risk engine.");
    } catch { setMessage("Unable to save preferences in this browser."); }
  }

  return <div className="panel card-pad">
    <div className="card-heading"><h2>Risk preference draft</h2><span className="status demo">DEMO FIRST</span></div>
    <div className="notice" style={{marginBottom:14}}><strong>Important:</strong> these are planning preferences only. They do not control or protect a live trading account until a server-side risk engine is implemented and tested.</div>
    <div className="form-grid">
      <div className="form-field"><label htmlFor="risk-stake">Max stake per contract</label><input id="risk-stake" type="number" min="0.01" step="0.01" value={values.maxStake} onChange={(e) => setValues({ ...values, maxStake: e.target.value })}/></div>
      <div className="form-field"><label htmlFor="risk-daily">Daily loss threshold</label><input id="risk-daily" type="number" min="0.01" step="0.01" value={values.dailyLossLimit} onChange={(e) => setValues({ ...values, dailyLossLimit: e.target.value })}/></div>
      <div className="form-field"><label htmlFor="risk-open">Max open contracts</label><input id="risk-open" type="number" min="1" max="20" step="1" value={values.maxOpenContracts} onChange={(e) => setValues({ ...values, maxOpenContracts: e.target.value })}/></div>
      <div className="form-field"><label htmlFor="risk-cooldown">Cooldown (minutes)</label><input id="risk-cooldown" type="number" min="0" step="1" value={values.cooldownMinutes} onChange={(e) => setValues({ ...values, cooldownMinutes: e.target.value })}/></div>
    </div>
    <button className="btn btn-primary" onClick={save}><Save size={14}/> Save local risk draft</button>
    {message && <div className="notice" role="status" style={{marginTop:12}}>{message}</div>}
    <div className="list-row" style={{marginTop:15}}><span style={{display:"flex",alignItems:"center",gap:8}}><ShieldAlert size={15} color="var(--lime)"/> Live trading</span><span className="status off">DISABLED</span></div>
  </div>;
}
