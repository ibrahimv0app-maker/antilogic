"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, ShieldCheck, Trash2, LoaderCircle } from "lucide-react";
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

type Rule = { id: number; indicator: "RSI" | "Moving Average" | "Momentum"; operator: "above" | "below"; threshold: string };
type Draft = { id: string; name: string; symbol: string; contractType: "CALL" | "PUT"; duration: string; stake: string; rules: Rule[]; savedAt: string };
const KEY = "anti-logic:strategy-drafts:v1";
const initialRule = (): Rule => ({ id: 1, indicator: "RSI", operator: "below", threshold: "30" });

export function StrategyMaker() {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [name, setName] = useState("My first strategy");
  const [symbol, setSymbol] = useState("R_100");
  const [contractType, setContractType] = useState<"CALL" | "PUT">("CALL");
  const [duration, setDuration] = useState("60");
  const [stake, setStake] = useState("1");
  const [rules, setRules] = useState<Rule[]>([initialRule()]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const configured = isSupabaseBrowserConfigured();
  const valid = useMemo(() => name.trim().length >= 3 && Number(duration) > 0 && Number(stake) > 0 && rules.length > 0 && rules.every((r) => r.threshold.trim() !== "" && Number.isFinite(Number(r.threshold))), [name, duration, stake, rules]);

  useEffect(() => {
    let cancelled = false;
    async function loadDraft() {
      const selected = new URLSearchParams(window.location.search).get("draft");
      if (!selected) return;
      setLoadingDraft(true);
      try {
        const supabase = createClient();
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase.from("strategies").select("id,name,symbol,contract_type,configuration,updated_at").eq("id", selected).eq("user_id", user.id).maybeSingle();
            if (error) throw new Error("Could not load that account strategy. Confirm the database migration and permissions.");
            if (data && !cancelled) {
              const config = (data.configuration || {}) as Record<string, unknown>;
              setDraftId(data.id);
              setName(data.name);
              setSymbol(data.symbol);
              setContractType(data.contract_type === "PUT" ? "PUT" : "CALL");
              setDuration(String(config.duration_seconds || 60));
              setStake(String(config.stake || 1));
              const savedRules = Array.isArray(config.rules) ? config.rules as Array<Record<string, unknown>> : [];
              setRules(savedRules.length ? savedRules.map((rule, index) => ({ id: Date.now() + index, indicator: rule.indicator === "Moving Average" || rule.indicator === "Momentum" ? rule.indicator : "RSI", operator: rule.operator === "above" ? "above" : "below", threshold: String(rule.threshold ?? "30") })) : [initialRule()]);
              setMessage("Loaded a strategy from your Anti Logic account.");
              return;
            }
          }
        }
        const local = JSON.parse(window.localStorage.getItem(KEY) || "[]") as Draft[];
        const found = local.find((item) => item.id === selected || item.name === selected);
        if (found && !cancelled) {
          setDraftId(found.id || null);
          setName(found.name);
          setSymbol(found.symbol);
          setContractType(found.contractType);
          setDuration(found.duration);
          setStake(found.stake);
          setRules(found.rules?.length ? found.rules.map((rule, index) => ({ ...rule, id: Date.now() + index })) : [initialRule()]);
          setMessage("Loaded a local strategy draft from this browser.");
        } else if (!cancelled) {
          setMessage("That draft could not be found. It may have been deleted or stored in another browser.");
        }
      } catch (caught) {
        if (!cancelled) setMessage(caught instanceof Error ? caught.message : "Could not load the strategy draft.");
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    }
    void loadDraft();
    return () => { cancelled = true; };
  }, []);

  function updateRule(id: number, patch: Partial<Rule>) {
    setRules((current) => current.map((rule) => rule.id === id ? { ...rule, ...patch } : rule));
    setMessage("");
  }

  function validate() {
    const next: string[] = [];
    if (name.trim().length < 3) next.push("Strategy name must contain at least 3 characters.");
    if (!Number.isFinite(Number(duration)) || Number(duration) <= 0 || Number(duration) > 86400) next.push("Duration must be between 1 and 86,400 seconds.");
    if (!Number.isFinite(Number(stake)) || Number(stake) <= 0) next.push("Stake must be a positive number.");
    if (!rules.length) next.push("Add at least one condition.");
    if (rules.some((r) => r.threshold.trim() === "" || !Number.isFinite(Number(r.threshold)))) next.push("Every rule needs a numeric threshold.");
    setErrors(next);
    return next.length === 0;
  }

  async function saveDraft() {
    if (!validate()) return;
    setSaving(true);
    setMessage("");
    const id = draftId || (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "draft-" + Date.now());
    const draft: Draft = { id, name: name.trim(), symbol, contractType, duration, stake, rules, savedAt: new Date().toISOString() };
    try {
      const supabase = createClient();
      if (supabase) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Sign in to save strategies to your Anti Logic account.");
        const { error } = await supabase.from("strategies").upsert({
          id,
          user_id: user.id,
          name: draft.name,
          description: "",
          symbol,
          contract_type: contractType,
          configuration: { duration_seconds: Number(duration), stake: Number(stake), rules: rules.map(({ indicator, operator, threshold }) => ({ indicator, operator, threshold: Number(threshold) })) },
          status: "draft",
          current_version: 1,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });
        if (error) throw new Error("Account save failed. Confirm the dedicated Anti Logic migration and row-level-security permissions.");
        setDraftId(id);
        setMessage("Strategy draft saved to your Anti Logic account. It is not validated or executable.");
      } else {
        const old = JSON.parse(window.localStorage.getItem(KEY) || "[]") as Draft[];
        const next = [draft, ...old.filter((item) => item.id !== id)].slice(0, 20);
        window.localStorage.setItem(KEY, JSON.stringify(next));
        setDraftId(id);
        setMessage("Draft saved on this device only. It is not synced to a server or connected to Deriv.");
      }
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "The draft could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="strategy-builder">
      <div className="notice"><strong>Research mode.</strong> Saving a strategy does not create a trading signal, validate market availability, or place trades.</div>
      {loadingDraft && <div className="success-note" style={{marginTop:12}}><LoaderCircle className="spin" size={15}/> Loading selected draft…</div>}
      <div className="form-grid">
        <div className="form-field"><label htmlFor="strategy-name">Strategy name</label><input id="strategy-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80}/></div>
        <div className="form-field"><label htmlFor="strategy-symbol">Symbol</label><select id="strategy-symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)}><option value="R_100">R_100 — illustrative selection</option><option value="R_50">R_50 — illustrative selection</option><option value="R_25">R_25 — illustrative selection</option></select><span className="field-hint">Verify symbol availability with the connected API before use.</span></div>
        <div className="form-field"><label htmlFor="strategy-contract">Prediction direction</label><select id="strategy-contract" value={contractType} onChange={(e) => setContractType(e.target.value as "CALL" | "PUT")}><option value="CALL">CALL / Rise-style</option><option value="PUT">PUT / Fall-style</option></select></div>
        <div className="form-field"><label htmlFor="strategy-duration">Duration (seconds)</label><input id="strategy-duration" type="number" min="1" max="86400" value={duration} onChange={(e) => setDuration(e.target.value)}/></div>
        <div className="form-field"><label htmlFor="strategy-stake">Stake (planning only)</label><input id="strategy-stake" type="number" min="0.01" step="0.01" value={stake} onChange={(e) => setStake(e.target.value)}/></div>
      </div>
      <div className="builder-heading"><div><h3>Entry conditions</h3><p className="muted">Structured rules, not executable code.</p></div><button className="btn" onClick={() => { setRules((old) => [...old, { ...initialRule(), id: Date.now() }]); setMessage(""); }}><Plus size={14}/> Add rule</button></div>
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
      <div className="builder-footer"><span className={valid ? "field-hint" : "field-hint error-text"}>{valid ? "Basic input validation passed. Strategy profitability is not evaluated." : "Complete the required fields to save this draft."}</span><button className="btn btn-primary" onClick={saveDraft} disabled={saving}>{saving ? <LoaderCircle className="spin" size={14}/> : <Save size={14}/>} Save strategy draft</button></div>
    </div>
  );
}
