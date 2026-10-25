"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, ChartCandlestick, CircleHelp, Clock3,
  RefreshCw, Search, SlidersHorizontal, Star, Wifi, WifiOff
} from "lucide-react";

const PUBLIC_WS_URL = "wss://api.derivws.com/trading/v1/options/ws/public";
const FALLBACK_SYMBOLS: MarketSymbol[] = [
  { symbol: "R_100", name: "Volatility 100 Index", category: "Synthetic" },
  { symbol: "R_50", name: "Volatility 50 Index", category: "Synthetic" },
  { symbol: "R_25", name: "Volatility 25 Index", category: "Synthetic" },
  { symbol: "R_10", name: "Volatility 10 Index", category: "Synthetic" },
];
const TIMEFRAMES = [
  { label: "1m", seconds: 60 },
  { label: "5m", seconds: 300 },
  { label: "15m", seconds: 900 },
  { label: "1h", seconds: 3600 },
] as const;

type MarketSymbol = { symbol: string; name: string; category: string };
type Candle = { epoch: number; open: number; high: number; low: number; close: number };
type PricePoint = { epoch: number; quote: number };
type ConnectionState = "connecting" | "connected" | "reconnecting" | "offline" | "error";

function normalizeCandle(value: Record<string, unknown>): Candle | null {
  const epoch = Number(value.epoch);
  const open = Number(value.open);
  const high = Number(value.high);
  const low = Number(value.low);
  const close = Number(value.close);
  if (![epoch, open, high, low, close].every(Number.isFinite) || epoch <= 0 || [open, high, low, close].some((n) => n <= 0)) return null;
  return { epoch, open, high, low, close };
}

function describeSymbol(item: Record<string, unknown>): MarketSymbol | null {
  const symbol = typeof item.symbol === "string" ? item.symbol : "";
  if (!symbol || !/^[A-Za-z0-9_]{2,30}$/.test(symbol)) return null;
  const name = typeof item.display_name === "string" ? item.display_name : symbol;
  const category = typeof item.market_display_name === "string"
    ? item.market_display_name
    : typeof item.market === "string" ? item.market : "Market";
  return { symbol, name, category };
}

function formatPrice(value: number, digits = 5) {
  return value.toLocaleString(undefined, { maximumFractionDigits: Math.min(8, Math.max(2, digits)), minimumFractionDigits: 0 });
}

function chartY(value: number, minimum: number, range: number): number {
  return 175 - ((value - minimum) / range) * 150;
}


