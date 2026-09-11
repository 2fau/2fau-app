import type { HeroCtaDict } from "../components/home/HeroCta";
import { getT } from "./t";

/** Resolve the HeroCta island's labels for a locale (passed as a prop so the
 * client island renders translated text without shipping the catalog). */
export function heroDict(locale: string | undefined): HeroCtaDict {
  const t = getT(locale).t;
  return {
    macApple: t("macOS · Apple silicon"),
    macIntel: t("macOS · Intel"),
    windows: t("Windows"),
    linux: t("Linux"),
    chromeEdgeBrave: t("Chrome / Edge / Brave"),
    firefox: t("Firefox"),
    downloadMac: t("Download for macOS"),
    downloadWindows: t("Download for Windows"),
    downloadLinux: t("Download for Linux"),
    addChrome: t("Add to Chrome"),
    addFirefox: t("Add to Firefox"),
    download: t("Download"),
    getExtension: t("Get the extension"),
    choosePlatform: t("Choose a platform to download"),
    chooseBrowser: t("Choose a browser"),
  };
}
