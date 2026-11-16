/**
 * Blog post source for /blog and /blog/[slug] (VGC-227).
 *
 * Posts are authored as typed blocks rather than MDX on purpose: the route is
 * prerendered (SSG) and SEO-critical, and a block model keeps every post
 * machine-checkable by vitest — slug shape, metadata length, date ordering and
 * the content guards below — without adding an MDX pipeline to the build.
 *
 * Editorial policy encoded here (and enforced in __tests__/blog-posts.test.ts):
 *   - No usage percentages, tournament results or player quotes unless they
 *     come with a verifiable primary source. Unsourced numbers in prerendered
 *     HTML are worse than no post at all.
 *   - No EV -> SP conversion number in prose. The exact boundary is an open
 *     question on this project (VGC-330); stating one here would bake a
 *     contradiction into indexed content. Point at /tools/ev-to-sp instead.
 */

export const BLOG_BASE_PATH = "/blog";
export const SITE_ORIGIN = "https://pokemonvgcteamreport.com";

/** A single rendered unit of post body copy. */
export type BlogBlock =
  /** Body copy. Renders as <p>. */
  | { kind: "paragraph"; text: string }
  /** Section heading. Renders as <h2> — the post title owns the only <h1>. */
  | { kind: "heading"; text: string }
  /** Sub-section heading inside a section. Renders as <h3>. */
  | { kind: "subheading"; text: string }
  /** Unordered list. Perplexity/ChatGPT extract list items well. */
  | { kind: "list"; items: string[] }
  /** Set-apart note (editorial status, caveats). Renders as <aside>. */
  | { kind: "callout"; text: string }
  /** Internal navigation block. Renders as a <ul> of <Link>s. */
  | { kind: "linkList"; items: BlogLink[] };

export interface BlogLink {
  label: string;
  /** Internal app path, e.g. "/champions". */
  href: string;
  description?: string;
}

export interface BlogAuthor {
  name: string;
  /** Optional profile URL for the Article author node. */
  url?: string;
}

export interface BlogPost {
  /** URL segment. Lowercase kebab-case; this is the canonical identity. */
  slug: string;
  /** Page <h1> and OpenGraph title. */
  title: string;
  /**
   * Shorter title for <title>. The root layout appends
   * " | VGC Team Report" (18 chars), so keep this <= 46 chars to stay
   * inside Google's ~60-char SERP budget.
   */
  metaTitle: string;
  /** Meta description / OpenGraph description. */
  description: string;
  /** ISO date (YYYY-MM-DD). */
  datePublished: string;
  /** ISO date (YYYY-MM-DD). Never earlier than datePublished. */
  dateModified: string;
  author: BlogAuthor;
  keywords: string[];
  /** Short labels shown on the index card. */
  tags: string[];
  /**
   * Only "published" posts get a route, a sitemap entry or an index card.
   * Draft copy lives in .swarm/drafts/, not here.
   */
  status: "published" | "draft";
  /**
   * Marks a scaffolding post that exists so the route has something real to
   * render. Surfaced in the UI so readers aren't misled about its depth.
   */
  isStarterPost?: boolean;
  blocks: BlogBlock[];
}

