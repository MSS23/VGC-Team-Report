import type { Metadata } from "next";
import { cache } from "react";
import { notFound, unstable_rethrow } from "next/navigation";
import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { ShareRedirectClient } from "./redirect";
import { ShareHero, buildShareHeroProps, type ShareHeroProps } from "./hero";
import { JsonLd } from "@/components/seo/JsonLd";
import { getShareOgCard, ogCardFingerprint, scheduleOgImageBackfill, OG_IMAGE_SIZE } from "@/lib/sharing/og-image";

/**
 * The share row + its accepted collaborators, loaded once per request.
 *
 * `generateMetadata` and `SharePage` both need exactly this pair and used to
 * issue it twice — 4 Neon round trips on the one route whose own 15s client
 * abort is commented as covering a Neon cold start. Next.js runs
 * `generateMetadata` inside the same RSC render pass as the page (its own
 * metadata resolver is a `react.cache` for that reason), so a `cache()`
 * wrapper here is shared between the two and the pair runs once.
 *
 * Returns `null` for a deleted/unknown id. Only a genuinely unreachable
 * database throws, which both callers already degrade from.
 */
const loadShare = cache(
  async (
    id: string,
  ): Promise<{ row: Record<string, unknown>; collabNames: string[] } | null> => {
    const sql = getDb();
    const [rows, collabRows] = await Promise.all([
      sql`SELECT data, is_public, is_unlisted, created_at, updated_at FROM shares WHERE id = ${id} AND deleted_at IS NULL`,
      sql`SELECT user_name FROM collaborators WHERE share_id = ${id} AND COALESCE(status, 'accepted') = 'accepted'`,
    ]);
    if (rows.length === 0) return null;
    return {
      row: rows[0] as Record<string, unknown>,
      collabNames: collabRows.map((r) => r.user_name as string),
    };
  },
);

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

  try {
    const found = await loadShare(id);
    // Deleted/unknown IDs were a soft 404 (200 + indexable homepage canonical).
    if (!found) notFound();
    const { row, collabNames } = found;

    // Private reports (neither public nor unlisted) must not leak even their
    // title/description into <head> — that's the same data we gate at the API.
    const isPublicRow = row.is_public === true;
    const isUnlistedRow = row.is_unlisted === true;
    if (!isPublicRow && !isUnlistedRow) {
      return { title: { absolute: "VGC Team Report" }, robots: { index: false, follow: false } };
    }

    const data = row.data as Record<string, unknown>;
    const isPublic = row.is_public !== false;
    const paste = (data.paste as string) ?? "";
    const tournamentName = (data.tournamentName as string) ?? "";
    const creatorName = (data.creatorName as string) ?? "";
    const teamSummary = (data.teamSummary as string) ?? "";
    const placement = (data.placement as string) ?? "";
    const record = (data.record as string) ?? "";
    const species = extractSpecies(paste);

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

    // Embed image: a card pre-rendered at save time and stored in Vercel Blob
    // (see lib/sharing/og-image). Rendering it on demand — an
    // opengraph-image.tsx convention file, then /api/team-graphic as og:image —
    // produced "image failed to load" unfurls, so og:image only ever points at
    // a static Blob URL. No card yet (older report, or no Blob token) means a
    // text-only unfurl, and a backfill render is queued after the response.
    //
    // `images: []` stays load-bearing when there is no card: without it,
    // Next.js falls back to the root /opengraph-image.tsx, which would show a
    // generic site-wide image on every share link.
    const visibility = { isPublic: isPublicRow, isUnlisted: isUnlistedRow };
    const ogCard = await getShareOgCard(id);
    if (!ogCard || ogCard.fp !== ogCardFingerprint(data)) {
      scheduleOgImageBackfill(id, data, visibility);
    }
    const ogImages = ogCard
      ? [{ url: ogCard.url, ...OG_IMAGE_SIZE, alt: `${title} — team preview` }]
      : [];
    return {
      title,
      description,
      ...(robotsMeta && { robots: robotsMeta }),
      openGraph: {
        title,
        description,
        type: "website",
        siteName: "VGC Team Report",
        images: ogImages,
      },
      alternates: {
        canonical: `https://pokemonvgcteamreport.com/s/${id}`,
        // oEmbed discovery. Next renders `alternates.types` as
        // <link rel="alternate" type="..." href="..." title="..." />, which is
        // exactly the discovery link unfurlers (Discord, Slack, WordPress)
        // look for. /api/oembed takes the share URL as a `url` query param and
        // only serves rows with is_public = TRUE, so advertise it for public
        // shares only — unlisted ones would just 404 the unfurler.
        ...(isPublic && {
          types: {
            "application/json+oembed": [
              {
                url: `https://pokemonvgcteamreport.com/api/oembed?url=${encodeURIComponent(
                  `https://pokemonvgcteamreport.com/s/${id}`,
                )}`,
                title,
              },
            ],
          },
        }),
      },
      twitter: {
        card: ogCard ? "summary_large_image" : "summary",
        title,
        description,
        images: ogImages,
      },
    };
  } catch (err) {
    unstable_rethrow(err); // let notFound() through; DB errors fall back below
    return { title: { absolute: "VGC Team Report" } };
  }
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

  // Build JSON-LD from DB (best-effort). We also derive a heading string
  // here that gets handed to the redirect client so its visually-hidden
  // <h1> can carry meaningful context for screen readers and crawlers,
  // instead of always falling back to the generic site name.
  let jsonLd: Record<string, unknown> | null = null;
  let heading = "VGC Team Report";
  // Server-rendered content for public reports (VGC-318). Stays null for
  // private/unlisted rows and when the database is unreachable, in which case
  // the route degrades to exactly the redirect-only behaviour it had before.
  let hero: ShareHeroProps | null = null;
  try {
    const found = await loadShare(id);
    if (!found) notFound();
    const { row: shareRow, collabNames: jsonLdCollabNames } = found;
    // Skip JSON-LD entirely for private reports — don't expose their structured
    // metadata. Unlisted/public still get rich structured data for unfurls/SEO.
    const visibleForLd = shareRow.is_public === true || shareRow.is_unlisted === true;
    if (visibleForLd) {
      const data = shareRow.data as Record<string, unknown>;
      const species = extractSpecies((data.paste as string) ?? "");
      const ldCreatorName = (data.creatorName as string) || undefined;
      const tournamentName = (data.tournamentName as string) || undefined;
      const ldCollabNames = jsonLdCollabNames;

      // Heading priority matches the spec: teamName → tournamentName →
      // species line → site name. teamName isn't currently a top-level
      // field on every share's data blob, but we read it defensively in
      // case future shares (or older imports) carry it.
      const teamName = (data.teamName as string) || "";
      const speciesLine = species.length > 0 ? species.join(" / ") : "";
      heading = teamName || tournamentName || speciesLine || "VGC Team Report";

      // buildShareHeroProps re-checks is_public itself, so this stays null for
      // unlisted rows even though they reach this branch for JSON-LD.
      hero = buildShareHeroProps({
        shareId: id,
        row: shareRow,
        collaborators: ldCollabNames,
        heading,
      });

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
        url: `https://pokemonvgcteamreport.com/s/${id}`,
        description:
          (data.teamSummary as string) ||
          `VGC team: ${species.join(", ")}`,
        datePublished: (shareRow.created_at as Date).toISOString(),
        dateModified: (shareRow.updated_at as Date).toISOString(),
        ...(primaryAuthor && { author: primaryAuthor }),
        ...(contributors.length > 0 && {
          contributor: contributors.length === 1 ? contributors[0] : contributors,
        }),
        isPartOf: {
          "@type": "WebApplication",
          name: "VGC Team Report",
          url: "https://pokemonvgcteamreport.com",
        },
      };
    }
  } catch (err) {
    unstable_rethrow(err);
    // Non-critical — skip JSON-LD
  }

  // Order matters: the hero is server markup, so it is in the first byte of
  // HTML and paints before the bundle has even downloaded. ShareRedirectClient
  // still runs the redirect to the interactive report as soon as it hydrates —
  // it just renders no UI of its own once the hero has supplied the <h1> and
  // the content, instead of replacing both with a contentless spinner.
  return (
    <>
      {jsonLd && (
        <JsonLd data={jsonLd} />
      )}
      {hero && <ShareHero {...hero} />}
      <ShareRedirectClient to={`/${qs}`} heading={heading} silent={hero !== null} />
    </>
  );
}
