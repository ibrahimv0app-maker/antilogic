"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck, Wifi } from "lucide-react";

type StatusPayload = {
  service: string;
  status: string;
  checkedAt: string;
  configuration: {
    authentication: string;
    derivMarketData: string;
    telegramDelivery: string;
    tradeExecution: string;
  };
  note: string;
};

export function SystemStatusPanel() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/health", { cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Status endpoint returned HTTP " + response.status + ".");
      const payload = await response.json() as StatusPayload;
      setData(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not retrieve Anti Logic configuration status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const rows = data ? [
    { title: "Anti Logic web application", detail: "The status endpoint responded to this request.", state: data.status === "ok" ? "Available" : "Needs review", ok: data.status === "ok", icon: Activity },
    { title: "Authentication configuration", detail: "Uses the dedicated Anti Logic Supabase environment variables.", state: data.configuration.authentication === "configured" ? "Configured" : "Not configured", ok: data.configuration.authentication === "configured", icon: ShieldCheck },
    { title: "Deriv market data", detail: "Read-only public WebSocket from the Charts workspace; this endpoint does not test the feed.", state: "Client-side connection", ok: true, icon: Wifi },
    { title: "Telegram delivery", detail: "A configured server token alone would not verify a working bot or chat.", state: data.configuration.telegramDelivery === "server_secret_configured" ? "Secret configured · unverified" : "Not configured", ok: false, icon: Activity },
    { title: "Trading execution", detail: "No automated or live trading is enabled in this milestone.", state: "Disabled", ok: false, icon: ShieldCheck },
  ] : [];

  return <div className="panel card-pad">
    <div className="card-heading"><div><h2>Service configuration</h2><p className="muted" style={{fontSize:11,margin:"6px 0 0"}}>Configuration status is not a third-party uptime guarantee.</p></div><button className="icon-action" onClick={() => void refresh()} disabled={loading} aria-label="Refresh system status" title="Refresh status">{loading ? <RefreshCw className="spin" size={14}/> : <RefreshCw size={14}/>}</button></div>
    {loading && !data && <div className="empty-note">Checking Anti Logic configuration…</div>}
    {error && <div role="alert" className="notice" style={{marginBottom:14}}><AlertTriangle size={14}/> {error}</div>}
    {data && <><div className="system-summary"><span className="status demo"><CheckCircle2 size={11}/> Web app responded</span><span className="field-hint">Checked {new Date(data.checkedAt).toLocaleString()}</span></div>{rows.map((row) => { const Icon = row.icon; return <div className="list-row system-status-row" key={row.title}><div className="system-status-main"><span className={"system-status-icon " + (row.ok ? "ok" : "pending")}><Icon size={15}/></span><div><strong>{row.title}</strong><p className="muted">{row.detail}</p></div></div><span className={"status " + (row.ok ? "demo" : "off")}>{row.state}</span></div>; })}<p className="field-hint" style={{marginTop:15}}>{data.note}</p></>}
    {!loading && !data && <button className="btn" onClick={() => void refresh()}>Try again</button>}
  </div>;
}
