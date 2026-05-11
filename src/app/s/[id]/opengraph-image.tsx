import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VGC Team Report — Shared team preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SLUG_MAP: Record<string, string> = {
  "ho-oh": "hooh", "type-null": "typenull", "mr-mime": "mrmime", "mr-rime": "mrrime",
  "mime-jr": "mimejr", "jangmo-o": "jangmoo", "hakamo-o": "hakamoo", "kommo-o": "kommoo",
  "tapu-koko": "tapukoko", "tapu-lele": "tapulele",
  "tapu-bulu": "tapubulu", "tapu-fini": "tapufini",
  "flutter-mane": "fluttermane", "iron-hands": "ironhands", "iron-bundle": "ironbundle",
  "iron-valiant": "ironvaliant", "iron-moth": "ironmoth", "iron-thorns": "ironthorns",
  "iron-jugulis": "ironjugulis", "iron-leaves": "ironleaves", "iron-boulder": "ironboulder",
  "iron-crown": "ironcrown", "great-tusk": "greattusk", "brute-bonnet": "brutebonnet",
  "scream-tail": "screamtail", "sandy-shocks": "sandyshocks", "slither-wing": "slitherwing",
  "roaring-moon": "roaringmoon", "walking-wake": "walkingwake", "gouging-fire": "gougingfire",
  "raging-bolt": "ragingbolt", "chien-pao": "chienpao", "chi-yu": "chiyu",
  "ting-lu": "tinglu", "wo-chien": "wochien",
  "urshifu-rapid-strike": "urshifu-rapidstrike",
  "necrozma-dusk-mane": "necrozma-duskmane", "necrozma-dawn-wings": "necrozma-dawnwings",
  "oricorio-pom-pom": "oricorio-pompom", "mr-mime-galar": "mrmime-galar",
  "tauros-paldea-combat": "tauros-paldeacombat", "tauros-paldea-blaze": "tauros-paldeablaze",
  "tauros-paldea-aqua": "tauros-paldeaaqua",
  "bloodmoon-ursaluna": "ursaluna-bloodmoon",
  "charizard-mega-x": "charizard-megax", "charizard-mega-y": "charizard-megay",
  "mewtwo-mega-x": "mewtwo-megax", "mewtwo-mega-y": "mewtwo-megay",
};

