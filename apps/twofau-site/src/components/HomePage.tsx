import { Nav } from "./home/Nav";
import { Hero } from "./home/Hero";
import { ProductShot } from "./home/ProductShot";
import { SurfacesBand } from "./home/SurfacesBand";
import { Security } from "./home/Security";
import { Extension } from "./home/Extension";
import { Features } from "./home/Features";
import { FinalCta } from "./home/FinalCta";
import { Footer } from "./home/Footer";

export function HomePage() {
  return (
    <div
      data-pencil-name="2FAu Landing"
      className="box-border h-fit flex flex-col gap-0 justify-start items-start bg-[#0B0B0D] overflow-hidden"
    >
      <Nav />
      <div
        data-pencil-name="Nav Divider"
        className="box-border w-full h-[1px] shrink-0 bg-[#262628]"
      ></div>
      <Hero />
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
      <div
        data-pencil-name="Footer Divider Top"
        className="box-border w-full h-[1px] shrink-0 bg-[#262628]"
      ></div>
      <Footer />
    </div>
  );
}
