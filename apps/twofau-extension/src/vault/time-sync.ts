//! Network time correction for the extension, mirroring the desktop's Rust
//! time sync. We fetch a trusted UTC time over HTTPS and store the *offset*
//! (trusted − local ms), which keeps applying to the live local clock, rather
//! than a fetched instant that goes stale immediately.
//!
//! Round-trip latency is removed NTP-style: bracket each request with local
//! reads (t0, t1), assume the server timestamped near the midpoint, and take
//! offset = server − (t0 + t1)/2. The lowest-RTT sample of a few wins.

const STORE_KEY = "timeOffset";

/** chrome.alarms enforces a 1-minute floor; time drifts slowly, so sync rarely. */
export const TIME_SYNC_ALARM = "2fau.timesync";
const TIME_SYNC_PERIOD_MINUTES = 6 * 60;

const SAMPLES = 4;
const MAX_RTT_MS = 5_000;

/** Trusted-time sources tried in order: a URL and the JSON field with an ISO
 * UTC time. timeapi.io has no zone suffix (→ UTC); worldtimeapi ends in +00:00. */
const SOURCES: ReadonlyArray<{ url: string; field: string }> = [
  { url: "https://timeapi.io/api/time/current/zone?timeZone=UTC", field: "dateTime" },
  { url: "https://worldtimeapi.org/api/timezone/Etc/UTC", field: "utc_datetime" },
];

export interface TimeOffsetRecord {
  /** Trusted − local, in ms; add to Date.now() for corrected time. */
  offsetMs: number;
  /** Round-trip of the winning sample (lower = more trustworthy). */
  rttMs: number;
  /** When this was measured (local ms). */
  syncedAt: number;
  /** Which source produced it. */
  source: string;
}

interface Sample {
  rttMs: number;
  offsetMs: number;
}

/** Parse an ISO-8601 UTC timestamp to epoch ms. timeapi.io omits the zone (we
 * requested UTC, so treat it as such); worldtimeapi carries `+00:00`. */
export function parseServerMs(iso: string): number | null {
  if (typeof iso !== "string" || iso.length === 0) return null;
  const hasZone = /([zZ])|([+-]\d\d:?\d\d)$/.test(iso);
  const ms = Date.parse(hasZone ? iso : `${iso}Z`);
  return Number.isNaN(ms) ? null : ms;
}

/** The lowest-RTT sample within the trust threshold, or null if none qualify. */
export function bestOffset(samples: Sample[]): Sample | null {
  let best: Sample | null = null;
  for (const s of samples) {
    if (s.rttMs <= MAX_RTT_MS && (best === null || s.rttMs < best.rttMs)) best = s;
  }
  return best;
}

/** One measurement against the first source that answers. */
async function sampleOnce(
  fetchFn: typeof fetch,
): Promise<(Sample & { source: string }) | null> {
  for (const src of SOURCES) {
    try {
      const t0 = Date.now();
      const res = await fetchFn(src.url, { cache: "no-store" });
      if (!res.ok) continue;
      const json = (await res.json()) as Record<string, unknown>;
      const t1 = Date.now();
      const server = parseServerMs(String(json[src.field]));
      if (server === null) continue;
      return { rttMs: t1 - t0, offsetMs: server - (t0 + t1) / 2, source: src.url };
    } catch {
      // try the next source
    }
  }
  return null;
}

/** Take a few samples, keep the best, persist it. Returns the record, or null
 * if no source was reachable (leaving any previous offset untouched). */
export async function syncTime(fetchFn: typeof fetch = fetch): Promise<TimeOffsetRecord | null> {
  const samples: Sample[] = [];
  let source = "";
  for (let i = 0; i < SAMPLES; i += 1) {
    const s = await sampleOnce(fetchFn);
    if (s) {
      samples.push({ rttMs: s.rttMs, offsetMs: s.offsetMs });
      source = s.source;
    }
  }
  const best = bestOffset(samples);
  if (!best) return null;
  const record: TimeOffsetRecord = {
    offsetMs: Math.round(best.offsetMs),
    rttMs: best.rttMs,
    syncedAt: Date.now(),
    source,
  };
  await chrome.storage.local.set({ [STORE_KEY]: record });
  return record;
}

/** The stored offset (0 if never synced). */
export async function getTimeOffsetMs(): Promise<number> {
  const got = await chrome.storage.local.get(STORE_KEY);
  const rec = got[STORE_KEY] as TimeOffsetRecord | undefined;
  return rec?.offsetMs ?? 0;
}

/** Local clock corrected by the stored offset — use wherever a code's time is
 * computed in the service worker. */
export async function correctedNow(): Promise<number> {
  return Date.now() + (await getTimeOffsetMs());
}

/** Arm the periodic time-sync alarm (idempotent). */
export function ensureTimeAlarm(): void {
  chrome.alarms.create(TIME_SYNC_ALARM, { periodInMinutes: TIME_SYNC_PERIOD_MINUTES });
}
