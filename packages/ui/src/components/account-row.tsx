import {CheckIcon, PencilIcon, RotateCwIcon, Trash2Icon} from "lucide-react";
import {useState} from "react";
import {AnimatePresence, motion} from 'framer-motion'
import type {Account} from "@/core/types";
import {accountColorVar} from "@/lib/colors";
import {formatCode} from "@/lib/format";
import {useClipboard} from "@/state/clipboard";
import {useVault} from "@/state/vault-provider";

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
                               modLabel,
                           }: {
    account: Account;
    onEdit: () => void;
    /** Force the green "copied" state (e.g. after a ⌘/Ctrl+N quick-copy). */
    flash?: boolean;
    /** 1–5: renders a small keyboard-shortcut hint on the row. */
    hotkeyIndex?: number;
    /** Formatted modifier shown before the digit in the hint (e.g. "⌘"). */
    modLabel?: string;
}) {
    const {codes, remove, advanceHotp, now} = useVault();
    const {writeText} = useClipboard();
    const [copied, setCopied] = useState(false);
    const copiedShown = copied || !!flash;
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false)

    const code = codes[account.id] ?? "";

    // Time-based codes (TOTP + Steam) blink in their last few seconds so a copy
    // right before rollover is an obvious risk. HOTP has no timer, so never blinks.
    const timeBased = account.otp_type !== "Hotp";
    const period = account.period || 30;
    const seconds = period - (Math.floor(now / 1000) % period);
    const expiring = timeBased && seconds <= EXPIRY_WARNING_S;

    const label = account.label ?? " ";
    const issuer = account.issuer ?? " ";
    const accent = `var(--row-accent)`
    const compact = true
    const progress = (seconds / period)
    const urgent = expiring

    const hotkeyLabel =
        hotkeyIndex != null
            ? `${modLabel ?? (navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl ")}${hotkeyIndex}`
            : null;

    async function copy() {
        if (!code) return;
        try {
            await writeText(code);
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
            setDeleting(true)
            await remove(account.id);
        } catch (e) {
            setActionError(`Could not delete account: ${msg(e)}`);
            setConfirmingDelete(false);
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div
            onClick={copy}
            style={
                {
                    "--row-accent": accountColorVar(account.color),
                    '--surface': `linear-gradient(160deg, color-mix(in srgb, ${accent} 15%, #16161b) 0%, color-mix(in srgb, ${accent} 6%, #131317) 55%, #121216 100%)`,
                    '--surface-hover': `linear-gradient(160deg, color-mix(in srgb, ${accent} 24%, #16161b) 0%, color-mix(in srgb, ${accent} 10%, #131317) 55%, #141418 100%)`,
                    '--edge': `color-mix(in srgb, ${accent} 24%, #23232b)`,
                    '--edge-hover': `color-mix(in srgb, ${accent} 44%, #23232b)`,
                    '--label': `color-mix(in srgb, ${accent} 55%, white)`,
                    '--chip-edge': `color-mix(in srgb, ${accent} 40%, #23232b)`,
                } as React.CSSProperties
            }
            className={[
                'group relative overflow-hidden rounded-xl min-h-22',
                '[background-image:var(--surface)]',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.4)]',
                'transition-[background-image,border-color] duration-150 ease-out',
                'pt-2 pb-2 px-3',
                confirmingDelete
                    ? 'border border-red-500/60'
                    : 'border border-[var(--edge)] hover:border-[var(--edge-hover)] hover:[background-image:var(--surface-hover)] focus-within:border-[var(--edge-hover)]',
            ].join(' ')}
        >
            {!confirmingDelete && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        void copy();
                    }}
                    aria-label={`Copy ${issuer} code for ${label}. ${seconds} seconds remaining`}
                    className="absolute inset-0 z-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/30"
                />
            )}

            <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-[2px]"
                style={{
                    backgroundImage: `linear-gradient(to bottom, transparent, ${accent}, transparent)`,
                }}
            />

            <div className="pointer-events-none relative z-10 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
              <span
                  aria-hidden="true"
                  className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[4px] border text-[9px] font-semibold"
                  style={{
                      borderColor: 'var(--chip-edge)',
                      color: 'var(--label)',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                  }}
              >
                {issuer.charAt(0)}
              </span>
                        <span
                            className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em]"
                            style={{color: 'var(--label)'}}
                        >{issuer}</span>
                    </div>

                    <div className="mt-1 overflow-hidden">
                        <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                                key={`${code}`}
                                initial={{opacity: 0, y: 8}}
                                animate={{opacity: 1, y: 0}}
                                exit={{opacity: 0, y: -8}}
                                transition={{duration: 0.22, ease: [0.23, 1, 0.32, 1]}}
                                className={[
                                    'block font-mono font-medium tabular-nums text-white',
                                    compact ? 'text-[21px] leading-7' : 'text-[25px] leading-8',
                                ].join(' ')}
                                style={{letterSpacing: '0.04em'}}
                            >
                                {formatCode(code)}
                            </motion.span>
                        </AnimatePresence>
                    </div>

                    {!actionError && <p className="mt-0.5 truncate text-[11.5px] text-zinc-500">{label}</p>}
                    {actionError && <p className="basis-full text-[10px] text-destructive">{actionError}</p>}
                </div>

                <div
                    className={[
                        'flex shrink-0 flex-col items-end justify-between self-stretch',
                        confirmingDelete ? 'w-[132px]' : 'w-[92px]',
                    ].join(' ')}
                    onClick={(e) => e.stopPropagation()}
                >
                    {confirmingDelete ? (
                        <div className="pointer-events-auto flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setConfirmingDelete(false)}
                                className="rounded-md border border-line px-2 py-[3px] text-[11px] font-medium text-zinc-300 transition-colors duration-150 ease-out hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                autoFocus
                                onClick={del}
                                disabled={deleting}
                                className="rounded-md bg-red-600 px-2 py-[3px] text-[11px] font-medium text-white transition-colors duration-150 ease-out hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    ) : copiedShown ? (
                        <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-emerald-400">
                <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5}/>
                Copied
              </span>
                    ) : (
                        <>
                            <div
                                className="pointer-events-auto flex items-center gap-0.5 opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100">
                                <IconAction
                                    label={`Generate a new ${account.issuer} code`}
                                    onClick={advance}
                                >
                                    <motion.span
                                        key={code}
                                        initial={{rotate: -180}}
                                        animate={{rotate: 0}}
                                        transition={{duration: 0.28, ease: [0.23, 1, 0.32, 1]}}
                                        className="grid place-items-center"
                                    >
                                        <RotateCwIcon className="h-[13px] w-[13px]"/>
                                    </motion.span>
                                </IconAction>
                                <IconAction
                                    label={`Edit ${account.issuer} account`}
                                    onClick={onEdit}
                                >
                                    <PencilIcon className="h-[13px] w-[13px]"/>
                                </IconAction>
                                <IconAction
                                    label={`Delete ${account.issuer} account`}
                                    danger
                                    onClick={() => setConfirmingDelete(true)}
                                >
                                    <Trash2Icon className="h-[13px] w-[13px]"/>
                                </IconAction>
                            </div>
                            {hotkeyLabel && (
                                <kbd
                                    className="absolute right-1 top-1 rounded-[5px] border bg-white/[0.04] px-1.5 py-[2px] font-mono text-[10.5px] transition-opacity duration-150 ease-out group-hover:opacity-0 group-focus-within:opacity-0"
                                    style={{borderColor: 'var(--edge)', color: 'var(--label)'}}
                                >
                                    {hotkeyLabel}
                                </kbd>
                            )}
                        </>
                    )}

                    <span
                        className="font-mono text-[11px] tabular-nums"
                        style={{color: urgent ? '#f5a524' : 'rgba(161,161,170,0.65)'}}
                    >
              {seconds}s
            </span>
                </div>
            </div>

            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.06]">
          <span
              className="block h-full"
              style={{
                  width: `${progress * 100}%`,
                  backgroundImage: urgent
                      ? 'linear-gradient(to right, rgba(245,165,36,0.35), #f5a524)'
                      : `linear-gradient(to right, color-mix(in srgb, ${accent} 45%, transparent), ${accent})`,
                  transition: 'width 200ms linear',
              }}
          />
        </span>
        </div>
    )
}

interface IconActionProps {
    label: string
    danger?: boolean
    onClick: () => void
    children: React.ReactNode
}

function IconAction({label, danger = false, onClick, children}: IconActionProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className={[
                'grid h-6 w-6 place-items-center rounded-md text-zinc-400',
                'transition-colors duration-150 ease-out',
                danger ? 'hover:bg-red-500/15 hover:text-red-400' : 'hover:bg-white/10 hover:text-white',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
            ].join(' ')}
        >
            {children}
        </button>
    )
}

function msg(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
}
