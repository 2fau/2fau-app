/** All external/asset links for the site, in one place. Update here. */

/** GitHub repository. */
export const REPO = "https://github.com/2fau/2fau-app";

/** Extension store listings (Chrome Web Store also serves Edge / Brave). */
export const STORE = {
  chrome: "https://chromewebstore.google.com/detail/ifacfgpnmddgogjjgjdaoaiflmjkjfag",
  firefox: "https://addons.mozilla.org/en-US/firefox/addon/2fau-authenticator/",
} as const;

/**
 * Desktop installer downloads. These are GitHub's stable "latest release" asset
 * URLs: `releases/latest/download/<name>` 302-redirects to the newest published
 * (non-prerelease) release's asset of that name. The release workflow uploads
 * these version-less copies, so the links never change and need no build-time
 * lookup. No Intel-mac build yet, so macIntel points at the releases page.
 */
const LATEST = `${REPO}/releases/latest/download`;
export const DOWNLOAD = {
  macArm: `${LATEST}/2FAu-macos-arm64.dmg`,
  macIntel: `${REPO}/releases/latest`,
  windows: `${LATEST}/2FAu-windows-x64.msi`,
  linuxAppImage: `${LATEST}/2FAu-linux-x86_64.AppImage`,
  linuxDeb: `${LATEST}/2FAu-linux-amd64.deb`,
} as const;

/** Project links. */
export const LINKS = {
  sourceCode: REPO,
  releases: `${REPO}/releases`,
  securityAdvisory: `${REPO}/security/advisories/new`,
  /** SHA-256 checksums for the latest desktop installers. */
  checksums: `${LATEST}/checksums.txt`,
} as const;
