import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import { PublicHeader } from "@/app/components/public-header";
import { CookiePreferencesButton } from "@/app/components/cookie-consent";

type Section = { heading: string; body: string };
type PublicPage = { title: string; description: string; sections: Section[] };
const articles = [
  { slug: "binary-contracts-basics", title: "Binary contracts: understand the mechanics", category: "Foundations", summary: "Understand stake, payout, expiry, and why contract terms matter before a trade." },
  { slug: "backtesting-honestly", title: "How to evaluate a strategy without fooling yourself", category: "Research", summary: "Learn about out-of-sample tests, data leakage, payout assumptions, and sample size." },
  { slug: "ai-confidence", title: "An AI confidence score is not a guarantee", category: "AI literacy", summary: "Why model calibration and uncertainty matter more than a confident-sounding prediction." },
];

const pages: Record<string, PublicPage> = {
  docs: { title: "Documentation", description: "Learn how the Anti Logic workspace is designed to work.", sections: [{ heading: "Getting started", body: "Start with your profile and workspace preferences. Provider connections will use official authorization flows when implemented." }, { heading: "Demo-first workflow", body: "Automation is disabled by default. Every trading integration must be tested in an authorized demo environment first." }] },
  faq: { title: "Frequently asked questions", description: "A practical guide to the Anti Logic foundation.", sections: [{ heading: "Can Anti Logic trade right now?", body: "No. The current milestone provides the website foundation and local-first research screens. No Deriv account is connected and no trades are executed." }, { heading: "Are dashboard numbers real?", body: "No trading metrics are fabricated. Empty or not-connected states are shown until real services are configured." }, { heading: "Does AI guarantee profitable trades?", body: "No. AI predictions can be wrong, and model confidence is not proof of a winning probability." }] },
  about: { title: "About Anti Logic", description: "A focused workspace for trading research, strategy design, and risk-aware automation.", sections: [{ heading: "Our approach", body: "Make the workflow understandable, test assumptions, protect account access, and keep automation disabled until the required safeguards exist." }] },
  features: { title: "Platform features", description: "Explore the Anti Logic research and workflow tools.", sections: [{ heading: "Research and strategy design", body: "Build structured rules, validate configurations, and plan a backtest using an authorized dataset." }, { heading: "Risk-aware automation", body: "Future automation will require independent risk checks, transparent state, and an emergency stop." }] },
  "features/ai-analysis": { title: "AI market analysis", description: "Structured observations and explainable strategy conditions — without claims of certainty.", sections: [{ heading: "What it should show", body: "Timestamped inputs, model or rule version, market regime, key indicators, uncertainty, and conditions that invalidate a signal." }, { heading: "What it will not promise", body: "No guaranteed predictions, fabricated win rates, or claims that an indicator ensures profitability." }] },
  "features/automation": { title: "Risk-aware automation", description: "A controlled process between a strategy, the risk engine, and an authorized provider API.", sections: [{ heading: "Controlled workflow", body: "Validate authorization, market-data freshness, contract terms, and risk limits before a documented order request. Reconcile uncertain submissions rather than retrying blindly." }, { heading: "Safe defaults", body: "Automation starts disabled. Demo testing comes first, and an emergency stop blocks new order submissions." }] },
  "features/strategy-lab": { title: "Strategy lab", description: "Build, version, and evaluate trading rules using documented assumptions.", sections: [{ heading: "Strategy research", body: "Record the market, supported contract type, duration, entry rules, stake assumption, and risk limits." }, { heading: "Validation", body: "Use chronological and out-of-sample tests. Historical performance does not guarantee future results." }] },
  platform: { title: "Anti Logic platform", description: "One workspace for binary trading research and controlled workflows.", sections: [{ heading: "Current milestone", body: "The website and navigation foundation are being built first. Authentication, provider integrations, and execution are separate tested milestones." }] },
  pricing: { title: "Plans & pricing", description: "Pricing will be published after feature scope and operating costs are established.", sections: [{ heading: "Not accepting payments yet", body: "Billing is not configured. No plan is being sold and no payment is being collected through this page." }] },
  security: { title: "Security", description: "Security is a product requirement, not a marketing claim.", sections: [{ heading: "Current status", body: "Authentication and protected account data require a dedicated backend, correct row-level security, and testing. No certification or independent security audit is claimed." }] },
  status: { title: "System status", description: "Anti Logic service health and integration status.", sections: [{ heading: "Foundation status", body: "This page describes the application foundation. It does not independently verify third-party API availability." }] },
  contact: { title: "Contact", description: "Contact workflows will be enabled after a secure support backend is configured.", sections: [{ heading: "Support channel", body: "The contact form is not connected yet. No message will be submitted from this page." }] },
  "legal/terms": { title: "Terms & conditions", description: "Draft terms for review before public launch.", sections: [{ heading: "Draft notice", body: "This page is not legal advice. Final terms must describe the operating entity, supported regions, services, and user responsibilities." }, { heading: "Trading risk", body: "Binary trading can result in losing the full stake. No outcome or return is guaranteed." }] },
  "legal/privacy": { title: "Privacy policy", description: "Draft privacy information for the Anti Logic application.", sections: [{ heading: "Draft notice", body: "The final policy must explain what information is collected, why it is processed, where it is stored, how long it is retained, and how users exercise their rights." }] },
  "legal/cookies": { title: "Cookie policy", description: "Cookie and consent preferences for Anti Logic.", sections: [{ heading: "Consent", body: "Necessary storage should be distinguished from optional analytics. Applicable consent requirements must be followed before enabling non-essential technologies." }] },
  "legal/risk-disclosure": { title: "Risk disclosure", description: "Understand the risks before using binary trading tools.", sections: [{ heading: "No guarantee", body: "Binary trading is high risk. A strategy's historical performance or an AI-generated assessment does not guarantee future results. Never trade money you cannot afford to lose." }, { heading: "Automation", body: "Automation can fail due to market conditions, latency, API errors, connection loss, or incorrect configuration. Demo testing does not eliminate live trading risk." }] },
  "blog/binary-contracts-basics": { title: articles[0].title, description: articles[0].summary, sections: [{ heading: "Check the contract before entry", body: "Confirm the instrument, contract type, duration or expiry, quoted price, payout, and conditions that determine the result. The options available depend on the selected market and account." }, { heading: "Know the payoff", body: "A binary-style contract can lose the full stake. Understand the net profit on a win and total loss on a loss before evaluating the break-even probability." }, { heading: "Use demo testing first", body: "A demo workflow helps test the software and understand contract mechanics, but it cannot guarantee the same experience or outcomes in live trading." }] },
  "blog/backtesting-honestly": { title: articles[1].title, description: articles[1].summary, sections: [{ heading: "Separate test periods", body: "Use chronological train, validation, and test segments. Do not tune parameters on the same data used to claim performance." }, { heading: "Model the actual payoff", body: "Account for stake loss, payout assumptions, expiry conditions, execution delays, and relevant costs. A win rate alone does not establish positive expected value." }, { heading: "Report uncertainty", body: "Show sample size, drawdown, losing streaks, and the assumptions behind results. A backtest is a simulation, not proof of future profit." }] },
  "blog/ai-confidence": { title: articles[2].title, description: articles[2].summary, sections: [{ heading: "Confidence is not calibration", body: "A model's score is useful only when it has been evaluated against properly labelled data and its predicted probabilities are calibrated." }, { heading: "Explain decisions", body: "Show the timestamp, model version, input features, uncertainty, and conditions that invalidate a signal." }, { heading: "Keep risk controls independent", body: "AI output must not bypass account authorization, proposal validation, stake limits, or an emergency stop." }] },
};

