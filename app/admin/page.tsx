import Link from "next/link";
import { Activity, BookOpen, CircleHelp, ShieldCheck, Users } from "lucide-react";

const tiles = [
  { title: "User management", text: "Review user status and account support workflows.", href: "/admin/users", icon: Users },
  { title: "Content management", text: "Manage research articles and published help content.", href: "/admin/blog", icon: BookOpen },
  { title: "Support queue", text: "Review and respond to support requests.", href: "/admin/support", icon: CircleHelp },
  { title: "System health", text: "Monitor configured services and operational incidents.", href: "/admin/system", icon: Activity },
  { title: "Audit events", text: "Review permitted application security and admin events.", href: "/admin/audit", icon: ShieldCheck },
];

export default function AdminHome() {
  return <main className="app-content"><div className="page-heading"><div><div className="eyebrow">Operations</div><h1>Admin overview</h1><p>Administration tools are protected by server-verified app metadata roles.</p></div><span className="status demo">ADMIN</span></div><div className="notice" style={{marginBottom:16}}>This is a structural foundation. No user counts, billing metrics, incidents, or support statistics are fabricated.</div><div className="admin-card-grid">{tiles.map((tile) => { const Icon = tile.icon; return <Link key={tile.href} href={tile.href} className="panel settings-link-card"><span className="feature-icon"><Icon size={17}/></span><strong>{tile.title}</strong><p className="muted">{tile.text}</p><span className="article-link">Open section →</span></Link>; })}</div></main>;
}
