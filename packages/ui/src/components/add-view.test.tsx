import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AddPrefill } from "@/lib/prefill";
import { account, fakeService, renderWithVault } from "@/test/test-utils";
import { AddView } from "./add-view";

const otpauthPrefill: AddPrefill = {
  issuer: "Acme",
  label: "me@x.com",
  secret: "GEZDGNBVGY3TQOJQ",
  type: "totp",
  uri: "otpauth://totp/Acme:me@x.com?secret=GEZDGNBVGY3TQOJQ&digits=8",
};

describe("AddView prefill", () => {
  it("seeds the fields from the prefill", () => {
    renderWithVault(<AddView prefill={otpauthPrefill} onDone={() => {}} />, fakeService([]));
    expect(screen.getByPlaceholderText(/Issuer/i)).toHaveValue("Acme");
    expect(screen.getByPlaceholderText(/Label/i)).toHaveValue("me@x.com");
    expect(screen.getByPlaceholderText(/Secret/i)).toHaveValue("GEZDGNBVGY3TQOJQ");
  });

  it("saves an untouched otpauth prefill via addUri to preserve its params", async () => {
    const user = userEvent.setup();
    const svc = fakeService([]);
    const addUri = vi.spyOn(svc, "addUri");
    const addManual = vi.spyOn(svc, "addManual");
    renderWithVault(<AddView prefill={otpauthPrefill} onDone={() => {}} />, svc);

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(addUri).toHaveBeenCalledWith(otpauthPrefill.uri);
    expect(addManual).not.toHaveBeenCalled();
  });

  it("falls back to addManual once a field is edited", async () => {
    const user = userEvent.setup();
    const svc = fakeService([account()]);
    const addUri = vi.spyOn(svc, "addUri");
    const addManual = vi.spyOn(svc, "addManual");
    renderWithVault(<AddView prefill={otpauthPrefill} onDone={() => {}} />, svc);

    await user.type(screen.getByPlaceholderText(/Issuer/i), "X");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(addUri).not.toHaveBeenCalled();
    expect(addManual).toHaveBeenCalledWith({
      issuer: "AcmeX",
      label: "me@x.com",
      secretBase32: "GEZDGNBVGY3TQOJQ",
      type: "totp",
    });
  });
});
