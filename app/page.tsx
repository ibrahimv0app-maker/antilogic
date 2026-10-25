import Link from "next/link";
import { Activity, ArrowRight, AudioWaveform, Bot, ChartNoAxesCombined, ChevronRight, FlaskConical, ShieldCheck, Waypoints } from "lucide-react";
import { PublicHeader } from "@/app/components/public-header";

function MiniChart(){return <svg className="chart-svg" viewBox="0 0 900 180" preserveAspectRatio="none" aria-label="Illustrative chart preview"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c6f36a" stopOpacity=".22"/><stop offset="100%" stopColor="#c6f36a" stopOpacity="0"/></linearGradient></defs>{[30,70,110,150].map((y)=><line key={y} x1="0" x2="900" y1={y} y2={y} stroke="#2b3340" strokeDasharray="3 7"/>)}<path d="M0 133 L35 126 L68 139 L102 107 L137 118 L173 92 L208 106 L244 79 L280 90 L315 62 L350 74 L385 92 L420 66 L455 80 L490 48 L526 61 L560 42 L595 57 L630 36 L666 52 L700 30 L735 48 L770 24 L805 41 L840 18 L875 29 L900 14 L900 180 L0 180 Z" fill="url(#fill)"/><path d="M0 133 L35 126 L68 139 L102 107 L137 118 L173 92 L208 106 L244 79 L280 90 L315 62 L350 74 L385 92 L420 66 L455 80 L490 48 L526 61 L560 42 L595 57 L630 36 L666 52 L700 30 L735 48 L770 24 L805 41 L840 18 L875 29 L900 14" fill="none" stroke="#c6f36a" strokeWidth="2.4" vectorEffect="non-scaling-stroke"/></svg>}

export default function Home(){
  return <>
    <PublicHeader />
    <main>
      <section className="hero grid-bg"><div className="container">
        <div className="pill"><span className="dot"/> RESEARCH FIRST. RISK ALWAYS.</div>
        <h1>Trade with a plan.<br/><span>Not a feeling.</span></h1>
        <p className="hero-copy">A focused workspace for binary trading research, strategy design, backtesting, and risk-aware automation — built to keep every decision clear.</p>
        <div className="hero-actions"><Link href="/app" className="btn btn-primary">Explore workspace <ArrowRight size={15}/></Link><a href="#features" className="btn">Discover the platform <ChevronRight size={15}/></a></div>
        <div className="preview panel"><div className="preview-top"><div><div className="eyebrow">Anti Logic / Workspace preview</div><div style={{fontSize:15,fontWeight:800,marginTop:7}}>Market intelligence</div></div><div className="pill"><span className="dot"/> UI PREVIEW <span style={{color:"#7f8a9b"}}>· Sample only</span></div></div>
          <div className="preview-grid">
            <div className="metric panel"><div className="metric-label">Account connection</div><div className="metric-value" style={{fontSize:17}}>Not connected</div><div className="metric-foot" style={{color:"var(--muted)"}}>Connect a demo account</div></div>
            <div className="metric panel"><div className="metric-label">Automation</div><div className="metric-value" style={{fontSize:17}}>Disabled</div><div className="metric-foot" style={{color:"var(--muted)"}}>Manual control by default</div></div>
            <div className="metric panel"><div className="metric-label">Strategy lab</div><div className="metric-value" style={{fontSize:17}}>Ready to configure</div><div className="metric-foot" style={{color:"var(--muted)"}}>Build rules, then test</div></div>
            <div className="metric panel"><div className="metric-label">Risk controls</div><div className="metric-value" style={{fontSize:17}}>Demo first</div><div className="metric-foot">Safety-led workflow</div></div>
          </div>
          <div className="chart-placeholder panel"><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",marginBottom:10}}><div><div style={{fontWeight:800,fontSize:12}}>Illustrative market chart</div><div className="muted" style={{fontSize:10,marginTop:5}}>Not live market data · No trading account connected</div></div><span className="status">PREVIEW</span></div><MiniChart/></div>
        </div>
      </div></section>
      <section className="section" id="features"><div className="container"><div className="eyebrow">One clear workflow</div><h2 className="section-title">From market research<br/>to controlled execution.</h2><p className="muted" style={{maxWidth:600,lineHeight:1.8}}>Keep your strategy rules, testing, account connection and automation status in one place — with transparent states instead of pretend live numbers.</p>
        <div className="feature-grid">
          <article className="feature-card panel"><div className="feature-icon"><Activity size={19}/></div><h3>Market workspace</h3><p>Organize symbols, chart views and permitted market data with clear connection and freshness indicators.</p></article>
          <article className="feature-card panel"><div className="feature-icon"><Waypoints size={19}/></div><h3>Strategy lab</h3><p>Create structured entry rules, save versions and validate configurations before running a test.</p></article>
          <article className="feature-card panel"><div className="feature-icon"><ChartNoAxesCombined size={19}/></div><h3>Backtesting</h3><p>Evaluate a strategy against an authorized dataset and disclose assumptions, sample size and limitations.</p></article>
          <article className="feature-card panel"><div className="feature-icon"><Bot size={19}/></div><h3>AI analysis</h3><p>Explain indicators and potential setups without promising a winning signal or guaranteed return.</p></article>
          <article className="feature-card panel"><div className="feature-icon"><ShieldCheck size={19}/></div><h3>Risk controls</h3><p>Keep automation off by default, validate limits server-side and make emergency stop easy to find.</p></article>
          <article className="feature-card panel"><div className="feature-icon"><AudioWaveform size={19}/></div><h3>Telegram alerts</h3><p>Connect notifications through an authorized bot flow and distinguish confirmed outcomes from predictions.</p></article>
        </div>
      </div></section>
      <section className="section" style={{paddingTop:10}}><div className="container"><div className="panel cta-panel"><div><div className="eyebrow">Start with the foundation</div><h2 className="section-title" style={{marginBottom:8}}>Build carefully.<br/>Scale when ready.</h2><p className="muted" style={{maxWidth:530,lineHeight:1.8}}>Create your workspace, configure your profile, and prepare a demo-first workflow before connecting any live trading permissions.</p></div><Link href="/app" className="btn btn-primary">Open workspace <ArrowRight size={15}/></Link></div></div></section>
    </main>
    <footer className="site-footer"><div className="container footer-row"><Link href="/" className="brand"><span className="brand-mark">A</span><span>anti logic<span style={{color:"var(--lime)"}}>.</span></span></Link><div style={{display:"flex",gap:18,flexWrap:"wrap"}}><Link href="/docs">Documentation</Link><Link href="/blog">Research</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link><Link href="/legal/cookies">Cookies</Link><Link href="/legal/risk-disclosure">Risk disclosure</Link></div><span>© {new Date().getFullYear()} Anti Logic. Binary trading involves substantial risk.</span></div></footer>
  </>;
}
