import { useEffect, useState } from "react";
import { SplitButton, type SplitButtonItem } from "../shared/SplitButton";
import { DownloadIcon, PuzzleIcon } from "../shared/icons";
import { DOWNLOAD, STORE } from "../../config/links";

/**
 * Hero split buttons.
 *
 * The main segment downloads the current selection; the chevron changes it.
 * Detection from the user agent only seeds the initial selection — once the
 * visitor picks from the menu their choice wins and the label follows.
 *
 * Detection runs in an effect rather than during render, so the server output
 * and the first client render agree (no hydration mismatch).
 */

/** Server-resolved labels for the active locale (technical `meta` tokens like
 * ".dmg"/"AMO" stay literal). */
export type HeroCtaDict = {
  macApple: string;
  macIntel: string;
  windows: string;
  linux: string;
  chromeEdgeBrave: string;
  firefox: string;
  downloadMac: string;
  downloadWindows: string;
  downloadLinux: string;
  addChrome: string;
  addFirefox: string;
  download: string;
  getExtension: string;
  choosePlatform: string;
  chooseBrowser: string;
};

const DEFAULT_DICT: HeroCtaDict = {
  macApple: "macOS · Apple silicon",
  macIntel: "macOS · Intel",
  windows: "Windows",
  linux: "Linux",
  chromeEdgeBrave: "Chrome / Edge / Brave",
  firefox: "Firefox",
  downloadMac: "Download for macOS",
  downloadWindows: "Download for Windows",
  downloadLinux: "Download for Linux",
  addChrome: "Add to Chrome",
  addFirefox: "Add to Firefox",
  download: "Download",
  getExtension: "Get the extension",
  choosePlatform: "Choose a platform to download",
  chooseBrowser: "Choose a browser",
};

function downloads(d: HeroCtaDict): SplitButtonItem[] {
  return [
    { id: "mac-arm", label: d.macApple, meta: ".dmg", button: d.downloadMac, href: DOWNLOAD.macArm },
    { id: "mac-intel", label: d.macIntel, meta: ".dmg", button: d.downloadMac, href: DOWNLOAD.macIntel },
    { id: "windows", label: d.windows, meta: ".msi", button: d.downloadWindows, href: DOWNLOAD.windows },
    { id: "linux-appimage", label: d.linux, meta: ".AppImage", button: d.downloadLinux, href: DOWNLOAD.linuxAppImage },
    { id: "linux-deb", label: d.linux, meta: ".deb", button: d.downloadLinux, href: DOWNLOAD.linuxDeb },
  ];
}

function extensions(d: HeroCtaDict): SplitButtonItem[] {
  return [
    { id: "chromium", label: d.chromeEdgeBrave, meta: "Web Store", button: d.addChrome, href: STORE.chrome },
    { id: "firefox", label: d.firefox, meta: "AMO", button: d.addFirefox, href: STORE.firefox },
  ];
}

export function detectOs(ua: string, platform: string): string | null {
  const s = `${ua} ${platform}`.toLowerCase();
  if (/android/.test(s)) return null;
  if (/iphone|ipad|ipod/.test(s)) return null;
  // Apple silicon is not exposed in the UA string, so macOS defaults to the
  // arm64 build; the menu is there for anyone still on Intel.
  if (/mac/.test(s)) return "mac-arm";
  if (/win/.test(s)) return "windows";
  if (/linux|x11|cros/.test(s)) return "linux-appimage";
  return null;
}

export function detectBrowser(ua: string): string | null {
  const s = ua.toLowerCase();
  if (/firefox\/|fxios/.test(s)) return "firefox";
  if (/edg\/|edge\//.test(s)) return "chromium";
  if (/chrome\/|chromium\/|crios/.test(s)) return "chromium";
  return null;
}

export function HeroCta({ dict = DEFAULT_DICT }: { dict?: HeroCtaDict }) {
  // Server render matches the design's default state; detection corrects it on
  // mount, and an explicit pick from the menu overrides both.
  const [os, setOs] = useState<string | null>("mac-arm");
  const [browser, setBrowser] = useState<string | null>("chromium");
  const [picked, setPicked] = useState({ os: false, browser: false });
  const DOWNLOADS = downloads(dict);
  const EXTENSIONS = extensions(dict);

  useEffect(() => {
    const nav = window.navigator;
    setOs((current) => (picked.os ? current : detectOs(nav.userAgent, nav.platform ?? "")));
    setBrowser((current) => (picked.browser ? current : detectBrowser(nav.userAgent)));
    // Detection is seeded once; later renders must not clobber a manual pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      data-pencil-name="CTA Row"
      className="box-border w-fit h-fit shrink-0 flex flex-row gap-[12px] justify-start items-center relative [z-index:99]"
    >
      <SplitButton
        variant="primary"
        icon={<DownloadIcon className="box-border w-[16px] shrink-0 h-[16px]" fill="#FFFFFF" />}
        items={DOWNLOADS}
        selectedId={os}
        onSelect={(id) => {
          setOs(id);
          setPicked((p) => ({ ...p, os: true }));
        }}
        fallbackLabel={dict.download}
        fallbackHref="#download"
        menuLabel={dict.choosePlatform}
      />
      <SplitButton
        variant="secondary"
        icon={<PuzzleIcon className="box-border w-[16px] shrink-0 h-[16px]" fill="#F5F5F7" />}
        items={EXTENSIONS}
        selectedId={browser}
        onSelect={(id) => {
          setBrowser(id);
          setPicked((p) => ({ ...p, browser: true }));
        }}
        fallbackLabel={dict.getExtension}
        fallbackHref="/extension"
        menuLabel={dict.chooseBrowser}
      />
    </div>
  );
}
