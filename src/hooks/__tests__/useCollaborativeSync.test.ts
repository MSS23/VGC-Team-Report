// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { renderHook } from "./render-hook";

// `useCollaborativeSync` imports `parseFetchedShareState` from `useShareUrl`,
// which pulls in the Next/Clerk client hooks at module scope.
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ isLoaded: true, userId: "owner" }) }));

import { useCollaborativeSync } from "@/hooks/useCollaborativeSync";

/**
 * Regression coverage for the §1 autosave↔SSE echo loop that produced 98,905
 * version rows on a single share. The invariant: a version event that is our
 * OWN save coming back (while a save is in flight, or briefly after it
 * resolves) must advance the local version pointer but must NOT be re-applied
 * via onRemoteUpdate — re-applying is what re-parsed the paste, minted new plan
 * IDs, and fired another autosave.
 *
 * Also covers BUG-SYNC-UNNORMALIZED (see the second describe block): the
 * `version` frame is now schema-validated before it reaches onRemoteUpdate, so
 * the `any` from `JSON.parse` can no longer flow into typed editor state.
 */

type Listener = (e: { data: string }) => void;

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  url: string;
  listeners: Record<string, Listener[]> = {};
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;
  closeCount = 0;
  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, cb: Listener) {
    (this.listeners[type] ||= []).push(cb);
  }
  close() {
    this.readyState = 2;
    this.closeCount++;
  }
  emit(type: string, data: unknown) {
    (this.listeners[type] || []).forEach((cb) => cb({ data: JSON.stringify(data) }));
  }
  /** Emit a raw (possibly non-JSON) SSE data payload. */
  emitRaw(type: string, data: string) {
    (this.listeners[type] || []).forEach((cb) => cb({ data }));
  }
}

/** A state object that satisfies `ShareableStateSchema`. */
const VALID = { paste: "Garchomp @ Life Orb\n", notes: {}, matchupPlans: [] };

beforeAll(async () => {
  // Warm the lazily-imported zod schema module so the validation inside the
  // SSE listener settles within the flush below.
  await import("@/lib/sharing/url-codec.schemas");
});

beforeEach(() => {
  FakeEventSource.instances = [];
  (globalThis as { EventSource?: unknown }).EventSource = FakeEventSource;
});

afterEach(() => {
  delete (globalThis as { EventSource?: unknown }).EventSource;
  vi.restoreAllMocks();
});

function mountSync(onRemoteUpdate: (s: unknown, v: number) => void) {
  return renderHook(() =>
    useCollaborativeSync({
      shareId: "abcd1234",
      enabled: true,
      onRemoteUpdate,
    }),
  );
}

/**
 * Validation of the `version` payload is async (the schemas are lazily
 * imported), so emitting a frame needs a macrotask flush before assertions.
 */
async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function emitVersion(es: FakeEventSource, data: unknown) {
  await act(async () => {
    es.emit("version", data);
  });
  await flush();
}

describe("useCollaborativeSync echo suppression", () => {
  it("connects with account cookies and never places edit credentials in the URL", () => {
    mountSync(vi.fn());
    expect(FakeEventSource.instances[0].url).toContain("/api/sync/abcd1234?");
    expect(FakeEventSource.instances[0].url).not.toContain("key=");
  });

  it("applies a genuine remote update", async () => {
    const onRemoteUpdate = vi.fn();
    mountSync(onRemoteUpdate);
    const es = FakeEventSource.instances[0];
    expect(es).toBeDefined();

    await emitVersion(es, { version: 2, state: { ...VALID, teamSummary: "remote" } });
    expect(onRemoteUpdate).toHaveBeenCalledTimes(1);
    expect(onRemoteUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ teamSummary: "remote" }),
      2,
    );
  });

  it("suppresses the echo of our own in-flight save (markSaving)", async () => {
    const onRemoteUpdate = vi.fn();
    const hook = mountSync(onRemoteUpdate);
    const es = FakeEventSource.instances[0];

    act(() => hook.current.markSaving());
    // The server bumps the version and echoes it back — this is OUR write.
    await emitVersion(es, { version: 2, state: { ...VALID, teamSummary: "echo" } });

    expect(onRemoteUpdate).not.toHaveBeenCalled();
  });

  it("does not discard a teammate save just after our own save resolves", async () => {
    const onRemoteUpdate = vi.fn();
    const hook = mountSync(onRemoteUpdate);
    const es = FakeEventSource.instances[0];

    act(() => hook.current.markSaving());
    act(() => hook.current.updateVersion(2)); // save resolved at version 2
    // A lagging echo of that same save arrives after the POST resolved.
    await emitVersion(es, { version: 3, state: { ...VALID, teamSummary: "lagging-echo" } });

    expect(onRemoteUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ teamSummary: "lagging-echo" }),
      3,
    );
  });

  it("ignores stale version events that are not newer than what we know", async () => {
    const onRemoteUpdate = vi.fn();
    const hook = mountSync(onRemoteUpdate);
    const es = FakeEventSource.instances[0];

    act(() => hook.current.updateVersion(5));
    await emitVersion(es, { version: 5, state: { ...VALID, teamSummary: "stale" } });
    expect(onRemoteUpdate).not.toHaveBeenCalled();
  });

  it("replays a queued teammate update after the exact own-save echo is discarded", async () => {
    const onRemoteUpdate = vi.fn();
    const hook = mountSync(onRemoteUpdate);
    act(() => hook.current.markSaving());
    await emitVersion(FakeEventSource.instances[0], {
      version: 3,
      state: { ...VALID, paste: "remote" },
    });
    act(() => hook.current.updateVersion(2));
    expect(onRemoteUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ paste: "remote" }),
      3,
    );
    hook.unmount();
  });
});

