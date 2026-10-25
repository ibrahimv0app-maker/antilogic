"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, ArrowUpRight, ChartCandlestick, CircleHelp, RefreshCw, Search, SlidersHorizontal, WifiOff } from "lucide-react";

const symbols = [
  { symbol: "R_100", name: "Volatility 100 Index", category: "Synthetic" },
  { symbol: "R_50", name: "Volatility 50 Index", category: "Synthetic" },
  { symbol: "R_25", name: "Volatility 25 Index", category: "Synthetic" },
  { symbol: "R_10", name: "Volatility 10 Index", category: "Synthetic" },
];

const points = "0,135 24,120 46,130 70,96 95,108 120,88 145,106 168,73 192,89 216,67 240,83 265,99 289,62 313,72 338,46 362,60 388,38 412,56 438,31 462,51 488,42 512,63 536,30 560,44 584,24 609,38 632,48 656,18 680,31 705,13 729,34 752,21 776,27 800,12";

export function MarketWorkspace() {
  const [symbol, setSymbol] = useState("R_100");
  const [timeframe, setTimeframe] = useState("1m");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(["R_100", "R_50"]);
  const [enabledIndicators, setEnabledIndicators] = useState<string[]>(["Moving average"]);

  const selected = symbols.find((item) => item.symbol === symbol) || symbols[0];
  const results = symbols.filter((item) => (item.symbol + " " + item.name).toLowerCase().includes(query.toLowerCase()));

  function toggleFavorite(value: string) {
    setFavorites((old) => old.includes(value) ? old.filter((item) => item !== value) : [...old, value]);
  }

  function toggleIndicator(value: string) {
    setEnabledIndicators((old) => old.includes(value) ? old.filter((item) => item !== value) : [...old, value]);
  }

  return <div className="market-layout">
    <aside className="panel market-watchlist">
      <div className="card-heading"><h2>Market watch</h2><span className="status off"><WifiOff size={10}/> OFFLINE</span></div>
      <label className="market-search"><Search size={14}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search symbols…" aria-label="Search markets"/></label>
      <div className="market-list">
        {results.map((item) => <button type="button" key={item.symbol} className={"market-item " + (item.symbol === symbol ? "selected" : "")} onClick={() => setSymbol(item.symbol)}>
          <span className="market-item-symbol">{item.symbol}<small>{item.category}</small></span><span className="market-item-actions"><span className="market-offline-dot" title="No data source connected"/><span className="star-button" role="button" tabIndex={0} aria-label={(favorites.includes(item.symbol) ? "Remove " : "Add ") + item.symbol + " favorite"} onClick={(event) => { event.stopPropagation(); toggleFavorite(item.symbol); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); toggleFavorite(item.symbol); } }}>{favorites.includes(item.symbol) ? "★" : "☆"}</span></span>
        </button>)}
      </div>
      <div className="field-hint" style={{marginTop:14}}>Symbols are examples only. Actual availability will be discovered through an authorized API connection.</div>
      <Link href="/app/account/deriv" className="btn" style={{width:"100%",marginTop:14}}>Connect Deriv <ArrowUpRight size={13}/></Link>
    </aside>
    <section className="market-main">
      <div className="panel market-chart-panel">
        <div className="market-chart-header">
          <div><div className="market-symbol-heading"><h2>{selected.symbol}</h2><span className="status">{selected.category}</span></div><p className="muted">{selected.name}</p></div>
          <div className="market-actions"><span className="status off"><WifiOff size={11}/> No live feed</span><button className="icon-action" disabled title="Connect a data source first" aria-label="Refresh market"><RefreshCw size={14}/></button></div>
        </div>
        <div className="market-tools"><div className="segmented-tabs" role="group" aria-label="Chart time frame">{["1m","5m","15m","1h"].map((item)=><button key={item} className={timeframe === item ? "selected" : ""} onClick={() => setTimeframe(item)}>{item}</button>)}</div><button className="btn" onClick={() => toggleIndicator("Moving average")}><SlidersHorizontal size={13}/> Indicators</button></div>
        <div className="chart-disclaimer"><CircleHelp size={14}/> Schematic illustration only — this is not live or historical market data.</div>
        <div className="chart-drawing" role="img" aria-label="Decorative schematic line chart, not market data">
          <div className="chart-y-labels"><span>Illustration</span><span>Not live</span><span>No prices</span><span>No data</span></div>
          <svg viewBox="0 0 800 190" preserveAspectRatio="none"><defs><linearGradient id="marketArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c6f36a" stopOpacity=".18"/><stop offset="1" stopColor="#c6f36a" stopOpacity="0"/></linearGradient></defs>{[25,65,105,145,185].map((y)=><line key={y} x1="0" y1={y} x2="800" y2={y} stroke="currentColor" strokeOpacity=".09" strokeDasharray="3 6"/>)}<polygon points={"0,190 " + points + " 800,190"} fill="url(#marketArea)"/><polyline points={points} fill="none" stroke="#c6f36a" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"/>{enabledIndicators.includes("Moving average") && <polyline points="0,150 35,144 70,131 105,121 140,113 175,105 210,98 245,90 280,82 315,75 350,69 385,65 420,61 455,56 490,52 525,48 560,44 595,40 630,36 665,32 700,29 735,25 770,22 800,20" fill="none" stroke="#72d9d2" strokeWidth="1.8" strokeDasharray="5 5"/>}</svg>
          <div className="chart-x-labels"><span>Illustrative</span><span>Timeframe: {timeframe}</span><span>Not a price feed</span></div>
        </div>
        <div className="indicator-toolbar"><span className="field-hint">Overlay controls (visual only until a data source connects):</span>{["Moving average","RSI","MACD"].map((indicator)=><button key={indicator} className={"indicator-chip " + (enabledIndicators.includes(indicator) ? "active" : "")} onClick={() => toggleIndicator(indicator)}>{indicator}</button>)}</div>
      </div>
      <div className="market-bottom-grid">
        <div className="panel card-pad"><div className="card-heading"><h2>Market data state</h2><Activity size={16} color="var(--lime)"/></div><div className="list-row"><span className="muted">Selected symbol</span><strong>{selected.symbol}</strong></div><div className="list-row"><span className="muted">Provider connection</span><span className="status off">Not connected</span></div><div className="list-row"><span className="muted">Data freshness</span><span className="status">Unavailable</span></div><div className="list-row"><span className="muted">Chart source</span><span className="status">Illustration</span></div></div>
        <div className="panel card-pad"><div className="card-heading"><h2>Watchlist</h2><ChartCandlestick size={16} color="var(--lime)"/></div>{favorites.length ? favorites.map((value)=><div className="list-row" key={value}><span>{value}</span><button className="btn" onClick={() => setSymbol(value)}>Open</button></div>) : <div className="empty-note">Mark a symbol as a favorite to add it to your watchlist.</div>}<p className="field-hint" style={{marginTop:12}}>The watchlist is a local UI preference, not a provider subscription.</p></div>
      </div>
    </section>
  </div>;
}
