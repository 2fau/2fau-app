import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Account } from "@/core/types";
import type { AddManualFields, Capabilities, VaultService } from "@/core/vault-service";
import { useNow } from "@/hooks/use-now";

interface VaultContextValue {
  service: VaultService;
  capabilities: Capabilities;
  locked: boolean;
  needsSetup: boolean;
  accounts: Account[];
  /** Current code per account id, recomputed every second. */
  codes: Record<string, string>;
  now: number;
  unlock: (passphrase: string) => Promise<void>;
  /** Lock the vault, returning to the unlock screen. */
  lock: () => Promise<void>;
  addUri: (uri: string) => Promise<Account>;
  addManual: (fields: AddManualFields) => Promise<Account>;
  update: (account: Account) => Promise<void>;
  reorder: (orderedIds: string[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
  advanceHotp: (id: string) => Promise<void>;
  secretUri: (id: string) => Promise<string>;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({
  service,
  children,
}: {
  service: VaultService;
  children: ReactNode;
}) {
  const rawNow = useNow();
  // Correct for a wrong machine clock: the host may supply an offset (trusted −
  // local ms) from a network time sync. Poll it (it refreshes in the background)
  // and add it to every timestamp the UI derives codes from, so a drifted clock
  // never yields a wrong code. Hosts without time-sync leave `now` = local.
  const [timeOffset, setTimeOffset] = useState(0);
  useEffect(() => {
    const get = service.getTimeOffsetMs;
    if (!get) return;
    let alive = true;
    const pull = () =>
      get.call(service).then(
        (o) => {
          if (alive) setTimeOffset(o);
        },
        () => {},
      );
    void pull();
    const id = setInterval(pull, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [service]);
  const now = rawNow + timeOffset;
  const [locked, setLocked] = useState(() => service.isLocked());
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [codes, setCodes] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    setAccounts(await service.list());
  }, [service]);

  useEffect(() => {
    if (!locked) void refresh();
  }, [locked, refresh]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const pairs = await Promise.all(
        accounts.map(async (a) => [a.id, await service.code(a, now)] as const),
      );
      if (!cancelled) setCodes(Object.fromEntries(pairs));
    })();
    return () => {
      cancelled = true;
    };
  }, [accounts, now, service]);

  const value: VaultContextValue = {
    service,
    capabilities: service.capabilities(),
    locked,
    needsSetup: service.needsSetup(),
    accounts,
    codes,
    now,
    unlock: async (passphrase) => {
      await service.unlock(passphrase);
      setLocked(false);
      await refresh();
    },
    lock: async () => {
      await service.lock();
      setLocked(true);
      // Drop any decrypted account/code state so nothing lingers behind the
      // unlock screen.
      setAccounts([]);
      setCodes({});
    },
    addUri: async (uri) => {
      const a = await service.addUri(uri);
      await refresh();
      return a;
    },
    addManual: async (fields) => {
      const a = await service.addManual(fields);
      await refresh();
      return a;
    },
    update: async (account) => {
      await service.update(account);
      await refresh();
    },
    reorder: async (orderedIds) => {
      // Reflect the new order immediately, then persist.
      setAccounts((prev) => {
        const rank = new Map(orderedIds.map((id, i) => [id, i]));
        return [...prev].sort(
          (a, b) =>
            (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
            (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
        );
      });
      await service.reorder(orderedIds);
    },
    remove: async (id) => {
      await service.remove(id);
      await refresh();
    },
    advanceHotp: async (id) => {
      await service.advanceHotp(id);
      await refresh();
    },
    secretUri: (id) => service.secretUri(id),
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault(): VaultContextValue {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within a VaultProvider");
  return ctx;
}
