import type React from "react";
import { PageShell } from "./shared/PageShell";
import { Hero } from "./home/Hero";
import { ProductShot } from "./home/ProductShot";
import { SurfacesBand } from "./home/SurfacesBand";
import { Security } from "./home/Security";
import { Extension } from "./home/Extension";
import { Features } from "./home/Features";
import { FinalCta } from "./home/FinalCta";

export function HomePage({ heroCta }: { heroCta?: React.ReactNode }) {
  return (
    <PageShell name="2FAu Landing">
  <Hero cta={heroCta} />
        <ProductShot />
        <div
          data-pencil-name="Band Divider Top"
          className="box-border w-full h-[1px] shrink-0 bg-[#262628]"
        ></div>
        <SurfacesBand />
        <div
          data-pencil-name="Band Divider Bottom"
          className="box-border w-full h-[1px] shrink-0 bg-[#262628]"
        ></div>
        <Security />
        <Extension />
        <Features />
        <FinalCta />
    </PageShell>
  );
}
