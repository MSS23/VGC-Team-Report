import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MEGA_POKEMON_LIST, MEGA_BY_SLUG } from "@/lib/data/mega-pokemon";
import { POKEMON_DATA } from "@/lib/data/pokemon";
import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { JsonLd } from "@/components/seo/JsonLd";
import { MegaLandingContent } from "./MegaLandingContent";
import type { ExploreReport } from "@/components/explore/ReportCard";

// Revalidate every 10 minutes to keep teams fresh while reducing DB load
export const revalidate = 600;

export function generateStaticParams() {
  return MEGA_POKEMON_LIST.map((m) => ({ pokemon: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pokemon: string }>;
}): Promise<Metadata> {
  const { pokemon } = await params;
  const mega = MEGA_BY_SLUG.get(pokemon);
  if (!mega) return {};

  const title = `${mega.displayName} VGC Teams & Stats | Pokemon Champions`;
  const description = `${mega.description} View competitive team reports, base stats, and strategies for ${mega.displayName} in Pokemon Champions Regulation M-A.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://pokemonvgcteamreport.com/champions/${mega.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "VGC Team Report",
      url: `https://pokemonvgcteamreport.com/champions/${mega.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    keywords: [
      mega.displayName,
      `${mega.displayName} VGC`,
      `${mega.baseName} Mega Evolution`,
      `${mega.displayName} teams`,
      `${mega.displayName} stats`,
      "Pokemon Champions",
      "Regulation M-A",
      "VGC 2026",
      mega.ability,
      mega.megaStone,
    ],
  };
}

async function getTeamsForPokemon(baseName: string): Promise<ExploreReport[]> {
  try {
    const sql = getDb();
    // Search for teams containing this Pokemon in the paste (case-insensitive)
    const searchPattern = `%${baseName}%`;
    const rows = await sql`
      SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count
      FROM shares s
      WHERE s.is_public = TRUE
        AND s.deleted_at IS NULL
        AND s.data->>'paste' ILIKE ${searchPattern}
      ORDER BY s.updated_at DESC
      LIMIT 9
    `;

    // Batch fetch like counts
    const shareIds = rows.map((r) => r.id as string);
    let likeMap: Record<string, number> = {};
    if (shareIds.length > 0) {
      const likeRows = await sql`
        SELECT share_id, COUNT(*)::int as count
        FROM reactions
        WHERE share_id = ANY(${shareIds})
        GROUP BY share_id
      `;
      for (const r of likeRows) {
        likeMap[r.share_id as string] = r.count as number;
      }
    }

    return rows.map((row) => {
      const data = row.data as Record<string, unknown>;
      const paste = (data.paste as string) ?? "";
      const sid = row.id as string;
      return {
        id: sid,
        species: extractSpecies(paste),
        tournamentName: (data.tournamentName as string) || undefined,
        creatorName: (data.creatorName as string) || undefined,
        placement: (data.placement as string) || undefined,
        teamSummary: (data.teamSummary as string) || undefined,
        createdAt: (row.created_at as Date).toISOString(),
        updatedAt: (row.updated_at as Date).toISOString(),
        viewCount: row.view_count as number,
        likeCount: likeMap[sid] ?? 0,
        tags: (data.tags as Record<string, unknown>) || undefined,
        collaborators: [],
      };
    });
  } catch (e) {
    console.error("Failed to fetch teams for", baseName, e);
    return [];
  }
}

export default async function MegaPokemonPage({
  params,
}: {
  params: Promise<{ pokemon: string }>;
}) {
  const { pokemon } = await params;
  const mega = MEGA_BY_SLUG.get(pokemon);
  if (!mega) notFound();

  const pokemonData = POKEMON_DATA[mega.dataKey];
  if (!pokemonData) notFound();

  // Fetch teams and prepare related megas in parallel
  const teams = await getTeamsForPokemon(mega.baseName);

  // Pick up to 8 related Megas (excluding current)
  const relatedMegas = MEGA_POKEMON_LIST
    .filter((m) => m.slug !== mega.slug)
    .slice(0, 8)
    .map((m) => ({ slug: m.slug, displayName: m.displayName, types: m.types as string[] }));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${mega.displayName} VGC Teams & Stats`,
          description: mega.description,
          url: `https://pokemonvgcteamreport.com/champions/${mega.slug}`,
          isPartOf: {
            "@type": "WebApplication",
            name: "VGC Team Report",
            url: "https://pokemonvgcteamreport.com",
          },
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Champions",
                item: "https://pokemonvgcteamreport.com/champions",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: mega.displayName,
                item: `https://pokemonvgcteamreport.com/champions/${mega.slug}`,
              },
            ],
          },
        }}
      />
      <MegaLandingContent
        mega={mega}
        baseStats={pokemonData.baseStats}
        teams={teams}
        relatedMegas={relatedMegas}
      />
    </>
  );
}
