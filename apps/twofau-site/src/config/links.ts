/** All external/asset links for the site, in one place. Update here. */

/** GitHub repository. */
export const REPO = "https://github.com/2fau/2fau-app";

/** Extension store listings (Chrome Web Store also serves Edge / Brave). */
export const STORE = {
  chrome: "https://chromewebstore.google.com/detail/ifacfgpnmddgogjjgjdaoaiflmjkjfag",
  firefox: "https://addons.mozilla.org/en-US/firefox/addon/2fau-authenticator/",
} as const;

/** Desktop installer downloads, per platform/format. */
export const DOWNLOAD = {
  macArm: "/download/mac-arm64",
  macIntel: "/download/mac-x64",
  windows: "/download/windows",
  linuxAppImage: "/download/linux-appimage",
  linuxDeb: "/download/linux-deb",
} as const;

/** Project links. */
export const LINKS = {
  sourceCode: REPO,
  releases: `${REPO}/releases`,
  securityAdvisory: `${REPO}/security/advisories/new`,
} as const;
