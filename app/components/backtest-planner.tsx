"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { AlertCircle, CheckCircle2, FileUp, FlaskConical, LoaderCircle, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { parsePriceCsv, runBinaryBacktest, type BacktestResult, type BacktestRule, type Candle } from "@/lib/backtest-engine";
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const LOCAL_STRATEGIES_KEY = "anti-logic:strategy-drafts:v1";
type SavedRule = { id?: number; indicator: string; operator: string; threshold: string | number };
type Strategy = { id: string; name: string; symbol: string; contractType: string; duration: string; stake: string; rules: SavedRule[]; source: "local" | "account" };
type RemoteStrategy = { id: string; name: string; symbol: string; contract_type: string; configuration: Record<string, unknown> };

function mapRules(rules: SavedRule[]): BacktestRule[] {
  return rules.map((rule) => ({
    indicator: rule.indicator === "Moving Average" || rule.indicator === "Momentum" ? rule.indicator : "RSI",
    operator: rule.operator === "above" ? "above" : "below",
    threshold: Number(rule.threshold),
  }));
}

function prettyTime(value: number): string {
  if (value >= 1_000_000_000_000) return new Date(value).toLocaleString();
  if (value >= 1_000_000_000) return new Date(value * 1000).toLocaleString();
  return String(value);
}

