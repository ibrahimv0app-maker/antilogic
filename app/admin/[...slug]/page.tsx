import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, BookOpen, CircleHelp, Settings, ShieldCheck, Users } from "lucide-react";

const sections: Record<string, { title: string; description: string; icon: typeof Users; items: string[] }> = {
  users: { title: "User management", description: "Manage access and support workflows for platform users.", icon: Users, items: ["Search and filter users", "Review account verification status", "Account restriction workflows", "User data and deletion requests"] },
  blog: { title: "Blog content", description: "Manage Anti Logic's public research articles.", icon: BookOpen, items: ["Create an article draft", "Edit and preview content", "Publish or unpublish", "Manage categories and slugs"] },
  support: { title: "Support queue", description: "Review and respond to help requests.", icon: CircleHelp, items: ["Ticket search and filters", "Assignment and priority", "Reply and status updates", "Escalation and closure"] },
  subscriptions: { title: "Subscriptions", description: "Review subscription features when billing is configured.", icon: Settings, items: ["Plan configuration", "Entitlement rules", "Provider-confirmed billing events", "Cancellation workflow"] },
  system: { title: "System health", description: "Monitor application and integration health.", icon: Activity, items: ["Service health", "Worker state", "Recent errors", "Incident response"] },
  audit: { title: "Audit events", description: "Review authorized application security and administrative events.", icon: ShieldCheck, items: ["Actor and event type", "Timestamp and resource", "Security events", "Retention and access controls"] },
  settings: { title: "Admin settings", description: "Manage controlled platform-level settings.", icon: Settings, items: ["Feature availability", "Maintenance notice", "Service configuration status", "Role assignment policy"] },
};

export default async function AdminSection({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const data = sections[slug.join("/")];
  if (!data) notFound();
  const Icon = data.icon;
  return <main className="app-content"><div className="page-heading"><div><div className="eyebrow">Administration</div><h1>{data.title}</h1><p>{data.description}</p></div><span className="status">FOUNDATION</span></div><div className="notice" style={{marginBottom:16}}>Admin section layout is ready; connected data operations still need implementation and testing. No action below changes user accounts or platform settings yet.</div><section className="panel card-pad"><div className="card-heading"><h2>Planned tools</h2><Icon size={17} color="var(--lime)"/></div>{data.items.map((item,index)=><div className="list-row" key={item}><span><span className="mono" style={{color:"var(--lime)",marginRight:12}}>{String(index+1).padStart(2,"0")}</span>{item}</span><span className="status">NOT CONNECTED</span></div>)}<Link href="/admin" className="btn" style={{marginTop:18}}>Back to admin overview</Link></section></main>;
}
