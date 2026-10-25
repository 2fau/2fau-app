import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { account, fakeService, renderWithVault } from "@/test/test-utils";
import { ImportView } from "./import-view";

const good = "otpauth://totp/Acme:me?secret=GEZDGNBVGY3TQOJQ";
const bad = "otpauth://totp/Broken:me?secret=!!";

describe("ImportView", () => {
  it("leaves only the links that failed in the box and says how many", async () => {
    const user = userEvent.setup();
    const svc = fakeService([account()]);
    svc.addUri = async (uri) => {
      if (uri === bad) throw new Error("invalid secret");
      return account();
    };
    renderWithVault(<ImportView onDone={() => {}} />, svc);

    const box = screen.getByRole("textbox", { name: /links to import/i });
    await user.click(box);
    await user.paste(`${good}\n${bad}`);
    await user.click(screen.getByRole("button", { name: /^import$/i }));

    expect(await screen.findByText(/1 link couldn't be added/i)).toBeInTheDocument();
    expect(box).toHaveValue(bad);
  });
});
