import { ChevronLeft } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/color-picker";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { decodeQrImage } from "@/lib/qr";
import { type AddPrefill, prefillFromClipboardText } from "@/lib/prefill";
import { useVault } from "@/state/vault-provider";

/** Port of the Swift `AddView`: import row + manual fields + TOTP/HOTP toggle.
 * An optional `prefill` seeds the fields (e.g. from the clipboard). */
export function AddView({
  onDone,
  onImport,
  prefill,
}: {
  onDone: () => void;
  /** Open the bulk / Google-Authenticator import screen. */
  onImport?: () => void;
  prefill?: AddPrefill;
}) {
  const { addUri, addManual, update, capabilities } = useVault();
  const [issuer, setIssuer] = useState(prefill?.issuer ?? "");
  const [label, setLabel] = useState(prefill?.label ?? "");
  const [secret, setSecret] = useState(prefill?.secret ?? "");
  const [type, setType] = useState<"totp" | "hotp" | "steam">(prefill?.type ?? "totp");
  const [color, setColor] = useState("");
  // The full otpauth URI behind the prefill, if any, and whether the parsed
  // fields are still untouched — while both hold, Save round-trips via addUri to
  // keep algorithm/digits/period/counter the manual form can't express.
  const [uri, setUri] = useState(prefill?.uri);
  const [pristine, setPristine] = useState(Boolean(prefill?.uri));
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function applyPrefill(p: AddPrefill) {
    setIssuer(p.issuer);
    setLabel(p.label);
    setSecret(p.secret);
    setType(p.type);
    setUri(p.uri);
    setPristine(Boolean(p.uri));
  }

  /** Any manual edit forfeits the URI fast-path. */
  function edited() {
    setPristine(false);
  }

  async function importFromClipboard() {
    try {
      const p = await prefillFromClipboardText(
        await navigator.clipboard.readText(),
      );
      if (!p) {
        setError("No otpauth:// URI or Base32 secret on the clipboard");
        return;
      }
      applyPrefill(p);
      setError(null);
    } catch (e) {
      setError(`Could not read clipboard: ${msg(e)}`);
    }
  }

  async function importFromFile(file: File) {
    const uri = await decodeQrImage(file);
    if (!uri) {
      setError("No QR code found");
      return;
    }
    try {
      applyPrefill(
        (await prefillFromClipboardText(uri)) ?? {
          issuer: "",
          label: "",
          secret: "",
          type: "totp",
        },
      );
      setError(null);
    } catch (e) {
      setError(`Could not read QR: ${msg(e)}`);
    }
  }

  async function save() {
    try {
      // Color isn't part of the add/import path, so set it with a follow-up
      // update on the created account when one was chosen.
      const created =
        pristine && uri
          ? await addUri(uri)
          : await addManual({ issuer, label, secretBase32: secret, type });
      if (color) await update({ ...created, color });
      onDone();
    } catch (e) {
      setError(`Could not add account: ${msg(e)}`);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-1">
        <Button size="icon-sm" variant="ghost" onClick={onDone}>
          <ChevronLeft />
        </Button>
        <span className="text-[15px] font-semibold">Add account</span>
      </div>

      <div className="border-t" />

      <div className="flex flex-col gap-2">
        <div className="text-[13px] text-muted-foreground">Paste from:</div>
        <div className="flex gap-2">
          {capabilities.paste && (
            <Button
              variant="secondary"
              size="sm"
              className="min-w-0 flex-1 px-2 text-xs"
              title="Paste an otpauth:// link or Base32 secret"
              onClick={importFromClipboard}
            >
              Clipboard
            </Button>
          )}
          {capabilities.qrImage && (
            <Button
              variant="secondary"
              size="sm"
              className="min-w-0 flex-1 px-2 text-xs"
              onClick={() => fileInput.current?.click()}
            >
              QR image
            </Button>
          )}
          {onImport && (
            <Button
              variant="secondary"
              size="sm"
              className="min-w-0 flex-1 px-2 text-xs"
              title="Import many, or a Google Authenticator export"
              onClick={onImport}
            >
              Bulk
            </Button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importFromFile(f);
            e.target.value = "";
          }}
        />
      </div>

      <Input
        placeholder="Issuer (e.g. GitHub)"
        value={issuer}
        onChange={(e) => {
          setIssuer(e.target.value);
          edited();
        }}
      />
      <Input
        placeholder="Label (e.g. me@x.com)"
        value={label}
        onChange={(e) => {
          setLabel(e.target.value);
          edited();
        }}
      />
      <Input
        placeholder="Secret (Base32)"
        value={secret}
        onChange={(e) => {
          setSecret(e.target.value);
          edited();
        }}
      />

      <ToggleGroup
        type="single"
        value={type}
        onValueChange={(v) => {
          if (v) {
            setType(v as "totp" | "hotp" | "steam");
            edited();
          }
        }}
        className="w-full"
      >
        <ToggleGroupItem value="totp" className="min-w-0 flex-1 px-2 text-xs">
          TOTP
        </ToggleGroupItem>
        <ToggleGroupItem value="hotp" className="min-w-0 flex-1 px-2 text-xs">
          HOTP
        </ToggleGroupItem>
        <ToggleGroupItem value="steam" className="min-w-0 flex-1 px-2 text-xs">
          Steam
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-muted-foreground">Row color</span>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      {error && <p className="text-[11px] text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" onClick={save}>
          Save
        </Button>
      </div>
    </div>
  );
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
