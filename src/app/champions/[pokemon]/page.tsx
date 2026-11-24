import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { MEGA_BY_SLUG, megaSlugForSpecies, getMegaRegulation, getMegaLegalInLabel, getRegMCMegasWithSprites } from "@/lib/data/mega-pokemon";
import { lookupPokemon } from "@/lib/data/pokemon";
import { getFeaturedTeamsForMega } from "@/lib/data/featured-teams";
import { JsonLd } from "@/components/seo/JsonLd";
import { MegaLandingContent } from "./MegaLandingContent";

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
  return getRegMCMegasWithSprites().map((m) => ({ pokemon: m.slug }));
}

/**
 * Regulation phrasing for a single Mega, derived from its actual legality.
 *
 * Regs are nested (M-A ⊂ M-B ⊂ M-C), so a Mega is legal from the rotation that
 * introduced it onward. These pages are statically generated, so hard-coding
 * "Regulation M-A" (as this file used to) would publish a false legality claim
 * on every later-rotation Mega.
 */
function regulationCopy(dataKey: string) {
  const since = getMegaRegulation(dataKey);
  const regs = (["M-A", "M-B", "M-C"] as const).filter((r) => r >= since);
  return {
    /** Rotation that introduced this Mega. */
    since,
    /** Prose form, e.g. "Regulation M-A, M-B and M-C". */
    legalIn: getMegaLegalInLabel(dataKey),
    /** Narrowest set of regulation keywords that is actually true. */
    keywords: regs.map((r) => `Regulation ${r}`),
    /** Explore deep-link filter value — the regulation this Mega debuted in. */
    exploreRegulation: `Reg ${since}`,
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
  // "{Pokemon} SP spread". Budget is ~60 chars INCLUDING the 18-char
  // " | VGC Team Report" template suffix from layout.tsx, so the string below
  // must stay <= ~42 chars for the longest displayName (Mega Crabominable).
  // It used to read "— SP Spreads, Movesets & Teams", which rendered at 78.
  const title = `${mega.displayName} VGC Guide — SP Spreads`;
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

export default async function MegaPokemonPage({
  params,
}: {
  params: Promise<{ pokemon: string }>;
}) {
  const { pokemon } = await params;
  const mega = MEGA_BY_SLUG.get(pokemon);
  if (!mega) {
    // People type /champions/garchomp; send them to the Mega guide instead of a 404.
    const megaSlug = megaSlugForSpecies(pokemon);
    if (megaSlug) permanentRedirect(`/champions/${megaSlug}`);
    notFound();
  }

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
  //
  // One batched, memoised query covers every Mega: this page is statically
  // generated for 81 Megas, and a query per page meant 81 Neon round-trips per
  // build. The rows for this Mega are unchanged — see src/lib/data/featured-teams.ts.
  const teams = await getFeaturedTeamsForMega(mega.dataKey, mega.megaStone);

  // Pick up to 8 related Megas (excluding current). Filter to "legal AND
  // sprited" so we never link to a broken-image page.
  //
  // The window rotates by the current Mega's position instead of always taking
  // the first 8. A fixed .slice(0, 8) pointed all 72 pages at the same 8
  // siblings, so link equity piled onto those 8 and the rest of the cluster
  // (including every newly-linked Reg M-B page) got inbound links from the
  // index only.
  const spritedMegas = getRegMCMegasWithSprites();
  const selfIndex = Math.max(spritedMegas.findIndex((m) => m.slug === mega.slug), 0);
  const relatedPool = spritedMegas.filter((m) => m.slug !== mega.slug);
  const relatedMegas = Array.from(
    { length: Math.min(8, relatedPool.length) },
    (_, i) => relatedPool[(selfIndex + i) % relatedPool.length],
  ).map((m) => ({ slug: m.slug, displayName: m.displayName, types: m.types as string[] }));

  const reg = regulationCopy(mega.dataKey);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${mega.displayName} VGC Guide — SP Spreads`,
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
        regulationLabel={reg.legalIn}
        exploreRegulation={reg.exploreRegulation}
      />
    </>
  );
}