function toSpriteSlug(species: string): string {
  const slug = species
    .toLowerCase()
    .replace(/♭/g, "m")
    .replace(/♀/g, "f")
    .replace(/[éè]/g, "e")
    .replace(/[''.:']/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return SLUG_MAP[slug] ?? slug;
}

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

interface ShareData {
  paste: string;
  tournamentName: string;
  creatorName: string;
  placement: string;
  record: string;
  tags?: { regulation?: string };
}

async function fetchShareData(id: string): Promise<ShareData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pokemonvgcteamreport.com";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${baseUrl}/api/share/${encodeURIComponent(id)}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    const raw = (json?.data ?? json) as Record<string, unknown>;
    return {
      paste: (raw.paste as string) ?? "",
      tournamentName: (raw.tournamentName as string) ?? "",
      creatorName: (raw.creatorName as string) ?? "",
      placement: (raw.placement as string) ?? "",
      record: (raw.record as string) ?? "",
      tags: (raw.tags as { regulation?: string }) ?? {},
    };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

function FallbackCard() {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0B0B1A 0%, #1C1C38 40%, #0B0B1A 100%)", fontFamily: "system-ui, sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #E11D48, #BE123C)", marginBottom: 28, boxShadow: "0 0 60px rgba(225,29,72,0.3), 0 4px 24px rgba(0,0,0,0.3)" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "white", border: "3px solid #BE123C" }} />
      </div>
      <div style={{ fontSize: 52, fontWeight: 800, color: "#F0EDE6", letterSpacing: "-0.02em", marginBottom: 12 }}>VGC Team Report</div>
      <div style={{ fontSize: 22, color: "#8A8AA3", textAlign: "center" }}>Build, share, and present professional VGC team reports</div>
      <div style={{ marginTop: 36, width: 120, height: 4, borderRadius: 2, background: "linear-gradient(90deg, #E11D48, #FB7185, #8B5CF6)" }} />
      <div style={{ position: "absolute", bottom: 28, fontSize: 14, color: "#4A4A68", letterSpacing: "0.05em" }}>pokemonvgcteamreport.com</div>
    </div>
  );
}

const POKEBALL_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Ccircle cx='48' cy='48' r='44' fill='%23222240' stroke='%23444466' stroke-width='2'/%3E%3Cpath d='M4 48h88M48 4a44 44 0 0 1 44 44' fill='none' stroke='%23333355' stroke-width='2'/%3E%3Ccircle cx='48' cy='48' r='12' fill='%23333355' stroke='%23555577' stroke-width='2'/%3E%3C/svg%3E";

async function fetchSprite(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return POKEBALL_PLACEHOLDER;
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    const mime = res.headers.get("content-type") ?? "image/png";
    return `data:${mime};base64,${b64}`;
  } catch {
    clearTimeout(timeout);
    return POKEBALL_PLACEHOLDER;
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await fetchShareData(id);

  if (!data || !data.paste) {
    return new ImageResponse(<FallbackCard />, { ...size });
  }

  const species = extractSpecies(data.paste);
  const SPRITE_BASE = "https://play.pokemonshowdown.com/sprites/home";
  const spriteUrls = await Promise.all(species.map((name) => fetchSprite(`${SPRITE_BASE}/${toSpriteSlug(name)}.png`)));

  const title = data.tournamentName ? (data.placement ? `${data.tournamentName} — ${data.placement}` : data.tournamentName) : (species.length > 0 ? species.join(" / ") : "VGC Team Report");
  const regulation = data.tags?.regulation ?? "";
  const placementColors = data.placement ? (() => { const p = data.placement.toLowerCase().trim(); if (p === "1st" || p === "1" || p === "winner" || p === "champion") return { bg: "rgba(250,204,21,0.12)", border: "rgba(250,204,21,0.45)", text: "#FCD34D" }; if (p === "2nd" || p === "2" || p === "finalist" || p === "runner-up") return { bg: "rgba(203,213,225,0.10)", border: "rgba(203,213,225,0.35)", text: "#E2E8F0" }; if (p === "3rd" || p === "3") return { bg: "rgba(251,146,60,0.10)", border: "rgba(251,146,60,0.35)", text: "#FDBA74" }; return { bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.25)", text: "#FDA4AF" }; })() : null;

  return new ImageResponse((
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(165deg, #080812 0%, #0B0B1E 30%, #0F0D25 55%, #080810 100%)", fontFamily: "system-ui, sans-serif", position: "relative", overflow: "hidden", gap: 0, padding: "40px 60px" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, transparent 5%, rgba(225,29,72,0.6) 28%, rgba(139,92,246,0.5) 50%, rgba(99,102,241,0.4) 72%, transparent 95%)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 36, maxWidth: 900 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ fontSize: title.length > 40 ? 30 : 38, fontWeight: 800, color: "#F0EEF8", letterSpacing: "-0.02em", textAlign: "center", lineHeight: 1.2 }}>{title}</div>
          {data.placement && placementColors && (<div style={{ fontSize: 18, fontWeight: 800, color: placementColors.text, background: placementColors.bg, border: `1.5px solid ${placementColors.border}`, padding: "4px 14px", borderRadius: 8, flexShrink: 0 }}>{data.placement}</div>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {data.creatorName && (<div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 16 }}><span style={{ color: "#505068" }}>by</span><span style={{ color: "#9898BE", fontWeight: 600 }}>{data.creatorName}</span></div>)}
          {data.record && (<div style={{ fontSize: 14, fontWeight: 700, color: "#A0A0C0", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "3px 10px", borderRadius: 6 }}>{data.record}</div>)}
          {regulation && (<div style={{ fontSize: 13, fontWeight: 700, color: "#8B8BBA", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.20)", padding: "3px 10px", borderRadius: 5 }}>{regulation}</div>)}
        </div>
      </div>
      {species.length > 0 && (
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 16 }}>
          {species.map((name, i) => {
            const spriteDataUrl = spriteUrls[i] ?? POKEBALL_PLACEHOLDER;
            return (<div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}><div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 140, borderRadius: 16, paddingBottom: 10, paddingTop: 6, background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 8px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={spriteDataUrl} alt={name} width={96} height={96} style={{ objectFit: "contain" }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: "#C8C6DC", textAlign: "center", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
            </div></div>);
          })}
        </div>
      )}
      <div style={{ position: "absolute", bottom: 22, right: 32, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#3A3A58", letterSpacing: "0.04em" }}>pokemonvgcteamreport.com</div>
    </div>
  ), { ...size });
}
