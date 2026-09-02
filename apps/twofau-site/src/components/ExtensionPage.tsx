import { PageShell } from "./shared/PageShell";
import { PageHeader } from "./extension/PageHeader";
import { Features } from "./extension/Features";
import { Differences } from "./extension/Differences";
import { Permissions } from "./extension/Permissions";
import { InstallCTA } from "./extension/InstallCTA";

export function ExtensionPage() {
  return (
    <PageShell name="2FAu Extension" active="extension" chromeCta>
      <PageHeader />
      <Features />
      <Differences />
      <Permissions />
      <InstallCTA />
    </PageShell>
  );
}
