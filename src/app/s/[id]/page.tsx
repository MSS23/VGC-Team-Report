import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { ShareRedirectClient } from "./redirect";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const sql = getDb();
    const [rows, collabRows] = await Promise.all([
      sql`SELECT data FROM shares WHERE id = ${id} AND deleted_at IS NULL`,
      sql`SELECT user_name FROM collaborators WHERE share_id = ${id} AND COALESCE(status, 'accepted') = 'accepted'`,
    ]);
    if (rows.length === 0) return { title: "VGC Team Report" };

    const data = rows[0].data as Record<string, unknown>;
    const paste = (data.paste as string) ?? "";
    const tournamentName = (data.tournamentName as string) ?? "";
    const creatorName = (data.creatorName as string) ?? "";
    const teamSummary = (data.teamSummary as string) ?? "";
    const placement = (data.placement as string) ?? "";
    const record = (data.record as string) ?? "";
    const species = extractSpecies(paste);
    const collabNames = collabRows.map((r) => r.user_name as string);

    // ── Title: front-load the most compelling signal the user gave us.
    // Priority is tournament placement → tournament → species core →
    // fallback. VGC players recognize "/" as the team-core separator, so
    // keep that convention in titles.
    const speciesLine = species.length > 0 ? species.join(" / ") : "";
    let title: string;
    if (tournamentName && placement) {
      title = `${tournamentName} — ${placement} | VGC Team Report`;
    } else if (tournamentName) {
      title = speciesLine
        ? `${tournamentName} | ${speciesLine} VGC Team`
        : `${tournamentName} | VGC Team Report`;
    } else if (speciesLine && creatorName) {
      title = `${speciesLine} — VGC Team by ${creatorName}`;
    } else if (speciesLine) {
      title = `${speciesLine} — VGC Team Report`;
    } else {
      title = "VGC Team Report";
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

    // VGC-134: Wire the existing /api/team-graphic endpoint into og:image so
    // every shared report gets a sprite-rich preview card in Discord/Twitter/
    // iMessage/Slack instead of a plain text unfurl.
    //
    // History: a previous opengraph-image.tsx convention file was abandoned
    // because mid-generation frames leaked to unfurlers. /api/team-graphic
    // is a separate, battle-tested endpoint (used for creator downloads) and
    // ships with aggressive Cache-Control so unfurlers receive a stable
    // response on first hit and cache it for ~24h at the edge.
    //
    // Only attach an image when we can actually render a meaningful card —
    // empty teams fall back to text-only so we never publish a blank PNG.
    const hasTeam = species.length > 0;
    const ogImageUrl = hasTeam
      ? `https://pokemonvgcteamreport.com/api/team-graphic?id=${encodeURIComponent(id)}&style=wide`
      : null;
    const ogImages = ogImageUrl
      ? [{ url: ogImageUrl, width: 1200, height: 400, alt: title }]
      : [];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        siteName: "VGC Team Report",
        images: ogImages,
      },
      alternates: {
        canonical: `https://pokemonvgcteamreport.com/s/${id}`,
      },
      twitter: {
        card: hasTeam ? "summary_large_image" : "summary",
        title,
        description,
        images: ogImages,
      },
    };
  } catch {
    return { title: "VGC Team Report" };
  }
}

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { id } = await params;
  const { key } = await searchParams;
  const qs = key
    ? `?s=${encodeURIComponent(id)}&key=${encodeURIComponent(key)}`
    : `?s=${encodeURIComponent(id)}`;

  // Build JSON-LD from DB (best-effort)
  let jsonLd: Record<string, unknown> | null = null;
  try {
    const sql = getDb();
    const [shareRows, jsonLdCollabRows] = await Promise.all([
      sql`SELECT data, created_at FROM shares WHERE id = ${id} AND deleted_at IS NULL`,
      sql`SELECT user_name FROM collaborators WHERE share_id = ${id} AND COALESCE(status, 'accepted') = 'accepted'`,
    ]);
    if (shareRows.length > 0) {
      const data = shareRows[0].data as Record<string, unknown>;
      const species = extractSpecies((data.paste as string) ?? "");
      const ldCreatorName = (data.creatorName as string) || undefined;
      const tournamentName = (data.tournamentName as string) || undefined;
      const ldCollabNames = jsonLdCollabRows.map((r) => r.user_name as string);

      const authors = [
        ...(ldCreatorName ? [{ "@type": "Person", name: ldCreatorName }] : []),
        ...ldCollabNames.map((name) => ({ "@type": "Person", name })),
      ];

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
        datePublished: (shareRows[0].created_at as Date).toISOString(),
        ...(authors.length > 0 && {
          author: authors.length === 1 ? authors[0] : authors,
        }),
        isPartOf: {
          "@type": "WebApplication",
          name: "VGC Team Report",
          url: "https://pokemonvgcteamreport.com",
        },
      };
    }
  } catch {
    // Non-critical — skip JSON-LD
  }

  return (
    <>
      {jsonLd && (
        <JsonLd data={jsonLd} />
      )}
      <ShareRedirectClient to={`/${qs}`} />
    </>
  );
}
