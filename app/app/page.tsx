import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardOverview } from "@/app/components/dashboard-overview";

export default function Dashboard() {
  return <main className="app-content">
    <div className="page-heading"><div><div className="eyebrow">Your workspace</div><h1>Overview</h1><p>Research, configure, and test your binary-trading workflow from one place.</p></div><Link className="btn btn-primary" href="/app/strategy-maker"><Plus size={15}/> Create strategy</Link></div>
    <div className="notice" style={{marginBottom:16}}><strong>Demo-first mode.</strong> No Deriv account is connected, no live prices are being shown, and no trades are being executed.</div>
    <DashboardOverview />
  </main>;
}
