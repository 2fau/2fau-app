import { describe, expect, it } from "vitest";
import { detectBrowser, detectOs } from "./HeroCta";

const WIN_FIREFOX = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0";
const MAC_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";

describe("detectOs", () => {
  it("trusts the user agent over the platform string", () => {
    expect(detectOs(WIN_FIREFOX, "MacIntel")).toBe("windows");
    expect(detectOs(MAC_CHROME, "Win32")).toBe("mac-arm");
  });

  it("falls back to the platform when the UA says nothing", () => {
    expect(detectOs("SomeBrowser/1.0", "Linux x86_64")).toBe("linux-appimage");
  });

  it("offers no desktop build to phones", () => {
    expect(detectOs(IPHONE, "iPhone")).toBeNull();
  });
});

describe("detectBrowser", () => {
  it("tells Firefox from Chromium browsers", () => {
    expect(detectBrowser(WIN_FIREFOX)).toBe("firefox");
    expect(detectBrowser(MAC_CHROME)).toBe("chromium");
  });
});
