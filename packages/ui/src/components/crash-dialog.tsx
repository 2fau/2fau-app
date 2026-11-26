import { useState } from "react";
import { useT } from "@twofau/i18n/react";
import { Button } from "@/components/ui/button";
import type { CrashReport } from "@/core/settings";

/** Covers the panel after a native crash: what happened, the full report
 * (selectable), and ways to hand it to us. Nothing is sent automatically —
 * Report opens a prefilled GitHub issue the user submits themselves. */
export function CrashDialog({
  report,
  onReport,
  onDismiss,
}: {
  report: CrashReport;
  onReport: () => void;
  onDismiss: () => void;
}) {
  const tr = useT();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(report.text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="crash-title"
      aria-describedby="crash-desc"
      className="absolute inset-0 z-50 flex flex-col gap-2 bg-background p-3 text-foreground"
    >
      <p id="crash-title" className="text-[15px] font-semibold">
        {tr.t("2FAU crashed")}
      </p>
      <p id="crash-desc" className="text-[12px] leading-relaxed text-muted-foreground">
        {tr.t(
          "A crash report was saved on this device. Reporting it on GitHub opens a prefilled issue you can review before sending.",
        )}
      </p>
      <p className="text-[12px] font-medium break-words">{report.message}</p>
      <pre
        tabIndex={0}
        className="macos-scroll min-h-0 flex-1 overflow-auto rounded-md border bg-muted p-2 font-mono text-[10px] leading-snug whitespace-pre select-text"
      >
        {report.text}
      </pre>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={copy}>
          {copied ? tr.t("Copied") : tr.t("Copy")}
        </Button>
        <Button variant="ghost" size="sm" className="flex-1" onClick={onDismiss}>
          {tr.t("Dismiss")}
        </Button>
      </div>
      <Button size="sm" className="w-full" onClick={onReport}>
        {tr.t("Report on GitHub")}
      </Button>
    </div>
  );
}
