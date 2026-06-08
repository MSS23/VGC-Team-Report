import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { ShareRedirectClient } from "./redirect";
import { JsonLd, BreadcrumbListJsonLd } from "@/components/seo/JsonLd";

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
    const sql = getDb();
    const [rows, collabRows] = await Promise.all([
      sql`SELECT data, is_public FROM shares WHERE id = ${id} AND deleted_at IS NULL`,
      sql`SELECT user_name FROM collaborators WHERE share_id = ${id} AND COALESCE(status, 'accepted') = 'accepted'`,
    ]);
    if (rows.length === 0) return { title: "VGC Team Report" };

    const data = rows[0].data as Record<string, unknown>;
    const isPublic = (rows[0] as Record<string, unknown>).is_public !== false;
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

    // Private / unlisted shares must not be indexed — thin content with no
    // discovery value. Collaborator edit URLs (?key=…) must also be noindexed
    // so a leaked share doesn't leak the edit token via Google's snippet cache.
    const robotsMeta = isPublic && !hasEditKey
      ? undefined
      : { index: false as const, follow: false as const };

    // Embed images for shared reports are intentionally suppressed. We have
    // tried this twice now (an opengraph-image.tsx convention file, then
    // wiring /api/team-graphic into og:image) — both produced "image failed
    // to load" unfurls in Discord and elsewhere. The edge runtime + sprite
    // CDN dependency + unfurler-side timeout combine to make a reliably-
    // rendering OG card unrealistic for now. A clean text-only unfurl
    // (title + description) is strictly better than a broken preview.
    //
    // `images: []` is load-bearing: without it, Next.js falls back to the
    // root /opengraph-image.tsx, which would show a generic site-wide
    // image on every share link. Explicitly empty arrays block that
    // inheritance for both the Open Graph and Twitter Card sides.
    return {
      title,
      description,
      ...(robotsMeta && { robots: robotsMeta }),
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

  // Build JSON-LD from DB (best-effort). We also derive a heading string
  // here that gets handed to the redirect client so its visually-hidden
  // <h1> can carry meaningful context for screen readers and crawlers,
  // instead of always falling back to the generic site name.
  let jsonLd: Record<string, unknown> | null = null;
  let heading = "VGC Team Report";
  // Leaf label for the BreadcrumbList JSON-LD — same priority as `heading`
  // but kept separately so future tweaks to the visible <h1> don't drift
  // the schema. Defaults to a generic label when DB lookup fails.
  let breadcrumbLeaf = "Shared Team";
  try {
    const sql = getDb();
    const [shareRows, jsonLdCollabRows] = await Promise.all([
      sql`SELECT data, created_at, updated_at FROM shares WHERE id = ${id} AND deleted_at IS NULL`,
      sql`SELECT user_name FROM collaborators WHERE share_id = ${id} AND COALESCE(status, 'accepted') = 'accepted'`,
    ]);
    if (shareRows.length > 0) {
      const data = shareRows[0].data as Record<string, unknown>;
      const species = extractSpecies((data.paste as string) ?? "");
      const ldCreatorName = (data.creatorName as string) || undefined;
      const tournamentName = (data.tournamentName as string) || undefined;
      const ldCollabNames = jsonLdCollabRows.map((r) => r.user_name as string);

      // Heading priority matches the spec: teamName → tournamentName →
      // species line → site name. teamName isn't currently a top-level
      // field on every share's data blob, but we read it defensively in
      // case future shares (or older imports) carry it.
      const teamName = (data.teamName as string) || "";
      const speciesLine = species.length > 0 ? species.join(" / ") : "";
      heading = teamName || tournamentName || speciesLine || "VGC Team Report";
      breadcrumbLeaf = teamName || tournamentName || speciesLine || "Shared Team";

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
        datePublished: (shareRows[0].created_at as Date).toISOString(),
        dateModified: (shareRows[0].updated_at as Date).toISOString(),
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
  } catch {
    // Non-critical — skip JSON-LD
  }

  return (
    <>
      {jsonLd && (
        <JsonLd data={jsonLd} />
      )}
      {/* SERP breadcrumb: Home → Explore → (this share). Emitted server-side
          so Google can pick it up before the client redirect hands off to the
          renderer at /?s=<id>. */}
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", url: "https://pokemonvgcteamreport.com" },
          { name: "Explore", url: "https://pokemonvgcteamreport.com/explore" },
          { name: breadcrumbLeaf, url: `https://pokemonvgcteamreport.com/s/${id}` },
        ]}
      />
      <ShareRedirectClient to={`/${qs}`} heading={heading} />
      {/* Server-rendered crawlable footer. The client redirect above mounts
          the SPA at /?s=<id>, but crawlers that don't execute JS still see
          this <footer> in the initial HTML — it distributes internal
          PageRank from the highest-traffic route type (share pages) back
          to the core sections. Intentionally minimal styling so it isn't a
          visual focal point during the brief redirect flash. */}
      <footer className="border-t border-border/40 mt-8 py-6 px-4 text-xs text-text-secondary">
        <nav aria-label="Site footer" className="max-w-5xl mx-auto flex flex-wrap gap-x-4 gap-y-2 justify-center">
          <a href="/" className="hover:text-text-primary transition-colors">Home</a>
          <a href="/explore" className="hover:text-text-primary transition-colors">Explore</a>
          <a href="/champions" className="hover:text-text-primary transition-colors">Champions</a>
          <a href="/tournaments" className="hover:text-text-primary transition-colors">Tournaments</a>
          <a href="/faq" className="hover:text-text-primary transition-colors">FAQ</a>
        </nav>
      </footer>
    </>
  );
}
