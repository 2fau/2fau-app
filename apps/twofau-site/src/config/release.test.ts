import { describe, expect, it } from "vitest";
import { pickDownloads } from "./release";

const PAGE = "https://github.com/2fau/2fau-app/releases/tag/v0.1.0";
const url = (name: string) => `https://github.com/2fau/2fau-app/releases/download/v0.1.0/${name}`;
const asset = (name: string) => ({ name, browser_download_url: url(name) });

describe("pickDownloads", () => {
  it("maps the v0.1.0 asset names to installer slots", () => {
    const dl = pickDownloads(
      [
        "2FAu-0.1.0-1.x86_64.rpm",
        "2fau-chrome-0.1.0.zip",
        "2fau-firefox-0.1.0.xpi",
        "2FAu_0.1.0_amd64.AppImage",
        "2FAu_0.1.0_amd64.deb",
        "2FAu_0.1.0_x64-setup.exe",
        "2FAu_0.1.0_x64_en-US.msi",
      ].map(asset),
      PAGE,
    );
    expect(dl.windows).toBe(url("2FAu_0.1.0_x64_en-US.msi"));
    expect(dl.linuxAppImage).toBe(url("2FAu_0.1.0_amd64.AppImage"));
    expect(dl.linuxDeb).toBe(url("2FAu_0.1.0_amd64.deb"));
    expect(dl.linuxRpm).toBe(url("2FAu-0.1.0-1.x86_64.rpm"));
  });

  it("falls back to the release page for a platform the release doesn't carry", () => {
    const dl = pickDownloads([asset("2FAu_0.1.0_x64_en-US.msi")], PAGE);
    expect(dl.macArm).toBe(PAGE);
    expect(dl.macIntel).toBe(PAGE);
    expect(dl.linuxAppImage).toBe(PAGE);
  });

  it("tells Apple-silicon and Intel dmgs apart", () => {
    const dl = pickDownloads([asset("2FAu_0.2.0_aarch64.dmg"), asset("2FAu_0.2.0_x64.dmg")], PAGE);
    expect(dl.macArm).toBe(url("2FAu_0.2.0_aarch64.dmg"));
    expect(dl.macIntel).toBe(url("2FAu_0.2.0_x64.dmg"));
  });
});
