import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

interface MatchLogRow {
  id: string;
  opponent_archetype: string;
  result: "win" | "loss" | "tie";
  game_count: number;
  notes: string | null;
  tournament_name: string | null;
  share_id: string | null;
  logged_at: Date;
}

const MatchLogBody = z.object({
  opponentArchetype: z.string().min(1).max(100),
  result: z.enum(["win", "loss", "tie"]),
  gameCount: z.number().int().min(1).max(3).default(2),
  notes: z.string().max(500).optional(),
  tournamentName: z.string().max(200).optional(),
  shareId: z.string().max(50).optional(),
});

export async function POST(request: NextRequest) {
  const guard = await apiGuard(request, { rateLimit: { key: "match-log", max: 60 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = MatchLogBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { opponentArchetype, result, gameCount, notes, tournamentName, shareId } = parsed.data;

    const sql = getDb();
    const rows = await sql`
      INSERT INTO match_logs (user_id, share_id, opponent_archetype, result, game_count, notes, tournament_name)
      VALUES (
        ${userId},
        ${shareId ?? null},
        ${opponentArchetype.trim()},
        ${result},
        ${gameCount},
        ${notes?.trim() ?? null},
        ${tournamentName?.trim() ?? null}
      )
      RETURNING id, logged_at
    `;

    return NextResponse.json({ success: true, id: rows[0].id, loggedAt: rows[0].logged_at });
  } catch (e) {
    console.error("Match log POST error:", e);
    return NextResponse.json({ error: "Failed to log match" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const guard = await apiGuard(request, { rateLimit: { key: "match-log-delete", max: 30 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const parsed = z.string().uuid().safeParse(idParam);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid or missing id" }, { status: 400 });
    }
    const id = parsed.data;

    const sql = getDb();
    const rows = await sql`
      DELETE FROM match_logs
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Match log DELETE error:", e);
    return NextResponse.json({ error: "Failed to delete match log" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const guard = await apiGuard(request, { rateLimit: { key: "match-log-get", max: 30 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDb();
    const rows = (await sql`
      SELECT id, opponent_archetype, result, game_count, notes, tournament_name, logged_at, share_id
      FROM match_logs
      WHERE user_id = ${userId}
      ORDER BY logged_at DESC
      LIMIT 200
    `) as MatchLogRow[];

    const logs = rows.map((r) => ({
      id: r.id,
      opponentArchetype: r.opponent_archetype,
      result: r.result,
      gameCount: r.game_count,
      notes: r.notes,
      tournamentName: r.tournament_name,
      shareId: r.share_id,
      loggedAt: r.logged_at.toISOString(),
    }));

    // Build win-rate summary by archetype
    const archetypeMap: Record<string, { wins: number; losses: number; ties: number }> = {};
    for (const log of logs) {
      const key = log.opponentArchetype;
      if (!archetypeMap[key]) archetypeMap[key] = { wins: 0, losses: 0, ties: 0 };
      if (log.result === "win") archetypeMap[key].wins++;
      else if (log.result === "loss") archetypeMap[key].losses++;
      else archetypeMap[key].ties++;
    }

    const archetypeStats = Object.entries(archetypeMap)
      .map(([archetype, counts]) => {
        const total = counts.wins + counts.losses + counts.ties;
        const winRate = total > 0 ? Math.round((counts.wins / total) * 100) : 0;
        return { archetype, ...counts, total, winRate };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const totalWins = logs.filter((l) => l.result === "win").length;
    const totalLosses = logs.filter((l) => l.result === "loss").length;
    const totalTies = logs.filter((l) => l.result === "tie").length;
    const totalGames = logs.length;
    const overallWinRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

    return NextResponse.json({
      logs,
      summary: { totalWins, totalLosses, totalTies, totalGames, overallWinRate },
      archetypeStats,
    });
  } catch (e) {
    console.error("Match log GET error:", e);
    return NextResponse.json({ error: "Failed to fetch match logs" }, { status: 500 });
  }
}
