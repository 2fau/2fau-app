import { useEffect, useState } from "react";
import { STORE } from "../../config/links";

/**
 * The nav "Add to …" pill. Server-renders the Chrome default so the markup is
 * stable, then on mount detects the visitor's browser and swaps the label + store
 * link (Firefox → AMO, Edge → labelled for Edge but installs from the Web Store,
 * everything else → Chrome Web Store).
 */

type Target = { label: string; href: string };

/** The three install labels, resolved server-side for the active locale. */
export type InstallLabels = { chrome: string; firefox: string; edge: string };

const DEFAULT_LABELS: InstallLabels = {
  chrome: "Add to Chrome",
  firefox: "Add to Firefox",
  edge: "Add to Edge",
};

export function detectInstall(ua: string, labels: InstallLabels): Target {
  const s = ua.toLowerCase();
  if (/firefox\/|fxios/.test(s)) return { label: labels.firefox, href: STORE.firefox };
  if (/edg\//.test(s)) return { label: labels.edge, href: STORE.chrome };
  // Chrome, Brave, and other Chromium browsers install from the Web Store.
  return { label: labels.chrome, href: STORE.chrome };
}

export function NavInstallButton({ labels = DEFAULT_LABELS }: { labels?: InstallLabels }) {
  const [target, setTarget] = useState<Target>({ label: labels.chrome, href: STORE.chrome });

  useEffect(() => {
    setTarget(detectInstall(window.navigator.userAgent, labels));
  }, [labels]);

  return (
    <a
      href={target.href}
      target="_blank"
      rel="noreferrer noopener"
      data-pencil-name="Nav Download"
      className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 p-[8px_15px] justify-start items-center bg-[#0A84FF] [outline:1px_solid_#0A84FF00] [outline-offset:-0.5px] rounded-[999px] no-underline transition-[filter] hover:brightness-110"
    >
      <span
        data-pencil-name="Label"
        className="text-[13.5px]/[normal] box-border text-[#FFFFFF] font-[Inter,system-ui,sans-serif] font-semibold text-left [white-space:nowrap]"
      >
        {target.label}
      </span>
    </a>
  );
}
