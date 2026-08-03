import {
  ArrowUpDown,
  Check,
  ClipboardPaste,
  GripVertical,
  Lock,
  Plus,
  ScanLine,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useRef, useState } from "react";
import { AccountRow } from "@/components/account-row";
import { ItemGroup } from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { useVault } from "@/state/vault-provider";
import { LogoMark, Wordmark } from "@/components/ui/logo";
import { SearchInput } from "@/components/ui/search-input";
import { accountColorVar } from "@/lib/colors";
import { primaryName, secondaryName } from "@/lib/format";
import { cn } from "@/lib/utils";

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

/** Geometry captured at grab so the floating clone can align to the pointer. */
type Geom = { x: number; y: number; offsetY: number; left: number; width: number };

const REORDER_ROW_CLASS =
  "flex select-none items-center gap-2.5 rounded-lg border bg-background px-3 py-2";

/** The dot + name shown in a reorder row (and its floating drag clone). */
function ReorderRowBody({ account }: { account: Account }) {
  const accent = accountColorVar(account.color);
  const secondary = secondaryName(account);
  return (
    <>
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: accent ?? "var(--muted-foreground)" }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px]">{primaryName(account)}</p>
        {secondary && (
          <p className="truncate text-[11px] text-muted-foreground">{secondary}</p>
        )}
      </div>
      <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </>
  );
}

/** A row in order mode: drag by the grip to reorder. Pointer-based (not native
 * HTML5 drag, which aborts when the list re-renders mid-drag). While dragged,
 * this in-list row becomes a dashed placeholder marking the drop slot and a
 * floating clone (rendered by the list) follows the pointer. No code is shown
 * and tap-to-copy is off, so reordering never copies. */
