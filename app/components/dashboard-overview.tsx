"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Bot, ChartCandlestick, Clock3, FlaskConical, Plus, ShieldCheck, Waypoints } from "lucide-react";
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const STRATEGY_KEY = "anti-logic:strategy-drafts:v1";
const BACKTEST_KEY = "anti-logic:backtest-plan:v1";

export function DashboardOverview() {
  const [strategyCount, setStrategyCount] = useState<number | null>(null);
  const [backtestPlanSaved, setBacktestPlanSaved] = useState(false);
  const [source, setSource] = useState<"loading" | "local" | "account" | "error">("loading");
  const [notice, setNotice] = useState("");
  const configured = isSupabaseBrowserConfigured();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (configured) {
          const supabase = createClient();
          if (!supabase) throw new Error("Supabase configuration is incomplete.");
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError || !user) throw new Error("Sign in again to load account data.");
          const { data, error } = await supabase.from("strategies").select("id").eq("user_id", user.id);
          if (error) throw new Error("Could not load account strategy count. Confirm the Anti Logic schema and RLS policies.");
          if (!cancelled) {
            setStrategyCount(data?.length || 0);
            setSource("account");
          }
        } else {
          let count = 0;
          try {
            const drafts = JSON.parse(window.localStorage.getItem(STRATEGY_KEY) || "[]");
            count = Array.isArray(drafts) ? drafts.length : 0;
          } catch {}
          if (!cancelled) {
            setStrategyCount(count);
            setSource("local");
          }
        }
      } catch (caught) {
        if (!cancelled) {
          setSource("error");
          setStrategyCount(null);
          setNotice(caught instanceof Error ? caught.message : "Workspace summary could not load.");
        }
      }
      if (!cancelled) {
        try { setBacktestPlanSaved(Boolean(window.localStorage.getItem(BACKTEST_KEY))); } catch {}
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [configured]);

  const metrics = [
    { label: "Deriv connection", value: "Not connected", foot: "Connect a demo account first", icon: ChartCandlestick },
    { label: "Saved strategies", value: strategyCount === null ? "—" : String(strategyCount), foot: source === "account" ? "From your account" : source === "local" ? "Drafts on this device" : "No data source", icon: Waypoints },
    { label: "Backtest plan", value: backtestPlanSaved ? "Saved" : "Not set", foot: "Planning only · no simulation run", icon: FlaskConical },
    { label: "Automation", value: "Disabled", foot: "Safe default state", icon: ShieldCheck },
  ];

  return <>
    {notice && <div className="notice" role="status" style={{marginBottom:16}}>{notice}</div>}
    <div className="app-grid">{metrics.map((metric) => { const Icon = metric.icon; return <div className="panel card-pad" key={metric.label}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><span className="metric-label">{metric.label}</span><Icon size={16} color="var(--lime)"/></div><div className="metric-value" style={{fontSize:20}}>{metric.value}</div><div className="metric-foot" style={{color:"var(--muted)"}}>{metric.foot}</div></div>; })}</div>
    <div className="content-grid">
      <section className="panel card-pad"><div className="card-heading"><h2>Recent activity</h2><span className="status">CONFIRMED EVENTS ONLY</span></div><div className="empty-note"><Clock3 size={22} style={{margin:"0 auto 12px",color:"#a3adbd"}}/><div style={{color:"var(--text)",fontWeight:700,marginBottom:5}}>No trading activity to show</div>There is no connected Deriv account, and no trades are being executed. Confirmed application events will appear here when the backend is connected.</div></section>
      <section className="panel card-pad"><div className="card-heading"><h2>Risk & system state</h2><ShieldCheck size={17} color="var(--lime)"/></div><div className="list-row"><span className="muted">Default mode</span><span className="status demo">Demo first</span></div><div className="list-row"><span className="muted">Execution</span><span className="status off">Disabled</span></div><div className="list-row"><span className="muted">Deriv connection</span><span className="status">Not connected</span></div><div className="list-row"><span className="muted">Telegram</span><span className="status">Not connected</span></div><Link href="/app/settings/risk" className="btn" style={{width:"100%",marginTop:17}}>Review risk preferences <ArrowUpRight size={14}/></Link></section>
    </div>
    <div className="content-grid">
      <section className="panel card-pad"><div className="card-heading"><h2>Get started</h2><span className="muted" style={{fontSize:10}}>3 STEPS</span></div>{[{n:"01",title:"Set up your account",desc:"Configure profile and preferences.",href:"/app/account"},{n:"02",title:"Build a strategy",desc:"Define rules and save a research draft.",href:"/app/strategy-maker"},{n:"03",title:"Plan a backtest",desc:"Set assumptions before connecting a valid dataset.",href:"/app/backtest"}].map((step)=><Link key={step.n} href={step.href} className="list-row"><div style={{display:"flex",gap:12,alignItems:"center"}}><span className="mono" style={{color:"var(--lime)"}}>{step.n}</span><div><div style={{fontWeight:700}}>{step.title}</div><div className="muted" style={{fontSize:10,marginTop:4}}>{step.desc}</div></div></div><ArrowUpRight size={15} color="#8792a3"/></Link>)}</section>
      <section className="panel card-pad"><div className="card-heading"><h2>Quick access</h2><Bot size={17} color="var(--lime)"/></div>{[{label:"Charts & markets",href:"/app/charts"},{label:"AI analysis",href:"/app/ai-analysis"},{label:"Strategy library",href:"/app/strategies"},{label:"Telegram alerts",href:"/app/integrations/telegram"},{label:"Account settings",href:"/app/settings"}].map((item)=><Link key={item.href} href={item.href} className="list-row"><span>{item.label}</span><ArrowUpRight size={14} color="#8792a3"/></Link>)}</section>
    </div>
  </>;
}
