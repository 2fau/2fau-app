import type React from "react";
import { SiteNav, type SiteNavProps } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";

export interface PageShellProps extends SiteNavProps {
  /** Mirrors the canvas frame name, so exported markup stays traceable. */
  name: string;
  children: React.ReactNode;
}

const RULE = "box-border w-full h-[1px] shrink-0 bg-[#262628]";

/**
 * The page chrome shared by every route: full-width column, nav, hairline
 * rules and footer. Sections supply their own inner container, so nothing here
 * pins a width.
 */
export function PageShell({ name, active, chromeCta, children }: PageShellProps) {
  return (
    <div
      data-pencil-name={name}
      className="box-border h-fit flex flex-col gap-0 justify-start items-start bg-[#0B0B0D] overflow-hidden"
    >
      <SiteNav active={active} chromeCta={chromeCta} />
      <div data-pencil-name="Nav Divider" className={RULE}></div>
      {children}
      <div data-pencil-name="Footer Divider Top" className={RULE}></div>
      <SiteFooter />
    </div>
  );
}
