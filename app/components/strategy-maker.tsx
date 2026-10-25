"use client";

import { useMemo, useState } from "react";
import { Plus, Save, ShieldCheck, Trash2 } from "lucide-react";

type Rule = { id: number; indicator: "RSI" | "Moving Average" | "Momentum"; operator: "above" | "below"; threshold: string };
type Draft = { name: string; symbol: string; contractType: "CALL" | "PUT"; duration: string; stake: string; rules: Rule[]; savedAt: string };
const KEY = "anti-logic:strategy-drafts:v1";
const initialRule = (): Rule => ({ id: Date.now(), indicator: "RSI", operator: "below", threshold: "30" });

export function StrategyMaker() {
  const [name, setName] = useState("My first strategy");
  const [symbol, setSymbol] = useState("R_100");
  const [contractType, setContractType] = useState<"CALL" | "PUT">("CALL");
  const [duration, setDuration] = useState("60");
  const [stake, setStake] = useState("1");
  const [rules, setRules] = useState<Rule[]>([initialRule()]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const valid = useMemo(() => name.trim().length >= 3 && Number(duration) > 0 && Number(stake) > 0 && rules.length > 0 && rules.every((r) => r.threshold !== "" && Number.isFinite(Number(r.threshold))), [name, duration, stake, rules]);

  function updateRule(id: number, patch: Partial<Rule>) {
    setRules((current) => current.map((rule) => rule.id === id ? { ...rule, ...patch } : rule));
    setMessage("");
  }
  function validate() {
    const next: string[] = [];
    if (name.trim().length < 3) next.push("Strategy name must contain at least 3 characters.");
    if (!Number.isFinite(Number(duration)) || Number(duration) <= 0) next.push("Duration must be a positive number of seconds.");
    if (!Number.isFinite(Number(stake)) || Number(stake) <= 0) next.push("Stake must be a positive number.");
    if (!rules.length) next.push("Add at least one condition.");
    if (rules.some((r) => r.threshold.trim() === "" || !Number.isFinite(Number(r.threshold)))) next.push("Every rule needs a numeric threshold.");
    setErrors(next);
    return next.length === 0;
  }
  function saveDraft() {
    if (!validate()) return;
    const draft: Draft = { name: name.trim(), symbol, contractType, duration, stake, rules, savedAt: new Date().toISOString() };
    try {
      const old = JSON.parse(window.localStorage.getItem(KEY) || "[]") as Draft[];
      window.localStorage.setItem(KEY, JSON.stringify([draft, ...old.filter((item) => item.name !== draft.name)].slice(0, 20)));
      setMessage("Draft saved on this device. It has not been sent to a server or connected to Deriv.");
    } catch {
      setMessage("This browser could not save the draft. Check local storage permissions.");
    }
  }

  return (
    <div className="strategy-builder">
      <div className="notice"><strong>Research mode.</strong> This builder saves a local draft only. It does not create signals, connect to a market, or place trades.</div>
      <div className="form-grid">
        <div className="form-field"><label htmlFor="strategy-name">Strategy name</label><input id="strategy-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80}/></div>
        <div className="form-field"><label htmlFor="strategy-symbol">Symbol</label><select id="strategy-symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)}><option value="R_100">R_100 — illustrative selection</option><option value="R_50">R_50 — illustrative selection</option><option value="R_25">R_25 — illustrative selection</option></select><span className="field-hint">Verify symbol availability with the connected API before use.</span></div>
        <div className="form-field"><label htmlFor="strategy-contract">Prediction direction</label><select id="strategy-contract" value={contractType} onChange={(e) => setContractType(e.target.value as "CALL" | "PUT")}><option value="CALL">CALL / Rise-style</option><option value="PUT">PUT / Fall-style</option></select></div>
        <div className="form-field"><label htmlFor="strategy-duration">Duration (seconds)</label><input id="strategy-duration" type="number" min="1" max="86400" value={duration} onChange={(e) => setDuration(e.target.value)}/></div>
        <div className="form-field"><label htmlFor="strategy-stake">Stake (demo planning only)</label><input id="strategy-stake" type="number" min="0.01" step="0.01" value={stake} onChange={(e) => setStake(e.target.value)}/></div>
      </div>
      <div className="builder-heading"><div><h3>Entry conditions</h3><p className="muted">Structured rules, not executable code.</p></div><button className="btn" onClick={() => { setRules((old) => [...old, { ...initialRule(), id: Date.now() + old.length }]); setMessage(""); }}><Plus size={14}/> Add rule</button></div>
      <div className="rule-list">
        {rules.map((rule, index) => (
          <div className="rule-row" key={rule.id}>
            <span className="rule-number">{String(index + 1).padStart(2, "0")}</span>
            <div className="form-field"><label htmlFor={"indicator-" + rule.id}>Indicator</label><select id={"indicator-" + rule.id} value={rule.indicator} onChange={(e) => updateRule(rule.id, { indicator: e.target.value as Rule["indicator"] })}><option>RSI</option><option>Moving Average</option><option>Momentum</option></select></div>
            <div className="form-field"><label htmlFor={"operator-" + rule.id}>Condition</label><select id={"operator-" + rule.id} value={rule.operator} onChange={(e) => updateRule(rule.id, { operator: e.target.value as Rule["operator"] })}><option value="below">Below</option><option value="above">Above</option></select></div>
            <div className="form-field"><label htmlFor={"threshold-" + rule.id}>Threshold</label><input id={"threshold-" + rule.id} type="number" value={rule.threshold} onChange={(e) => updateRule(rule.id, { threshold: e.target.value })}/></div>
            <button className="icon-action danger-action" aria-label={"Remove rule " + (index + 1)} disabled={rules.length === 1} onClick={() => setRules((old) => old.filter((item) => item.id !== rule.id))}><Trash2 size={15}/></button>
          </div>
        ))}
      </div>
      {errors.length > 0 && <div role="alert" className="form-errors">{errors.map((error) => <div key={error}>• {error}</div>)}</div>}
      {message && <div role="status" className="success-note"><ShieldCheck size={16}/>{message}</div>}
      <div className="builder-footer"><span className={valid ? "field-hint" : "field-hint error-text"}>{valid ? "Basic input validation passed. Strategy profitability is not evaluated." : "Complete the required fields to save this draft."}</span><button className="btn btn-primary" onClick={saveDraft}><Save size={14}/> Save local draft</button></div>
    </div>
  );
}
