import { PageShell } from "./shared/PageShell";
import { PageHeader } from "./desktop/PageHeader";
import { Window } from "./desktop/Window";
import { Features } from "./desktop/Features";
import { Platforms } from "./desktop/Platforms";
import { DownloadCTA } from "./desktop/DownloadCTA";

export function DesktopPage() {
  return (
    <PageShell name="2FAu Desktop" active="desktop">
      <PageHeader />
      <Window />
      <Features />
      <Platforms />
      <DownloadCTA />
    </PageShell>
  );
}
