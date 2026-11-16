import { describe, it, expect } from "vitest";

import {
  BLOG_POSTS,
  PUBLISHED_BLOG_POSTS,
  blogIndexUrl,
  blogPostPlainText,
  blogPostSlugs,
  blogPostUrl,
  blogReadingMinutes,
  blogSitemapEntries,
  formatBlogDate,
  getBlogPost,
} from "../blog-posts";

describe("getBlogPost — slug resolution", () => {
  it("resolves every published slug", () => {
    for (const slug of blogPostSlugs()) {
      expect(getBlogPost(slug)?.slug).toBe(slug);
    }
  });

  it("returns undefined for an unknown slug so the route can 404", () => {
    expect(getBlogPost("no-such-post")).toBeUndefined();
    expect(getBlogPost("")).toBeUndefined();
  });

  it("is case- and whitespace-sensitive — no accidental duplicate URLs", () => {
    const slug = blogPostSlugs()[0];
    expect(getBlogPost(slug.toUpperCase())).toBeUndefined();
    expect(getBlogPost(` ${slug} `)).toBeUndefined();
  });

  it("never resolves a draft post, even by its exact slug", () => {
    const drafts = BLOG_POSTS.filter((p) => p.status !== "published");
    for (const draft of drafts) {
      expect(getBlogPost(draft.slug)).toBeUndefined();
    }
  });

  it("publishes at least one post so the route has something to prerender", () => {
    expect(PUBLISHED_BLOG_POSTS.length).toBeGreaterThan(0);
  });
});

