import { ChevronLeft, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Account } from "@/core/types";
import { useVault } from "@/state/vault-provider";

/** Port of the Swift `EditView`: edit issuer/label of an existing account, and
 * reveal its QR code so it can be re-added on another device. */
export function EditView({ account, onDone }: { account: Account; onDone: () => void }) {
  const { update, secretUri } = useVault();
  const [issuer, setIssuer] = useState(account.issuer);
  const [label, setLabel] = useState(account.label);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  async function save() {
    try {
      await update({ ...account, issuer, label });
      onDone();
    } catch (e) {
      setError(`Could not save: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function revealQr() {
    try {
      const uri = await secretUri(account.id);
      setQr(await QRCode.toDataURL(uri, { margin: 1, width: 176 }));
    } catch (e) {
      setError(`Could not build QR: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-1">
        <Button size="icon-sm" variant="ghost" onClick={onDone}>
          <ChevronLeft />
        </Button>
        <span className="text-[15px] font-semibold">Edit account</span>
      </div>

      <div className="border-t" />

      <Input placeholder="Issuer" value={issuer} onChange={(e) => setIssuer(e.target.value)} />
      <Input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />

      {qr ? (
        <div className="flex flex-col items-center gap-1">
          <img src={qr} alt="Account QR code" className="rounded-md" width={176} height={176} />
          <p className="text-[11px] text-muted-foreground">Scan to add on another device.</p>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={revealQr}>
          <QrCode />
          Show QR code
        </Button>
      )}

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