function formatCandleTime(epoch: number, timeframe: number) {
  const date = new Date(epoch * 1000);
  return date.toLocaleTimeString([], timeframe >= 3600 ? { hour: "2-digit", minute: "2-digit" } : { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function MarketWorkspace() {
  const [symbol, setSymbol] = useState("R_100");
  const [timeframeSeconds, setTimeframeSeconds] = useState<number>(60);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(["R_100", "R_50"]);
  const [enabledIndicators, setEnabledIndicators] = useState<string[]>(["Moving average"]);
  const [symbols, setSymbols] = useState<MarketSymbol[]>(FALLBACK_SYMBOLS);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [liveTicks, setLiveTicks] = useState<PricePoint[]>([]);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [connectionError, setConnectionError] = useState("");
  const [lastTickAt, setLastTickAt] = useState<number | null>(null);
  const [pipSize, setPipSize] = useState(5);
  const [lastQuote, setLastQuote] = useState<number | null>(null);
  const [recentRetries, setRecentRetries] = useState(0);
  const [refreshGeneration, setRefreshGeneration] = useState(0);

  const selected = symbols.find((item) => item.symbol === symbol) || FALLBACK_SYMBOLS.find((item) => item.symbol === symbol) || { symbol, name: symbol, category: "Market" };
  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    return symbols.filter((item) => (!text || (item.symbol + " " + item.name + " " + item.category).toLowerCase().includes(text)));
  }, [symbols, query]);
  const activeTimeframe = TIMEFRAMES.find((item) => item.seconds === timeframeSeconds) || TIMEFRAMES[0];
  const latestCandle = candles.length ? candles[candles.length - 1] : null;
  const tickLinePoints = useMemo(() => {
    if (liveTicks.length < 2) return "";
    const quotes = liveTicks.map((tick) => tick.quote);
    const minimum = Math.min(...quotes);
    const maximum = Math.max(...quotes);
    const range = maximum - minimum || Math.max(Math.abs(maximum) * 0.0001, 0.000001);
    return liveTicks.map((tick, index) => {
      const x = (index / (liveTicks.length - 1)) * 800;
      const y = 175 - ((tick.quote - minimum) / range) * 150;
      return x.toFixed(2) + "," + y.toFixed(2);
    }).join(" ");
  }, [liveTicks]);
  const minimumPrice = candles.length ? Math.min(...candles.map((item) => item.low)) : 0;
  const maximumPrice = candles.length ? Math.max(...candles.map((item) => item.high)) : 1;
  const priceRange = maximumPrice - minimumPrice || Math.max(Math.abs(maximumPrice) * 0.0001, 0.000001);
  const candleWidth = candles.length ? Math.max(2, Math.min(8, 640 / candles.length)) : 4;
  const movingAveragePoints = enabledIndicators.includes("Moving average") ? candles.map((candle, index) => {
    if (index < 13) return null;
    const average = candles.slice(index - 13, index + 1).reduce((sum, item) => sum + item.close, 0) / 14;
    const x = ((index + 0.5) / candles.length) * 800;
    return x.toFixed(2) + "," + chartY(average, minimumPrice, priceRange).toFixed(2);
  }).filter((point): point is string => point !== null).join(" ") : "";
  const candleChange = candles.length > 1 ? candles[candles.length - 1].close - candles[candles.length - 2].close : null;
  const candleChangePercent = candles.length > 1 && candles[candles.length - 2].close !== 0
    ? (candleChange! / candles[candles.length - 2].close) * 100 : null;

  function toggleFavorite(value: string) {
    setFavorites((old) => {
      const next = old.includes(value) ? old.filter((item) => item !== value) : [...old, value];
      try { window.localStorage.setItem("anti-logic:market-favorites:v1", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function toggleIndicator(value: string) {
    setEnabledIndicators((old) => old.includes(value) ? old.filter((item) => item !== value) : [...old, value]);
  }

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("anti-logic:market-favorites:v1") || "null") as unknown;
      if (Array.isArray(saved)) setFavorites(saved.filter((item): item is string => typeof item === "string"));
    } catch {}
  }, []);

  useEffect(() => {
    let disposed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let reconnectAttempt = 0;
    const subscriptions = new Set<number>();
    let receivedMarketData = false;
    const activeReqId = 101;
    const historyReqId = 102;
    const tickReqId = 103;

    setCandles([]);
    setLiveTicks([]);
    setLastTickAt(null);
    setLastQuote(null);
    setConnectionError("");
    setConnection("connecting");

    function updateCandles(incoming: Candle[]) {
      if (disposed || incoming.length === 0) return;
      setCandles((current) => {
        const byEpoch = new Map<number, Candle>();
        for (const candle of current) byEpoch.set(candle.epoch, candle);
        for (const candle of incoming) byEpoch.set(candle.epoch, candle);
        return Array.from(byEpoch.values()).sort((a, b) => a.epoch - b.epoch).slice(-120);
      });
      const last = incoming[incoming.length - 1];
      setLastQuote(last.close);
      setLastTickAt(Date.now());
      setConnectionError("");
      receivedMarketData = true;
      reconnectAttempt = 0;
      setRecentRetries(0);
      setConnection("connected");
    }

    function updateFromLiveTick(epoch: number, quote: number) {
      const bucketEpoch = Math.floor(epoch / timeframeSeconds) * timeframeSeconds;
      setCandles((current) => {
        if (!current.length) return [{ epoch: bucketEpoch, open: quote, high: quote, low: quote, close: quote }];
        const last = current[current.length - 1];
        if (last.epoch === bucketEpoch) {
          const next = current.slice();
          next[next.length - 1] = {
            ...last,
            high: Math.max(last.high, quote),
            low: Math.min(last.low, quote),
            close: quote,
          };
          return next;
        }
        if (last.epoch < bucketEpoch) {
          return [...current, { epoch: bucketEpoch, open: quote, high: quote, low: quote, close: quote }].slice(-120);
        }
        return current;
      });
    }

    function handleMessage(event: MessageEvent<string>) {
      if (disposed) return;
      let message: Record<string, unknown>;
      try { message = JSON.parse(event.data) as Record<string, unknown>; }
      catch { setConnectionError("Received an unreadable response from the public market-data service."); return; }

      const errorObj = message.error && typeof message.error === "object" ? message.error as Record<string, unknown> : null;
      if (errorObj) {
        const text = typeof errorObj.message === "string" ? errorObj.message : "Market data request failed.";
        setConnectionError(text);
        if (Number(message.req_id) === activeReqId || Number(message.req_id) === historyReqId || Number(message.req_id) === tickReqId) {
          setConnection("error");
        }
        return;
      }

      const data = message.data && typeof message.data === "object" ? message.data as Record<string, unknown> : message;
      const msgType = typeof message.msg_type === "string" ? message.msg_type : typeof data.msg_type === "string" ? data.msg_type : "";

      const subscription = message.subscription && typeof message.subscription === "object" ? message.subscription as Record<string, unknown> : data.subscription && typeof data.subscription === "object" ? data.subscription as Record<string, unknown> : null;
      if (subscription && Number.isFinite(Number(subscription.id))) subscriptions.add(Number(subscription.id));

      const active = Array.isArray(data.active_symbols) ? data.active_symbols : Array.isArray(message.active_symbols) ? message.active_symbols : null;
      if (active) {
        const markets = active
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
          .map(describeSymbol)
          .filter((item): item is MarketSymbol => item !== null);
        if (markets.length && !disposed) {
          const bySymbol = new Map(markets.map((item) => [item.symbol, item]));
          const preferredOrder = FALLBACK_SYMBOLS.map((item) => item.symbol);
          const sorted = markets.sort((a, b) => {
            const ai = preferredOrder.indexOf(a.symbol);
            const bi = preferredOrder.indexOf(b.symbol);
            if (ai >= 0 && bi >= 0) return ai - bi;
            if (ai >= 0) return -1;
            if (bi >= 0) return 1;
            return a.name.localeCompare(b.name);
          });
          setSymbols(sorted);
          if (!bySymbol.has(symbol)) setSymbol(sorted[0].symbol);
        }
      }

      const candlesResponse = Array.isArray(data.candles) ? data.candles : Array.isArray(message.candles) ? message.candles : null;
      if (candlesResponse) {
        const parsed = candlesResponse
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
          .map(normalizeCandle)
          .filter((item): item is Candle => item !== null);
        updateCandles(parsed);
        if (Number(message.req_id) === historyReqId) setConnection("connected");
      }

      const ohlc = data.ohlc && typeof data.ohlc === "object" ? normalizeCandle(data.ohlc as Record<string, unknown>) : message.ohlc && typeof message.ohlc === "object" ? normalizeCandle(message.ohlc as Record<string, unknown>) : null;
      if (ohlc) {
        updateCandles([ohlc]);
        setConnection("connected");
      }

      const tick = data.tick && typeof data.tick === "object" ? data.tick as Record<string, unknown> : message.tick && typeof message.tick === "object" ? message.tick as Record<string, unknown> : null;
      if (tick) {
        const quote = Number(tick.quote);
        const epoch = Number(tick.epoch);
        if (Number.isFinite(quote) && Number.isFinite(epoch)) {
          setLastQuote(quote);
          updateFromLiveTick(epoch, quote);
          setConnectionError("");
          setLiveTicks((old) => {
            const next = [...old, { epoch, quote }].slice(-200);
            return next;
          });
          setLastTickAt(Date.now());
          setConnection("connected");
          receivedMarketData = true;
          reconnectAttempt = 0;
          setRecentRetries(0);
          if (Number.isFinite(Number(tick.pip_size))) setPipSize(Number(tick.pip_size));
        }
      }

      const echoed = message.echo_req && typeof message.echo_req === "object" ? message.echo_req as Record<string, unknown> : null;
      if (echoed && Number(echoed.req_id) === activeReqId && msgType === "active_symbols" && !receivedMarketData) setConnection("connecting");
    }

    function connect() {
      if (disposed) return;
      try {
        socket = new WebSocket(PUBLIC_WS_URL);
      } catch {
        setConnection("error");
        setConnectionError("Your browser could not create a public WebSocket connection.");
        return;
      }

      socket.onopen = () => {
        if (disposed || !socket) return;
        setConnection("connecting");
        setConnectionError("");
        socket.send(JSON.stringify({ active_symbols: "brief", req_id: activeReqId }));
        socket.send(JSON.stringify({
          ticks_history: symbol,
          end: "latest",
          count: 100,
          style: "candles",
          granularity: timeframeSeconds,
          subscribe: 1,
          req_id: historyReqId,
        }));
        // A tick stream gives a live quote even if the chart subscription is still warming up.
        socket.send(JSON.stringify({ ticks: symbol, subscribe: 1, req_id: tickReqId }));
      };

      socket.onmessage = handleMessage;
      socket.onerror = () => {
        if (disposed) return;
        setConnectionError("The public market-data connection reported an error. Attempting to reconnect.");
        try { socket?.close(); } catch {}
      };
      socket.onclose = () => {
        if (disposed) return;
        if (reconnectAttempt >= 5) {
          setConnection("offline");
          setConnectionError("Could not maintain the public feed after 5 reconnect attempts. You can refresh to try again.");
          return;
        }
        const wait = Math.min(10_000, 750 * (2 ** reconnectAttempt));
        reconnectAttempt += 1;
        setRecentRetries(reconnectAttempt);
        setConnection("reconnecting");
        reconnectTimer = setTimeout(connect, wait);
      };
    }

    connect();
    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      const current = socket;
      if (current && current.readyState === WebSocket.OPEN) {
        for (const id of subscriptions) {
          try { current.send(JSON.stringify({ forget: id })); } catch {}
        }
      }
      if (current && current.readyState < WebSocket.CLOSING) current.close(1000, "Market workspace changed");
    };
  }, [symbol, timeframeSeconds, refreshGeneration]);

  const statusCopy: Record<ConnectionState, string> = {
    connecting: "Connecting…",
    connected: "Live data connected",
    reconnecting: "Reconnecting…",
    offline: "Offline",
    error: "Feed error",
  };
  const statusIcon = connection === "connected" ? <Wifi size={11}/> : <WifiOff size={11}/>;

  return <div className="market-layout">
    <aside className="panel market-watchlist">
      <div className="card-heading"><h2>Market watch</h2><span className={"status " + (connection === "connected" ? "demo" : "off")}>{statusIcon} {connection === "connected" ? "LIVE" : connection === "connecting" || connection === "reconnecting" ? "WAITING" : "OFFLINE"}</span></div>
      <label className="market-search"><Search size={14}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search symbols…" aria-label="Search markets"/></label>
      <div className="market-list">
        {results.map((item) => <div key={item.symbol} className={"market-item " + (item.symbol === symbol ? "selected" : "")}>
          <button type="button" className="market-select" onClick={() => setSymbol(item.symbol)}><span className="market-item-symbol">{item.symbol}<small>{item.category}</small></span></button><span className="market-item-actions"><span className={"market-offline-dot " + (item.symbol === symbol && connection === "connected" ? "market-live-dot" : "")} title={item.symbol === symbol && connection === "connected" ? "Live subscription active" : "No live subscription for this symbol"}/><button type="button" className="star-button" aria-label={(favorites.includes(item.symbol) ? "Remove " : "Add ") + item.symbol + " favorite"} onClick={() => toggleFavorite(item.symbol)}><Star size={14} fill={favorites.includes(item.symbol) ? "currentColor" : "none"}/></button></span>
        </div>)}
        {results.length === 0 && <div className="empty-note">No symbols match your search.</div>}
      </div>
      <div className="field-hint" style={{marginTop:14}}>Symbols are discovered from the public API while connected. Only the selected symbol has an active subscription.</div>
      <Link href="/app/account/deriv" className="btn" style={{width:"100%",marginTop:14}}>Account connection <ArrowUpRight size={13}/></Link>
    </aside>

    <section className="market-main">
      <div className="panel market-chart-panel">
        <div className="market-chart-header">
          <div><div className="market-symbol-heading"><h2>{selected.symbol}</h2><span className="status">{selected.category}</span></div><p className="muted">{selected.name}</p>
            <div className="market-current-quote">{lastQuote === null ? <span className="muted">Waiting for first quote…</span> : <><strong>{formatPrice(lastQuote, pipSize)}</strong>{candleChange !== null && <span className={candleChange > 0 ? "positive" : candleChange < 0 ? "negative" : "muted"}>{candleChange > 0 ? "+" : ""}{formatPrice(candleChange, pipSize)}{candleChangePercent !== null ? " (" + (candleChangePercent > 0 ? "+" : "") + candleChangePercent.toFixed(3) + "%)" : ""}</span>}</>}</div>
          </div>
          <div className="market-actions"><span className={"status " + (connection === "connected" ? "demo" : "off")}>{statusIcon} {statusCopy[connection]}</span><button className="icon-action" onClick={() => setRefreshGeneration((generation) => generation + 1)} title="Restart market feed" aria-label="Restart market feed"><RefreshCw size={14}/></button></div>
        </div>
        <div className="market-tools"><div className="segmented-tabs" role="group" aria-label="Candle timeframe">{TIMEFRAMES.map((item)=><button key={item.label} className={timeframeSeconds === item.seconds ? "selected" : ""} onClick={() => setTimeframeSeconds(item.seconds)}>{item.label}</button>)}</div><button className="btn" onClick={() => toggleIndicator("Moving average")}><SlidersHorizontal size={13}/> {enabledIndicators.includes("Moving average") ? "Hide MA overlay" : "Show MA overlay"}</button></div>
        <div className={"chart-disclaimer " + (connection === "connected" ? "chart-live-note" : "")}><CircleHelp size={14}/>{connection === "connected" ? "Live public market data · Read-only feed · No account or trading actions are available here." : candles.length || liveTicks.length ? "Connection is " + statusCopy[connection].toLowerCase() + ". The chart shows the last received market data and may be stale." : "Waiting for the public feed. Chart data is not substituted with illustrative prices."}</div>
        <div className="chart-drawing" role="img" aria-label={candles.length ? "Real public market candle-close price chart" : "Market chart waiting for real data"}>
          {candles.length >= 2 ? <>
            <div className="chart-y-labels"><span>{formatPrice(maximumPrice, pipSize)}</span><span>{formatPrice((maximumPrice + minimumPrice) / 2, pipSize)}</span><span>{formatPrice(minimumPrice, pipSize)}</span></div>
            <svg viewBox="0 0 800 190" preserveAspectRatio="none" aria-label="Live market candlestick chart"><defs><clipPath id="candleClip"><rect x="0" y="0" width="800" height="190"/></clipPath></defs>{[25,65,105,145,185].map((y)=><line key={y} x1="0" y1={y} x2="800" y2={y} stroke="currentColor" strokeOpacity=".09" strokeDasharray="3 6"/>)}<g clipPath="url(#candleClip)">{candles.map((candle, index) => { const x = ((index + 0.5) / candles.length) * 800; const openY = chartY(candle.open, minimumPrice, priceRange); const closeY = chartY(candle.close, minimumPrice, priceRange); const highY = chartY(candle.high, minimumPrice, priceRange); const lowY = chartY(candle.low, minimumPrice, priceRange); const bullish = candle.close >= candle.open; const color = bullish ? "#72d9d2" : "#ff7e87"; return <g key={candle.epoch}><line x1={x} x2={x} y1={highY} y2={lowY} stroke={color} strokeWidth="1.1"/><rect x={x - candleWidth / 2} y={Math.min(openY, closeY)} width={candleWidth} height={Math.max(1.2, Math.abs(openY - closeY))} rx=".6" fill={color}/></g>; })}{movingAveragePoints && <polyline points={movingAveragePoints} fill="none" stroke="#c6f36a" strokeWidth="1.7" strokeDasharray="4 4" strokeLinecap="round"/>}</g></svg>
            <div className="chart-x-labels"><span>{formatCandleTime(candles[0].epoch, timeframeSeconds)}</span><span>{activeTimeframe.label} candles · {candles.length} shown</span><span>{latestCandle ? formatCandleTime(latestCandle.epoch, timeframeSeconds) : ""}</span></div>
          </> : liveTicks.length >= 2 ? <>
            <div className="chart-y-labels"><span>{formatPrice(Math.max(...liveTicks.map((item) => item.quote)), pipSize)}</span><span>{formatPrice((Math.max(...liveTicks.map((item) => item.quote)) + Math.min(...liveTicks.map((item) => item.quote))) / 2, pipSize)}</span><span>{formatPrice(Math.min(...liveTicks.map((item) => item.quote)), pipSize)}</span></div>
            <svg viewBox="0 0 800 190" preserveAspectRatio="none" aria-label="Live public market tick line chart"><defs><linearGradient id="tickArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c6f36a" stopOpacity=".16"/><stop offset="1" stopColor="#c6f36a" stopOpacity="0"/></linearGradient></defs>{[25,65,105,145,185].map((y)=><line key={y} x1="0" y1={y} x2="800" y2={y} stroke="currentColor" strokeOpacity=".09" strokeDasharray="3 6"/>)}<polygon points={"0,190 " + tickLinePoints + " 800,190"} fill="url(#tickArea)"/><polyline points={tickLinePoints} fill="none" stroke="#c6f36a" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/></svg>
            <div className="chart-x-labels"><span>{new Date(liveTicks[0].epoch * 1000).toLocaleTimeString()}</span><span>Live ticks · {liveTicks.length} quotes</span><span>{new Date(liveTicks[liveTicks.length - 1].epoch * 1000).toLocaleTimeString()}</span></div>
                    </> : <div className="chart-waiting"><div className="chart-waiting-icon">{connection === "connected" ? <Clock3 size={20}/> : <WifiOff size={20}/>}</div><strong>{connection === "connected" ? "Waiting for candle history" : connection === "error" || connection === "offline" ? "Market feed unavailable" : "Connecting to public market data"}</strong><span>{connectionError || (connection === "connected" ? "The connection is open. Waiting for candle history or additional live ticks." : "Anti Logic will not display a fake price chart while disconnected.")}</span>{recentRetries > 0 && <small>Reconnect attempt {recentRetries} of 5</small>}</div>}
        </div>
        <div className="indicator-toolbar"><span className="field-hint">Indicators are computed from received candle data only:</span>{["Moving average"].map((indicator)=><button key={indicator} className={"indicator-chip " + (enabledIndicators.includes(indicator) ? "active" : "")} onClick={() => toggleIndicator(indicator)}>{indicator}</button>)}</div>
      </div>
      <div className="market-bottom-grid">
        <div className="panel card-pad"><div className="card-heading"><h2>Market data state</h2><Activity size={16} color="var(--lime)"/></div><div className="list-row"><span className="muted">Selected symbol</span><strong>{selected.symbol}</strong></div><div className="list-row"><span className="muted">Provider connection</span><span className={"status " + (connection === "connected" ? "demo" : "off")}>{statusCopy[connection]}</span></div><div className="list-row"><span className="muted">Last update</span><span className="status">{lastTickAt ? new Date(lastTickAt).toLocaleTimeString() : "Unavailable"}</span></div><div className="list-row"><span className="muted">Data source</span><span className="status">Deriv public WS</span></div><div className="list-row"><span className="muted">Trading actions</span><span className="status off">Not available</span></div></div>
        <div className="panel card-pad"><div className="card-heading"><h2>Watchlist</h2><ChartCandlestick size={16} color="var(--lime)"/></div>{favorites.length ? favorites.map((value)=><div className="list-row" key={value}><span>{value}</span><button className="btn" onClick={() => setSymbol(value)}>Open</button></div>) : <div className="empty-note">Mark a symbol as a favorite to add it to your watchlist.</div>}<p className="field-hint" style={{marginTop:12}}>Favorites are stored in this browser. No market-data history is saved to the database.</p></div>
      </div>
    </section>
  </div>;
}
