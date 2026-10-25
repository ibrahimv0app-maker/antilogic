import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, BookOpen, CircleHelp, LayoutDashboard, Settings, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/blog", label: "Blog content", icon: BookOpen },
  { href: "/admin/support", label: "Support", icon: CircleHelp },
  { href: "/admin/system", label: "System health", icon: Activity },
  { href: "/admin/audit", label: "Audit events", icon: ShieldCheck },
  { href: "/admin/settings", label: "Admin settings", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  if (!supabase) {
    return <main className="container admin-locked"><div className="eyebrow">Anti Logic / Admin</div><h1 className="section-title">Administration is locked</h1><p className="muted">Configure the dedicated Anti Logic Supabase project and server-side admin role before accessing any administrative tools.</p><Link href="/" className="btn">Back to website</Link></main>;
  }
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/auth/sign-in?next=/admin");
  if (user.app_metadata?.role !== "admin") redirect("/app");

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link href="/" className="brand"><span className="brand-mark">A</span><span>anti logic<span style={{color:"var(--lime)"}}>.</span></span></Link>
      <div className="admin-label">ADMINISTRATION</div>
      {nav.map((item) => { const Icon = item.icon; return <Link className="side-link" key={item.href} href={item.href}><Icon size={15}/>{item.label}</Link>; })}
      <div className="admin-sidebar-bottom"><span className="status demo">ROLE VERIFIED</span><span className="field-hint">{user.email || "Authorized administrator"}</span><Link href="/app" className="side-link">← User workspace</Link></div>
    </aside>
    <div className="admin-main"><header className="admin-topbar"><span className="muted">Anti Logic <span style={{color:"var(--border)"}}>/</span> Administration</span><span className="status demo">ADMIN ACCESS</span></header>{children}</div>
  </div>;
}