const STARTER_POST: BlogPost = {
  slug: "welcome-to-the-vgc-team-report-blog",
  title: "Welcome to the VGC Team Report Blog",
  metaTitle: "Welcome to the VGC Team Report Blog",
  description:
    "The first post on the VGC Team Report blog: what it will cover, and a quick tour of what the site already does for VGC and Pokemon Champions players.",
  datePublished: "2026-11-16",
  dateModified: "2026-11-16",
  author: { name: "Manraj Sidhu" },
  keywords: [
    "VGC Team Report blog",
    "Pokemon Champions guide",
    "Regulation M-C",
    "VGC team report",
    "Pokemon Champions SP",
    "VGC 2026",
  ],
  tags: ["Site news", "Pokemon Champions"],
  status: "published",
  isStarterPost: true,
  blocks: [
    {
      kind: "callout",
      text:
        "Starter post. This is the first entry on the blog and exists so the feed has something real to render. Format guides and dated meta write-ups follow here.",
    },
    {
      kind: "paragraph",
      text:
        "VGC Team Report turns a Pokemon Showdown paste into a shareable team report: every Pokemon's build, its speed tier against the rest of the field, damage calculations, and format legality. It is free, works without an account, and this blog is where the longer-form writing about it will live.",
    },
    { kind: "heading", text: "What this blog will cover" },
    {
      kind: "list",
      items: [
        "Format guides for the Pokemon Champions regulations the app supports, starting with the current Regulation M-C.",
        "Walkthroughs of the report builder — what each section of a report is for and how to read it.",
        "Notes on what changed in the app, for anything too long to fit in the changelog.",
        "Dated meta write-ups, published only when they can cite a primary source for every number in them.",
      ],
    },
    { kind: "heading", text: "What the site already does" },
    {
      kind: "list",
      items: [
        "Paste a Showdown team (or a PokePaste URL) and get a parsed report with moves, items, natures and spreads.",
        "Compare your team's speed tiers on one chart instead of calculating them one Pokemon at a time.",
        "Run damage calculations against the builds in your report.",
        "Check a team against Pokemon Champions legality rules — dex, Mega Stones, restricted limit, item clause and the stat budget.",
        "Convert an EV spread to Stat Points, and back, with the converter at /tools/ev-to-sp.",
        "Read per-Mega guides under /champions, one page per Mega Evolution legal in the current regulation.",
        "Publish a report to a share link, keep it unlisted, or post it to the community Explore page.",
      ],
    },
    { kind: "heading", text: "Pokemon Champions in one minute" },
    { kind: "subheading", text: "The regulations are nested" },
    {
      kind: "paragraph",
      text:
        "Regulation M-A, M-B and M-C are supersets of each other, not separate formats: M-B keeps everything legal in M-A and adds to it, and M-C keeps everything legal in M-B and adds to it. Regulation M-C is the current format, running from 9 September to 2 December 2026. In practice that means a Pokemon or Mega is legal from the rotation that introduced it onward, so the useful question is never \"is this M-C legal?\" on its own but \"which rotation did it arrive in?\".",
    },
    { kind: "subheading", text: "SP replaces EVs" },
    {
      kind: "paragraph",
      text:
        "Pokemon Champions drops EVs for Stat Points, or SP. A Champions build gets 66 SP in total and no more than 32 SP in any single stat, which is a much tighter budget than the one VGC players are used to and makes the trade-offs in a spread far more visible. VGC Team Report reads pastes written either way: give it SP and it uses them directly, give it an EV spread and it converts for you. If you want to see a specific spread translated, use the converter at /tools/ev-to-sp rather than working from a rule of thumb.",
    },
    { kind: "subheading", text: "Everything is level 50" },
    {
      kind: "paragraph",
      text:
        "VGC is played at level 50, always. The app calculates every stat at level 50 and ignores any Level line in a pasted team, so a paste exported at level 100 still produces the correct report.",
    },
    { kind: "heading", text: "Where to go next" },
    {
      kind: "linkList",
      items: [
        {
          label: "Champions Mega guides",
          href: "/champions",
          description: "One page per Mega Evolution legal in the current regulation.",
        },
        {
          label: "EV to SP converter",
          href: "/tools/ev-to-sp",
          description: "Translate a spread against the 66 SP budget and 32 SP per-stat cap.",
        },
        {
          label: "Frequently asked questions",
          href: "/faq",
          description: "How reports, sharing and collaboration work.",
        },
        {
          label: "Explore community teams",
          href: "/explore",
          description: "Public team reports published by other players.",
        },
      ],
    },
  ],
};

/** Every post, published or not. Prefer PUBLISHED_BLOG_POSTS for rendering. */
export const BLOG_POSTS: readonly BlogPost[] = [STARTER_POST];

/** Published posts, newest first. The index and the sitemap both use this. */
export const PUBLISHED_BLOG_POSTS: readonly BlogPost[] = [...BLOG_POSTS]
  .filter((p) => p.status === "published")
  .sort((a, b) => b.datePublished.localeCompare(a.datePublished));

const BLOG_POST_BY_SLUG = new Map(PUBLISHED_BLOG_POSTS.map((p) => [p.slug, p]));

/**
 * Resolve a URL segment to a published post.
 *
 * Returns undefined for an unknown slug AND for a slug that exists only as a
 * draft, so an unpublished post can never be reached by guessing its URL.
 * Callers are expected to notFound() on undefined.
 */
export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POST_BY_SLUG.get(slug);
}

/** Slugs to prerender. */
export function blogPostSlugs(): string[] {
  return PUBLISHED_BLOG_POSTS.map((p) => p.slug);
}

/** Absolute canonical URL for a post. */
export function blogPostUrl(slug: string): string {
  return `${SITE_ORIGIN}${BLOG_BASE_PATH}/${slug}`;
}

/** Absolute canonical URL for the blog index. */
export function blogIndexUrl(): string {
  return `${SITE_ORIGIN}${BLOG_BASE_PATH}`;
}

/** Plain-text body of a post — used for reading time and content linting. */
export function blogPostPlainText(post: BlogPost): string {
  return post.blocks
    .map((block) => {
      switch (block.kind) {
        case "paragraph":
        case "heading":
        case "subheading":
        case "callout":
          return block.text;
        case "list":
          return block.items.join(" ");
        case "linkList":
          return block.items
            .map((i) => [i.label, i.description].filter(Boolean).join(" "))
            .join(" ");
      }
    })
    .join(" ");
}

/**
 * Reading time in whole minutes, at 200 wpm, minimum 1.
 *
 * Derived rather than hand-written so it cannot drift when a post is edited.
 */
export function blogReadingMinutes(post: BlogPost): number {
  const words = blogPostPlainText(post).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Display form of an ISO date, e.g. "16 November 2026". */
export function formatBlogDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export interface BlogSitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: "weekly";
  priority: number;
}

/**
 * Blog URLs for src/app/sitemap.ts — the index plus every published post.
 *
 * Exported as a ready-made list so the sitemap never has to know the post
 * shape, and so a new post appears in the sitemap with no sitemap edit.
 */
export function blogSitemapEntries(): BlogSitemapEntry[] {
  return [
    {
      url: blogIndexUrl(),
      lastModified: new Date(
        `${PUBLISHED_BLOG_POSTS[0]?.dateModified ?? "2026-11-16"}T00:00:00Z`,
      ),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...PUBLISHED_BLOG_POSTS.map((post) => ({
      url: blogPostUrl(post.slug),
      lastModified: new Date(`${post.dateModified}T00:00:00Z`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
