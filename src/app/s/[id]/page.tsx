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

    // Embed images for shared reports are intentionally suppressed. We
    // previously generated a Satori-rendered team preview via
    // opengraph-image.tsx, but the render budget on Vercel's edge runtime
    // couldn't reliably produce an accurate, timely image — Discord
    // unfurls were landing on stale, mislabeled, or mid-generation frames.
    // A clean text-only unfurl (title + description) is strictly better
    // than a wrong or broken preview image, and it renders instantly.
    //
    // `images: []` is load-bearing: without it, Next.js falls back to the
    // root /opengraph-image.tsx, which would show a generic site-wide
    // image on every share link. Explicitly empty arrays block that
    // inheritance for both the Open Graph and Twitter Card sides.
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        siteName: "VGC Team Report",
        images: [],
      },
      alternates: {
        canonical: `https://pokemonvgcteamreport.com/s/${id}`,
      },
      twitter: {
        card: "summary",
        title,
        description,
        images: [],
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
