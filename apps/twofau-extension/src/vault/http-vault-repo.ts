import { vaultSalt } from "@twofau/core-wasm";
import { bridgeFetch } from "../bridge/connection";
import { b64ToBytes, bytesToB64 } from "./base64";
import { KDF_ID } from "./extension-vault-service";
import {
  type LoadedVault,
  MANIFEST_VERSION,
  type SaveResult,
  type VaultManifest,
  type VaultRepoPort,
} from "./vault-repo";

/**
 * A `VaultRepoPort` backed by the desktop bridge. Moves the sealed blob over
 * HTTP; the salt is recovered from the blob itself (the desktop only tracks a
 * revision), and cached so the cheap revision peek can still report it.
 */
export class HttpVaultRepo implements VaultRepoPort {
  private lastSalt: string | null = null;

  async hasVault(): Promise<boolean> {
    const res = await bridgeFetch("/vault");
    if (res.status === 404) return false;
    if (!res.ok) throw new Error(`Bridge error ${res.status}`);
    return true;
  }

  async loadManifest(): Promise<VaultManifest | null> {
    const res = await bridgeFetch("/vault/revision");
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Bridge error ${res.status}`);
    const { revision } = (await res.json()) as { revision: number };
    // The revision peek carries no salt; recover it once via a full load.
    if (this.lastSalt === null) {
      const loaded = await this.load();
      return loaded?.manifest ?? null;
    }
    return this.manifest(revision, this.lastSalt);
  }

  async load(): Promise<LoadedVault | null> {
    const res = await bridgeFetch("/vault");
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Bridge error ${res.status}`);
    const { revision, blob } = (await res.json()) as { revision: number; blob: string };
    const bytes = b64ToBytes(blob);
    this.lastSalt = await vaultSalt(bytes);
    return { blob: bytes, manifest: this.manifest(revision, this.lastSalt) };
  }

  async save(
    blob: Uint8Array,
    salt: string,
    _kdfId: number,
    baseRevision: number,
  ): Promise<SaveResult> {
    const res = await bridgeFetch("/vault", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base_revision: baseRevision, blob: bytesToB64(blob) }),
    });
    if (res.ok) {
      const { revision } = (await res.json()) as { revision: number };
      this.lastSalt = salt;
      return { ok: true, manifest: this.manifest(revision, salt) };
    }
    if (res.status === 409) {
      const { revision, blob: remote } = (await res.json()) as { revision: number; blob: string };
      const bytes = b64ToBytes(remote);
      this.lastSalt = await vaultSalt(bytes);
      return {
        ok: false,
        conflict: { blob: bytes, manifest: this.manifest(revision, this.lastSalt) },
      };
    }
    throw new Error(`Bridge refused the write (${res.status}).`);
  }

  private manifest(revision: number, salt: string): VaultManifest {
    // chunks is always 1 over HTTP — the blob travels whole, not chunked.
    return { version: MANIFEST_VERSION, revision, chunks: 1, salt, kdfId: KDF_ID };
  }
}