function numberText(value: number, digits = 2): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function BacktestPlanner() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [strategiesLoaded, setStrategiesLoaded] = useState(false);
  const [strategySource, setStrategySource] = useState<"local" | "account" | "none">("none");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [fileName, setFileName] = useState("");
  const [direction, setDirection] = useState<"CALL" | "PUT">("CALL");
  const [durationBars, setDurationBars] = useState("1");
  const [stake, setStake] = useState("1");
  const [payout, setPayout] = useState("0.8");
  const [tieHandling, setTieHandling] = useState<"loss" | "break_even">("loss");
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"notice" | "success-note" | "form-errors">("notice");
  const configured = isSupabaseBrowserConfigured();
  const selectedStrategy = strategies.find((strategy) => strategy.id === selectedId);
  const breakEven = Number(payout) > 0 && Number.isFinite(Number(payout)) ? 100 / (1 + Number(payout)) : null;

  useEffect(() => {
    let cancelled = false;
    async function loadStrategies() {
      let local: Strategy[] = [];
      try {
        const saved = JSON.parse(window.localStorage.getItem(LOCAL_STRATEGIES_KEY) || "[]") as Array<Record<string, unknown>>;
        if (Array.isArray(saved)) {
          local = saved.filter((item) => typeof item.name === "string").map((item, index) => ({
            id: String(item.id || item.name || index),
            name: String(item.name),
            symbol: String(item.symbol || "R_100"),
            contractType: String(item.contractType || "CALL") === "PUT" ? "PUT" : "CALL",
            duration: String(item.duration || "60"),
            stake: String(item.stake || "1"),
            rules: Array.isArray(item.rules) ? item.rules as SavedRule[] : [],
            source: "local" as const,
          }));
        }
      } catch {}

      if (configured) {
        const supabase = createClient();
        if (supabase) {
          try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (!authError && user) {
              const { data, error } = await supabase.from("strategies").select("id,name,symbol,contract_type,configuration").eq("user_id", user.id).order("updated_at", { ascending: false });
              if (!error && data) {
                const remote = (data as RemoteStrategy[]).map((row) => {
                  const config = row.configuration || {};
                  const rules = Array.isArray(config.rules) ? config.rules as Array<Record<string, unknown>> : [];
                  return {
                    id: row.id,
                    name: row.name,
                    symbol: row.symbol,
                    contractType: row.contract_type === "PUT" ? "PUT" : "CALL",
                    duration: String(config.duration_seconds || 60),
                    stake: String(config.stake || 1),
                    rules: rules.map((rule, index) => ({ id: index + 1, indicator: String(rule.indicator || "RSI"), operator: String(rule.operator || "below"), threshold: Number(rule.threshold ?? 30) })),
                    source: "account" as const,
                  };
                });
                if (!cancelled) {
                  setStrategies(remote);
                  setStrategySource("account");
                  setSelectedId(remote[0]?.id || "");
                  setStrategiesLoaded(true);
                  return;
                }
              }
              if (error) setMessage("The account strategy list could not load. Confirm the Anti Logic schema and RLS policies.");
            }
          } catch (caught) {
            if (!cancelled) setMessage(caught instanceof Error ? caught.message : "Account strategies could not load.");
          }
        }
      }

      if (!cancelled) {
        setStrategies(local);
        setStrategySource(local.length ? "local" : "none");
        setSelectedId(local[0]?.id || "");
        setStrategiesLoaded(true);
      }
    }
    void loadStrategies();
    return () => { cancelled = true; };
  }, [configured]);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setResult(null);
    setMessage("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setCandles([]);
      setFileName("");
      setMessage("Choose a CSV file containing timestamp/time and close/price columns.");
      setMessageKind("form-errors");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setCandles([]);
      setFileName("");
      setMessage("File exceeds 20 MB. Split the dataset into smaller CSV files.");
      setMessageKind("form-errors");
      return;
    }
    try {
      const text = await file.text();
      const parsed = parsePriceCsv(text);
      setCandles(parsed);
      setFileName(file.name);
      setMessage(parsed.length.toLocaleString() + " valid rows loaded into browser memory. The file was not uploaded.");
      setMessageKind("success-note");
    } catch (caught) {
      setCandles([]);
      setFileName("");
      setMessage(caught instanceof Error ? caught.message : "CSV could not be parsed.");
      setMessageKind("form-errors");
    } finally {
      event.target.value = "";
    }
  }

  function runSimulation() {
    setResult(null);
    if (!candles.length) {
      setMessage("Import a CSV dataset before running the backtest.");
      setMessageKind("form-errors");
      return;
    }
    if (!selectedStrategy) {
      setMessage("Create or select a strategy with at least one rule before running the backtest.");
      setMessageKind("form-errors");
      return;
    }
    if (!selectedStrategy.rules.length) {
      setMessage("The selected strategy has no entry rules. Add conditions in Strategy Maker first.");
      setMessageKind("form-errors");
      return;
    }
    setRunning(true);
    setMessage("");
    try {
      const output = runBinaryBacktest(candles, {
        direction,
        durationBars: Number(durationBars),
        stake: Number(stake),
        netPayoutMultiple: Number(payout),
        tieHandling,
        rules: mapRules(selectedStrategy.rules),
      });
      setResult(output);
      setMessage(output.totalTrades ? "Simulation completed from your imported CSV. Results are illustrative and were not saved to the server." : "Simulation completed, but no entries matched the selected rules. Review the thresholds or dataset.");
      setMessageKind(output.totalTrades ? "success-note" : "notice");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Backtest could not run.");
      setMessageKind("form-errors");
    } finally {
      setRunning(false);
    }
  }

  function exportTimestamp(value: number) {
    if (value >= 1_000_000_000_000) return new Date(value).toISOString();
    if (value >= 1_000_000_000) return new Date(value * 1000).toISOString();
    return String(value);
  }

  function exportReport() {
    if (!result) return;
    const escapeCell = (value: string | number | boolean) => {
      const raw = String(value);
      return /[",\r\n]/.test(raw) ? '"' + raw.replace(/"/g, '""') + '"' : raw;
    };
    const summaryRows: Array<Array<string | number | boolean>> = [
      ["Anti Logic simulated backtest report"],
      ["exported_at", new Date().toISOString()],
      ["data_source", "User-provided CSV processed in browser"],
      ["strategy", selectedStrategy?.name || "Unknown"],
      ["symbol", selectedStrategy?.symbol || "Unknown"],
      ["direction", direction],
      ["expiry_bars", durationBars],
      ["stake_units", stake],
      ["assumed_net_payout_multiple", payout],
      ["ties", tieHandling],
      ["total_trades", result.totalTrades],
      ["wins", result.wins],
      ["losses", result.losses],
      ["draws", result.draws],
      ["win_rate_percent", result.winRate === null ? "N/A" : result.winRate],
      ["net_profit_loss_units", result.netProfitLoss],
      ["total_staked_units", result.totalStaked],
      ["roi_percent", result.roiPercent === null ? "N/A" : result.roiPercent],
      ["max_drawdown_units", result.maxDrawdown],
      ["max_consecutive_losses", result.maxConsecutiveLosses],
      ["trade_rows_exported", result.trades.length],
      ["trade_rows_truncated", result.tradesTruncated],
      ["assumptions"],
      ...result.assumptions.map((assumption) => [assumption]),
      [],
      ["entry_timestamp", "exit_timestamp", "direction", "entry_close", "expiry_close", "result", "net_pl_units"],
      ...result.trades.map((trade) => [exportTimestamp(trade.entryTimestamp), exportTimestamp(trade.exitTimestamp), trade.direction, trade.entryPrice, trade.exitPrice, trade.result, trade.netProfitLoss]),
    ];
    const csv = summaryRows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "anti-logic-backtest-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const recentTrades = useMemo(() => result ? result.trades.slice(-20).reverse() : [], [result]);

  return <div className="backtest-workspace">
    <div className="notice"><strong>Browser-only research.</strong> This tool requires a CSV dataset that you have rights to use. The file stays in the current browser session; Anti Logic does not upload or persist it. Results are simulations, not actual Deriv contracts or predictions of future profit.</div>
    <div className="backtest-layout">
      <section className="panel card-pad">
        <div className="card-heading"><div><h2>1. Import historical prices</h2><p className="muted" style={{fontSize:11,margin:"6px 0 0"}}>CSV · Up to 20 MB · 100,000 rows</p></div><FileUp size={17} color="var(--lime)"/></div>
        <label className="csv-dropzone" htmlFor="backtest-csv"><FileUp size={23}/><strong>{fileName || "Choose a CSV dataset"}</strong><span className="muted">Required columns: timestamp (or time/date) and close (or price).</span><span className="btn">Browse files</span><input id="backtest-csv" type="file" accept=".csv,text/csv" onChange={(event) => void handleFile(event)}/></label>
        {candles.length > 0 && <div className="dataset-summary"><div className="dataset-icon"><CheckCircle2 size={16}/></div><div><strong>{candles.length.toLocaleString()} rows loaded</strong><p className="muted">{prettyTime(candles[0].timestamp)} <span>→</span> {prettyTime(candles[candles.length - 1].timestamp)}</p></div><button className="btn" onClick={() => { setCandles([]); setFileName(""); setResult(null); setMessage("Dataset cleared from the current page state."); setMessageKind("notice"); }}><RotateCcw size={13}/> Clear</button></div>}
        <div className="csv-example"><span className="field-hint">Example format</span><code>timestamp,close<br/>2026-01-01T10:00:00Z,123.45<br/>2026-01-01T10:01:00Z,123.51</code></div>
      </section>
      <section className="panel card-pad">
        <div className="card-heading"><div><h2>2. Configure the simulation</h2><p className="muted" style={{fontSize:11,margin:"6px 0 0"}}>No actual order will be placed.</p></div><FlaskConical size={17} color="var(--lime)"/></div>
        <div className="form-field"><label htmlFor="bt-strategy">Saved strategy</label><select id="bt-strategy" value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setResult(null); }} disabled={!strategiesLoaded || strategies.length === 0}><option value="">{strategiesLoaded ? "Select a strategy" : "Loading strategies…"}</option>{strategies.map((strategy) => <option key={strategy.id} value={strategy.id}>{strategy.name}{strategy.source === "account" ? " (account)" : " (local)"}</option>)}</select></div>
        {selectedStrategy && <div className="selected-strategy-summary"><span className="status">{selectedStrategy.symbol}</span><span className="status">{selectedStrategy.rules.length} rule(s)</span><span className="status">{selectedStrategy.source === "account" ? "Account source" : "Local source"}</span><span className="field-hint">The simulation runs the selected rule conditions against imported close prices.</span></div>}
        <div className="form-grid"><div className="form-field"><label htmlFor="bt-direction">Binary direction</label><select id="bt-direction" value={direction} onChange={(event) => setDirection(event.target.value as "CALL" | "PUT")}><option value="CALL">CALL — win if expiry close is higher</option><option value="PUT">PUT — win if expiry close is lower</option></select></div><div className="form-field"><label htmlFor="bt-duration">Expiry horizon (bars)</label><input id="bt-duration" type="number" min="1" max="10000" step="1" value={durationBars} onChange={(event) => setDurationBars(event.target.value)}/></div><div className="form-field"><label htmlFor="bt-stake">Hypothetical stake (units)</label><input id="bt-stake" type="number" min="0.01" step="0.01" value={stake} onChange={(event) => setStake(event.target.value)}/></div><div className="form-field"><label htmlFor="bt-payout">Net profit on win (multiple of stake)</label><input id="bt-payout" type="number" min="0.01" max="10" step="0.05" value={payout} onChange={(event) => setPayout(event.target.value)}/></div><div className="form-field"><label htmlFor="bt-ties">Equal entry/expiry price</label><select id="bt-ties" value={tieHandling} onChange={(event) => setTieHandling(event.target.value as "loss" | "break_even")}><option value="loss">Count as loss (conservative)</option><option value="break_even">Treat as break-even</option></select></div></div>
        {breakEven !== null && <div className="break-even-panel"><span className="muted">Break-even win rate from this assumed payout</span><strong>{numberText(breakEven, 2)}%</strong><small>Formula: 1 ÷ (1 + net payout multiple) · ignores fees and execution effects</small></div>}
        <button className="btn btn-primary" onClick={runSimulation} disabled={running || !strategiesLoaded}>{running ? <LoaderCircle className="spin" size={14}/> : <Play size={14}/>} Run browser-only simulation</button>
        {message && <div role="status" className={messageKind} style={{marginTop:14}}>{messageKind === "success-note" && <CheckCircle2 size={15}/>} {messageKind === "form-errors" && <AlertCircle size={15}/>} {message}</div>}
      </section>
    </div>
    {result && <>
      <section className="panel card-pad backtest-result-panel">
        <div className="card-heading"><div><h2>Simulation report</h2><p className="muted" style={{fontSize:11,margin:"6px 0 0"}}>Computed in this browser from the selected CSV.</p></div><div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><span className="status demo">SIMULATED</span><button className="btn" onClick={exportReport}><Download size={13}/> Export report</button></div></div>
        <div className="backtest-metric-grid">
          <div className="metric panel"><div className="metric-label">Matched trades</div><div className="metric-value">{result.totalTrades.toLocaleString()}</div><div className="metric-foot">Signal conditions matched</div></div>
          <div className="metric panel"><div className="metric-label">Win rate</div><div className="metric-value">{result.winRate === null ? "—" : numberText(result.winRate) + "%"}</div><div className="metric-foot">{result.wins} wins / {result.evaluatedTrades} evaluated</div></div>
          <div className="metric panel"><div className="metric-label">Net P/L</div><div className={"metric-value " + (result.netProfitLoss >= 0 ? "positive" : "negative")}>{result.netProfitLoss > 0 ? "+" : ""}{numberText(result.netProfitLoss)} units</div><div className="metric-foot">Not real money</div></div>
          <div className="metric panel"><div className="metric-label">ROI on simulated stake</div><div className="metric-value">{result.roiPercent === null ? "—" : numberText(result.roiPercent) + "%"}</div><div className="metric-foot">{numberText(result.totalStaked)} units allocated</div></div>
          <div className="metric panel"><div className="metric-label">Max drawdown</div><div className="metric-value negative">{numberText(result.maxDrawdown)} units</div><div className="metric-foot">Peak-to-trough simulated P/L</div></div>
          <div className="metric panel"><div className="metric-label">Max losing streak</div><div className="metric-value">{result.maxConsecutiveLosses}</div><div className="metric-foot">{result.losses} losses · {result.draws} ties</div></div>
        </div>
        <div className="notice" style={{marginTop:14}}><ShieldCheck size={14}/> {result.assumptions.join(" ")}</div>
        {result.tradesTruncated && <div className="notice" style={{marginTop:10}}>The table below shows the most recent 20 of up to 5,000 retained in-memory result rows. The report counted {result.totalTrades.toLocaleString()} matched trades.</div>}
      </section>
      <section className="panel card-pad">
        <div className="card-heading"><h2>Recent simulated entries</h2><span className="status">{recentTrades.length} shown</span></div>
        <div className="table-wrap"><table className="table history-table"><thead><tr><th>Entry time</th><th>Exit time</th><th>Direction</th><th>Entry close</th><th>Expiry close</th><th>Result</th><th>Net P/L</th></tr></thead><tbody>{recentTrades.map((trade,index)=><tr key={trade.entryTimestamp + "-" + index}><td>{prettyTime(trade.entryTimestamp)}</td><td>{prettyTime(trade.exitTimestamp)}</td><td>{trade.direction}</td><td>{numberText(trade.entryPrice,5)}</td><td>{numberText(trade.exitPrice,5)}</td><td><span className={"status " + (trade.result === "win" ? "demo" : trade.result === "loss" ? "off" : "")}>{trade.result.toUpperCase()}</span></td><td className={trade.netProfitLoss > 0 ? "positive" : trade.netProfitLoss < 0 ? "negative" : ""}>{trade.netProfitLoss > 0 ? "+" : ""}{numberText(trade.netProfitLoss)}</td></tr>)}</tbody></table></div>
        <p className="field-hint" style={{marginTop:14}}>The imported dataset and result rows are held only in current page memory. Refreshing this page clears the simulation output.</p>
      </section>
    </>}
    <div className="backtest-bottom-note"><ShieldCheck size={15}/><span>Research discipline: an out-of-sample dataset, sufficient sample size, realistic payout assumptions and independent risk controls are necessary. A profitable simulation is not proof of future profit.</span></div>
  </div>;
}