function ReorderRow({
  account,
  index,
  dragging,
  onGrabStart,
  onGrabMove,
  onGrabEnd,
}: {
  account: Account;
  index: number;
  dragging: boolean;
  onGrabStart: (geom: Geom) => void;
  onGrabMove: (x: number, y: number) => void;
  onGrabEnd: () => void;
}) {
  const accent = accountColorVar(account.color);
  const secondary = secondaryName(account);
  return (
    <div
      data-reorder-index={index}
      className={cn(
        REORDER_ROW_CLASS,
        dragging && "border-dashed bg-muted/40 [&>*]:opacity-0",
      )}
    >
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: accent ?? "var(--muted-foreground)" }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px]">{primaryName(account)}</p>
        {secondary && (
          <p className="truncate text-[11px] text-muted-foreground">{secondary}</p>
        )}
      </div>
      <span
        role="button"
        aria-label="Drag to reorder"
        className="shrink-0 cursor-grab touch-none p-1 text-muted-foreground active:cursor-grabbing"
        onPointerDown={(e) => {
          e.preventDefault();
          const rect = (
            e.currentTarget.closest("[data-reorder-index]") as HTMLElement | null
          )?.getBoundingClientRect();
          e.currentTarget.setPointerCapture(e.pointerId);
          onGrabStart({
            x: e.clientX,
            y: e.clientY,
            offsetY: rect ? e.clientY - rect.top : 0,
            left: rect?.left ?? 0,
            width: rect?.width ?? 0,
          });
        }}
        onPointerUp={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
          onGrabEnd();
          return;
        }}
        onPointerMove={(e) => {
          onGrabMove(e.clientX, e.clientY);
        }}
        onPointerCancel={onGrabEnd}
        onLostPointerCapture={onGrabEnd}
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </span>
    </div>
  );
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
  const { accounts, now, capabilities, lock, reorder } = useVault();
  const [search, setSearch] = useState("");
  const [pasteFailed, setPasteFailed] = useState(false);
  // Order mode: a local snapshot dragged into place, persisted only on "Done".
  const [reordering, setReordering] = useState(false);
  const [ordered, setOrdered] = useState<Account[]>([]);
  const [drag, setDrag] = useState<(Geom & { id: string }) | null>(null);
  const dragIdRef = useRef<string | null>(null);

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

  function toggleReorder() {
    if (reordering) {
      // Apply the new order only now, on "Done".
      void reorder(ordered.map((a) => a.id));
      setReordering(false);
      dragIdRef.current = null;
      setDrag(null);
    } else {
      setSearch("");
      setOrdered([...accounts]);
      setReordering(true);
    }
  }

  function onGrabStart(id: string, geom: Geom) {
    dragIdRef.current = id;
    setDrag({ id, ...geom });
  }

  // Live-reorder the local snapshot: hit-test the row under the pointer and move
  // the dragged account there. Uses the ref + a functional update so rapid
  // pointer events never act on stale state.
  function onGrabMove(x: number, y: number) {
    const id = dragIdRef.current;
    if (!id) return;
    // Move the floating clone with the pointer.
    setDrag((d) => (d ? { ...d, x, y } : d));

    // Target slot = how many row midpoints sit above the pointer. Counting
    // midpoints (rather than hit-testing the row under the pointer) is what lets
    // the item pass its own placeholder and reach the very top or bottom.
    const rows = document.querySelectorAll("[data-reorder-index]");
    if (rows.length === 0) return;
    let target = 0;
    for (const el of rows) {
      const r = el.getBoundingClientRect();
      if (y > r.top + r.height / 2) target += 1;
    }
    target = Math.min(target, rows.length - 1);

    setOrdered((cur) => {
      const from = cur.findIndex((a) => a.id === id);
      if (from === -1 || from === target) return cur;
      const next = [...cur];
      const [item] = next.splice(from, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  function onGrabEnd() {
    dragIdRef.current = null;
    setDrag(null);
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
          {!reordering && capabilities.scanScreen && onScan && (
            <Button
              size="icon-xs"
              variant="ghost"
              title="Scan QR from screen"
              onClick={onScan}
            >
              <ScanLine />
            </Button>
          )}
          {!reordering && capabilities.paste && onQuickAdd && (
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
          {accounts.length > 1 && (
            <Button
              size="icon-xs"
              variant="ghost"
              title={reordering ? "Done reordering" : "Reorder accounts"}
              aria-label={reordering ? "Done reordering" : "Reorder accounts"}
              className={reordering ? "text-primary" : undefined}
              onClick={toggleReorder}
            >
              {reordering ? <Check /> : <ArrowUpDown />}
            </Button>
          )}
          {!reordering && (
            <Button
              size="icon-xs"
              variant="ghost"
              title="Add account"
              onClick={onAdd}
            >
              <Plus />
            </Button>
          )}
        </div>
      </div>

      <div className="border-t" />

      {/* Fills the panel; the list scrolls its own overflow so the header and
          footer stay put and the popup height never changes. */}
      <div className="flex min-h-0 flex-1 flex-col">
        {accounts.length === 0 ? (
          <EmptyState />
        ) : reordering ? (
          <ItemGroup className="macos-scroll min-h-0 flex-1 gap-1 overflow-y-auto px-1.5 py-1">
            {ordered.map((a, i) => (
              <ReorderRow
                key={a.id}
                account={a}
                index={i}
                dragging={drag?.id === a.id}
                onGrabStart={(geom) => onGrabStart(a.id, geom)}
                onGrabMove={onGrabMove}
                onGrabEnd={onGrabEnd}
              />
            ))}
            {drag &&
              (() => {
                const acc = ordered.find((a) => a.id === drag.id);
                if (!acc) return null;
                return (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none fixed z-50"
                    style={{ left: drag.left, top: drag.y - drag.offsetY, width: drag.width }}
                  >
                    <div className={cn(REORDER_ROW_CLASS, "scale-[1.02] shadow-xl")}>
                      <ReorderRowBody account={acc} />
                    </div>
                  </div>
                );
              })()}
          </ItemGroup>
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
