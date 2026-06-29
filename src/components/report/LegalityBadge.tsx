/**
 * Small coloured pill that reports whether a team is legal in a given
 * regulation. Green when legal, red when not — tooltip carries the
 * reasons so the badge stays scannable next to the format / archetype
 * chips on the report header.
 *
 * Pure presentational — call {@link getLegalityFor} upstream to compute
 * `legal` / `reasons`. Keeping this dumb means the same component renders
 * the same way on TeamOverview and on Explore cards where we only know
 * the regulation tag, not the full team.
 */
interface LegalityBadgeProps {
  regulation: string;
  legal: boolean;
  reasons?: string[];
}

export function LegalityBadge({ regulation, legal, reasons = [] }: LegalityBadgeProps) {
  const shortLabel = legal ? `Legal in ${regulation}` : `Illegal in ${regulation}`;
  const longLabel = legal
    ? `Legal in ${regulation}`
    : reasons.length > 0
      ? `Illegal in ${regulation} — ${reasons[0]}`
      : `Illegal in ${regulation} — uses unlisted Mega`;

  // Tooltip body — every blocking reason on its own line, falls back to a
  // friendly default when the team is legal.
  const tooltip = legal
    ? longLabel
    : reasons.length > 0
      ? reasons.join("\n")
      : longLabel;

  return (
    <span
      role="status"
      aria-label={longLabel}
      title={tooltip}
      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${
        legal
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      }`}
    >
      <span aria-hidden="true">{legal ? "✓" : "✖"}</span>
      <span>{shortLabel}</span>
    </span>
  );
}
