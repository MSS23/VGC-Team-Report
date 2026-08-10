import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MEGA_BY_SLUG, getMegaRegulation, getRegMBMegasWithSprites } from "@/lib/data/mega-pokemon";
import { lookupPokemon } from "@/lib/data/pokemon";
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
  // Only build landing pages for Megas that BOTH (a) are legal in the current
  // Champions regulation AND (b) have a confirmed Showdown sprite. Sprite-less
  // Megas would render as a broken-image page, so they're surfaced only as
  // "Coming Soon" non-clickable cards on the /champions index until Showdown
  // ships the sprite.
  //
  // This MUST track the widest live regulation, not M-A. When it was pinned to
  // getRegMAMegasWithSprites() the 14 sprited Reg M-B Megas were never
  // prerendered, never sitemapped and never linked (VGC-258) — they only
  // resolved on demand via dynamicParams, i.e. invisible to crawlers.
  return getRegMBMegasWithSprites().map((m) => ({ pokemon: m.slug }));
}

/**
 * Regulation phrasing for a single Mega, derived from its actual legality.
 *
 * Reg M-B is a superset of Reg M-A, so an M-A Mega is legal in BOTH, while the
 * 16 Megas added in the M-B rotation are legal in M-B ONLY. These pages are
 * statically generated, so hard-coding "Regulation M-A" (as this file used to)
 * would publish a false legality claim on every M-B-only Mega.
 */
function regulationCopy(dataKey: string) {
  const mbOnly = getMegaRegulation(dataKey) === "M-B";
  return {
    mbOnly,
    /** Prose form, e.g. "Regulation M-A and M-B". */
    legalIn: mbOnly ? "Regulation M-B" : "Regulation M-A and M-B",
    /** Narrowest set of regulation keywords that is actually true. */
    keywords: mbOnly ? ["Regulation M-B"] : ["Regulation M-A", "Regulation M-B"],
    /** Explore deep-link filter value — the regulation this Mega can be played in. */
    exploreRegulation: mbOnly ? "Reg M-B" : "Reg M-A",
  };
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
  // "{Pokemon} SP spread", "{Pokemon} moveset". Keeping it under ~60 chars
  // so Google doesn't truncate in SERPs.
  const title = `${mega.displayName} VGC Guide — SP Spreads, Movesets & Teams`;
  const reg = regulationCopy(mega.dataKey);
  const description = `Complete ${mega.displayName} VGC guide for Pokemon Champions ${reg.legalIn}: best SP spreads, movesets, damage calcs, and top competitive teams. ${mega.ability} with ${mega.megaStone}.`;

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
      images: [{ url: `/champions/${mega.slug}/opengraph-image`, width: 1200, height: 630, alt: `${mega.displayName} VGC guide` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: `/champions/${mega.slug}/opengraph-image`, width: 1200, height: 630, alt: `${mega.displayName} VGC guide` }],
    },
    keywords: [
      mega.displayName,
      `${mega.displayName} VGC`,
      `${mega.displayName} SP spread`,
      `${mega.displayName} moveset`,
      `${mega.displayName} competitive set`,
      `${mega.displayName} best set`,
      `${mega.displayName} teams`,
      `${mega.displayName} stats`,
      `${mega.baseName} Mega Evolution`,
      `${mega.baseName} VGC`,
      `${mega.baseName} SP spread`,
      "Pokemon Champions",
      ...reg.keywords,
      "VGC 2026",
      mega.ability,
      mega.megaStone,
    ],
  };
}

