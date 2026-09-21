import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/security/api-guard";
import { normalizeLimitlessUrl, parseLimitlessTeam, parseLimitlessTournament } from "@/lib/import/limitless";

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(8000), headers: { "User-Agent": "VGC-Team-Report/1.0" } });
  if (!response.ok) throw new Error(`Limitless returned ${response.status}. Try again later.`);
  if (!response.body) throw new Error("Limitless returned an empty response.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 2_000_000) throw new Error("Limitless page is too large to import.");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "limitless-import", max: 15 } });
  if (guard) return guard;
  let url: string;
  try { url = normalizeLimitlessUrl(new URL(request.url).searchParams.get("url") ?? ""); }
  catch { return NextResponse.json({ error: "Use a team URL such as https://limitlessvgc.com/teams/6859" }, { status: 400 }); }
  try {
    const team = parseLimitlessTeam(await fetchPage(url));
    const requestedIndex = Number(new URL(request.url).searchParams.get("result") ?? 0);
    if (!Number.isInteger(requestedIndex) || !team.results[requestedIndex]) return NextResponse.json({ error: "Choose a valid tournament result." }, { status: 400 });
    const selected = team.results[requestedIndex];
    const tags = parseLimitlessTournament(await fetchPage(selected.tournamentUrl));
    return NextResponse.json({
      ...team, selectedIndex: requestedIndex,
      state: { paste: team.paste, notes: {}, matchupPlans: [], tournamentName: selected.tournamentName, placement: selected.placement, creatorName: selected.player,
        tags: { ...tags, tournamentUrl: selected.tournamentUrl, eventType: /regional/i.test(selected.tournamentName) ? "Regional" : /world/i.test(selected.tournamentName) ? "Worlds" : /international|[ENL]AIC|EUIC/i.test(selected.tournamentName) ? "International" : "Other" },
      },
    }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to import this team." }, { status: 502 });
  }
}
