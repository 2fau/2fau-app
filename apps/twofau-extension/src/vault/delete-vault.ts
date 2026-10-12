import { createVaultService } from "./backend";
import { readSettings, writeSettings } from "./settings";
import type { ExtensionVaultService } from "./extension-vault-service";

/**
 * Delete this browser's vault.
 *
 * Refuses in Desktop-vault mode, where the vault on screen belongs to the
 * desktop app. In Sync mode it also drops back to Independent: the local copy is
 * gone, but the reconcile engine would pull the desktop's straight back, so
 * deleting would look like it did nothing. The pairing is left alone, so turning
 * Sync back on is one click.
 */
export async function deleteLocalVault(
  passphrase: string,
  build: () => Promise<ExtensionVaultService> = () =>
    createVaultService() as Promise<ExtensionVaultService>,
): Promise<void> {
  const { mode } = await readSettings();
  if (mode === "client") throw new Error("This vault lives in the desktop app.");

  const service = await build();
  await service.deleteVault(passphrase, async () => {
    if (mode === "sync") await writeSettings({ mode: "independent" });
  });
}
