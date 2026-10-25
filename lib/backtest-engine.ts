export type Candle = {
  timestamp: number;
  close: number;
};

export type BacktestRule = {
  indicator: "RSI" | "Moving Average" | "Momentum";
  operator: "above" | "below";
  threshold: number;
};

export type BacktestOptions = {
  direction: "CALL" | "PUT";
  durationBars: number;
  stake: number;
  netPayoutMultiple: number;
  tieHandling: "loss" | "break_even";
  rules: BacktestRule[];
};

export type BacktestTrade = {
  entryTimestamp: number;
  exitTimestamp: number;
  entryPrice: number;
  exitPrice: number;
  direction: "CALL" | "PUT";
  result: "win" | "loss" | "draw";
  netProfitLoss: number;
};

export type BacktestResult = {
  candleCount: number;
  totalTrades: number;
  wins: number;
  losses: number;
  draws: number;
  evaluatedTrades: number;
  winRate: number | null;
  netProfitLoss: number;
  totalStaked: number;
  roiPercent: number | null;
  expectedProfitPerTrade: number | null;
  maxConsecutiveLosses: number;
  maxDrawdown: number;
  trades: BacktestTrade[];
  tradesTruncated: boolean;
  assumptions: string[];
};

const MAX_CSV_CHARACTERS = 20 * 1024 * 1024;
const MAX_ROWS = 100_000;
const MAX_RESULT_TRADES = 5_000;

function parseCsvRows(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, "");
  if (source.length > MAX_CSV_CHARACTERS) {
    throw new Error("CSV file exceeds 20 MB. Split the data into smaller files and test each period separately.");
  }

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(field.trim());
      field = "";
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      if (rows.length > MAX_ROWS + 1) {
        throw new Error("CSV contains more than 100,000 rows. Split it into smaller files.");
      }
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(field.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function parseTimestamp(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return Number.NaN;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    const numeric = Number(trimmed);
    // Normalize epoch seconds to milliseconds; leave small numeric sequence IDs untouched.
    return numeric >= 1_000_000_000 && numeric < 100_000_000_000 ? numeric * 1000 : numeric;
  }
  return Date.parse(trimmed);
}

export function parsePriceCsv(text: string): Candle[] {
  const rows = parseCsvRows(text);
  if (rows.length < 21) {
    throw new Error("Provide a header row and at least 20 price rows for indicator warm-up.");
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase().replace(/[\s-]+/g, "_"));
  const timeIndex = headers.findIndex((header) => ["timestamp", "time", "date", "datetime", "epoch"].includes(header));
  const closeIndex = headers.findIndex((header) => ["close", "price", "close_price"].includes(header));

  if (timeIndex < 0 || closeIndex < 0) {
    throw new Error("CSV needs a timestamp/time/date column and a close/price column.");
  }

  const candles: Candle[] = [];
  let previousTime = Number.NEGATIVE_INFINITY;

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (row.length <= Math.max(timeIndex, closeIndex)) {
      throw new Error("Row " + (rowIndex + 1) + " is missing a timestamp or close value.");
    }

    const timestamp = parseTimestamp(row[timeIndex]);
    const close = Number(row[closeIndex]);

    if (!Number.isFinite(timestamp)) {
      throw new Error("Row " + (rowIndex + 1) + " has an invalid timestamp.");
    }
    if (!Number.isFinite(close) || close <= 0) {
      throw new Error("Row " + (rowIndex + 1) + " must have a positive numeric close price.");
    }
    if (timestamp <= previousTime) {
      throw new Error("Timestamps must be strictly ascending with no duplicates. Sort the CSV oldest to newest.");
    }

    previousTime = timestamp;
    candles.push({ timestamp, close });
  }

  if (candles.length < 20) throw new Error("At least 20 valid rows are needed.");
  return candles;
}

function simpleMovingAverage(closes: number[], index: number, period = 14): number | null {
  if (index + 1 < period) return null;
  let sum = 0;
  for (let i = index - period + 1; i <= index; i += 1) sum += closes[i];
  return sum / period;
}

function calculateRsi(closes: number[], index: number, period = 14): number | null {
  if (index < period) return null;
  let gains = 0;
  let losses = 0;
  for (let i = index - period + 1; i <= index; i += 1) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else if (change < 0) losses += Math.abs(change);
  }
  if (gains === 0 && losses === 0) return 50;
  if (losses === 0) return 100;
  if (gains === 0) return 0;
  const avgGain = gains / period;
  const avgLoss = losses / period;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function indicatorValue(rule: BacktestRule, closes: number[], index: number): number | null {
  if (rule.indicator === "RSI") return calculateRsi(closes, index);
  if (rule.indicator === "Moving Average") {
    const average = simpleMovingAverage(closes, index);
    return average === null ? null : closes[index] - average;
  }
  if (index < 5) return null;
  return ((closes[index] / closes[index - 5]) - 1) * 100;
}

function rulePasses(rule: BacktestRule, closes: number[], index: number): boolean {
  const value = indicatorValue(rule, closes, index);
  if (value === null || !Number.isFinite(value)) return false;
  return rule.operator === "above" ? value > rule.threshold : value < rule.threshold;
}

