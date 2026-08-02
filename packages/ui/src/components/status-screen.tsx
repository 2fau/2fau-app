import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface StatusAction {
  label: string;
  onClick: () => void;
  variant?: ComponentProps<typeof Button>["variant"];
}

/** A full-panel empty/notice state: a centered icon, title, message, and any
 * recovery actions. Used when there's nothing to list — e.g. the extension is
 * in Desktop-vault mode but the desktop app is closed. Matches the popup's fixed
 * size and dark panel so it reads as a normal screen, not an error page. */
export function StatusScreen({
  icon,
  title,
  message,
  actions,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  actions?: StatusAction[];
}) {
  return (
    <div className="dark flex h-[458px] w-[320px] flex-col items-center justify-center gap-2.5 overflow-hidden bg-background px-8 text-center text-foreground">
      {icon && <div className="mb-1 text-muted-foreground">{icon}</div>}
      <p className="text-[15px] font-semibold">{title}</p>
      {message && (
        <p className="text-[12px] leading-relaxed text-muted-foreground">{message}</p>
      )}
      {actions && actions.length > 0 && (
        <div className="mt-3 flex w-full flex-col gap-2">
          {actions.map((a) => (
            <Button key={a.label} variant={a.variant} className="w-full" onClick={a.onClick}>
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
