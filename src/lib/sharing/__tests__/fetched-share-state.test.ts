/**
 * Regression tests for H1: the `/api/share/{id}` body was asserted into
 * `ShareableState` with `state as ShareableState` and no runtime validation,
 * while the sibling URL-decode path (`decodeShareState`) had been running
 * `ShareableStateSchema.safeParse` and failing closed since VGC-146.
 *
 * The validator under test lives in `useShareUrl.ts` but is a pure async
 * function, so it is tested here beside the other sharing-codec tests rather
 * than through a rendered hook.
 */
import { describe, it, expect, vi } from "vitest";

// `useShareUrl` is a client hook; these imports only need to resolve, nothing
// in them is called by the function under test.
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ isLoaded: true, userId: null }) }));

import { parseFetchedShareState } from "@/hooks/useShareUrl";
import { normalizeReportData } from "@/lib/utils/normalize-report";

const MINIMAL = {
  paste: "Garchomp @ Life Orb\nAbility: Rough Skin\n- Earthquake",
  notes: {},
  matchupPlans: [],
};

describe("parseFetchedShareState — fetched share bodies are validated, not cast", () => {
  it("accepts a well-formed body and returns the parsed state", async () => {
    const state = await parseFetchedShareState({ ...MINIMAL, notes: { "0": "Lead" } });
    expect(state).not.toBeNull();
    expect(state?.paste).toBe(MINIMAL.paste);
    expect(state?.notes).toEqual({ "0": "Lead" });
  });

  it("rejects a body whose notes map holds non-strings (the unchecked-cast bug)", async () => {
    expect(await parseFetchedShareState({ ...MINIMAL, notes: { "0": 42 } })).toBeNull();
    expect(await parseFetchedShareState({ ...MINIMAL, notes: "not a map" })).toBeNull();
  });

  it("rejects a body missing the required keys instead of half-rendering it", async () => {
    expect(await parseFetchedShareState({ paste: "x", notes: {} })).toBeNull();
    expect(await parseFetchedShareState({ notes: {}, matchupPlans: [] })).toBeNull();
    expect(await parseFetchedShareState({ ...MINIMAL, matchupPlans: "nope" })).toBeNull();
  });

  it("rejects non-object payloads", async () => {
    expect(await parseFetchedShareState(null)).toBeNull();
    expect(await parseFetchedShareState(undefined)).toBeNull();
    expect(await parseFetchedShareState("a string body")).toBeNull();
    expect(await parseFetchedShareState(7)).toBeNull();
    expect(await parseFetchedShareState([MINIMAL])).toBeNull();
  });

  it("rejects a malformed matchup plan (bad bring tuple, bad result)", async () => {
    const badBring = {
      ...MINIMAL,
      matchupPlans: [
        {
          opponentPaste: "",
          opponentLabel: "Sun",
          gamePlans: [{ bring: [0, 1], notes: "" }],
        },
      ],
    };
    expect(await parseFetchedShareState(badBring)).toBeNull();

    const badResult = {
      ...MINIMAL,
      matchupPlans: [
        {
          opponentPaste: "",
          opponentLabel: "Sun",
          gamePlans: [{ bring: [0, 1, 2, 3], notes: "", result: "win" }],
        },
      ],
    };
    expect(await parseFetchedShareState(badResult)).toBeNull();
  });

  it("accepts a legacy planA/planB report exactly as the API serves it", async () => {
    // A row written by an older release: planA/planB + spreadNotes, no
    // gamePlans. `normalizeReportData` is what the GET route runs before the
    // body reaches the client, so this is the real wire shape.
    const legacyRow = {
      paste: "Miraidon @ Choice Specs\nAbility: Hadron Engine\n- Electro Drift",
      notes: { "0": "Restricted" },
      spreadNotes: { "0": "252 SpA / 252 Spe" },
      calcs: { "0": ["Electro Drift vs Flutter Mane: 112%"] },
      matchupPlans: [
        {
          opponentPaste: "Calyrex-Shadow @ Focus Sash",
          opponentLabel: "Calyrex-Shadow",
          notes: "Lead Miraidon",
          planA: { lead: [0, 1], back: [2, 3] },
          planB: { lead: [1, 0], back: [3, 2] },
        },
      ],
      commonModes: { leads: "Miraidon + Rillaboom", modes: "Trick Room" },
    };

    const state = await parseFetchedShareState(normalizeReportData(legacyRow));
    expect(state).not.toBeNull();
    expect(state?.matchupPlans[0].gamePlans?.[0].bring).toEqual([0, 1, 2, 3]);
    // spreadNotes was merged into notes by the normalizer, not dropped.
    expect(state?.notes["0"]).toContain("252 SpA / 252 Spe");
    expect(state?.commonModes?.leads).toBe("Miraidon + Rillaboom");
  });

  it("still loads a report whose hiddenSlides hold legacy numeric slide ids", async () => {
    // POST /api/share accepts `hiddenSlides: (number | string)[]`, so numeric
    // entries are legitimate stored data. They are inert view preferences —
    // rejecting the whole report over them would lock a user out of their own
    // team, so the field is dropped and the rest is still validated.
    const state = await parseFetchedShareState({
      ...MINIMAL,
      hiddenSlides: [0, 2, "speed-tiers"],
      spriteSettings: "legacy junk",
    });
    expect(state).not.toBeNull();
    expect(state?.paste).toBe(MINIMAL.paste);
    expect(state?.hiddenSlides).toBeUndefined();
    expect(state?.spriteSettings).toBeUndefined();
  });

  it("keeps well-formed hiddenSlides and spriteSettings untouched", async () => {
    const state = await parseFetchedShareState({
      ...MINIMAL,
      hiddenSlides: ["speed-tiers"],
      spriteSettings: { "0": { shiny: true, animated: false } },
    });
    expect(state?.hiddenSlides).toEqual(["speed-tiers"]);
    expect(state?.spriteSettings).toEqual({ "0": { shiny: true, animated: false } });
  });

  it("does not let the legacy tolerance smuggle a structurally broken report through", async () => {
    const state = await parseFetchedShareState({
      ...MINIMAL,
      notes: { "0": null },
      hiddenSlides: [0],
    });
    expect(state).toBeNull();
  });

  it("strips the API's internal flags and any unknown keys", async () => {
    const state = await parseFetchedShareState({
      ...MINIMAL,
      _isUnlisted: true,
      replays: ["https://example.com/replay"],
    });
    expect(state).not.toBeNull();
    expect(state as unknown as Record<string, unknown>).not.toHaveProperty("_isUnlisted");
    expect(state as unknown as Record<string, unknown>).not.toHaveProperty("replays");
  });
});
