// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook } from "./render-hook";
import { useUndoRedo, type UndoRedoSnapshot } from "@/hooks/useUndoRedo";

function snap(summary: string): UndoRedoSnapshot {
  return { notes: {}, calcs: {}, roles: {}, summary, plans: [] };
}

describe("useUndoRedo", () => {
  it("starts empty — cannot undo or redo", () => {
    const { current } = renderHook(() => useUndoRedo());
    expect(current.canUndo()).toBe(false);
    expect(current.canRedo()).toBe(false);
    expect(current.undo()).toBeNull();
    expect(current.redo()).toBeNull();
  });

  it("undo returns the previous snapshot, redo returns forward again", () => {
    const { current } = renderHook(() => useUndoRedo());
    current.pushSnapshot(snap("a"));
    current.pushSnapshot(snap("b"));
    current.pushSnapshot(snap("c"));

    expect(current.canUndo()).toBe(true);
    expect(current.undo()?.summary).toBe("b");
    // undo() flips the internal restoring flag; clear it as the app does.
    current.doneRestoring();
    expect(current.undo()?.summary).toBe("a");
    current.doneRestoring();
    expect(current.canUndo()).toBe(false); // at the oldest entry

    expect(current.redo()?.summary).toBe("b");
    current.doneRestoring();
    expect(current.redo()?.summary).toBe("c");
    current.doneRestoring();
    expect(current.canRedo()).toBe(false);
  });

  it("ignores snapshots pushed while restoring (undo/redo must not record)", () => {
    const { current } = renderHook(() => useUndoRedo());
    current.pushSnapshot(snap("a"));
    current.pushSnapshot(snap("b"));

    current.undo(); // sets isRestoring = true
    expect(current.isRestoring()).toBe(true);
    // A state-sync effect firing during the restore must be a no-op.
    current.pushSnapshot(snap("SHOULD_BE_DROPPED"));
    current.doneRestoring();

    // History is still [a, b]; redo goes back to b, not the dropped snapshot.
    expect(current.redo()?.summary).toBe("b");
  });

  it("pushing after an undo truncates the redo branch", () => {
    const { current } = renderHook(() => useUndoRedo());
    current.pushSnapshot(snap("a"));
    current.pushSnapshot(snap("b"));
    current.pushSnapshot(snap("c"));

    current.undo(); // now at "b"
    current.doneRestoring();
    current.pushSnapshot(snap("d")); // branches off — "c" is discarded

    expect(current.canRedo()).toBe(false);
    expect(current.undo()?.summary).toBe("b");
  });

  it("caps history at 50 entries", () => {
    const { current } = renderHook(() => useUndoRedo());
    for (let i = 0; i < 60; i++) current.pushSnapshot(snap(`s${i}`));

    // Walk all the way back; the oldest reachable snapshot is s10 (60 - 50).
    let steps = 0;
    let last = current.undo();
    current.doneRestoring();
    while (last) {
      const next = current.undo();
      current.doneRestoring();
      if (!next) break;
      last = next;
      steps++;
    }
    // 50 entries => 49 undo steps from the newest to the oldest.
    expect(steps).toBe(48);
    expect(last?.summary).toBe("s10");
  });
});
