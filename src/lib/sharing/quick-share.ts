import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { lookupPokemon } from "@/lib/data/pokemon";

export const QUICK_OWNER_COOKIE = "vgc-quick-owner";
export const QUICK_SHARE_TTL_SECONDS = 30 * 24 * 60 * 60;
export const validQuickId = (id: string) => /^[a-f0-9]{32}$/.test(id);
export function quickOwnerToken(request: Request): string | null {
  const value = request.headers.get("cookie")?.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${QUICK_OWNER_COOKIE}=`))?.slice(QUICK_OWNER_COOKIE.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
export const newQuickToken = () => randomBytes(32).toString("hex");
export const hashQuickToken = (token: string) => createHash("sha256").update(token).digest("hex");
export function ownsQuickShare(token: string | null, hash: string): boolean {
  if (!token || !/^[a-f0-9]{64}$/.test(hash)) return false;
  return timingSafeEqual(Buffer.from(hashQuickToken(token), "hex"), Buffer.from(hash, "hex"));
}
export function validateQuickPaste(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > 16_000) throw new Error("Paste a Showdown team of up to six Pokémon (maximum 16,000 characters).");
  const paste = value.trim();
  const blocks = paste.replace(/\r\n?/g, "\n").replace(/^===.*===[ \t]*$/gm, "").split(/\n\s*\n/).filter((block) => block.trim());
  if (blocks.length > 6) throw new Error("A guest link supports one team of up to six Pokémon.");
  const team = parseShowdownPaste(paste);
  if (!team.pokemon.length || team.pokemon.length > 6 || team.pokemon.some((p) => !lookupPokemon(p.species) || !p.moves.length || p.moves.length > 4)) throw new Error("Each Pokémon needs a recognized species and one to four moves.");
  return paste;
}
