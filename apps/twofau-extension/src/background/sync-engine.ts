import { openWithKey, type VaultDocument } from "@twofau/core-wasm";
import { BridgeUnreachableError, bridgeFetch } from "../bridge/connection";
import { b64ToBytes, bytesToB64 } from "../vault/base64";
import { KDF_ID } from "../vault/extension-vault-service";
import { getSessionKey } from "../vault/session-key";
import { readSettings } from "../vault/settings";
import { VaultRepo } from "../vault/vault-repo";

export type SyncOutcome =
  | "synced"
  | "up-to-date"
  | "skipped"
  | "locked"
  | "offline"
  | "conflict"
  | "error";

/** Ask the desktop to merge our local blob and return the merged doc re-sealed
 *  under our salt. Throws BridgeUnreachableError if the desktop is down. */
async function mergeBlob(blob: Uint8Array): Promise<{ revision: number; blob: Uint8Array }> {
  const res = await bridgeFetch("/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blob: bytesToB64(blob) }),
  });
  if (!res.ok) throw new Error(`merge failed (${res.status})`);
  const { revision, blob: merged } = (await res.json()) as { revision: number; blob: string };
  return { revision, blob: b64ToBytes(merged) };
}

/** Stable serialisation so an unchanged document compares equal regardless of
 *  entry order — the guard that stops sync from looping on its own writes. */
function canonical(doc: VaultDocument): string {
  const entries = [...doc.entries].sort((a, b) => a.account.id.localeCompare(b.account.id));
  const tombstones = [...doc.tombstones].sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify({ entries, tombstones });
}

/**
 * One reconcile pass. Best-effort: any failure is a quiet no-op that leaves the
 * local vault untouched. Writes locally only when the merge actually changed
 * the document, so a converged pair never re-triggers.
 */
export async function syncOnce(): Promise<SyncOutcome> {
  const { mode, storageArea } = await readSettings();
  if (mode !== "sync") return "skipped";
  const key = await getSessionKey();
  if (key === null) return "locked";

  const local = new VaultRepo(storageArea);
  const localLoaded = await local.load();
  if (!localLoaded) return "up-to-date"; // no local vault yet — nothing to send

  let reply: { revision: number; blob: Uint8Array };
  try {
    reply = await mergeBlob(localLoaded.blob);
  } catch (err) {
    if (err instanceof BridgeUnreachableError) return "offline";
    return "error"; // desktop locked / passphrase mismatch / bad status
  }

  const before = await openWithKey(localLoaded.blob, key);
  const after = await openWithKey(reply.blob, key);
  if (canonical(before) === canonical(after)) return "up-to-date";

  // Persist under our own salt at the revision we read; a local write that
  // raced us returns a conflict and the next pass retries.
  const result = await local.save(
    reply.blob,
    localLoaded.manifest.salt,
    KDF_ID,
    localLoaded.manifest.revision,
  );
  return result.ok ? "synced" : "conflict";
}
