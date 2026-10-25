"use client";

import { useState } from "react";
import Link from "next/link";
import { BrainCircuit, CircleHelp, ShieldCheck, SlidersHorizontal } from "lucide-react";

const symbols = ["R_100", "R_50", "R_25", "R_10"];

export function AIAnalysisPanel() {
  const [symbol, setSymbol] = useState("R_100");
  const [method, setMethod] = useState("technical");
  const [horizon, setHorizon] = useState("60");
  const [details, setDetails] = useState(true);

  return <div className="analysis-layout">
    <section className="panel card-pad">
      <div className="card-heading"><div><h2>Analysis setup</h2><p className="muted" style={{fontSize:11,margin:"6px 0 0"}}>Choose an analysis configuration.</p></div><SlidersHorizontal size={16} color="var(--lime)"/></div>
      <div className="form-field"><label htmlFor="analysis-symbol">Market symbol</label><select id="analysis-symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)}>{symbols.map((item)=><option key={item}>{item}</option>)}</select><span className="field-hint">Examples only — symbol availability has not been checked with Deriv.</span></div>
      <div className="form-field"><label htmlFor="analysis-method">Analysis approach</label><select id="analysis-method" value={method} onChange={(e) => setMethod(e.target.value)}><option value="technical">Technical indicator review</option><option value="trend">Trend and volatility classification</option><option value="statistical">Statistical baseline</option></select></div>
      <div className="form-field"><label htmlFor="analysis-horizon">Hypothetical evaluation horizon</label><select id="analysis-horizon" value={horizon} onChange={(e) => setHorizon(e.target.value)}><option value="60">60 seconds</option><option value="120">120 seconds</option><option value="300">300 seconds</option><option value="900">15 minutes</option></select></div>
      <label className="preference-row"><span><strong>Show method explanations</strong><small>Explain inputs, uncertainty, and invalidation conditions.</small></span><input type="checkbox" checked={details} onChange={(e) => setDetails(e.target.checked)}/></label>
      <div className="notice" style={{marginTop:14}}>The controls above describe a future analysis request. They do not run an AI model or generate a live trading signal.</div>
    </section>
    <section className="panel card-pad">
      <div className="card-heading"><h2>Analysis result</h2><span className="status off"><CircleHelp size={10}/> WAITING FOR DATA</span></div>
      <div className="analysis-empty"><div className="feature-icon"><BrainCircuit size={19}/></div><h3>No analysis has been run</h3><p className="muted">An authorized, fresh market-data source and a validated analysis service are required before Anti Logic can calculate any market assessment.</p><Link className="btn btn-primary" href="/app/charts">Open market workspace</Link></div>
      <div className="analysis-metrics"><div><span>Selected symbol</span><strong>{symbol}</strong></div><div><span>Method</span><strong>{method === "technical" ? "Technical review" : method === "trend" ? "Trend / volatility" : "Statistical baseline"}</strong></div><div><span>Horizon</span><strong>{horizon}s</strong></div><div><span>Estimated probability</span><strong>—</strong></div></div>
      {details && <div className="notice analysis-explain"><ShieldCheck size={14}/> A future result must include source timestamp, model or rule version, calibrated probability only where justified, uncertainty, and explicit invalidation conditions. No confidence score or prediction is fabricated here.</div>}
    </section>
  </div>;
}
