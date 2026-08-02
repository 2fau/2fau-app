import {
  ClipboardPaste,
  Lock,
  Plus,
  ScanLine,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { AccountRow } from "@/components/account-row";
import { ItemGroup } from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { useVault } from "@/state/vault-provider";
import { LogoMark, Wordmark } from "@/components/ui/logo";
import { SearchInput } from "@/components/ui/search-input";

import type { Account } from "@/core/types";

const MAX_VISIBLE_ROWS = 5;

/** Seconds before a TOTP code rolls over that it starts blinking. */
const EXPIRY_WARNING_S = 5;

function EmptyState() {
  return (
      <div className="flex flex-col items-center gap-1.5 py-9">
        <ShieldCheck className="size-8 text-muted-foreground" />
        <p className="text-[13px] text-muted-foreground">No accounts yet</p>
        <p className="text-[11px] text-tertiary-foreground">Tap + to add one</p>
      </div>
  );
}

function NoMatchesState() {
  return (
      <p className="py-6 text-center text-[13px] text-muted-foreground">
        No matches
      </p>
  )
}

type FooterProps = {
  accounts: Account[]
  onQuit?: () => void;
  onOpenSettings?: () => void;
  onLock?: () => void;
}

function Footer({
  accounts,
  onQuit,
  onOpenSettings,
  onLock
}: FooterProps) {
  return (
      <div className="flex items-center px-3.5 py-2">
        <div className="flex flex-row items-center gap-2">
          <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Lock vault"
              title="Lock vault"
              className="text-muted-foreground"
              onClick={onLock}
          >
            <Lock />
          </Button>
          <span className="text-[11px] text-muted-foreground">
            {accounts.length === 1 ? "1 account" : `${accounts.length} accounts`}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          {onOpenSettings && (
              <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Settings"
                  className="text-muted-foreground"
                  onClick={onOpenSettings}
              >
                <Settings />
              </Button>
          )}
          {onQuit && (
              <Button size="xs" variant="ghost" className="text-muted-foreground" onClick={onQuit}>
                Quit
              </Button>
          )}
        </div>
      </div>
  )
}

export function MenuBarView({
  onAdd,
  onQuickAdd,
  onEdit,
  onScan,
  onQuit,
  onOpenSettings,
  matchAccount,
}: {
  onAdd: () => void;
  /** Open the Add screen prefilled from the clipboard (otpauth:// or a raw
   * secret). Resolves false when the clipboard holds nothing importable, so the
   * icon can flash red instead of navigating. */
  onQuickAdd?: () => Promise<boolean>;
  onEdit: (a: Account) => void;
  onScan?: () => void;
  onQuit?: () => void;
  onOpenSettings?: () => void;
  /** Smart filter: accounts matching the current page float to the top. */
  matchAccount?: (a: Account) => boolean;
}) {
  const { accounts, now, capabilities, lock } = useVault();
  const [search, setSearch] = useState("");
  const [pasteFailed, setPasteFailed] = useState(false);

  async function handleQuickAdd() {
    const opened = (await onQuickAdd?.()) ?? false;
    if (!opened) {
      setPasteFailed(true);
      window.setTimeout(() => setPasteFailed(false), 600);
    }
  }

  async function onLock() {
    void lock()
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? accounts.filter(
        (a) =>
          a.issuer.toLowerCase().includes(q) ||
          a.label.toLowerCase().includes(q),
      )
    : accounts;

  // Smart filter: while not searching, split out accounts that belong to the
  // current page so they can lead the list under a caption.
  const matched = !q && matchAccount ? filtered.filter(matchAccount) : [];
  const matchedIds = new Set(matched.map((a) => a.id));
  const rest = matched.length ? filtered.filter((a) => !matchedIds.has(a.id)) : filtered;

  const period = 30
  const secondsLeft = period - (Math.floor(now / 1000) % period);
  const filled = (secondsLeft / period);
  const expiring = secondsLeft <= EXPIRY_WARNING_S;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* header */}
      <div className="flex items-center gap-2 px-3.5 py-[11px]">
        <LogoMark size={26} progress={filled} urgent={expiring} />
        <Wordmark size={17} />
        <div className="ml-auto flex items-center gap-4">
          {capabilities.scanScreen && onScan && (
            <Button
              size="icon-xs"
              variant="ghost"
              title="Scan QR from screen"
              onClick={onScan}
            >
              <ScanLine />
            </Button>
          )}
          {capabilities.paste && onQuickAdd && (
            <Button
              size="icon-xs"
              variant="ghost"
              title="Add from clipboard"
              className={pasteFailed ? "text-destructive" : undefined}
              onClick={handleQuickAdd}
            >
              <ClipboardPaste />
            </Button>
          )}
          <Button
            size="icon-xs"
            variant="ghost"
            title="Add account"
            onClick={onAdd}
          >
            <Plus />
          </Button>
        </div>
      </div>

      <div className="border-t" />

      {/* Fills the panel; the list scrolls its own overflow so the header and
          footer stay put and the popup height never changes. */}
      <div className="flex min-h-0 flex-1 flex-col">
        {accounts.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {accounts.length > MAX_VISIBLE_ROWS && (
              <>
                <SearchInput value={search} setValue={setSearch} />
                <div className="border-t" />
              </>
            )}

            {filtered.length === 0 ? (
              <NoMatchesState />
            ) : (
              <ItemGroup className="macos-scroll min-h-0 flex-1 gap-1 overflow-y-auto px-1.5 py-1">
                {matched.length > 0 && (
                  <>
                    <p className="px-2 pt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      For this site
                    </p>
                    {matched.map((a) => (
                      <AccountRow key={a.id} account={a} onEdit={() => onEdit(a)} />
                    ))}
                    <div className="mx-1 my-1 border-t" />
                  </>
                )}
                {rest.map((a) => (
                  <AccountRow key={a.id} account={a} onEdit={() => onEdit(a)} />
                ))}
              </ItemGroup>
            )}
          </>
        )}
      </div>

      <div className="border-t" />

      {/* footer */}
      <Footer accounts={accounts} onQuit={onQuit} onLock={onLock} onOpenSettings={onOpenSettings} />
    </div>
  );
}
