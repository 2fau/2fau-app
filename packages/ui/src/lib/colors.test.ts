import { describe, expect, it } from "vitest";
import { accountColorAccent, accountColorBorder, accountColorVar } from "./colors";

describe("account colours", () => {
  it("maps a known key to its accent variable", () => {
    expect(accountColorVar("blue")).toBe("var(--acct-blue)");
  });

  it("builds an avatar fill and a card border for a known key", () => {
    expect(accountColorAccent("green")).toContain("var(--acct-green)");
    expect(accountColorBorder("green")).toContain("var(--acct-green)");
  });

  it("returns undefined for no colour or an unknown key", () => {
    for (const fn of [accountColorVar, accountColorAccent, accountColorBorder]) {
      expect(fn("")).toContain('var(--acct-gray)');
      expect(fn("chartreuse")).toContain('var(--acct-gray)');
    }
  });
});
