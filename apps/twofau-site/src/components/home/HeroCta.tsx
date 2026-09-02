import { useEffect, useState } from "react";
import { SplitButton, type SplitButtonItem } from "../shared/SplitButton";
import { DownloadIcon, PuzzleIcon } from "../shared/icons";

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

export const DOWNLOADS: SplitButtonItem[] = [
  {
    id: "mac-arm",
    label: "macOS · Apple silicon",
    meta: ".dmg",
    button: "Download for macOS",
    href: "/download/mac-arm64",
  },
  {
    id: "mac-intel",
    label: "macOS · Intel",
    meta: ".dmg",
    button: "Download for macOS",
    href: "/download/mac-x64",
  },
  {
    id: "windows",
    label: "Windows",
    meta: ".msi",
    button: "Download for Windows",
    href: "/download/windows",
  },
  {
    id: "linux-appimage",
    label: "Linux",
    meta: ".AppImage",
    button: "Download for Linux",
    href: "/download/linux-appimage",
  },
  {
    id: "linux-deb",
    label: "Linux",
    meta: ".deb",
    button: "Download for Linux",
    href: "/download/linux-deb",
  },
];

export const EXTENSIONS: SplitButtonItem[] = [
  {
    id: "chromium",
    label: "Chrome / Edge / Brave",
    meta: "Web Store",
    button: "Add to Chrome",
    href: "/extension#chrome",
  },
  {
    id: "firefox",
    label: "Firefox",
    meta: "AMO",
    button: "Add to Firefox",
    href: "/extension#firefox",
  },
];

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

export function HeroCta() {
  // Server render matches the design's default state; detection corrects it on
  // mount, and an explicit pick from the menu overrides both.
  const [os, setOs] = useState<string | null>("mac-arm");
  const [browser, setBrowser] = useState<string | null>("chromium");
  const [picked, setPicked] = useState({ os: false, browser: false });

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
        fallbackLabel="Download"
        fallbackHref="#download"
        menuLabel="Choose a platform to download"
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
        fallbackLabel="Get the extension"
        fallbackHref="/extension"
        menuLabel="Choose a browser"
      />
    </div>
  );
}
