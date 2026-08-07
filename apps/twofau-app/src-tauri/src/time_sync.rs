//! Network time correction, so codes stay right even when the machine clock is
//! wrong. We fetch a trusted UTC time over HTTPS and store the *offset*
//! (trusted − local), not the fetched instant — an instant goes stale the
//! moment we read it, an offset keeps applying to the live local clock.
//!
//! Drift from network latency is removed the way NTP does it: bracket each
//! request with local reads (t0, t1), assume the server timestamped near the
//! midpoint, and take offset = server − (t0 + t1)/2. Several samples are taken
//! and the one with the smallest round-trip (least uncertainty) wins.

use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

/// How many samples per sync pass; the lowest-RTT one is kept.
const SAMPLES: usize = 4;
/// Samples slower than this are too uncertain to trust.
const MAX_RTT_MS: i64 = 5_000;
/// Per-request network timeout.
const HTTP_TIMEOUT: Duration = Duration::from_secs(5);
/// How often the background thread re-syncs.
pub const REFRESH: Duration = Duration::from_secs(30 * 60);

/// A trusted-time source: a URL and the JSON field holding an ISO-8601 UTC time.
struct Source {
    url: &'static str,
    field: &'static str,
}

/// timeapi.io first (millisecond `dateTime`, no zone suffix → UTC), then
/// worldtimeapi.org (`utc_datetime`, `+00:00` suffix) as a fallback.
const SOURCES: &[Source] = &[
    Source {
        url: "https://timeapi.io/api/time/current/zone?timeZone=UTC",
        field: "dateTime",
    },
    Source {
        url: "https://worldtimeapi.org/api/timezone/Etc/UTC",
        field: "utc_datetime",
    },
];

/// Holds the current clock offset and persists it so a restart (or an offline
/// launch) starts from the last known good correction instead of zero.
pub struct TimeSync {
    offset_ms: Mutex<i64>,
    path: PathBuf,
}

impl TimeSync {
    pub fn new(path: PathBuf) -> TimeSync {
        let offset_ms = std::fs::read_to_string(&path)
            .ok()
            .and_then(|s| s.trim().parse::<i64>().ok())
            .unwrap_or(0);
        TimeSync {
            offset_ms: Mutex::new(offset_ms),
            path,
        }
    }

    /// Milliseconds to add to the local clock to get trusted time.
    pub fn offset_ms(&self) -> i64 {
        *self.offset_ms.lock().expect("time offset mutex")
    }

    fn store(&self, value: i64) {
        *self.offset_ms.lock().expect("time offset mutex") = value;
        let _ = std::fs::write(&self.path, value.to_string());
    }

    /// One sync pass: sample the sources a few times and keep the lowest-RTT
    /// offset. Returns the new offset, or an error if nothing was reachable.
    pub fn sync_once(&self) -> Result<i64, String> {
        let agent = ureq::AgentBuilder::new()
            .timeout_connect(HTTP_TIMEOUT)
            .timeout_read(HTTP_TIMEOUT)
            .build();

        let mut best: Option<Sample> = None;
        for _ in 0..SAMPLES {
            if let Some(s) = sample_any(&agent) {
                if s.rtt_ms <= MAX_RTT_MS && best.as_ref().map_or(true, |b| s.rtt_ms < b.rtt_ms) {
                    best = Some(s);
                }
            }
        }
        match best {
            Some(s) => {
                self.store(s.offset_ms);
                Ok(s.offset_ms)
            }
            None => Err("no trusted time source was reachable".into()),
        }
    }
}

/// One RTT-compensated measurement.
struct Sample {
    rtt_ms: i64,
    offset_ms: i64,
}

fn local_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

/// Try each source in order until one yields a usable sample.
fn sample_any(agent: &ureq::Agent) -> Option<Sample> {
    SOURCES.iter().find_map(|src| sample(agent, src))
}

