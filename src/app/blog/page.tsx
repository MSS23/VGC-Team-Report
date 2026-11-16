import type { Metadata } from "next";
import Link from "next/link";

import { BreadcrumbListJsonLd, JsonLd } from "@/components/seo/JsonLd";
import { PageFooter } from "@/components/layout/PageFooter";
import {
  PUBLISHED_BLOG_POSTS,
  blogIndexUrl,
  blogPostUrl,
  blogReadingMinutes,
  formatBlogDate,
} from "@/lib/data/blog-posts";

const TITLE = "Blog";
const DESCRIPTION =
  "Guides and write-ups from VGC Team Report: Pokemon Champions regulations, SP spreads, reading a team report, and what is new in the app.";

// Nothing here reads the request or the database — the post source is a typed
// module, so the index is fully static and prerendered at build time.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "VGC blog",
    "Pokemon Champions guides",
    "VGC team report blog",
    "Regulation M-C",
    "Pokemon Champions SP",
    "VGC 2026",
  ],
  alternates: { canonical: blogIndexUrl() },
  openGraph: {
    title: "VGC Team Report Blog",
    description: DESCRIPTION,
    url: blogIndexUrl(),
    type: "website",
    siteName: "VGC Team Report",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VGC Team Report Blog",
    description: DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
};

export default function BlogIndexPage() {
  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "Blog", url: blogIndexUrl() },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "VGC Team Report Blog",
          description: DESCRIPTION,
          url: blogIndexUrl(),
          inLanguage: "en",
          publisher: {
            "@type": "Organization",
            name: "VGC Team Report",
            url: "https://pokemonvgcteamreport.com",
          },
          blogPost: PUBLISHED_BLOG_POSTS.map((post) => ({
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            url: blogPostUrl(post.slug),
            datePublished: post.datePublished,
            dateModified: post.dateModified,
            author: { "@type": "Person", name: post.author.name },
          })),
        }}
      />

      <div className="min-h-screen bg-background">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mb-2">
            Blog
          </h1>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-2xl mb-10">
            Guides and write-ups for VGC and Pok&eacute;mon Champions players — formats,
            spreads, and how to get the most out of a team report.
          </p>

          {PUBLISHED_BLOG_POSTS.length === 0 ? (
            <p className="text-sm text-text-tertiary">
              No posts yet. Check back soon.
            </p>
          ) : (
            <ul className="space-y-4">
              {PUBLISHED_BLOG_POSTS.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block rounded-xl border border-border bg-surface px-4 py-4 sm:px-6 sm:py-5 transition-colors hover:border-accent/40 hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <time
                        dateTime={post.datePublished}
                        className="text-xs font-medium text-text-tertiary"
                      >
                        {formatBlogDate(post.datePublished)}
                      </time>
                      <span aria-hidden="true" className="text-xs text-text-tertiary">
                        &middot;
                      </span>
                      <span className="text-xs text-text-tertiary">
                        {blogReadingMinutes(post)} min read
                      </span>
                      {post.isStarterPost && (
                        <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-semibold text-text-primary ring-1 ring-accent/40">
                          Starter post
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-text-primary">
                      {post.title}
                    </h2>
                    <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
                      {post.description}
                    </p>
                    {post.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-surface-alt px-2 py-0.5 text-[11px] font-semibold text-text-secondary ring-1 ring-border"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </main>
        <PageFooter />
      </div>
    </>
  );
}