describe("slug and URL shape", () => {
  it("uses lowercase kebab-case slugs with no URL-escaping needed", () => {
    for (const post of BLOG_POSTS) {
      expect(post.slug, post.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(encodeURIComponent(post.slug)).toBe(post.slug);
    }
  });

  it("has no duplicate slugs", () => {
    const slugs = BLOG_POSTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("builds canonical URLs on the production origin", () => {
    expect(blogIndexUrl()).toBe("https://pokemonvgcteamreport.com/blog");
    for (const post of PUBLISHED_BLOG_POSTS) {
      expect(blogPostUrl(post.slug)).toBe(
        `https://pokemonvgcteamreport.com/blog/${post.slug}`,
      );
    }
  });
});

describe("metadata fields", () => {
  it("keeps metaTitle inside the SERP budget once the layout template is applied", () => {
    // Root layout appends " | VGC Team Report" (18 chars) to every title.
    for (const post of BLOG_POSTS) {
      expect(`${post.metaTitle} | VGC Team Report`.length, post.slug).toBeLessThanOrEqual(60);
    }
  });

  it("gives every post a unique, usefully-long description", () => {
    const seen = new Set<string>();
    for (const post of BLOG_POSTS) {
      expect(post.description.length, post.slug).toBeGreaterThanOrEqual(80);
      expect(post.description.length, post.slug).toBeLessThanOrEqual(170);
      expect(seen.has(post.description), `duplicate description: ${post.slug}`).toBe(false);
      seen.add(post.description);
    }
  });

  it("gives every post a unique title, keywords, tags and a named author", () => {
    const titles = new Set<string>();
    for (const post of BLOG_POSTS) {
      expect(titles.has(post.title), `duplicate title: ${post.slug}`).toBe(false);
      titles.add(post.title);
      expect(post.keywords.length, post.slug).toBeGreaterThan(0);
      expect(post.tags.length, post.slug).toBeGreaterThan(0);
      expect(post.author.name.trim().length, post.slug).toBeGreaterThan(0);
    }
  });

  it("uses valid ISO dates with dateModified never before datePublished", () => {
    for (const post of BLOG_POSTS) {
      expect(post.datePublished, post.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(post.dateModified, post.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(`${post.datePublished}T00:00:00Z`).getTime())).toBe(false);
      expect(post.dateModified >= post.datePublished, post.slug).toBe(true);
    }
  });

  it("orders published posts newest first", () => {
    const dates = PUBLISHED_BLOG_POSTS.map((p) => p.datePublished);
    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates);
  });

  it("formats dates for display without drifting across timezones", () => {
    expect(formatBlogDate("2026-11-16")).toBe("16 November 2026");
  });
});

describe("post body", () => {
  it("starts each post with content and derives a non-zero reading time", () => {
    for (const post of BLOG_POSTS) {
      expect(post.blocks.length, post.slug).toBeGreaterThan(0);
      expect(blogReadingMinutes(post), post.slug).toBeGreaterThanOrEqual(1);
    }
  });

  it("never declares a second h1 — the page title owns it", () => {
    // Block kinds map to h2/h3 only; this guards the content model itself.
    for (const post of BLOG_POSTS) {
      for (const block of post.blocks) {
        expect(["paragraph", "heading", "subheading", "list", "callout", "linkList"])
          .toContain(block.kind);
      }
    }
  });

  it("keeps heading order semantic — no subheading before its first heading", () => {
    for (const post of BLOG_POSTS) {
      let sawHeading = false;
      for (const block of post.blocks) {
        if (block.kind === "heading") sawHeading = true;
        if (block.kind === "subheading") {
          expect(sawHeading, `${post.slug}: h3 before any h2`).toBe(true);
        }
      }
    }
  });

  it("only links to internal app paths", () => {
    for (const post of BLOG_POSTS) {
      for (const block of post.blocks) {
        if (block.kind !== "linkList") continue;
        for (const link of block.items) {
          expect(link.href, `${post.slug}: ${link.href}`).toMatch(/^\/[a-z0-9/-]*$/);
          expect(link.label.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("content guards — nothing unverifiable ships in prerendered HTML", () => {
  const prose = BLOG_POSTS.map((p) => `${p.title} ${p.description} ${blogPostPlainText(p)}`);

  it("states no usage/meta percentage figures", () => {
    // Usage shares and tier percentages need a cited primary source. Until a
    // post carries one, a "%" in blog prose is a fabricated statistic.
    for (const [i, text] of prose.entries()) {
      expect(text, BLOG_POSTS[i].slug).not.toMatch(/\d\s*(%|per cent|percent)/i);
    }
  });

  it("states no EV-to-SP conversion number (VGC-330 is unresolved)", () => {
    // The exact EV boundary is disputed on this project. Content must point at
    // /tools/ev-to-sp instead of baking a number into indexed HTML.
    for (const [i, text] of prose.entries()) {
      const slug = BLOG_POSTS[i].slug;
      expect(text, slug).not.toMatch(/\b248\b/);
      expect(text, slug).not.toMatch(/\d+\s*EVs?\s*(?:=|is|equals|->|→|per|to)\s*\d+\s*SP/i);
      expect(text, slug).not.toMatch(/\d+\s*SP\s*(?:=|is|equals|->|→|per)\s*\d+\s*EVs?/i);
    }
  });

  it("keeps the SP budget facts correct wherever they are stated", () => {
    for (const [i, text] of prose.entries()) {
      const slug = BLOG_POSTS[i].slug;
      if (/\bSP\b/.test(text) && /total/i.test(text)) {
        // 66 total / 32 per stat are the only correct Champions budget numbers.
        const budgetNumbers = text.match(/(\d+)\s*SP/g) ?? [];
        for (const match of budgetNumbers) {
          const n = Number(match.replace(/\D/g, ""));
          expect([66, 32], `${slug}: unexpected SP figure "${match}"`).toContain(n);
        }
      }
    }
  });

  it("asserts no tournament results, placements or quoted players", () => {
    for (const [i, text] of prose.entries()) {
      const slug = BLOG_POSTS[i].slug;
      expect(text, slug).not.toMatch(/\b(won|winner|1st place|top cut|top 8|top 16)\b/i);
    }
  });
});

describe("blogSitemapEntries — consumed by src/app/sitemap.ts", () => {
  const entries = blogSitemapEntries();

  it("lists the index plus every published post, and nothing else", () => {
    expect(entries.map((e) => e.url)).toEqual([
      blogIndexUrl(),
      ...PUBLISHED_BLOG_POSTS.map((p) => blogPostUrl(p.slug)),
    ]);
  });

  it("never lists a draft post", () => {
    const draftUrls = BLOG_POSTS.filter((p) => p.status !== "published").map((p) =>
      blogPostUrl(p.slug),
    );
    for (const url of draftUrls) {
      expect(entries.some((e) => e.url === url)).toBe(false);
    }
  });

  it("emits valid sitemap fields", () => {
    for (const entry of entries) {
      expect(entry.url.startsWith("https://pokemonvgcteamreport.com/blog")).toBe(true);
      expect(entry.lastModified instanceof Date).toBe(true);
      expect(Number.isNaN(entry.lastModified.getTime())).toBe(false);
      expect(entry.changeFrequency).toBe("weekly");
      expect(entry.priority).toBeGreaterThan(0);
      expect(entry.priority).toBeLessThanOrEqual(1);
    }
  });

  it("dates each post entry from its own dateModified", () => {
    for (const post of PUBLISHED_BLOG_POSTS) {
      const entry = entries.find((e) => e.url === blogPostUrl(post.slug));
      expect(entry).toBeDefined();
      expect(entry!.lastModified.toISOString().slice(0, 10)).toBe(post.dateModified);
    }
  });
});
