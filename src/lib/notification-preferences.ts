export interface NotificationPrefs {
  welcomeSeries: boolean;
  weeklyDigest: boolean;
  socialActivity: boolean;
  productUpdates: boolean;
}
export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  welcomeSeries: true, weeklyDigest: true, socialActivity: true, productUpdates: true,
};
export function readNotificationPrefs(value: unknown): NotificationPrefs {
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS };
  if (!value || typeof value !== "object" || Array.isArray(value)) return prefs;
  for (const key of Object.keys(prefs) as (keyof NotificationPrefs)[]) {
    const saved = (value as Record<string, unknown>)[key];
    if (typeof saved === "boolean") prefs[key] = saved;
  }
  return prefs;
}
