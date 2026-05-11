interface ViewCountProps {
  count: number;
}

export function ViewCount({ count }: ViewCountProps) {
  if (count <= 0) return null;
  const label = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-text-tertiary"
      aria-label={`${label} views`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <span className="font-semibold" aria-hidden="true">
        {label}
      </span>
    </span>
  );
}
