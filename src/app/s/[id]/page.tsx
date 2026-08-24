import { cache } from "react";
import type { Metadata } from "next";
import { extractSpecies } from "@/lib/utils/extract-species";
import { getShareForRender } from "@/lib/sharing/get-share-for-render";
import { ShareReportContent } from "./ShareReportContent";
import { ShareRedirectClient } from "./redirect";
import { JsonLd } from "@/components/seo/JsonLd";

/**
 * One DB read per request, shared between generateMetadata and the render.
 * React's `cache` dedupes across both passes, so adding server-rendered body
 * content costs no extra queries — it actually removes two, since <head> and
 * the JSON-LD block used to query separately.
 */
const loadShare = cache(getShareForRender);

const SITE_URL = "https://pokemonvgcteamreport.com";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ key?: string | string[] }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { key } = await searchParams;
  // Collaborator edit links carry the secret edit token as ?key=...; if
  // a creator ever pastes such a URL in Discord/X/Reddit Google will
  // crawl + cache it, leaking the edit token in SERP snippets. Force
  // noindex/nofollow whenever a key is present, regardless of share
  // visibility.
  const hasEditKey = Boolean(key && (Array.isArray(key) ? key.length > 0 : key.trim() !== ""));

  const result = await loadShare(id);
  if (result.status === "not-found") return { title: { absolute: "VGC Team Report" } };

  // Private reports (neither public nor unlisted) must not leak even their
  // title/description into <head> — that's the same data we gate at the API.
  // They also get no og:image: a preview card is a leak too.
  if (result.status === "private") {
    return { title: { absolute: "VGC Team Report" }, robots: { index: false, follow: false } };
  }

  const { share } = result;
  const data = share.data;
  const isPublic = share.isPublic;
  const paste = (data.paste as string) ?? "";
  const tournamentName = (data.tournamentName as string) ?? "";
  const creatorName = (data.creatorName as string) ?? "";
  const teamSummary = (data.teamSummary as string) ?? "";
  const placement = (data.placement as string) ?? "";
  const record = (data.record as string) ?? "";
  const species = extractSpecies(paste);
  const collabNames = share.collaborators;

  // ── Title: front-load the most compelling signal the user gave us.
  // Priority is tournament placement → tournament → species core →
  // fallback. VGC players recognize "/" as the team-core separator, so
  // keep that convention in titles.
  const speciesLine = species.length > 0 ? species.join(" / ") : "";
  let title: string;
  if (tournamentName && placement) {
    title = `${tournamentName} — ${placement}`;
  } else if (tournamentName) {
    title = speciesLine
      ? `${tournamentName} | ${speciesLine} VGC Team`
      : tournamentName;
  } else if (speciesLine && creatorName) {
    title = `${speciesLine} — VGC Team by ${creatorName}`;
  } else if (speciesLine) {
    title = `${speciesLine} — VGC Team`;
  } else {
    title = "VGC Team";
  }

  // ── Description: the user's teamSummary always wins — it's their
  // voice. When absent, we auto-compose a description that actually
  // sells the click: lead with a placement/record hook if they exist,
  // list the full 6-mon team with bullet separators (better visual
  // scan than commas), name the author, and close with a concrete
  // value prop line. Aim for ~220 chars max so Twitter doesn't
  // truncate mid-sentence.
  const authorLabel = creatorName
    ? collabNames.length
      ? `${creatorName} with ${collabNames.join(", ")}`
      : creatorName
    : "";
  const speciesBullets = species.length > 0 ? species.join(" · ") : "";

  let description: string;
  if (teamSummary) {
    description = teamSummary;
  } else if (speciesBullets) {
    const hook = placement && tournamentName
      ? `${placement} at ${tournamentName}: `
      : placement
        ? `${placement}: `
        : record && tournamentName
          ? `${record} at ${tournamentName}: `
          : record
            ? `${record} record: `
            : "";
    const byline = authorLabel ? ` VGC team by ${authorLabel}.` : "";
    description = `${hook}${speciesBullets}.${byline} Full EV spreads, damage calcs, and matchup plans inside.`;
  } else {
    description = "Build, share, and present professional VGC team reports with damage calcs, speed tiers, and matchup plans.";
  }

  // Private / unlisted shares must not be indexed — thin content with no
  // discovery value. Collaborator edit URLs (?key=…) must also be noindexed
  // so a leaked share doesn't leak the edit token via Google's snippet cache.
  const robotsMeta = isPublic && !hasEditKey
    ? undefined
    : { index: false as const, follow: false as const };

  // ── Embed image (VGC-275).
  //
  // We point og:image at /api/team-graphic, NOT at the route's own
  // opengraph-image.tsx convention file. That file is the version that kept
  // regressing: it self-fetches our own API (4s budget) and then pulls six
  // sprites off an external CDN (2.5s each) with no caching, which blows past
  // Discord's ~5s unfurl budget and renders a broken preview. /api/team-graphic
  // reads Postgres directly and ships
  // `s-maxage=86400, stale-while-revalidate=604800`, so the first unfurl is one
  // fast render and every later one is an edge hit.
  //
  // An explicit `images` array also still does the job the old `images: []`
  // did — it blocks inheritance of the site-wide root /opengraph-image.tsx —
  // while actually producing a card. Private reports never reach this code, so
  // they never get a preview image.
  const ogImage = {
    url: `${SITE_URL}/api/team-graphic?id=${encodeURIComponent(id)}&style=wide`,
    width: 1200,
    height: 400,
    alt: title,
  };

  return {
    title,
    description,
    ...(robotsMeta && { robots: robotsMeta }),
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "VGC Team Report",
      url: `${SITE_URL}/s/${id}`,
      images: [ogImage],
    },
    alternates: {
      canonical: `${SITE_URL}/s/${id}`,
    },
    twitter: {
      // summary_large_image, not summary: with a real image supplied, `summary`
      // forces the small thumbnail card and wastes it.
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Never forward legacy edit tokens into the client URL. Report access is
  // resolved from the authenticated account only.
  const qs = `?s=${encodeURIComponent(id)}`;

  const result = await loadShare(id);

  // Build JSON-LD (best-effort). We also derive a heading string here that
  // gets handed to the redirect client so its visually-hidden <h1> can carry
  // meaningful context when there is no server-rendered body to show.
  let jsonLd: Record<string, unknown> | null = null;
  let heading = "VGC Team Report";

  // Skip JSON-LD entirely for private reports — don't expose their structured
  // metadata. Unlisted/public still get rich structured data for unfurls/SEO.
  if (result.status === "visible") {
    const { share } = result;
    const data = share.data;
    const species = extractSpecies((data.paste as string) ?? "");
    const ldCreatorName = (data.creatorName as string) || undefined;
    const tournamentName = (data.tournamentName as string) || undefined;
    const ldCollabNames = share.collaborators;

    // Heading priority matches the spec: teamName → tournamentName →
    // species line → site name. teamName isn't currently a top-level
    // field on every share's data blob, but we read it defensively in
    // case future shares (or older imports) carry it.
    const teamName = (data.teamName as string) || "";
    const speciesLine = species.length > 0 ? species.join(" / ") : "";
    heading = teamName || tournamentName || speciesLine || "VGC Team Report";

    const primaryAuthor = ldCreatorName
      ? { "@type": "Person", name: ldCreatorName }
      : null;
    const contributors = ldCollabNames.map((name) => ({ "@type": "Person", name }));

    jsonLd = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: tournamentName
        ? `${tournamentName} - VGC Team Report`
        : species.length > 0
          ? `${species.join(" / ")} - VGC Team Report`
          : "VGC Team Report",
      url: `${SITE_URL}/s/${id}`,
      description:
        (data.teamSummary as string) ||
        `VGC team: ${species.join(", ")}`,
      ...(share.createdAt && { datePublished: share.createdAt }),
      ...(share.updatedAt && { dateModified: share.updatedAt }),
      ...(primaryAuthor && { author: primaryAuthor }),
      ...(contributors.length > 0 && {
        contributor: contributors.length === 1 ? contributors[0] : contributors,
      }),
      isPartOf: {
        "@type": "WebApplication",
        name: "VGC Team Report",
        url: SITE_URL,
      },
    };
  }

  return (
    <>
      {jsonLd && (
        <JsonLd data={jsonLd} />
      )}
      {/*
        VGC-275 / VGC-228: the team is rendered here, on the server, so the
        first HTML response carries the report. Crawlers (which are blocked
        from /api/ by robots.txt and so could never resolve the old
        client-side fetch) and no-JS readers now get the whole thing.
        The interactive slideshow still lives in the client app, which takes
        over once ShareRedirectClient hands off to /?s=<id>.
      */}
      {result.status === "visible" && <ShareReportContent share={result.share} />}
      <ShareRedirectClient
        to={`/${qs}`}
        heading={heading}
        // When the server already painted the report there's nothing to wait
        // for on screen — showing a spinner over real content would be a
        // downgrade. Private/missing reports keep the original spinner.
        silent={result.status === "visible"}
      />
    </>
  );
}
