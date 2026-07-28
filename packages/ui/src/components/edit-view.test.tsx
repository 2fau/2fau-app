import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { account, fakeService, renderWithVault } from "@/test/test-utils";
import { EditView } from "./edit-view";

// jsdom has no canvas, so stub the QR renderer with a deterministic data URL.
vi.mock("qrcode", () => ({
  default: { toDataURL: vi.fn(async () => "data:image/png;base64,STUB") },
}));

describe("EditView QR reveal", () => {
  it("hides the QR until requested, then renders it from the account's secretUri", async () => {
    const user = userEvent.setup();
    const svc = fakeService([account({ id: "abc" })]);
    const spy = vi.spyOn(svc, "secretUri");
    renderWithVault(<EditView account={account({ id: "abc" })} onDone={() => {}} />, svc);

    expect(screen.queryByRole("img", { name: /qr/i })).toBeNull();

    await user.click(screen.getByRole("button", { name: /show qr/i }));

    expect(spy).toHaveBeenCalledWith("abc");
    expect(await screen.findByRole("img", { name: /qr/i })).toHaveAttribute(
      "src",
      "data:image/png;base64,STUB",
    );
  });
});

describe("EditView row color", () => {
  it("saves the picked color via update", async () => {
    const user = userEvent.setup();
    const svc = fakeService([account({ id: "abc" })]);
    const update = vi.spyOn(svc, "update");
    renderWithVault(<EditView account={account({ id: "abc" })} onDone={() => {}} />, svc);

    await user.click(screen.getByRole("button", { name: "Blue" }));
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ id: "abc", color: "blue" }));
  });
});
