import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A full settings screen: a grouped-background page with a centered title, an
 * optional back button (omitted on a standalone root), and an optional footer
 * pinned to the bottom (e.g. the version string). */
export function SettingsPage({
  title,
  onBack,
  backLabel = "Settings",
  footer,
  children,
}: {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center border-b px-1.5 py-2">
        <div className="flex min-w-[68px] items-center">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[13px] text-primary active:opacity-60"
            >
              <ChevronLeft className="size-4" />
              {backLabel}
            </button>
          )}
        </div>
        <span className="flex-1 text-center text-[13px] font-semibold">{title}</span>
        <div className="min-w-[68px]" />
      </div>

      <div className="macos-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-3.5">
        {children}
      </div>

      {footer && (
        <div className="border-t px-4 pb-3 pt-2 text-center text-[11px] text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}

/** A grouped card of rows with an optional header label above and footer note
 * below (the iOS inset-grouped style). Rows are hairline-separated. */
export function SettingsGroup({
  header,
  footer,
  children,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      {header && (
        <div className="px-3.5 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {header}
        </div>
      )}
      <div className="divide-y divide-border overflow-hidden rounded-[10px] border bg-card">
        {children}
      </div>
      {footer && <div className="px-3.5 pt-1.5 text-[11px] text-muted-foreground">{footer}</div>}
    </div>
  );
}

/** One row. Pressable when `onClick` is set (drill-in or action). `icon` is an
 * optional lucide node shown in a coloured rounded tile (`iconBg`). `value` is
 * trailing muted text; `chevron` adds the drill-in arrow. */
export function SettingsRow({
  icon,
  iconBg,
  label,
  value,
  chevron,
  destructive,
  disabled,
  trailing,
  onClick,
}: {
  icon?: ReactNode;
  iconBg?: string;
  label: ReactNode;
  value?: ReactNode;
  chevron?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  trailing?: ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <>
      {icon && (
        <span
          className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-white [&_svg]:size-[15px]"
          style={{ backgroundColor: iconBg ?? "var(--muted-foreground)" }}
        >
          {icon}
        </span>
      )}
      <span
        className={cn(
          "truncate text-[13px]",
          destructive ? "text-destructive" : "text-foreground",
        )}
      >
        {label}
      </span>
      <div className="ml-auto flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
        {value != null && <span className="max-w-[150px] truncate">{value}</span>}
        {trailing}
        {chevron && <ChevronRight className="size-4 shrink-0 text-tertiary-foreground" />}
      </div>
    </>
  );

  const rowClass = "flex min-h-[42px] w-full items-center gap-3 px-3.5 py-2 text-left";

  if (onClick) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(rowClass, "active:bg-muted disabled:opacity-50")}
      >
        {body}
      </button>
    );
  }
  return <div className={rowClass}>{body}</div>;
}