async function getTeamsForPokemon(
  dataKey: string,
  megaStone: string,
): Promise<ExploreReport[]> {
  try {
    const sql = getDb();
    // Two valid pieces of evidence that this team uses the Pokemon AS its
    // Mega:
    //   1. The paste contains the Mega Stone (e.g. "Scizorite") — base+stone
    //   2. The paste contains the EXACT Mega species form name
    //
    // The species pattern must be the FULL form name ("Charizard-Mega-Y"),
    // NOT just "{baseName}-Mega". The shorter pattern was matching every
    // Charizard-Mega-X paste on the Mega-Charizard-Y page (and vice versa,
    // and the same for Mewtwo-X/Y) because PostgreSQL ILIKE with a trailing
    // wildcard treats "Charizard-Mega" as a prefix of "Charizard-Mega-X".
    //
    // Derive the Showdown-format species form from dataKey (which is the
    // canonical lowercased form, e.g. "charizard-mega-y") by title-casing
    // each hyphen-separated segment → "Charizard-Mega-Y". ILIKE is
    // case-insensitive so casing only affects readability of the pattern.
    const megaSpeciesForm = dataKey
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("-");
    const stonePattern = `%${megaStone}%`;
    const megaSpeciesPattern = `%${megaSpeciesForm}%`;
    const rows = await sql`
      SELECT s.id, s.data, s.created_at, s.updated_at, COALESCE(s.view_count, 0) as view_count
      FROM shares s
      WHERE s.is_public = TRUE
        AND s.deleted_at IS NULL
        AND (
          s.data->>'paste' ILIKE ${stonePattern}
          OR s.data->>'paste' ILIKE ${megaSpeciesPattern}
        )
      ORDER BY s.updated_at DESC
      LIMIT 9
    `;

    // Batch fetch like counts
    const shareIds = rows.map((r) => r.id as string);
    const likeMap: Record<string, number> = {};
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
    console.error("Failed to fetch teams for", dataKey, e);
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

  // Use lookupPokemon so Champions-original Megas that aren't in our
  // hand-written POKEMON_DATA (Froslass-Mega, Emboar-Mega, Chandelure-Mega,
  // etc.) fall through to the @pkmn/dex runtime fallback and still render.
  // Previously did POKEMON_DATA[dataKey] directly which notFound()'d on
  // everything added after the static catalogue was seeded.
  const pokemonData = lookupPokemon(mega.dataKey);
  if (!pokemonData) notFound();

  // Fetch teams using the exact Mega species form (via dataKey) AND the
  // Mega Stone — searching by base name alone would pull in any team
  // containing the un-Mega'd base species.
  const teams = await getTeamsForPokemon(mega.dataKey, mega.megaStone);

  // Pick up to 8 related Megas (excluding current). Filter to "legal AND
  // sprited" so we never link to a broken-image page.
  //
  // The window rotates by the current Mega's position instead of always taking
  // the first 8. A fixed .slice(0, 8) pointed all 72 pages at the same 8
  // siblings, so link equity piled onto those 8 and the rest of the cluster
  // (including every newly-linked Reg M-B page) got inbound links from the
  // index only.
  const spritedMegas = getRegMBMegasWithSprites();
  const selfIndex = Math.max(spritedMegas.findIndex((m) => m.slug === mega.slug), 0);
  const relatedPool = spritedMegas.filter((m) => m.slug !== mega.slug);
  const relatedMegas = Array.from(
    { length: Math.min(8, relatedPool.length) },
    (_, i) => relatedPool[(selfIndex + i) % relatedPool.length],
  ).map((m) => ({ slug: m.slug, displayName: m.displayName, types: m.types as string[] }));

  const bst = pokemonData.baseStats.hp + pokemonData.baseStats.atk + pokemonData.baseStats.def +
    pokemonData.baseStats.spa + pokemonData.baseStats.spd + pokemonData.baseStats.spe;
  const typeLine = mega.types.join(" / ");

  // FAQ schema — Google surfaces these as rich snippets for long-tail
  // queries. Every answer below is grounded in first-party data (stats,
  // ability, mega stone, live team count) — NO hallucinated "best spread"
  // claims that we can't back up. Adding fake answers here would be a
  // manual-action risk for structured-data spam.
  const reg = regulationCopy(mega.dataKey);
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
      a: `${mega.displayName} is a ${typeLine}-type Pokemon in VGC ${reg.legalIn}.`,
    },
    {
      q: `What are ${mega.displayName}'s base stats?`,
      a: `${mega.displayName} has base stats of ${pokemonData.baseStats.hp} HP / ${pokemonData.baseStats.atk} Atk / ${pokemonData.baseStats.def} Def / ${pokemonData.baseStats.spa} SpA / ${pokemonData.baseStats.spd} SpD / ${pokemonData.baseStats.spe} Spe, for a Base Stat Total of ${bst}.`,
    },
    // Legality must be derived, never asserted. Reg M-B is a superset of M-A:
    // an M-A Mega is legal in both, an M-B-only Mega is legal in M-B alone and
    // saying otherwise would be a false claim baked into prerendered HTML.
    reg.mbOnly
      ? {
          q: `Is ${mega.displayName} legal in VGC 2026 Regulation M-B?`,
          a: `Yes — ${mega.displayName} is legal in VGC 2026 Regulation M-B, the Pokemon Champions Mega rotation that introduced it. It is not legal in Regulation M-A.`,
        }
      : {
          q: `Is ${mega.displayName} legal in VGC 2026 Regulation M-A?`,
          a: `Yes — ${mega.displayName} is legal in VGC 2026 Regulation M-A, the Pokemon Champions format that reintroduces Mega Evolution to competitive VGC, and it remains legal in Regulation M-B.`,
        },
    ...(teams.length > 0
      ? [{
          q: `Where can I find competitive ${mega.displayName} VGC teams?`,
          a: `VGC Team Report hosts ${teams.length} public competitive team${teams.length === 1 ? "" : "s"} featuring ${mega.displayName}, with full SP spreads, movesets, and matchup notes. Browse them on this page or create your own report by pasting your Showdown team.`,
        }]
      : []),
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${mega.displayName} VGC Guide — SP Spreads, Movesets & Teams`,
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
        regulationLabel={reg.mbOnly ? "Regulation M-B only" : "Regulation M-A and M-B"}
        exploreRegulation={reg.exploreRegulation}
      />
    </>
  );
}