export default async function PublicPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const key = slug.join("/");
  if (key === "blog") {
    return <><PublicHeader /><main className="container public-content">
      <Link href="/" className="brand"><span className="brand-mark">A</span><span>anti logic<span style={{color:"var(--lime)"}}>.</span></span></Link>
      <div className="eyebrow public-eyebrow">Learn & research</div><h1 className="section-title">Research library</h1><p className="muted public-lead">Practical articles about binary contract mechanics, strategy evaluation, and responsible AI research.</p>
      <div className="article-grid">{articles.map((article) => <article key={article.slug} className="panel article-card"><span className="status">{article.category}</span><h2>{article.title}</h2><p className="muted">{article.summary}</p><Link href={"/blog/" + article.slug} className="article-link">Read article <ArrowRight size={14}/></Link></article>)}</div>
      <Link href="/" className="btn" style={{marginTop:24}}>Back home</Link>
    </main></>;
  }
  const data = pages[key];
  if (!data) notFound();

  return <><PublicHeader /><main className="container public-content">
    <Link href="/" className="brand"><span className="brand-mark">A</span><span>anti logic<span style={{color:"var(--lime)"}}>.</span></span></Link>
    <div className="eyebrow public-eyebrow">Anti Logic / Information</div>
    <h1 className="section-title">{data.title}</h1>
    <p className="muted public-lead">{data.description}</p>
    <div className="public-sections">{data.sections.map((section) => <section key={section.heading} className="panel card-pad"><h2>{section.heading}</h2><p className="muted">{section.body}</p></section>)}</div>
    {key.startsWith("legal/") && <div className="notice legal-notice"><ShieldCheck size={15}/> Draft content — review for the applicable business and jurisdictions before public release.</div>}{key === "legal/cookies" && <div style={{marginTop:16}}><CookiePreferencesButton /></div>}
    <Link href={key.startsWith("blog/") ? "/blog" : "/"} className="btn" style={{marginTop:24}}>{key.startsWith("blog/") ? "← Back to research" : "← Back home"}</Link>
  </main></>;
}