describe("useCollaborativeSync — BUG-SYNC-UNNORMALIZED: the SSE payload is validated, not cast", () => {
  /**
   * `const { version, state } = JSON.parse(e.data)` typed the payload `any`,
   * so a raw Postgres jsonb blob became `ShareableState` with no diagnostic.
   * The server now normalises before sending; the client validates with the
   * same zod schema the `/api/share/{id}` fetch path uses.
   */
  it("passes a normalised (current-shaped) row through to onRemoteUpdate unchanged", async () => {
    const onRemoteUpdate = vi.fn();
    mountSync(onRemoteUpdate);

    // Exactly what the normalising server route now puts on the wire.
    const normalised = {
      paste: "Garchomp @ Life Orb\n",
      notes: { Garchomp: "Max speed\n\nOutspeeds base 100s" },
      calcs: { Garchomp: [{ text: "110%", category: "offensive" }] },
      roles: {},
      teamSummary: "",
      mvpIndex: null,
      hiddenSlides: [],
      allowComments: false,
      matchupPlans: [
        {
          opponentPaste: "Miraidon @ Choice Specs\n",
          opponentLabel: "Miraidon",
          gamePlans: [{ bring: [0, 1, 2, 3], notes: "Lead Chomp" }],
        },
      ],
    };

    await emitVersion(FakeEventSource.instances[0], { version: 4, state: normalised });

    expect(onRemoteUpdate).toHaveBeenCalledTimes(1);
    const [state, version] = onRemoteUpdate.mock.calls[0];
    expect(version).toBe(4);
    // Pin the shape that reaches the editor: migrated calcs, gamePlans, merged notes.
    expect(state).toMatchObject({
      paste: "Garchomp @ Life Orb\n",
      notes: { Garchomp: "Max speed\n\nOutspeeds base 100s" },
      calcs: { Garchomp: [{ text: "110%", category: "offensive" }] },
      matchupPlans: [
        {
          opponentPaste: "Miraidon @ Choice Specs\n",
          opponentLabel: "Miraidon",
          gamePlans: [{ bring: [0, 1, 2, 3], notes: "Lead Chomp" }],
        },
      ],
    });
    expect(state).not.toHaveProperty("spreadNotes");
  });

  it("ignores a legacy-shaped frame instead of feeding it into the editor", async () => {
    // The pre-fix bug: this exact shape (string calcs, planA/planB, spreadNotes,
    // no `notes`) used to arrive raw and become live editor state, then got
    // saved back — reverting the migration. It now fails closed.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onRemoteUpdate = vi.fn();
    mountSync(onRemoteUpdate);

    await emitVersion(FakeEventSource.instances[0], {
      version: 2,
      state: {
        paste: "Garchomp @ Life Orb\n",
        calcs: { Garchomp: ["252+ Atk Garchomp EQ: 110%"] },
        spreadNotes: { Garchomp: "Outspeeds base 100s" },
        matchupPlans: [{ opponentPaste: "", opponentLabel: "", planA: { lead: [0, 1], back: [2, 3] } }],
      },
    });

    expect(onRemoteUpdate).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it("ignores a malformed frame and keeps the stream alive", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onRemoteUpdate = vi.fn();
    const hook = mountSync(onRemoteUpdate);
    const es = FakeEventSource.instances[0];

    // Not JSON at all.
    await act(async () => es.emitRaw("version", "}{not json"));
    await flush();
    // JSON, but not an object envelope.
    await emitVersion(es, "a string payload");
    await emitVersion(es, [1, 2, 3]);
    await emitVersion(es, null);
    // Object envelope, non-numeric version.
    await emitVersion(es, { version: "2", state: VALID });
    // Object envelope, state fails the schema (notes must be a string map).
    await emitVersion(es, { version: 2, state: { ...VALID, notes: { Garchomp: 42 } } });
    // Object envelope, state missing required fields.
    await emitVersion(es, { version: 2, state: {} });
    await emitVersion(es, { version: 2 });

    expect(onRemoteUpdate).not.toHaveBeenCalled();
    // No frame threw out of the listener, so the EventSource was never torn down.
    expect(es.closeCount).toBe(0);
    expect(hook.current.syncStatus).not.toBe("disconnected");
    expect(FakeEventSource.instances).toHaveLength(1);

    // And a good frame at the same version still applies afterwards: an
    // invalid frame must not poison the version pointer.
    warn.mockClear();
    await emitVersion(es, { version: 2, state: { ...VALID, teamSummary: "recovered" } });
    expect(onRemoteUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ teamSummary: "recovered" }),
      2,
    );
  });

  it("keeps the reconnection catch-up pointer (?since) on the validated version", async () => {
    const onRemoteUpdate = vi.fn();
    const hook = mountSync(onRemoteUpdate);
    const es = FakeEventSource.instances[0];
    expect(es.url).not.toContain("since=");

    await emitVersion(es, { version: 6, state: VALID });

    // Dropping the connection must resume from the version we actually applied.
    await act(async () => {
      es.onerror?.();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });
    expect(FakeEventSource.instances).toHaveLength(2);
    expect(FakeEventSource.instances[1].url).toContain("since=6");
    hook.unmount();
  });
});
