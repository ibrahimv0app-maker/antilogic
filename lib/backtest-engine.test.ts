import { describe, expect, it } from "vitest";
import { parsePriceCsv, runBinaryBacktest, type Candle } from "./backtest-engine";

function makeCandles(closes: number[]): Candle[] {
  return closes.map((close, index) => ({
    timestamp: Date.UTC(2026, 0, 1, 0, index),
    close,
  }));
}

const alwaysMatch = [{ indicator: "RSI" as const, operator: "above" as const, threshold: -1 }];

describe("parsePriceCsv", () => {
  it("parses timestamp and close columns", () => {
    const rows = Array.from({ length: 20 }, (_, index) =>
      new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString() + "," + (100 + index),
    );
    const candles = parsePriceCsv(["timestamp,close", ...rows].join("\n"));
    expect(candles).toHaveLength(20);
    expect(candles[0].close).toBe(100);
    expect(candles[19].close).toBe(119);
    expect(candles[19].timestamp).toBeGreaterThan(candles[0].timestamp);
  });

  it("normalizes epoch seconds and rejects duplicate timestamps", () => {
    const rows = Array.from({ length: 20 }, (_, index) => (1760000000 + index) + "," + (100 + index));
    const parsed = parsePriceCsv(["timestamp,close", ...rows].join("\n"));
    expect(parsed[0].timestamp).toBe(1760000000 * 1000);

    rows[19] = rows[18];
    expect(() => parsePriceCsv(["timestamp,close", ...rows].join("\n"))).toThrow(/strictly ascending/);
  });

  it("rejects missing required headers", () => {
    const rows = Array.from({ length: 20 }, (_, index) => index + ",123");
    expect(() => parsePriceCsv(["date,open", ...rows].join("\n"))).toThrow(/needs a timestamp/);
  });
});

describe("runBinaryBacktest", () => {
  it("calculates payout-aware results for a rising series", () => {
    const result = runBinaryBacktest(makeCandles(Array.from({ length: 25 }, (_, index) => 100 + index)), {
      direction: "CALL",
      durationBars: 1,
      stake: 1,
      netPayoutMultiple: 0.8,
      tieHandling: "loss",
      rules: alwaysMatch,
    });

    expect(result.totalTrades).toBe(5);
    expect(result.wins).toBe(5);
    expect(result.losses).toBe(0);
    expect(result.winRate).toBe(100);
    expect(result.netProfitLoss).toBeCloseTo(4);
    expect(result.totalStaked).toBe(5);
    expect(result.roiPercent).toBeCloseTo(80);
    expect(result.maxConsecutiveLosses).toBe(0);
    const candles = makeCandles(Array.from({ length: 25 }, (_, index) => 100 + index));
    expect(result.trades[0].entryTimestamp).toBe(candles[15].timestamp);
    expect(result.trades[0].exitTimestamp).toBe(candles[16].timestamp);
  });

  it("treats ties as break-even when configured", () => {
    const result = runBinaryBacktest(makeCandles(Array.from({ length: 20 }, () => 100)), {
      direction: "CALL",
      durationBars: 1,
      stake: 1,
      netPayoutMultiple: 0.8,
      tieHandling: "break_even",
      rules: alwaysMatch,
    });

    expect(result.totalTrades).toBe(2);
    expect(result.draws).toBe(2);
    expect(result.losses).toBe(0);
    expect(result.winRate).toBeNull();
    expect(result.netProfitLoss).toBe(0);
  });

  it("keeps ties separate when ties are charged as losses", () => {
    const result = runBinaryBacktest(makeCandles(Array.from({ length: 20 }, () => 100)), {
      direction: "CALL",
      durationBars: 1,
      stake: 2,
      netPayoutMultiple: 0.8,
      tieHandling: "loss",
      rules: alwaysMatch,
    });

    expect(result.totalTrades).toBe(2);
    expect(result.wins).toBe(0);
    expect(result.losses).toBe(0);
    expect(result.draws).toBe(2);
    expect(result.winRate).toBe(0);
    expect(result.netProfitLoss).toBe(-4);
    expect(result.maxConsecutiveLosses).toBe(2);
  });

  it("retains the latest 5,000 trade details for large simulations", () => {
    const candles = makeCandles(Array.from({ length: 10_100 }, (_, index) => 100 + index));
    const result = runBinaryBacktest(candles, {
      direction: "CALL",
      durationBars: 1,
      stake: 1,
      netPayoutMultiple: 0.8,
      tieHandling: "loss",
      rules: alwaysMatch,
    });

    expect(result.totalTrades).toBe(5_042);
    expect(result.trades).toHaveLength(5_000);
    expect(result.tradesTruncated).toBe(true);
    expect(result.trades[0].entryTimestamp).toBe(candles[99].timestamp);
    expect(result.trades[result.trades.length - 1].entryTimestamp).toBe(candles[10_097].timestamp);
  });

  it("rejects invalid payout assumptions", () => {
    expect(() => runBinaryBacktest(makeCandles(Array.from({ length: 20 }, (_, index) => 100 + index)), {
      direction: "CALL",
      durationBars: 1,
      stake: 1,
      netPayoutMultiple: 0,
      tieHandling: "loss",
      rules: alwaysMatch,
    })).toThrow(/payout assumption/);
  });
});
