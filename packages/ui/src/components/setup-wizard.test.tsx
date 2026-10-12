import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SetupWizard } from "@/components/setup-wizard";
import type { AdoptError, SetupBackend } from "@/core/setup";
import type { VaultService } from "@/core/vault-service";
import { fakeService, renderWithVault } from "@/test/test-utils";

/** A host that has no vault yet — what the wizard is rendered for. */
function freshService(): VaultService {
  return { ...fakeService([]), isLocked: () => true, needsSetup: () => true };
}

function adoptError(code: AdoptError["code"]): AdoptError {
  const err: AdoptError = new Error("nope");
  err.code = code;
  return err;
}

function fileBackend(run: (file: File, passphrase: string) => Promise<number>): SetupBackend {
  return { adopt: { kind: "file", run } };
}

/** Type a passphrase into the adopt step and hand it a file. */
function chooseFile(passphrase: string) {
  fireEvent.change(screen.getByPlaceholderText(/passphrase of the file/i), {
    target: { value: passphrase },
  });
  fireEvent.change(screen.getByLabelText(/vault file/i), {
    target: { files: [new File(["blob"], "2fau-vault.dat")] },
  });
}

describe("SetupWizard", () => {
  it("is just the create step when the host offers nothing else", () => {
    const svc = freshService();
    const unlock = vi.spyOn(svc, "unlock");
    renderWithVault(<SetupWizard onDone={() => {}} />, svc);

    expect(screen.queryByText(/set up 2fau/i)).not.toBeInTheDocument();
    const [pass, confirm] = screen.getAllByPlaceholderText(/passphrase/i);
    fireEvent.change(pass, { target: { value: "longenough" } });
    fireEvent.change(confirm, { target: { value: "longenough" } });
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));
    expect(unlock).toHaveBeenCalledWith("longenough");
  });

  it("offers every starting point the host declares", () => {
    const backend: SetupBackend = {
      ...fileBackend(async () => 1),
      connect: {
        placement: "choice",
        title: "Use my desktop app",
        description: "Pair with the desktop vault.",
        screen: () => <p>connect screen</p>,
      },
    };
    renderWithVault(<SetupWizard backend={backend} onDone={() => {}} />, freshService());

    expect(screen.getByText(/create a new vault/i)).toBeInTheDocument();
    expect(screen.getByText(/import a vault file/i)).toBeInTheDocument();
    expect(screen.getByText(/use my desktop app/i)).toBeInTheDocument();
  });

  it("adopts a vault file and unlocks with the file's passphrase", async () => {
    const svc = freshService();
    const unlock = vi.spyOn(svc, "unlock");
    const run = vi.fn(async () => 3);
    const onDone = vi.fn();
    renderWithVault(<SetupWizard backend={fileBackend(run)} onDone={onDone} />, svc);

    fireEvent.click(screen.getByText(/import a vault file/i));
    chooseFile("file-passphrase");

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(run).toHaveBeenCalledWith(expect.any(File), "file-passphrase");
    expect(unlock).toHaveBeenCalledWith("file-passphrase");
  });

  it("tells a wrong passphrase from an unusable file, and creates no vault", async () => {
    const svc = freshService();
    const unlock = vi.spyOn(svc, "unlock");
    const onDone = vi.fn();
    const run = vi
      .fn<(file: File, passphrase: string) => Promise<number>>()
      .mockRejectedValueOnce(adoptError("wrong-passphrase"))
      .mockRejectedValueOnce(adoptError("bad-file"));
    renderWithVault(<SetupWizard backend={fileBackend(run)} onDone={onDone} />, svc);

    fireEvent.click(screen.getByText(/import a vault file/i));
    chooseFile("wrong");
    expect(await screen.findByText(/doesn.t open this file/i)).toBeInTheDocument();

    chooseFile("wrong");
    expect(await screen.findByText(/isn.t a 2fau vault/i)).toBeInTheDocument();

    expect(unlock).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("stays put when the file picker is dismissed", async () => {
    const svc = freshService();
    const unlock = vi.spyOn(svc, "unlock");
    const onDone = vi.fn();
    const backend: SetupBackend = { adopt: { kind: "native", run: async () => null } };
    renderWithVault(<SetupWizard backend={backend} onDone={onDone} />, svc);

    fireEvent.click(screen.getByText(/import a vault file/i));
    fireEvent.change(screen.getByPlaceholderText(/passphrase of the file/i), {
      target: { value: "whatever" },
    });
    fireEvent.click(screen.getByRole("button", { name: /choose file/i }));

    await waitFor(() => expect(screen.getByPlaceholderText(/passphrase of the file/i)).toBeInTheDocument());
    expect(unlock).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("runs the host's connect step after the vault exists, and finishes when it is skipped", async () => {
    const onDone = vi.fn();
    const backend: SetupBackend = {
      connect: {
        placement: "after-vault",
        title: "Connect your browser",
        description: "Pair the extension with this app.",
        screen: ({ onSkip }) => (
          <button type="button" onClick={onSkip}>
            Skip
          </button>
        ),
      },
    };
    renderWithVault(<SetupWizard backend={backend} onDone={onDone} />, freshService());

    const [pass, confirm] = screen.getAllByPlaceholderText(/passphrase/i);
    fireEvent.change(pass, { target: { value: "longenough" } });
    fireEvent.change(confirm, { target: { value: "longenough" } });
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    const skip = await screen.findByRole("button", { name: /skip/i });
    expect(onDone).not.toHaveBeenCalled();
    fireEvent.click(skip);
    expect(onDone).toHaveBeenCalled();
  });

  it("finishes on the extension's connect choice without creating a local vault", async () => {
    const svc = freshService();
    const unlock = vi.spyOn(svc, "unlock");
    const onDone = vi.fn();
    const backend: SetupBackend = {
      ...fileBackend(async () => 1),
      connect: {
        placement: "choice",
        title: "Use my desktop app",
        description: "Pair with the desktop vault.",
        screen: ({ onDone: done }) => (
          <button type="button" onClick={done}>
            Paired
          </button>
        ),
      },
    };
    renderWithVault(<SetupWizard backend={backend} onDone={onDone} />, svc);

    fireEvent.click(screen.getByText(/use my desktop app/i));
    fireEvent.click(await screen.findByRole("button", { name: /paired/i }));

    expect(onDone).toHaveBeenCalled();
    expect(unlock).not.toHaveBeenCalled();
  });
});
