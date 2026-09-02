import { PageShell } from "./shared/PageShell";
import { PageHeader } from "./security/PageHeader";
import { VaultFormat } from "./security/VaultFormat";
import { ThreatModel } from "./security/ThreatModel";
import { KeysAndUnlock } from "./security/KeysAndUnlock";
import { Disclosure } from "./security/Disclosure";

export function SecurityPage() {
  return (
    <PageShell name="2FAu Security" active="security">
      <PageHeader />
      <VaultFormat />
      <ThreatModel />
      <KeysAndUnlock />
      <Disclosure />
    </PageShell>
  );
}
