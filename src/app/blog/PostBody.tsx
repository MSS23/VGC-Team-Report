import Link from "next/link";
import type { BlogBlock } from "@/lib/data/blog-posts";

/**
 * Renders a post's typed blocks as semantic HTML.
 *
 * Server component — nothing here is interactive. Heading order is fixed by
 * the block kind (heading -> h2, subheading -> h3) so a post can never skip a
 * level or introduce a second h1; the page title owns the only h1.
 */
export function PostBody({ blocks }: { blocks: readonly BlogBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: BlogBlock }) {
  switch (block.kind) {
    case "heading":
      return (
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight pt-4">
          {block.text}
        </h2>
      );

    case "subheading":
      return (
        <h3 className="text-base sm:text-lg font-semibold text-text-primary pt-2">
          {block.text}
        </h3>
      );

    case "paragraph":
      return (
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
          {block.text}
        </p>
      );

    case "list":
      return (
        <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-text-secondary leading-relaxed">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );

    case "callout":
      return (
        <aside className="flex gap-3 rounded-xl border border-border bg-surface-alt px-4 py-3">
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 flex-shrink-0 text-text-tertiary"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-sm text-text-secondary leading-relaxed">{block.text}</p>
        </aside>
      );

    case "linkList":
      return (
        <ul className="grid gap-3 sm:grid-cols-2">
          {block.items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex min-h-11 flex-col justify-center rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/40 hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="text-sm font-semibold text-text-primary">
                  {item.label}
                </span>
                {item.description && (
                  <span className="mt-0.5 text-xs text-text-secondary leading-relaxed">
                    {item.description}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      );
  }
}
