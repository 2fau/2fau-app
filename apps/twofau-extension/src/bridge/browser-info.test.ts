import { describe, expect, it } from "vitest";
import { identityFrom } from "./browser-info";

describe("identityFrom", () => {
  it("prefers a specific brand over Chromium and Not.A/Brand", () => {
    const uaData = {
      brands: [
        { brand: "Not.A/Brand", version: "24" },
        { brand: "Chromium", version: "128" },
        { brand: "Google Chrome", version: "128" },
      ],
      platform: "macOS",
    };
    expect(identityFrom(uaData, "")).toEqual({
      name: "Google Chrome",
      version: "128",
      os: "macOS",
    });
  });

  it("falls back to the UA string when userAgentData is absent", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";
    expect(identityFrom(undefined, ua)).toEqual({
      name: "Chrome",
      version: "127",
      os: "Windows",
    });
  });

  it("distinguishes Edge from Chrome in the UA string", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0";
    expect(identityFrom(undefined, ua)).toMatchObject({ name: "Microsoft Edge", os: "macOS" });
  });

  it("degrades to an empty identity for unknown UA", () => {
    expect(identityFrom(undefined, "")).toEqual({ name: "Browser", version: "", os: "" });
  });
});
