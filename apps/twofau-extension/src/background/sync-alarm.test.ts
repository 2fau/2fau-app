import { beforeEach, describe, expect, it } from "vitest";
import { type FakeChrome, installFakeChrome } from "../test/fake-chrome";
import { writeSettings } from "../vault/settings";
import { ensureSyncAlarm, SYNC_ALARM, SYNC_PERIOD_MINUTES } from "./sync-alarm";

let fake: FakeChrome;

beforeEach(() => {
  fake = installFakeChrome();
});

describe("ensureSyncAlarm", () => {
  it("arms a periodic alarm in sync mode", async () => {
    await writeSettings({ mode: "sync" });
    await ensureSyncAlarm();
    expect(fake.alarms.created[SYNC_ALARM]).toBe(SYNC_PERIOD_MINUTES);
  });

  it("clears the alarm outside sync mode", async () => {
    await writeSettings({ mode: "sync" });
    await ensureSyncAlarm();
    await writeSettings({ mode: "independent" });
    await ensureSyncAlarm();
    expect(fake.alarms.created[SYNC_ALARM]).toBeUndefined();
  });
});
