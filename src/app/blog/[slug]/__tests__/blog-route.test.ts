import { describe, it, expect, vi } from "vitest";

/**
 * notFound() normally throws a Next-internal control-flow error. Mocking it
 * with a recognisable error keeps the assertion deterministic while still
 * proving the page delegates an unknown slug to the app's 404 instead of
 * rendering something (or crashing on a null post).
 */
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import {
  PUBLISHED_BLOG_POSTS,
  blogPostSlugs,
  blogPostUrl,
} from "@/lib/data/blog-posts";

import BlogPostPage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from "../page";

const KNOWN_SLUG = blogPostSlugs()[0];

describe("generateStaticParams — /blog/[slug] must be prerendered", () => {
  it("returns one param object per published post", () => {
    expect(generateStaticParams()).toEqual(
      PUBLISHED_BLOG_POSTS.map((p) => ({ slug: p.slug })),
    );
  });

  it("returns at least one slug, so the route is not an empty SSG shell", () => {
    expect(generateStaticParams().length).toBeGreaterThan(0);
  });

  it("opts out of on-demand params so unknown slugs 404 instead of being SSR'd", () => {
    expect(dynamicParams).toBe(false);
  });
});

describe("generateMetadata", () => {
  it("builds unique title, description and canonical for a known slug", async () => {
    const post = PUBLISHED_BLOG_POSTS[0];
    const meta = await generateMetadata({ params: Promise.resolve({ slug: post.slug }) });

    expect(meta.title).toBe(post.metaTitle);
    expect(meta.description).toBe(post.description);
    expect(meta.alternates?.canonical).toBe(blogPostUrl(post.slug));
    expect(meta.keywords).toEqual(post.keywords);
  });

  it("emits article OpenGraph with published/modified times and author", async () => {
    const post = PUBLISHED_BLOG_POSTS[0];
    const meta = await generateMetadata({ params: Promise.resolve({ slug: post.slug }) });
    const og = meta.openGraph as Record<string, unknown> | undefined;

    expect(og?.type).toBe("article");
    expect(og?.url).toBe(blogPostUrl(post.slug));
    expect(og?.title).toBe(post.title);
    expect(og?.publishedTime).toBe(post.datePublished);
    expect(og?.modifiedTime).toBe(post.dateModified);
    expect(og?.authors).toEqual([post.author.name]);
    const tw = meta.twitter as Record<string, unknown> | undefined;
    expect(tw?.card).toBe("summary_large_image");
  });

  it("returns no metadata for an unknown slug rather than throwing", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "does-not-exist" }) }),
    ).resolves.toEqual({});
  });

  it("gives each published post a distinct canonical URL", async () => {
    const canonicals = await Promise.all(
      PUBLISHED_BLOG_POSTS.map(async (p) => {
        const meta = await generateMetadata({ params: Promise.resolve({ slug: p.slug }) });
        return meta.alternates?.canonical;
      }),
    );
    expect(new Set(canonicals).size).toBe(canonicals.length);
  });
});

describe("page component", () => {
  it("renders a known slug without throwing", async () => {
    await expect(
      BlogPostPage({ params: Promise.resolve({ slug: KNOWN_SLUG }) }),
    ).resolves.toBeTruthy();
  });

  it("calls notFound() for an unknown slug instead of crashing", async () => {
    await expect(
      BlogPostPage({ params: Promise.resolve({ slug: "definitely-not-a-post" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("calls notFound() for a trailing-slash / cased variant of a real slug", async () => {
    await expect(
      BlogPostPage({ params: Promise.resolve({ slug: KNOWN_SLUG.toUpperCase() }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
