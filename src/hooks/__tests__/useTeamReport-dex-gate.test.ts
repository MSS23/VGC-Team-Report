// @vitest-environment jsdom
/**
 * useTeamReport × the lazy dex fallback — VGC-271.
 *
 * The dex subset now arrives in an on-demand chunk, so `lookupPokemon` answers
 * `null` for uncommon species until it lands. This suite pins the behaviour
 * that keeps that invisible: a team the static maps cover commits immediately,
 * and a team that needs the dex is NOT committed to state until the chunk has
 * loaded — so a card never renders with an empty name and 0% stat bars.
 *
 * `vitest.setup.ts` registers the fallback globally (mirroring the server), so
 * each test starts from `vi.resetModules()` to get the un-loaded client state.
 * React and the hook are both imported *after* the reset so they share one
 * module instance.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const COMMON_PASTE = [
  "Incineroar @ Assault Vest",
  "Ability: Intimidate",
  "EVs: 252 HP / 4 Atk / 252 SpD",
  "- Fake Out",
].join("\n");

// Clefable-Mega is deliberately absent from the hand-maintained POKEMON_DATA
// map — the dex subset is the only thing that can resolve it.
const UNCOMMON_PASTE = [
  "Clefable-Mega @ Leftovers",
  "Ability: Magic Guard",
  "EVs: 252 HP / 252 SpA / 4 SpD",
  "- Moonblast",
].join("\n");

async function setup() {
  const { act } = await import("react");
  const { renderHook } = await import("./render-hook");
  const { useTeamReport } = await import("@/hooks/useTeamReport");
  const fallback = await import("@/lib/data/pkmn-dex-fallback");
  return { act, renderHook, useTeamReport, fallback };
}

describe("useTeamReport — dex-fallback commit gate", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it("commits a static-map team synchronously and never fetches the chunk", async () => {
    const { act, renderHook, useTeamReport, fallback } = await setup();
    const hook = renderHook(() => useTeamReport());

    act(() => {
      hook.current.parseTeam(COMMON_PASTE);
    });

    expect(hook.current.analysis).not.toBeNull();
    expect(hook.current.analysis?.pokemon[0].data?.name).toBe("Incineroar");
    expect(fallback.isDexFallbackReady()).toBe(false);
  });

  it("withholds a dex-only team until the chunk lands, then renders it whole", async () => {
    const { act, renderHook, useTeamReport, fallback } = await setup();
    const hook = renderHook(() => useTeamReport());

    act(() => {
      hook.current.parseTeam(UNCOMMON_PASTE);
    });

    // The flash this ticket had to avoid: nothing is committed while the data
    // would still be missing.
    expect(hook.current.analysis).toBeNull();

    await act(async () => {
      await fallback.loadDexFallback();
    });

    expect(fallback.isDexFallbackReady()).toBe(true);
    const mon = hook.current.analysis?.pokemon[0];
    expect(mon?.data?.name).toBe("Clefable-Mega");
    expect(mon?.data?.types).toEqual(["Fairy", "Flying"]);
    // Real stats, not the 0-filled placeholder the null path produces.
    expect(mon?.calculatedStats.hp).toBeGreaterThan(0);
  });

  it("commits the newest paste when an earlier one was still waiting", async () => {
    const { act, renderHook, useTeamReport, fallback } = await setup();
    const hook = renderHook(() => useTeamReport());

    act(() => {
      hook.current.parseTeam(UNCOMMON_PASTE);
      hook.current.parseTeam(COMMON_PASTE);
    });

    await act(async () => {
      await fallback.loadDexFallback();
    });

    expect(hook.current.analysis?.pokemon).toHaveLength(1);
    expect(hook.current.analysis?.pokemon[0].data?.name).toBe("Incineroar");
  });
});
