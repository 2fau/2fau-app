/** Human-readable browser identity, sent to the desktop when pairing so the
 * "Paired browsers" list can show "Google Chrome 128 · macOS" instead of an
 * opaque extension origin. */
export interface BrowserIdentity {
  name: string;
  version: string;
  os: string;
}

interface UaBrand {
  brand: string;
  version: string;
}
interface UaDataLike {
  brands?: UaBrand[];
  platform?: string;
}

function osFromUa(ua: string): string {
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
  if (/CrOS/i.test(ua)) return "ChromeOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Linux/i.test(ua)) return "Linux";
  return "";
}

/** Parse name + major version from a UA string. Order matters: Edge and Opera
 * both also carry "Chrome/…", so they must be matched first. */
function parseUa(ua: string): BrowserIdentity {
  const os = osFromUa(ua);
  const patterns: [string, RegExp][] = [
    ["Microsoft Edge", /Edg\/(\d+)/],
    ["Opera", /OPR\/(\d+)/],
    ["Firefox", /Firefox\/(\d+)/],
    ["Chrome", /Chrome\/(\d+)/],
    ["Safari", /Version\/(\d+).*Safari/],
  ];
  for (const [name, re] of patterns) {
    const m = re.exec(ua);
    if (m) return { name, version: m[1], os };
  }
  return { name: "Browser", version: "", os };
}

/**
 * Derive an identity from `navigator.userAgentData` when present (Chromium),
 * falling back to parsing the UA string. Pure, for testability.
 */
export function identityFrom(uaData: UaDataLike | undefined, userAgent: string): BrowserIdentity {
  const brands = uaData?.brands?.filter((b) => !/not.?a.?brand/i.test(b.brand));
  if (brands && brands.length > 0) {
    // Prefer a specific brand (Chrome, Edge, Brave…) over generic "Chromium".
    const pick = brands.find((b) => b.brand !== "Chromium") ?? brands[0];
    return {
      name: pick.brand,
      version: pick.version,
      os: uaData?.platform || osFromUa(userAgent),
    };
  }
  return parseUa(userAgent);
}

/** The running browser's identity, or best-effort empties off-DOM. */
export function detectBrowser(): BrowserIdentity {
  const nav =
    typeof navigator !== "undefined"
      ? (navigator as Navigator & { userAgentData?: UaDataLike })
      : undefined;
  return identityFrom(nav?.userAgentData, nav?.userAgent ?? "");
}
