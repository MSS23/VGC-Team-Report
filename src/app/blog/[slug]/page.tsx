import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { PageFooter } from "@/components/layout/PageFooter";
import {
  blogIndexUrl,
  blogPostSlugs,
  blogPostUrl,
  blogReadingMinutes,
  formatBlogDate,
  getBlogPost,
} from "@/lib/data/blog-posts";
import { PostBody } from "../PostBody";

const SITE = "https://pokemonvgcteamreport.com";

/**
 * Prerender every published post. The post source is a typed module with no
 * DB or network reads, so each page is pure SSG — which is the point: this is
 * an SEO/AEO surface and a crawler must get finished HTML on first request.
 */
export function generateStaticParams() {
  return blogPostSlugs().map((slug) => ({ slug }));
}

/**
 * Unknown slugs must not be rendered on demand. With dynamicParams off, Next
 * serves the app's 404 for anything outside generateStaticParams instead of
 * SSR-ing a page for a post that does not exist (which would also let a draft
 * slug resolve the moment it was added to the source in any state).
 */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  // An empty object leaves the route on the root layout's defaults; the page
  // itself 404s, so no metadata is ever served for an unknown slug.
  if (!post) return {};

  const url = blogPostUrl(post.slug);

  return {
    title: post.metaTitle,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author.name, ...(post.author.url ? { url: post.author.url } : {}) }],
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      siteName: "VGC Team Report",
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      authors: [post.author.name],
      tags: post.tags,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: post.title }],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const url = blogPostUrl(post.slug);
  const readingMinutes = blogReadingMinutes(post);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          url,
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          datePublished: post.datePublished,
          dateModified: post.dateModified,
          inLanguage: "en",
          keywords: post.keywords.join(", "),
          author: {
            "@type": "Person",
            name: post.author.name,
            ...(post.author.url ? { url: post.author.url } : {}),
          },
          publisher: {
            "@type": "Organization",
            name: "VGC Team Report",
            url: SITE,
            logo: {
              "@type": "ImageObject",
              url: `${SITE}/icon-512.png`,
              width: 512,
              height: 512,
            },
          },
          isPartOf: {
            "@type": "Blog",
            name: "VGC Team Report Blog",
            url: blogIndexUrl(),
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE },
            { "@type": "ListItem", position: 2, name: "Blog", item: blogIndexUrl() },
            { "@type": "ListItem", position: 3, name: post.title, item: url },
          ],
        }}
      />

      <div className="min-h-screen bg-background">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
          <nav aria-label="Breadcrumb" className="mb-6">
            <Link
              href="/blog"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
            >
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              All posts
            </Link>
          </nav>

          <article className="max-w-3xl">
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <time
                  dateTime={post.datePublished}
                  className="text-xs font-medium text-text-tertiary"
                >
                  {formatBlogDate(post.datePublished)}
                </time>
                <span aria-hidden="true" className="text-xs text-text-tertiary">
                  &middot;
                </span>
                <span className="text-xs text-text-tertiary">{readingMinutes} min read</span>
                <span aria-hidden="true" className="text-xs text-text-tertiary">
                  &middot;
                </span>
                <span className="text-xs text-text-tertiary">{post.author.name}</span>
                {post.isStarterPost && (
                  <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-semibold text-text-primary ring-1 ring-accent/40">
                    Starter post
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                {post.title}
              </h1>
              <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
                {post.description}
              </p>
            </header>

            <PostBody blocks={post.blocks} />
          </article>
        </main>
        <PageFooter />
      </div>
    </>
  );
}
