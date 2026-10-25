export default function Loading() {
  return <main className="container loading-shell" aria-live="polite" aria-busy="true">
    <div className="loading-brand"><span className="brand-mark">A</span><span>anti logic<span style={{color:"var(--lime)"}}>.</span></span></div>
    <div className="loading-kicker">Loading workspace</div>
    <div className="loading-title" />
    <div className="loading-description" />
    <div className="loading-grid">{[0,1,2,3].map((item) => <div className="panel loading-card" key={item}><div className="loading-line short"/><div className="loading-line large"/><div className="loading-line"/></div>)}</div>
  </main>;
}
