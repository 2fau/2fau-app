import { ChevronLeft } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ParsedOtp } from "@/core/types";
import { buildOtpauthUri } from "@/lib/otpauth";
import { decodeQrImage } from "@/lib/qr";
import { useVault } from "@/state/vault-provider";

/** Bulk import: paste many `otpauth://` links (one per line) or a Google
 * Authenticator `otpauth-migration://` export, or drop in a QR image of either.
 * Adds every account it can parse. `parseMigration` is host-supplied (WASM in
 * the extension, a Tauri command on the desktop); without it, migration links
 * are skipped and only plain otpauth links import. */
export function ImportView({
  onDone,
  parseMigration,
}: {
  onDone: () => void;
  parseMigration?: (uri: string) => Promise<ParsedOtp[]>;
}) {
  const { addUri, capabilities } = useVault();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function collectUris(): Promise<string[]> {
    const uris: string[] = [];
    for (const token of text.split(/\s+/).map((s) => s.trim()).filter(Boolean)) {
      if (token.startsWith("otpauth-migration://")) {
        if (!parseMigration) continue;
        for (const p of await parseMigration(token)) {
          uris.push(
            buildOtpauthUri(
              {
                id: "",
                issuer: p.issuer,
                label: p.label,
                otp_type: p.otp_type,
                algorithm: p.algorithm,
                digits: p.digits,
                period: p.period,
                counter: p.counter,
                color: "",
              },
              p.secret,
            ),
          );
        }
      } else if (token.startsWith("otpauth://")) {
        uris.push(token);
      }
    }
    return uris;
  }

  async function run() {
    setBusy(true);
    setStatus(null);
    setError(null);
    try {
      const uris = await collectUris();
      if (uris.length === 0) {
        setError("No otpauth:// links or a Google Authenticator export found.");
        return;
      }
      let added = 0;
      for (const uri of uris) {
        try {
          await addUri(uri);
          added += 1;
        } catch {
          // skip a bad entry rather than abort the whole batch
        }
      }
      setStatus(`Imported ${added} of ${uris.length} account${uris.length === 1 ? "" : "s"}.`);
      if (added > 0) setText("");
    } catch (e) {
      setError(msg(e));
    } finally {
      setBusy(false);
    }
  }

  async function importFromImage(file: File) {
    const uri = await decodeQrImage(file);
    if (!uri) {
      setError("No QR code found in that image.");
      return;
    }
    setText((t) => (t ? `${t}\n${uri}` : uri));
    setError(null);
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-1">
        <Button size="icon-sm" variant="ghost" onClick={onDone}>
          <ChevronLeft />
        </Button>
        <span className="text-[15px] font-semibold">Import accounts</span>
      </div>

      <div className="border-t" />

      <p className="text-[12px] text-muted-foreground">
        Paste <code>otpauth://</code> links (one per line) or a Google Authenticator
        export (<code>otpauth-migration://</code>).
      </p>

      <textarea
        className="macos-scroll h-28 w-full resize-none rounded-md border bg-transparent p-2 font-mono text-[11px] outline-none placeholder:text-muted-foreground"
        placeholder={"otpauth://totp/...\notpauth://totp/...\notpauth-migration://offline?data=..."}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {capabilities.qrImage && (
        <div>
          <Button variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>
            From QR image
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importFromImage(f);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {status && <p className="text-[11px] text-muted-foreground">{status}</p>}
      {error && <p className="text-[11px] text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onDone}>
          Done
        </Button>
        <Button size="sm" disabled={busy || text.trim().length === 0} onClick={run}>
          {busy ? "Importing…" : "Import"}
        </Button>
      </div>
    </div>
  );
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
