import { describe, expect, it } from "vitest";
import {
  accountColorAccent,
  accountColorBorder,
  accountColorVar,
  accountRowBackground,
} from "./colors";

describe("account colours", () => {
  it("maps a known key to its accent variable", () => {
    expect(accountColorVar("blue")).toBe("var(--acct-blue)");
  });

  it("builds a translucent conic gradient background for a known key", () => {
    const bg = accountRowBackground("blue");
    expect(bg).toContain("conic-gradient");
    expect(bg).toContain("var(--acct-blue)");
    expect(bg).toContain("color-mix");
  });

  it("builds an avatar fill and a card border for a known key", () => {
    expect(accountColorAccent("green")).toContain("var(--acct-green)");
    expect(accountColorBorder("green")).toContain("var(--acct-green)");
  });

  it("returns undefined for no colour or an unknown key", () => {
    for (const fn of [accountColorVar, accountRowBackground, accountColorAccent, accountColorBorder]) {
      expect(fn("")).toBeUndefined();
      expect(fn("chartreuse")).toBeUndefined();
    }
  });
});
