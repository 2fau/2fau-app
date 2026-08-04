import { beforeEach, describe, expect, it } from "vitest";
import { installFakeChrome } from "../test/fake-chrome";
import {
  bestOffset,
  correctedNow,
  getTimeOffsetMs,
  parseServerMs,
  syncTime,
} from "./time-sync";

beforeEach(() => {
  installFakeChrome();
});

describe("parseServerMs", () => {
  it("reads a timeapi.io timestamp (no zone → UTC)", () => {
    expect(parseServerMs("2024-01-01T00:00:00.0000000")).toBe(1_704_067_200_000);
  });

  it("reads a worldtimeapi timestamp (+00:00, millis)", () => {
    expect(parseServerMs("2024-01-01T00:00:00.123456+00:00")).toBe(1_704_067_200_123);
  });

  it("reads a plain Z timestamp", () => {
    expect(parseServerMs("1970-01-01T00:00:01Z")).toBe(1_000);
  });

  it("rejects garbage", () => {
    expect(parseServerMs("not-a-time")).toBeNull();
    expect(parseServerMs("")).toBeNull();
  });
});

describe("bestOffset", () => {
  it("keeps the lowest round-trip", () => {
    expect(
      bestOffset([
        { rttMs: 300, offsetMs: 40 },
        { rttMs: 80, offsetMs: 51 },
        { rttMs: 500, offsetMs: 12 },
      ]),
    ).toEqual({ rttMs: 80, offsetMs: 51 });
  });

  it("rejects samples slower than the trust threshold", () => {
    expect(bestOffset([{ rttMs: 9_000, offsetMs: 100 }])).toBeNull();
  });

  it("is null with no samples", () => {
    expect(bestOffset([])).toBeNull();
  });
});

describe("syncTime", () => {
  /** A fetch stub answering the time API with `now + skewMs`, near-instantly. */
  function fetchAt(skewMs: number): typeof fetch {
    return (async () => {
      const server = new Date(Date.now() + skewMs).toISOString();
      return {
        ok: true,
        json: async () => ({ dateTime: server, utc_datetime: server }),
      } as Response;
    }) as unknown as typeof fetch;
  }

  it("stores an RTT-compensated offset ≈ the true skew", async () => {
    const rec = await syncTime(fetchAt(5_000));
    expect(rec).not.toBeNull();
    // Local reads bracket the (instant) fetch, so the estimate lands within a
    // few ms of the injected 5s skew.
    expect(Math.abs((rec?.offsetMs ?? 0) - 5_000)).toBeLessThan(100);
    expect(await getTimeOffsetMs()).toBe(rec?.offsetMs);
  });

  it("correctedNow applies the stored offset", async () => {
    await syncTime(fetchAt(-3_000));
    const corrected = await correctedNow();
    expect(Math.abs(corrected - (Date.now() - 3_000))).toBeLessThan(100);
  });

  it("returns null and leaves the offset untouched when unreachable", async () => {
    const failing = (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    expect(await syncTime(failing)).toBeNull();
    expect(await getTimeOffsetMs()).toBe(0);
  });
});
