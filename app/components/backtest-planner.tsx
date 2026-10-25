"use client";

import { useState } from "react";
import { CalendarRange, Save, ShieldCheck } from "lucide-react";

const KEY = "anti-logic:backtest-plan:v1";

export function BacktestPlanner() {
  const [strategy, setStrategy] = useState("first-strategy");
  const [period, setPeriod] = useState("30");
  const [stake, setStake] = useState("1");
  const [payout, setPayout] = useState("0.8");
  const [message, setMessage] = useState("");

  function savePlan() {
    if (!Number.isFinite(Number(period)) || Number(period) < 1 || Number(period) > 3650 || !Number.isFinite(Number(stake)) || Number(stake) <= 0 || !Number.isFinite(Number(payout)) || Number(payout) <= 0 || Number(payout) > 10) {
      setMessage("Check the period, stake, and net payout assumptions.");
      return;
    }
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ strategy, periodDays: Number(period), stake: Number(stake), assumedNetPayout: Number(payout), savedAt: new Date().toISOString() }));
      setMessage("Test configuration saved on this device. No historical simulation was run.");
    } catch { setMessage("This browser could not save the plan."); }
  }

  return <div className="panel card-pad"><div className="card-heading"><h2>Simulation setup</h2><span className="status demo"><CalendarRange size={11}/> PLANNING</span></div><div className="notice">This is a test planner, not a backtest engine. Results will only be displayed after a permitted data source and a validated simulator are connected.</div><div className="form-grid" style={{marginTop:14}}><div className="form-field"><label htmlFor="bt-strategy">Strategy version</label><select id="bt-strategy" value={strategy} onChange={(e) => setStrategy(e.target.value)}><option value="first-strategy">First strategy (placeholder)</option><option value="custom">Custom strategy configuration</option></select></div><div className="form-field"><label htmlFor="bt-period">Test period (days)</label><input id="bt-period" type="number" min="1" max="3650" value={period} onChange={(e) => setPeriod(e.target.value)}/></div><div className="form-field"><label htmlFor="bt-stake">Hypothetical stake</label><input id="bt-stake" type="number" min="0.01" step="0.01" value={stake} onChange={(e) => setStake(e.target.value)}/></div><div className="form-field"><label htmlFor="bt-payout">Assumed net profit per stake (example 0.8 = 80%)</label><input id="bt-payout" type="number" min="0.01" max="10" step="0.05" value={payout} onChange={(e) => setPayout(e.target.value)}/></div></div><button className="btn btn-primary" onClick={savePlan}><Save size={14}/> Save test plan</button>{message && <div role="status" className="success-note" style={{marginTop:14}}><ShieldCheck size={16}/>{message}</div>}</div>;
}
