import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AudioWaveform, Bell, BookOpen, ChartCandlestick, CircleHelp, Cog, ExternalLink, FlaskConical, ListChecks, ShieldCheck, SlidersHorizontal, UserRound, Waypoints, Bot, Activity, Cable } from "lucide-react";
import { StrategyMaker } from "@/app/components/strategy-maker";
import { StrategyLibrary } from "@/app/components/strategy-library";
import { BacktestPlanner } from "@/app/components/backtest-planner";
import { ProfilePreferences } from "@/app/components/profile-preferences";
import { TelegramPreferences } from "@/app/components/telegram-preferences";
import { RiskPreferences } from "@/app/components/risk-preferences";
import { MarketWorkspace } from "@/app/components/market-workspace";
import { AIAnalysisPanel } from "@/app/components/ai-analysis-panel";
import { TradeHistoryPanel } from "@/app/components/trade-history-panel";

type Page = { title: string; description: string; items: string[]; notice: string };
const pages: Record<string, Page> = {
  charts: { title: "Charts & markets", description: "A market workspace for permitted price streams and technical research.", items: ["Market selector and watchlist", "Live-stream connection and freshness status", "Chart and indicator controls", "Strategy overlays when configured"], notice: "Live market data is not connected. No sample prices are presented as live." },
  "ai-analysis": { title: "AI analysis", description: "Review structured observations and explainable strategy conditions.", items: ["Market and strategy selection", "Indicator explanations", "Signal conditions and invalidation rules", "Model uncertainty and data freshness"], notice: "AI analysis is not connected yet. This page does not generate live trading signals." },
  "strategy-maker": { title: "Strategy maker", description: "Build structured strategy rules without executing arbitrary code.", items: [], notice: "Drafts are saved locally in this browser until authenticated server storage is configured." },
  backtest: { title: "Backtest lab", description: "Plan historical simulations with clear assumptions.", items: [], notice: "No historical dataset or simulation engine is connected. No backtest results are fabricated." },
  history: { title: "Trade history", description: "Review confirmed contract information from an authorized source.", items: ["Account and date filters", "Contract type and status", "Outcome and result where available", "Clear separation between signals and confirmed trades"], notice: "No account is connected. This page does not contain fabricated trade records." },
  automation: { title: "Automation", description: "Monitor automation state and risk checks.", items: ["Selected account and strategy", "Worker status and risk lock", "Start, pause, and stop controls", "Emergency stop and execution reconciliation"], notice: "Automation is disabled. Live execution is not implemented or enabled." },
  account: { title: "My account", description: "Manage your profile and connected-service preferences.", items: [], notice: "This profile editor stores a local draft only until the dedicated Anti Logic account backend is configured." },
  settings: { title: "Settings", description: "Manage workspace preferences and planned trading safeguards.", items: ["General preferences", "Trading defaults", "Risk controls", "Notification preferences", "Privacy and cookie preferences"], notice: "Settings that affect trading accounts will not be applied until secure backend workflows are implemented." },
  notifications: { title: "Notifications", description: "Manage in-app notifications and delivery preferences.", items: ["In-app notification categories", "Read and unread states", "Telegram delivery status", "Quiet hours and delivery preferences"], notice: "No notification provider is connected yet." },
  support: { title: "Help & support", description: "Find guidance and prepare a support request.", items: ["Product documentation", "Create a support ticket", "Track ticket status", "Connection troubleshooting"], notice: "Support ticket submission is not enabled until the support backend is configured." },
  "integrations/telegram": { title: "Telegram alerts", description: "Choose which events you would like to receive through your authorized Telegram bot.", items: [], notice: "Telegram is not connected. These preference controls do not send messages." },
  "settings/general": { title: "General settings", description: "Configure the Anti Logic workspace experience.", items: ["Theme and appearance", "Language and time zone", "Date and number formats", "Sidebar preferences"], notice: "General preferences are currently local to this browser." },
  "settings/trading": { title: "Trading preferences", description: "Set defaults for research and future demo workflows.", items: ["Preferred symbol", "Default strategy", "Chart preferences", "Demo-first account mode"], notice: "These preferences do not change an external trading account." },
  "settings/risk": { title: "Risk controls", description: "Define safeguards for a future server-side risk engine.", items: [], notice: "These preferences are not yet enforced by a trading worker." },
  "settings/notifications": { title: "Notification settings", description: "Choose which application events should notify you.", items: ["In-app events", "Telegram categories", "Connection-loss alerts", "Quiet hours"], notice: "No delivery channel is connected." },
  "settings/privacy": { title: "Privacy settings", description: "Manage consent and account-data preferences.", items: ["Cookie preferences", "Consent history", "Data export where supported", "Account deletion request"], notice: "Account-wide privacy controls require an authenticated backend." },
  "account/profile": { title: "Profile details", description: "Manage your display and personal preferences.", items: [], notice: "Local preview only. Changes are not synced to an account." },
  "account/security": { title: "Security", description: "Review account security settings.", items: ["Password and recovery", "Active sessions", "Multi-factor authentication where configured", "Login history"], notice: "Security controls become active after Supabase Auth is configured." },
  "account/sessions": { title: "Active sessions", description: "Review and revoke sessions belonging to your account.", items: ["Session details", "Last activity", "Revoke session", "Sign out other sessions"], notice: "Session management is not connected to an authenticated account yet." },
  "account/deriv": { title: "Deriv connections", description: "Manage authorized Deriv account connections.", items: ["Official authorization flow", "Account mode and permissions", "Connection health", "Disconnect and revoke authorization"], notice: "No Deriv account is connected. Never enter your Deriv password into Anti Logic." },
  "account/billing": { title: "Billing", description: "Review plan and entitlements when billing is configured.", items: ["Current plan", "Available features", "Invoices when enabled", "Cancellation when enabled"], notice: "Billing is not configured. No payments are being accepted." },
  "support/new": { title: "Create a support ticket", description: "Prepare a request for help with Anti Logic.", items: ["Choose a category", "Describe the issue", "Attach evidence when enabled", "Track ticket status"], notice: "Ticket submission is not active until the backend is configured." },
};
const settingsLinks = [
  { href: "/app/settings/general", label: "General", icon: Cog },
  { href: "/app/settings/trading", label: "Trading preferences", icon: ChartCandlestick },
  { href: "/app/settings/risk", label: "Risk controls", icon: ShieldCheck },
  { href: "/app/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/app/settings/privacy", label: "Privacy", icon: UserRound },
];
const iconByPath: Record<string, typeof Activity> = {
  charts: ChartCandlestick, "ai-analysis": Bot, strategies: Waypoints, "strategy-maker": SlidersHorizontal,
  backtest: FlaskConical, history: ListChecks, automation: Activity, account: UserRound, settings: Cog,
  notifications: Bell, support: CircleHelp, "integrations/telegram": AudioWaveform,
};

