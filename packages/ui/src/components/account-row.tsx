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
  flash,
  hotkeyIndex,
}: {
  account: Account;
  onEdit: () => void;
  /** Force the green "copied" state (e.g. after a ⌘/Ctrl+N quick-copy). */
  flash?: boolean;
  /** 1–5: renders a small keyboard-shortcut hint on the row. */
  hotkeyIndex?: number;
}) {
  const { codes, remove, advanceHotp, now } = useVault();
  const { writeText } = useClipboard();
  const [copied, setCopied] = useState(false);
  const copiedShown = copied || !!flash;
  const [hovering, setHovering] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const raw = codes[account.id] ?? "";

  // Time-based codes (TOTP + Steam) blink in their last few seconds so a copy
  // right before rollover is an obvious risk. HOTP has no timer, so never blinks.
  const timeBased = account.otp_type !== "Hotp";
  const period = account.period || 30;
  const secondsLeft = period - (Math.floor(now / 1000) % period);
  const expiring = timeBased && secondsLeft <= EXPIRY_WARNING_S;
  const showActions = (hovering || confirmingDelete)

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

  const copyButton = (
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

  const copiedIcon = (
      <Check className="size-4 text-success" />
  )

  const deleteButton = (
      <Button size="xs" variant="destructive" onClick={del}>
        Delete
      </Button>
  )

  const deleteAskButton = (
      <Button
          size="icon-sm"
          variant="ghost"
          className="text-destructive"
          title="Delete"
          onClick={() => setConfirmingDelete(true)}
      >
        <Trash2 />
      </Button>
  )

  const cancelButton = (
      <Button
          size="xs"
          variant="secondary"
          onClick={() => setConfirmingDelete(false)}
      >
        Cancel
      </Button>
  )

  const rotateButton = (
      account.otp_type === "Hotp" ? (
          <Button
              size="icon-sm"
              variant="ghost"
              className="text-muted-foreground"
              title="Next code"
              onClick={advance}
          >
            <RotateCw />
          </Button>
      ) : null
  )

  const editButton = (
      <Button
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground"
          title="Edit"
          onClick={onEdit}
      >
        <Pencil />
      </Button>
  )

  const codeContent = (
      <span
          className={cn(
              "font-mono text-2xl leading-none font-medium tabular-nums",
              copiedShown && "text-success",
              expiring && !copiedShown && "animate-blink",
          )}
      >{formatCode(raw)}</span>
  )

  const hotkeyLabel =
      hotkeyIndex != null
          ? `${navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl "}${hotkeyIndex}`
          : null;

  const hotkeyBadge = hotkeyIndex != null && (
      <kbd
          aria-label={`Shortcut ${hotkeyIndex}`}
          className="ml-auto rounded border px-1 text-[10px] font-medium text-muted-foreground"
      >
        {hotkeyLabel}
      </kbd>
  )

  return (
    <Item
      size="sm"
      className={cn(
        "relative cursor-default flex gap-3 rounded-lg px-3 py-2.5",
        account.color && "acct-glow",
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
          {codeContent}
          {copiedShown ? copiedIcon : hovering ? copyButton : hotkeyBadge}
        </div>
        <ItemDescription className="max-w-full truncate text-[11px]">
          {label}&nbsp;
        </ItemDescription>
      </ItemContent>

      {showActions && (
        <ItemActions
          className="self-center"
          onClick={(e) => e.stopPropagation()}
        >
          {confirmingDelete ? (
            <>{deleteButton}{cancelButton}</>
          ) : (
            <>{rotateButton}{editButton}{deleteAskButton}</>
          )}
        </ItemActions>
      )}

      {actionError && (
        <p className="basis-full text-[10px] text-destructive">{actionError}</p>
      )}

      {/* Per-account countdown: fills empty→full as the code ages, in the row's
       * own accent (periods can differ). In its final seconds it blinks in sync
       * with the code numbers to warn of an imminent roll. HOTP has no timer. */}
      {timeBased && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[3px] rounded-lg bg-foreground/10"
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
