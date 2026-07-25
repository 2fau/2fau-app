import type { VaultService } from "@twofau/ui";
import { ExtensionVaultService } from "./extension-vault-service";
import { HttpVaultRepo } from "./http-vault-repo";
import { readSettings } from "./settings";
import { VaultRepo } from "./vault-repo";

/**
 * Picks the backend the UI talks to, from the saved mode.
 *
 * - `client`: no local vault — proxy everything to the desktop bridge.
 * - `independent` (and, until Phase C, `sync`): the local chrome.storage vault.
 *
 * Every backend is the same `ExtensionVaultService` over a different repo, so
 * the revision-guard and merge logic is shared.
 */
export async function createVaultService(): Promise<VaultService> {
  const { mode, storageArea } = await readSettings();
  if (mode === "client") {
    return ExtensionVaultService.create(new HttpVaultRepo());
  }
  return ExtensionVaultService.create(new VaultRepo(storageArea));
}
