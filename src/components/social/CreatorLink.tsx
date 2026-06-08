interface CreatorLinkProps {
  name: string;
  className?: string;
}

export function CreatorLink({ name, className = "" }: CreatorLinkProps) {
  return (
    <a
      href={`/creator/${encodeURIComponent(name)}`}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-accent transition-colors ${className}`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <span>{name}</span>
    </a>
  );
}
