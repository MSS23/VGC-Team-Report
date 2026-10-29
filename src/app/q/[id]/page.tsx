import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { QUICK_OWNER_COOKIE, ownsQuickShare, validQuickId } from "@/lib/sharing/quick-share";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { pokemonToShowdown } from "@/lib/utils/export-paste";
import { PokemonSprite } from "@/components/report/PokemonSprite";
import { ClaimQuickShare } from "./ClaimQuickShare";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Guest Team Report", robots: { index: false, follow: false } };

export default async function QuickSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!validQuickId(id)) notFound();
  const sql = getDb();
  const rows = await sql`SELECT paste, expires_at, owner_hash, claimed_share_id FROM quick_shares
    WHERE id = ${id} AND (expires_at > NOW() OR claimed_share_id IS NOT NULL)`;
  const row = rows[0];
  if (!row) return <main className="mx-auto max-w-5xl space-y-4 px-4 py-12"><h1 className="text-2xl font-bold">This guest report is no longer available</h1><p>Guest links expire after 30 days unless saved to an account.</p><Link href="/" className="inline-flex min-h-11 items-center underline focus-visible:ring-2 focus-visible:ring-accent">Create a new team report</Link></main>;
  if (row.claimed_share_id) redirect(`/s/${row.claimed_share_id}`);
  const jar = await cookies();
  const canClaim = ownsQuickShare(jar.get(QUICK_OWNER_COOKIE)?.value ?? null, row.owner_hash as string);
  const team = parseShowdownPaste(row.paste as string);
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 text-text-primary sm:px-6">
    <header className="space-y-2"><Link href="/" className="inline-flex min-h-11 items-center text-sm underline focus-visible:ring-2 focus-visible:ring-accent">VGC Team Report</Link><h1 className="text-3xl font-bold">Guest team report</h1><p className="text-sm text-text-secondary">Anyone with this link can view it. Expires {new Date(row.expires_at as string).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" })} (UTC).</p></header>
    <ClaimQuickShare id={id} canClaim={canClaim} />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{team.pokemon.map((p, index) => <article key={index} className="rounded-xl border border-border bg-surface p-4"><div className="flex items-center gap-3"><PokemonSprite species={p.species} shiny={p.shiny} animated={false} size={80} /><h2 className="text-lg font-bold">{p.nickname || p.species}</h2></div><pre className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed">{pokemonToShowdown(p)}</pre></article>)}</div>
    <details className="rounded-xl border border-border p-4"><summary className="min-h-11 cursor-pointer py-2 font-semibold focus-visible:ring-2 focus-visible:ring-accent">Original Showdown paste</summary><pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm">{row.paste as string}</pre></details>
  </main>;
}
