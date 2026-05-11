import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";
import { notFound } from "next/navigation";

export const revalidate = 600;

// Use canonical slug resolver — single source of truth for all sprite slugs
import { resolveSlug as toSpriteSlug } from "@/lib/utils/sprite-slug";

export default async function EmbedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const rows = await sql`SELECT data FROM shares WHERE id = ${id} AND is_public = TRUE AND deleted_at IS NULL`;
  if (rows.length === 0) notFound();

  const data = rows[0].data as Record<string, unknown>;
  const paste = (data.paste as string) ?? "";
  const tournamentName = (data.tournamentName as string) ?? "";
  const placement = (data.placement as string) ?? "";
  const creatorName = (data.creatorName as string) ?? "";
  const summary = (data.teamSummary as string) ?? "";
  const species = extractSpecies(paste);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{tournamentName || "VGC Team Report"}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #0B0B1A;
            color: #F0EDE6;
            padding: 16px;
            max-width: 100%;
            overflow: hidden;
          }
          .header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
          .title { font-size: 16px; font-weight: 800; }
          .placement { font-size: 12px; font-weight: 800; color: #E11D48; background: rgba(225,29,72,0.12); padding: 2px 8px; border-radius: 4px; }
          .creator { font-size: 12px; color: #8A8AA3; }
          .team { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
          .mon { display: flex; flex-direction: column; align-items: center; gap: 4px; }
          .mon img { width: 48px; height: 48px; object-fit: contain; }
          .mon-name { font-size: 10px; font-weight: 700; color: #C0C0D8; text-align: center; }
          .summary { font-size: 11px; color: #8A8AA3; line-height: 1.5; max-height: 3em; overflow: hidden; text-overflow: ellipsis; }
          .cta {
            display: inline-flex; align-items: center; gap: 4px;
            font-size: 10px; font-weight: 700; color: #E11D48;
            text-decoration: none; margin-top: 8px;
          }
          .cta:hover { text-decoration: underline; }
        `}</style>
      </head>
      <body>
        <div className="header" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {tournamentName && <span style={{ fontSize: 16, fontWeight: 800 }}>{tournamentName}</span>}
          {placement && <span style={{ fontSize: 12, fontWeight: 800, color: "#E11D48", background: "rgba(225,29,72,0.12)", padding: "2px 8px", borderRadius: 4 }}>{placement}</span>}
          {creatorName && <span style={{ fontSize: 12, color: "#8A8AA3" }}>by {creatorName}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {species.map((name) => (
            <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://play.pokemonshowdown.com/sprites/home/${toSpriteSlug(name)}.png`}
                alt={name}
                width={48}
                height={48}
                style={{ objectFit: "contain" }}
              />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#C0C0D8", textAlign: "center" }}>{name}</span>
            </div>
          ))}
        </div>
        {summary && (
          <p style={{ fontSize: 11, color: "#8A8AA3", lineHeight: 1.5, maxHeight: "3em", overflow: "hidden" }}>
            {summary.slice(0, 200)}{summary.length > 200 ? "..." : ""}
          </p>
        )}
        <a
          href={`https://pokemonvgcteamreport.com/s/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "#E11D48", textDecoration: "none", marginTop: 8 }}
        >
          View full report &rarr;
        </a>
      </body>
    </html>
  );
}
