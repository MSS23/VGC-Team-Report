import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { ShareRedirectClient } from "./redirect";

// Extract species names from a Showdown paste
function extractSpecies(paste: string): string[] {
  const blocks = paste.trim().split(/\n\s*\n/);
  const species: string[] = [];
  for (const block of blocks) {
    const firstLine = block.trim().split("\n")[0]?.trim();
    if (!firstLine) continue;
    let namePart = firstLine.split(" @ ")[0].trim();
    namePart = namePart.replace(/\s*\([MF]\)\s*$/, "");
    const nicknameMatch = namePart.match(/^.+\((.+)\)$/);
    species.push(nicknameMatch ? nicknameMatch[1].trim() : namePart);
  }
  return species.slice(0, 6);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const sql = getDb();
    const rows = await sql`SELECT data FROM shares WHERE id = ${id}`;
    if (rows.length === 0) return { title: "VGC Team Report" };

    const data = rows[0].data as Record<string, unknown>;
    const paste = (data.paste as string) ?? "";
    const tournamentName = (data.tournamentName as string) ?? "";
    const creatorName = (data.creatorName as string) ?? "";
    const teamSummary = (data.teamSummary as string) ?? "";
    const species = extractSpecies(paste);

    const title = tournamentName
      ? `${tournamentName} - VGC Team Report`
      : species.length > 0
        ? `${species.join(" / ")} - VGC Team Report`
        : "VGC Team Report";

    const description = teamSummary
      || (creatorName
        ? `Team by ${creatorName}: ${species.join(", ")}`
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

  return <ShareRedirectClient to={`/${qs}`} />;
}
