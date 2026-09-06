import { useEffect, useState } from "react";
import { STORE } from "../../config/links";

/**
 * The nav "Add to …" pill. Server-renders the Chrome default so the markup is
 * stable, then on mount detects the visitor's browser and swaps the label + store
 * link (Firefox → AMO, Edge → labelled for Edge but installs from the Web Store,
 * everything else → Chrome Web Store).
 */

type Target = { label: string; href: string };

const CHROME: Target = { label: "Add to Chrome", href: STORE.chrome };

export function detectInstall(ua: string): Target {
  const s = ua.toLowerCase();
  if (/firefox\/|fxios/.test(s)) return { label: "Add to Firefox", href: STORE.firefox };
  if (/edg\//.test(s)) return { label: "Add to Edge", href: STORE.chrome };
  return CHROME; // Chrome, Brave, and other Chromium browsers install from the Web Store.
}

export function NavInstallButton() {
  const [target, setTarget] = useState<Target>(CHROME);

  useEffect(() => {
    setTarget(detectInstall(window.navigator.userAgent));
  }, []);

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
