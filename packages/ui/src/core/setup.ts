import type { ReactNode } from "react";
import type { ImportSpec } from "@/core/settings";

/**
 * The host-supplied "connect to the desktop" step of the first-run wizard.
 *
 * `placement` is the difference between the two hosts: the extension can live
 * entirely in the desktop's vault, so connecting is a starting point of its own;
 * the desktop *is* the vault, so its bridge is an optional follow-up once one
 * exists. The screen is host-rendered (pairing and permissions are host APIs)
 * and reports back through `onDone`/`onSkip`.
 */
export interface ConnectStep {
  placement: "choice" | "after-vault";
  /** Host-translated label for the choice (or the step's own heading). */
  title: string;
  /** One line under the title, explaining what connecting does here. */
  description: string;
  screen: (props: { onDone: () => void; onSkip: () => void }) => ReactNode;
}

/**
 * What a host offers on first run. Creating a vault is always available — it is
 * `VaultService.unlock` on a host reporting no vault — so only the other
 * starting points are declared here, and the wizard renders exactly the ones
 * present.
 */
export interface SetupBackend {
  /**
   * Adopt an existing vault file as this device's vault. Same `native`/`file`
   * split as the Settings import, but it *replaces* rather than merges: the
   * blob becomes the vault and the passphrase that opens the file becomes this
   * device's passphrase. Only valid before a vault exists.
   *
   * `run` writes the vault and leaves it locked; the wizard unlocks it with the
   * same passphrase, so adoption goes through the host's ordinary unlock path
   * (keyring on desktop, session key in the extension). Rejections should carry
   * an `AdoptError.code`.
   */
  adopt?: ImportSpec;
  connect?: ConnectStep;
}

/**
 * Why an adopt failed. Hosts tag the rejection so the wizard can tell "you
 * typed the wrong passphrase" (retry) from "that file is not a vault" (pick
 * another file) without parsing host-written prose.
 */
export type AdoptFailure = "wrong-passphrase" | "bad-file";

export interface AdoptError extends Error {
  code?: AdoptFailure;
}

export function adoptFailure(err: unknown): AdoptFailure | null {
  const code = (err as AdoptError | null)?.code;
  return code === "wrong-passphrase" || code === "bad-file" ? code : null;
}