function PageHeading({ title, description }: { title: string; description: string }) {
  return <div className="page-heading"><div><div className="eyebrow">Anti Logic workspace</div><h1>{title}</h1><p>{description}</p></div><span className="status">FOUNDATION</span></div>;
}

export default async function WorkspacePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const key = slug.join("/");
  if (key === "charts") {
    return <main className="app-content"><PageHeading title="Charts & markets" description="Choose a symbol, organize your watchlist, and prepare the workspace for an authorized data stream."/><MarketWorkspace /></main>;
  }
  if (key === "ai-analysis") {
    return <main className="app-content"><PageHeading title="AI analysis" description="Configure an analysis request without fabricating signals or market predictions."/><AIAnalysisPanel /></main>;
  }
  if (key === "history") {
    return <main className="app-content"><PageHeading title="Trade history" description="Only confirmed records from an authorized source should appear in this workspace."/><TradeHistoryPanel /></main>;
  }
  if (key === "strategies" ) {
    return <main className="app-content"><PageHeading title="Strategies" description="Create and manage your strategy drafts in one place."/><StrategyLibrary /></main>;
  }
  if (key === "strategy-maker" || key === "strategies/new") {
    return <main className="app-content"><PageHeading title="Strategy maker" description="Compose binary-trading conditions and save a local research draft."/><StrategyMaker /></main>;
  }
  if (key === "backtest") {
    return <main className="app-content"><PageHeading title="Backtest lab" description="Prepare a test plan with explicit assumptions before a validated simulator is connected."/><BacktestPlanner /></main>;
  }
  if (key === "account" || key === "account/profile") {
    return <main className="app-content"><PageHeading title="My account" description="Review profile preferences and prepare the account settings workflow."/><ProfilePreferences /></main>;
  }
  if (key === "integrations/telegram") {
    return <main className="app-content"><PageHeading title="Telegram alerts" description="Configure your future alert preferences without exposing bot credentials."/><TelegramPreferences /></main>;
  }
  if (key === "settings/risk") {
    return <main className="app-content"><PageHeading title="Risk controls" description="Prepare conservative risk preferences for future server-side enforcement."/><RiskPreferences /></main>;
  }

  const page = pages[key];
  if (!page) notFound();
  const Icon = iconByPath[key] || Activity;

  return <main className="app-content">
    <PageHeading title={page.title} description={page.description}/>
    <div className="notice" style={{marginBottom:18}}>{page.notice}</div>
    {key === "settings" ? (
      <div className="settings-links-grid">{settingsLinks.map((item) => { const ItemIcon = item.icon; return <Link className="panel settings-link-card" href={item.href} key={item.href}><span className="feature-icon"><ItemIcon size={17}/></span><strong>{item.label}</strong><span className="muted">Open settings <ExternalLink size={12}/></span></Link>; })}</div>
    ) : (
      <div className="content-grid">
        <section className="panel card-pad"><div className="card-heading"><h2>Page capabilities</h2><span className="feature-icon" style={{margin:0,width:32,height:32}}><Icon size={16}/></span></div>
          {page.items.map((item, i) => <div className="list-row" key={item}><div style={{display:"flex",alignItems:"center",gap:12}}><span className="mono" style={{color:"var(--lime)"}}>{String(i+1).padStart(2,"0")}</span><span>{item}</span></div><span className="status">PLANNED</span></div>)}
          {page.items.length === 0 && <div className="empty-note">This section has no connected backend yet.</div>}
        </section>
        <section className="panel card-pad"><div className="card-heading"><h2>Service state</h2><span className="status demo">DEMO FIRST</span></div>
          <div className="list-row"><span className="muted">Execution</span><span className="status off">Disabled</span></div>
          <div className="list-row"><span className="muted">Provider connection</span><span className="status">Not connected</span></div>
          <div className="list-row"><span className="muted">Data source</span><span className="status">Not configured</span></div>
          <p className="muted" style={{fontSize:11,lineHeight:1.8,marginTop:16}}>This page will become operational when its integration, authentication, validation, and tests are complete. It will not show fabricated trading data.</p>
          <Link href="/app" className="btn" style={{width:"100%",marginTop:12}}>Back to overview</Link>
        </section>
      </div>
    )}
    {key.startsWith("account/") && <div className="settings-links-grid" style={{marginTop:16}}>{[{href:"/app/account/profile",label:"Profile",icon:UserRound},{href:"/app/account/security",label:"Security",icon:ShieldCheck},{href:"/app/account/deriv",label:"Deriv connections",icon:Cable}].map((item)=>{const ItemIcon=item.icon;return <Link href={item.href} className="panel settings-link-card" key={item.href}><span className="feature-icon"><ItemIcon size={17}/></span><strong>{item.label}</strong></Link>;})}</div>}
  </main>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const key = slug.join("/");
  const specialTitles: Record<string, string> = {
    "strategies/new": "Create strategy",
    "strategy-maker": "Strategy maker",
    "strategies": "Strategies",
    "backtest": "Backtest lab",
    "account": "My account",
    "account/profile": "Profile",
    "integrations/telegram": "Telegram alerts",
    "settings/risk": "Risk controls",
  };
  const page = pages[key];
  return {
    title: specialTitles[key] || page?.title || "Workspace",
    robots: { index: false, follow: false },
  };
}