export function runBinaryBacktest(candles: Candle[], options: BacktestOptions): BacktestResult {
  if (candles.length < 20) throw new Error("At least 20 valid candles are required.");
  if (!options.rules.length) throw new Error("Add at least one strategy condition before running a backtest.");
  if (!Number.isInteger(options.durationBars) || options.durationBars < 1 || options.durationBars > 10_000) throw new Error("Expiry bars must be an integer between 1 and 10,000.");
  if (!Number.isFinite(options.stake) || options.stake <= 0) throw new Error("Stake must be a positive number.");
  if (!Number.isFinite(options.netPayoutMultiple) || options.netPayoutMultiple <= 0 || options.netPayoutMultiple > 10) throw new Error("Net payout assumption must be above 0 and no more than 10 times the stake.");
  for (const rule of options.rules) {
    if (!Number.isFinite(rule.threshold)) throw new Error("All strategy thresholds must be valid numbers.");
  }

  const closes = candles.map((candle) => candle.close);
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let netProfitLoss = 0;
  let totalStaked = 0;
  let currentLossStreak = 0;
  let maxConsecutiveLosses = 0;
  let equity = 0;
  let peakEquity = 0;
  let maxDrawdown = 0;
  const trades: BacktestTrade[] = [];
  let tradeCount = 0;
  let nextEligibleIndex = 14;

  for (let index = 14; index + 1 + options.durationBars < candles.length; index += 1) {
    if (index < nextEligibleIndex) continue;
    if (!options.rules.every((rule) => rulePasses(rule, closes, index))) continue;

    // Signal is evaluated on the current candle close. Use the next candle close as a
    // simplified fill so the signal candle close is not also treated as an executable price.
    const entryIndex = index + 1;
    const entryPrice = closes[entryIndex];
    const exitIndex = entryIndex + options.durationBars;
    nextEligibleIndex = exitIndex;
    const exitPrice = closes[exitIndex];
    const higher = exitPrice > entryPrice;
    const lower = exitPrice < entryPrice;
    const draw = !higher && !lower;
    const won = !draw && ((options.direction === "CALL" && higher) || (options.direction === "PUT" && lower));

    let result: BacktestTrade["result"];
    let pnl: number;
    if (draw) {
      draws += 1;
      result = "draw";
      pnl = options.tieHandling === "loss" ? -options.stake : 0;
      if (options.tieHandling === "loss") {
        currentLossStreak += 1;
      } else {
        currentLossStreak = 0;
      }
    } else if (won) {
      wins += 1;
      result = "win";
      pnl = options.stake * options.netPayoutMultiple;
      currentLossStreak = 0;
    } else {
      losses += 1;
      result = "loss";
      pnl = -options.stake;
      currentLossStreak += 1;
    }

    maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak);
    netProfitLoss += pnl;
    totalStaked += options.stake;
    equity += pnl;
    peakEquity = Math.max(peakEquity, equity);
    maxDrawdown = Math.max(maxDrawdown, peakEquity - equity);
    tradeCount += 1;

    const recordedTrade: BacktestTrade = {
      entryTimestamp: candles[entryIndex].timestamp,
      exitTimestamp: candles[exitIndex].timestamp,
      entryPrice,
      exitPrice,
      direction: options.direction,
      result,
      netProfitLoss: pnl,
    };
    if (trades.length < MAX_RESULT_TRADES) {
      trades.push(recordedTrade);
    } else {
      // Keep a fixed-size circular buffer so large CSVs retain the latest detail rows.
      trades[tradeCount % MAX_RESULT_TRADES] = recordedTrade;
    }
  }

  const evaluatedTrades = options.tieHandling === "break_even" ? wins + losses : tradeCount;
  const retainedTrades = tradeCount > MAX_RESULT_TRADES
    ? [...trades.slice(tradeCount % MAX_RESULT_TRADES), ...trades.slice(0, tradeCount % MAX_RESULT_TRADES)]
    : trades;
  return {
    candleCount: candles.length,
    totalTrades: tradeCount,
    wins,
    losses,
    draws,
    evaluatedTrades,
    winRate: evaluatedTrades ? (wins / evaluatedTrades) * 100 : null,
    netProfitLoss,
    totalStaked,
    roiPercent: totalStaked ? (netProfitLoss / totalStaked) * 100 : null,
    expectedProfitPerTrade: tradeCount ? netProfitLoss / tradeCount : null,
    maxConsecutiveLosses,
    maxDrawdown,
    trades: retainedTrades,
    tradesTruncated: tradeCount > MAX_RESULT_TRADES,
    assumptions: [
      "Uses only the user-selected CSV in this browser; the file is not uploaded or stored by Anti Logic.",
      "Signals are evaluated at candle index i, the simplified simulated entry is the next candle close i+1, and expiry is checked after the selected number of additional bars.",
      "Only one hypothetical position is open at a time; the next entry is considered after the previous simulated expiry.",
      "RSI uses a simple 14-change average, moving-average spread uses close minus the 14-bar simple moving average, and momentum is the 5-bar percentage change.",
      "A win earns the configured net payout multiple; a loss loses the full stake.",
      options.tieHandling === "loss" ? "Equal entry and expiry prices count as a draw category, are charged as a full-stake loss in net P/L, and extend the loss streak." : "Equal entry and expiry prices are treated as break-even and excluded from win-rate denominator.",
      "Ignores execution latency, proposal changes, spread, fees, payout changes, and other contract-specific rules.",
      "This is a simplified research simulation, not a representation of actual Deriv contract execution.",
    ],
  };
}
