import { Check, Copy, Pencil, RotateCw, Trash2 } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import type { Account } from "@/core/types";
import { accountColorBorder, accountColorVar } from "@/lib/colors";
import { formatCode } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useClipboard } from "@/state/clipboard";
import { useVault } from "@/state/vault-provider";

/** Seconds before a TOTP code rolls over that it starts blinking. */
const EXPIRY_WARNING_S = 5;

/** A single account as a shadcn Item: a colour-tinted card with an avatar,
 * the code, and hover actions (copy / HOTP refresh / edit / delete-confirm).
 * The whole row is tap-to-copy. */
export function AccountRow({
  account,
  onEdit,
}: {
  account: Account;
  onEdit: () => void;
}) {
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
  const expiring =
    account.otp_type === "Totp" && secondsLeft <= EXPIRY_WARNING_S;

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

  const label = account.label ?? " ";
  const issuer = account.issuer ?? " ";

  return (
    <Item
      size="sm"
      className={cn(
        "relative cursor-default gap-3 rounded-lg px-3 py-2.5",
        account.color && "acct-fill",
      )}
      style={
        {
          "--row-accent": accountColorVar(account.color),
          borderColor: accountColorBorder(account.color),
        } as CSSProperties
      }
      onClick={copy}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <ItemContent className="min-w-0 gap-0.5">
        <ItemTitle className="max-w-full truncate text-[11px] font-medium text-muted-foreground">
          {issuer}&nbsp;
        </ItemTitle>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "font-mono text-2xl leading-none font-medium tabular-nums",
              copied && "text-success",
              expiring && !copied && "animate-blink",
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
        <ItemDescription className="max-w-full truncate text-[11px]">
          {label}&nbsp;
        </ItemDescription>
      </ItemContent>

      {(hovering || confirmingDelete) && (
        <ItemActions
          className="self-center"
          onClick={(e) => e.stopPropagation()}
        >
          {confirmingDelete ? (
            <>
              <Button size="xs" variant="destructive" onClick={del}>
                Delete
              </Button>
              <Button
                size="xs"
                variant="secondary"
                onClick={() => setConfirmingDelete(false)}
              >
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
        </ItemActions>
      )}

      {actionError && (
        <p className="basis-full text-[10px] text-destructive">{actionError}</p>
      )}

      {/* Per-account countdown: fills empty→full as the code ages, in the row's
       * own accent (periods can differ). In its final seconds it blinks in sync
       * with the code numbers to warn of an imminent roll. HOTP has no timer. */}
      {account.otp_type === "Totp" && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[3px] bg-foreground/10"
        >
          <span
            className={cn(
              "block h-full transition-[width] duration-300 ease-linear",
              expiring && "animate-blink",
            )}
            style={{
              width: `${(secondsLeft / period) * 100}%`,
              backgroundColor: accountColorVar(account.color) ?? "var(--primary)",
            }}
          />
        </span>
      )}
    </Item>
  );
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
