/**
 * Installer links taken from the latest published GitHub release at build time.
 *
 * The site is static, so these resolve once per build: rebuild after a release
 * to pick up its assets. An asset the release doesn't carry (or a failed fetch,
 * e.g. an offline build) falls back to the release page, never a dead link.
 * Server-only: islands receive the resolved URLs as props.
 */
import { REPO } from "./links";

const API = "https://api.github.com/repos/2fau/2fau-app/releases/latest";

export type ReleaseAsset = { name: string; browser_download_url: string };

export type Downloads = {
  macArm: string;
  macIntel: string;
  windows: string;
  linuxAppImage: string;
  linuxDeb: string;
  linuxRpm: string;
};

export type Release = {
  /** e.g. "v0.1.0", or null when the release couldn't be read. */
  version: string | null;
  /** The release page; per-asset SHA-256 digests are listed there. */
  page: string;
  downloads: Downloads;
};

/** Map release assets to installer slots by file name; `page` fills gaps. */
export function pickDownloads(assets: ReleaseAsset[], page: string): Downloads {
  const find = (re: RegExp) => assets.find((a) => re.test(a.name))?.browser_download_url ?? page;
  return {
    macArm: find(/(aarch64|arm64|universal).*\.dmg$/i),
    macIntel: find(/(x64|x86_64|intel|universal).*\.dmg$/i),
    windows: find(/-setup\.exe$/i),
    linuxAppImage: find(/\.AppImage$/i),
    linuxDeb: find(/\.deb$/i),
    linuxRpm: find(/\.rpm$/i),
  };
}

async function load(): Promise<Release> {
  const fallback = `${REPO}/releases/latest`;
  try {
    const token = process.env.GITHUB_TOKEN;
    const res = await fetch(API, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const rel = (await res.json()) as { tag_name: string; html_url: string; assets: ReleaseAsset[] };
    return { version: rel.tag_name, page: rel.html_url, downloads: pickDownloads(rel.assets, rel.html_url) };
  } catch (e) {
    console.warn(`[release] falling back to ${fallback}: ${(e as Error).message}`);
    return { version: null, page: fallback, downloads: pickDownloads([], fallback) };
  }
}

let cached: Promise<Release> | undefined;

/** One fetch per build, shared by every page. */
export function getRelease(): Promise<Release> {
  return (cached ??= load());
}
