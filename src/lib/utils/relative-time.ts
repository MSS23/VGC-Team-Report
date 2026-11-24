export interface RelativeTimeOptions {
  /** Label for under a minute (and future timestamps). Default "Just now". */
  justNow?: string;
  /**
   * When set, timestamps 7+ days old (and unparseable ones) are passed here
   * instead of getting the "Nd ago" / "Nmo ago" labels.
   */
  formatOlder?: (date: Date) => string;
}

export function relativeTime(dateStr: string, options: RelativeTimeOptions = {}): string {
  const { justNow = "Just now", formatOlder } = options;
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  // `!(days < 7)` rather than `days >= 7` so an invalid date (NaN) lands here too.
  if (formatOlder && !(days < 7)) return formatOlder(new Date(dateStr));
  if (days > 30) return `${Math.floor(days / 30)}mo ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return justNow;
}
