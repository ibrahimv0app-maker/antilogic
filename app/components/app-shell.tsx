"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity, AudioWaveform, Bell, ChartCandlestick, CircleHelp, Cog,
  FlaskConical, LayoutDashboard, ListChecks, Menu, ShieldCheck,
  SlidersHorizontal, UserRound, Waypoints, Bot, X
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const groups = [
  { label: "Workspace", items: [
    { href: "/app", label: "Overview", icon: LayoutDashboard },
    { href: "/app/charts", label: "Charts & markets", icon: ChartCandlestick },
    { href: "/app/ai-analysis", label: "AI analysis", icon: Bot },
  ]},
  { label: "Research", items: [
    { href: "/app/strategies", label: "Strategies", icon: Waypoints },
    { href: "/app/strategy-maker", label: "Strategy maker", icon: SlidersHorizontal },
    { href: "/app/backtest", label: "Backtest lab", icon: FlaskConical },
    { href: "/app/history", label: "Trade history", icon: ListChecks },
  ]},
  { label: "Automation", items: [
    { href: "/app/automation", label: "Automation", icon: Activity },
    { href: "/app/integrations/telegram", label: "Telegram alerts", icon: AudioWaveform },
  ]},
  { label: "Account", items: [
    { href: "/app/account", label: "My account", icon: UserRound },
    { href: "/app/settings", label: "Settings", icon: Cog },
    { href: "/app/notifications", label: "Notifications", icon: Bell },
    { href: "/app/support", label: "Help & support", icon: CircleHelp },
  ]},
];

function Brand() {
  return <Link href="/" className="brand"><span className="brand-mark">A</span><span>anti logic<span style={{color:"var(--lime)"}}>.</span></span></Link>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <aside className={"sidebar " + (mobileOpen ? "sidebar-open" : "")}>
      <div className="sidebar-brand-row"><Brand />{mobileOpen && <button className="icon-action mobile-only" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={17}/></button>}</div>
      <div className="pill sidebar-pill"><span className="dot"/> DEMO-FIRST WORKSPACE</div>
      <nav aria-label="Workspace navigation">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="side-label">{group.label}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/app" ? pathname === "/app" : pathname === item.href || pathname.startsWith(item.href + "/");
              return <Link onClick={() => setMobileOpen(false)} aria-current={active ? "page" : undefined} href={item.href} key={item.href} className={"side-link " + (active ? "active" : "")}><Icon size={16}/>{item.label}</Link>;
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="notice"><strong>Demo first.</strong> No live trades are enabled in this foundation.</div>
        <Link href="/" className="side-link">← Back to website</Link>
      </div>
    </aside>
  );

  return (
    <div className="app-shell">
      {sidebar}
      {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-start">
            <button className="icon-action mobile-only" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={17}/></button>
            <span className="muted topbar-breadcrumb">Workspace <span style={{color:"#596476"}}>/</span> <span style={{color:"var(--text)"}}>Anti Logic</span></span>
          </div>
          <div className="topbar-actions">
            <span className="status demo topbar-mode"><ShieldCheck size={11}/> DEMO FIRST</span>
            <span className="status off topbar-connection">Not connected</span>
            <ThemeToggle />
            <Link className="icon-action" href="/app/notifications" aria-label="Notifications"><Bell size={15}/></Link>
            <UserMenu />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
