import { describe, expect, it } from "vitest";
import { accountColorAccent, accountColorVar, accountRowBackground } from "./colors";

describe("account colours", () => {
  it("maps a known key to its accent variable", () => {
    expect(accountColorVar("blue")).toBe("var(--acct-blue)");
  });

  it("builds a translucent gradient background for a known key", () => {
    const bg = accountRowBackground("blue");
    expect(bg).toContain("linear-gradient");
    expect(bg).toContain("var(--acct-blue)");
    expect(bg).toContain("color-mix");
  });

  it("builds a stronger accent fill for the avatar", () => {
    expect(accountColorAccent("green")).toContain("var(--acct-green)");
  });

  it("returns undefined for no colour or an unknown key", () => {
    for (const fn of [accountColorVar, accountRowBackground, accountColorAccent]) {
      expect(fn("")).toBeUndefined();
      expect(fn("chartreuse")).toBeUndefined();
    }
  });
});
