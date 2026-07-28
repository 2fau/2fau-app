import { Check, Copy, Pencil, RotateCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Account } from "@/core/types";
import { cn } from "@/lib/utils";
import { accountColorVar } from "@/lib/colors";
import { formatCode } from "@/lib/format";
import { useClipboard } from "@/state/clipboard";
import { useVault } from "@/state/vault-provider";

/** Seconds before a TOTP code rolls over that it starts blinking. */
const EXPIRY_WARNING_S = 5;

/** Port of the Swift `RowView`: two-line account cell, tap-to-copy, hover
 * actions (copy / HOTP refresh / edit / delete-with-confirm). */
export function AccountRow({ account, onEdit }: { account: Account; onEdit: () => void }) {
  const { codes, remove, advanceHotp, now } = useVault();
  const { writeText } = useClipboard();
  const [copied, setCopied] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const raw = codes[account.id] ?? "";

  // TOTP codes blink in their last few seconds so a copy right before rollover
  // is an obvious risk. HOTP has no timer, so it never blinks.
  const period = account.period || 30;
  const secondsLeft = period - (Math.floor(now / 1000) % period);
  const expiring = account.otp_type === "Totp" && secondsLeft <= EXPIRY_WARNING_S;

  async function copy() {
    if (!raw) return;
    try {
      await writeText(raw);
    } catch {
      // clipboard may be unavailable; still flash feedback
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1000);
  }

  async function advance() {
    try {
      await advanceHotp(account.id);
    } catch (e) {
      setActionError(`Could not advance code: ${msg(e)}`);
    }
  }

  async function del() {
    try {
      await remove(account.id);
    } catch (e) {
      setActionError(`Could not delete account: ${msg(e)}`);
      setConfirmingDelete(false);
    }
  }

  return (
    <div
      className="flex cursor-default flex-col gap-1 px-2 py-2"
      style={{ backgroundColor: accountColorVar(account.color) }}
      onClick={copy}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="flex min-h-12 items-center gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          {account.issuer && (
            <span className="truncate text-[11px] font-medium text-muted-foreground">
              {account.issuer}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-mono text-2xl font-medium tabular-nums",
                copied && "text-success",
                expiring && !copied && "animate-blink text-destructive",
              )}
            >
              {formatCode(raw)}
            </span>
            {copied ? (
              <Check className="size-4 text-success" />
            ) : (
              hovering && (
                <button
                  type="button"
                  aria-label="Copy code"
                  title="Copy code"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    void copy();
                  }}
                >
                  <Copy className="size-4" />
                </button>
              )
            )}
          </div>
          {account.label && (
            <span className="truncate text-[11px] text-muted-foreground">{account.label}</span>
          )}
        </div>

        <div className="ml-auto" />

        {(hovering || confirmingDelete) && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {confirmingDelete ? (
              <>
                <Button size="xs" variant="destructive" onClick={del}>
                  Delete
                </Button>
                <Button size="xs" variant="secondary" onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {account.otp_type === "Hotp" && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    title="Next code"
                    onClick={advance}
                  >
                    <RotateCw />
                  </Button>
                )}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  title="Edit"
                  onClick={onEdit}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive"
                  title="Delete"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2 />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      {actionError && <p className="text-[10px] text-destructive">{actionError}</p>}
    </div>
  );
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
