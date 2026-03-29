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
    const species = extractSpecies(paste);
    const collabNames = collabRows.map((r) => r.user_name as string);

    const title = tournamentName
      ? `${tournamentName} - VGC Team Report`
      : species.length > 0
        ? `${species.join(" / ")} - VGC Team Report`
        : "VGC Team Report";

    const authorLabel = creatorName
      ? `Team by ${creatorName}${collabNames.length ? ` with ${collabNames.join(", ")}` : ""}`
      : undefined;

    const description = teamSummary
      || (authorLabel
        ? `${authorLabel}: ${species.join(", ")}`
        : `Team: ${species.join(", ")}`);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        siteName: "VGC Team Report",
      },
      alternates: {
        canonical: `https://pokemonvgcteamreport.com/s/${id}`,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
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
