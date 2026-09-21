import { expect, it } from "vitest";
import { readNotificationPrefs } from "../notification-preferences";
it("preserves explicit opt-outs and defaults only missing or malformed choices", () => {
  expect(readNotificationPrefs({ weeklyDigest: false, productUpdates: "false" })).toEqual({ welcomeSeries: true, weeklyDigest: false, socialActivity: true, productUpdates: true });
  expect(readNotificationPrefs(null).weeklyDigest).toBe(true);
});
