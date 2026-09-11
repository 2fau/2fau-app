import { ChevronLeft, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useState } from "react";
import { useT } from "@twofau/i18n/react";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/color-picker";
import { Input } from "@/components/ui/input";
import type { Account } from "@/core/types";
import { useVault } from "@/state/vault-provider";

/** Port of the Swift `EditView`: edit issuer/label of an existing account, and
 * reveal its QR code so it can be re-added on another device. */
export function EditView({ account, onDone }: { account: Account; onDone: () => void }) {
  const { t } = useT();
  const { update, secretUri } = useVault();
  const [issuer, setIssuer] = useState(account.issuer);
  const [label, setLabel] = useState(account.label);
  const [color, setColor] = useState(account.color);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  async function save() {
    try {
      await update({ ...account, issuer, label, color });
      onDone();
    } catch (e) {
      setError(t("Could not save: {error}", { error: e instanceof Error ? e.message : String(e) }));
    }
  }

  async function revealQr() {
    try {
      const uri = await secretUri(account.id);
      setQr(await QRCode.toDataURL(uri, { margin: 1, width: 176 }));
    } catch (e) {
      setError(t("Could not build QR: {error}", { error: e instanceof Error ? e.message : String(e) }));
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-1">
        <Button size="icon-sm" variant="ghost" onClick={onDone}>
          <ChevronLeft />
        </Button>
        <span className="text-[15px] font-semibold">{t("Edit account")}</span>
      </div>

      <div className="border-t" />

      <Input placeholder={t("Issuer")} value={issuer} onChange={(e) => setIssuer(e.target.value)} />
      <Input placeholder={t("Label")} value={label} onChange={(e) => setLabel(e.target.value)} />

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-muted-foreground">{t("Row color")}</span>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      {qr ? (
        <div className="flex flex-col items-center gap-1">
          <img src={qr} alt={t("Account QR code")} className="rounded-md" width={176} height={176} />
          <p className="text-[11px] text-muted-foreground">{t("Scan to add on another device.")}</p>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={revealQr}>
          <QrCode />
          {t("Show QR code")}
        </Button>
      )}

      {error && <p className="text-[11px] text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onDone}>
          {t("Cancel")}
        </Button>
        <Button size="sm" onClick={save}>
          {t("Save")}
        </Button>
      </div>
    </div>
  );
}
