import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MEGA_BY_SLUG, getRegMAMegas } from "@/lib/data/mega-pokemon";
import { POKEMON_DATA } from "@/lib/data/pokemon";
import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { JsonLd } from "@/components/seo/JsonLd";
import { MegaLandingContent } from "./MegaLandingContent";
import type { ExploreReport } from "@/components/explore/ReportCard";

// Revalidate every hour. New public teams for any given mega don't appear
// fast enough to justify a 10-minute window, and each revalidation runs
// DB queries + SSR for every mega in MEGA_POKEMON_LIST — roughly 6x
// cheaper at 3600s vs 600s for users who won't notice the difference.
export const revalidate = 3600;

export function generateStaticParams() {
  // Only build landing pages for Megas legal in the current Reg M-A format.
  // Illegal Megas (e.g. Mega Salamence/Metagross/Mawile) won't be generated.
  return getRegMAMegas().map((m) => ({ pokemon: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pokemon: string }>;
}): Promise<Metadata> {
  const { pokemon } = await params;
  const mega = MEGA_BY_SLUG.get(pokemon);
  if (!mega) return {};

  // Title targets the highest-volume long-tail queries: "{Pokemon} VGC",
  // "{Pokemon} EV spread", "{Pokemon} moveset". Keeping it under ~60 chars
  // so Google doesn't truncate in SERPs.
  const title = `${mega.displayName} VGC Guide — EV Spreads, Movesets & Teams`;
  const description = `Complete ${mega.displayName} VGC guide for Pokemon Champions Regulation M-A: best EV spreads, movesets, damage calcs, and top competitive teams. ${mega.ability} with ${mega.megaStone}.`;

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
      `${mega.displayName} EV spread`,
      `${mega.displayName} moveset`,
      `${mega.displayName} competitive set`,
      `${mega.displayName} best set`,
      `${mega.displayName} teams`,
      `${mega.displayName} stats`,
      `${mega.baseName} Mega Evolution`,
      `${mega.baseName} VGC`,
      `${mega.baseName} EV spread`,
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

  // Pick up to 8 related Megas (excluding current). Filter to Reg M-A so we
  // never link from a legal Mega to an illegal one.
  const relatedMegas = getRegMAMegas()
    .filter((m) => m.slug !== mega.slug)
    .slice(0, 8)
    .map((m) => ({ slug: m.slug, displayName: m.displayName, types: m.types as string[] }));

  const bst = pokemonData.baseStats.hp + pokemonData.baseStats.atk + pokemonData.baseStats.def +
    pokemonData.baseStats.spa + pokemonData.baseStats.spd + pokemonData.baseStats.spe;
  const typeLine = mega.types.join(" / ");

  // FAQ schema — Google surfaces these as rich snippets for long-tail
  // queries. Every answer below is grounded in first-party data (stats,
  // ability, mega stone, live team count) — NO hallucinated "best spread"
  // claims that we can't back up. Adding fake answers here would be a
  // manual-action risk for structured-data spam.
  const faqItems = [
    {
      q: `What ability does ${mega.displayName} have?`,
      a: `${mega.displayName} has the ability ${mega.ability}. ${mega.description}`,
    },
    {
      q: `What Mega Stone does ${mega.baseName} need to Mega Evolve?`,
      a: `${mega.baseName} needs to hold ${mega.megaStone} to Mega Evolve into ${mega.displayName} during battle.`,
    },
    {
      q: `What type is ${mega.displayName}?`,
      a: `${mega.displayName} is a ${typeLine}-type Pokemon in VGC Regulation M-A.`,
    },
    {
      q: `What are ${mega.displayName}'s base stats?`,
      a: `${mega.displayName} has base stats of ${pokemonData.baseStats.hp} HP / ${pokemonData.baseStats.atk} Atk / ${pokemonData.baseStats.def} Def / ${pokemonData.baseStats.spa} SpA / ${pokemonData.baseStats.spd} SpD / ${pokemonData.baseStats.spe} Spe, for a Base Stat Total of ${bst}.`,
    },
    {
      q: `Is ${mega.displayName} legal in VGC 2026 Regulation M-A?`,
      a: `Yes — ${mega.displayName} is legal in VGC 2026 Regulation M-A, the Pokemon Champions format that reintroduces Mega Evolution to competitive VGC.`,
    },
    ...(teams.length > 0
      ? [{
          q: `Where can I find competitive ${mega.displayName} VGC teams?`,
          a: `VGC Team Report hosts ${teams.length} public competitive team${teams.length === 1 ? "" : "s"} featuring ${mega.displayName}, with full EV spreads, movesets, and matchup notes. Browse them on this page or create your own report by pasting your Showdown team.`,
        }]
      : []),
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${mega.displayName} VGC Guide — EV Spreads, Movesets & Teams`,
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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }}
      />
      <MegaLandingContent
        mega={mega}
        baseStats={pokemonData.baseStats}
        teams={teams}
        relatedMegas={relatedMegas}
        faqs={faqItems}
      />
    </>
  );
}