fn sample(agent: &ureq::Agent, src: &Source) -> Option<Sample> {
    let t0 = local_ms();
    let resp = agent.get(src.url).call().ok()?;
    let json: serde_json::Value = resp.into_json().ok()?;
    let t1 = local_ms();
    let server = parse_iso_utc_ms(json.get(src.field)?.as_str()?)?;
    Some(Sample {
        rtt_ms: t1 - t0,
        offset_ms: server - (t0 + t1) / 2,
    })
}

/// Parse an ISO-8601 UTC timestamp ("YYYY-MM-DDTHH:MM:SS[.fff][Z|+hh:mm]") to
/// epoch milliseconds. We always request UTC, so any zone suffix is dropped.
/// Dependency-free so we don't pull in a date crate for one field.
pub fn parse_iso_utc_ms(s: &str) -> Option<i64> {
    let (date, time_zone) = s.split_once('T')?;
    let mut d = date.split('-');
    let year: i64 = d.next()?.parse().ok()?;
    let month: i64 = d.next()?.parse().ok()?;
    let day: i64 = d.next()?.parse().ok()?;

    // Drop a trailing zone marker ('Z' or the '+' of an offset). A '-' can only
    // start a negative offset, which never occurs for the UTC we ask for.
    let time = match time_zone.find(['Z', '+']) {
        Some(p) => &time_zone[..p],
        None => time_zone,
    };
    let mut t = time.split(':');
    let hour: i64 = t.next()?.parse().ok()?;
    let minute: i64 = t.next()?.parse().ok()?;
    let sec_frac = t.next()?;
    let (sec_str, frac_str) = sec_frac.split_once('.').unwrap_or((sec_frac, ""));
    let second: i64 = sec_str.parse().ok()?;

    // First three fractional digits are milliseconds; pad if fewer.
    let mut millis_str: String = frac_str.chars().take(3).collect();
    while millis_str.len() < 3 {
        millis_str.push('0');
    }
    let millis: i64 = millis_str.parse().unwrap_or(0);

    let days = days_from_civil(year, month, day);
    Some((days * 86_400 + hour * 3_600 + minute * 60 + second) * 1_000 + millis)
}

/// Days since 1970-01-01 for a proleptic-Gregorian date (Howard Hinnant's
/// `days_from_civil`). Valid for any date; no leap-second handling (UTC APIs
/// don't expose them).
fn days_from_civil(y: i64, m: i64, d: i64) -> i64 {
    let y = if m <= 2 { y - 1 } else { y };
    let era = if y >= 0 { y } else { y - 399 } / 400;
    let yoe = y - era * 400; // [0, 399]
    let doy = (153 * (if m > 2 { m - 3 } else { m + 9 }) + 2) / 5 + d - 1; // [0, 365]
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy; // [0, 146096]
    era * 146_097 + doe - 719_468
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_timeapi_style_no_zone() {
        // 2024-01-01T00:00:00.000 UTC == 1704067200000 ms.
        assert_eq!(
            parse_iso_utc_ms("2024-01-01T00:00:00.0000000"),
            Some(1_704_067_200_000)
        );
    }

    #[test]
    fn parses_worldtimeapi_style_with_offset_and_millis() {
        // Same instant plus 123 ms, with a +00:00 zone suffix.
        assert_eq!(
            parse_iso_utc_ms("2024-01-01T00:00:00.123456+00:00"),
            Some(1_704_067_200_123)
        );
    }

    #[test]
    fn parses_without_fractional_seconds() {
        assert_eq!(parse_iso_utc_ms("1970-01-01T00:00:01Z"), Some(1_000));
    }

    #[test]
    fn rejects_garbage() {
        assert_eq!(parse_iso_utc_ms("not-a-time"), None);
        assert_eq!(parse_iso_utc_ms(""), None);
    }

    #[test]
    fn days_from_civil_matches_known_epochs() {
        assert_eq!(days_from_civil(1970, 1, 1), 0);
        assert_eq!(days_from_civil(1970, 1, 2), 1);
        assert_eq!(days_from_civil(2000, 3, 1), 11017);
        assert_eq!(days_from_civil(1969, 12, 31), -1);
    }
}
