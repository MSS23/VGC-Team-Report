// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { renderHook } from "./render-hook";
import { useCollaborativeSync } from "@/hooks/useCollaborativeSync";

/**
 * Regression coverage for the §1 autosave↔SSE echo loop that produced 98,905
 * version rows on a single share. The invariant: a version event that is our
 * OWN save coming back (while a save is in flight, or briefly after it
 * resolves) must advance the local version pointer but must NOT be re-applied
 * via onRemoteUpdate — re-applying is what re-parsed the paste, minted new plan
 * IDs, and fired another autosave.
 */

type Listener = (e: { data: string }) => void;

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  url: string;
  listeners: Record<string, Listener[]> = {};
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;
  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, cb: Listener) {
    (this.listeners[type] ||= []).push(cb);
  }
  close() {
    this.readyState = 2;
  }
  emit(type: string, data: unknown) {
    (this.listeners[type] || []).forEach((cb) => cb({ data: JSON.stringify(data) }));
  }
}

beforeEach(() => {
  FakeEventSource.instances = [];
  (globalThis as { EventSource?: unknown }).EventSource = FakeEventSource;
});

afterEach(() => {
  delete (globalThis as { EventSource?: unknown }).EventSource;
});

function mountSync(onRemoteUpdate: (s: unknown) => void) {
  return renderHook(() =>
    useCollaborativeSync({
      shareId: "abcd1234",
      editKey: "edit-key",
      enabled: true,
      onRemoteUpdate,
    }),
  );
}

describe("useCollaborativeSync echo suppression", () => {
  it("applies a genuine remote update", () => {
    const onRemoteUpdate = vi.fn();
    mountSync(onRemoteUpdate);
    const es = FakeEventSource.instances[0];
    expect(es).toBeDefined();

    act(() => es.emit("version", { version: 2, state: { summary: "remote" } }));
    expect(onRemoteUpdate).toHaveBeenCalledTimes(1);
    expect(onRemoteUpdate).toHaveBeenCalledWith({ summary: "remote" });
  });

  it("suppresses the echo of our own in-flight save (markSaving)", () => {
    const onRemoteUpdate = vi.fn();
    const hook = mountSync(onRemoteUpdate);
    const es = FakeEventSource.instances[0];

    act(() => hook.current.markSaving());
    // The server bumps the version and echoes it back — this is OUR write.
    act(() => es.emit("version", { version: 2, state: { summary: "echo" } }));

    expect(onRemoteUpdate).not.toHaveBeenCalled();
  });

  it("keeps suppressing self-echoes for the window after a save resolves", () => {
    const onRemoteUpdate = vi.fn();
    const hook = mountSync(onRemoteUpdate);
    const es = FakeEventSource.instances[0];

    act(() => hook.current.markSaving());
    act(() => hook.current.updateVersion(2)); // save resolved at version 2
    // A lagging echo of that same save arrives after the POST resolved.
    act(() => es.emit("version", { version: 3, state: { summary: "lagging-echo" } }));

    expect(onRemoteUpdate).not.toHaveBeenCalled();
  });

  it("ignores stale version events that are not newer than what we know", () => {
    const onRemoteUpdate = vi.fn();
    const hook = mountSync(onRemoteUpdate);
    const es = FakeEventSource.instances[0];

    act(() => hook.current.updateVersion(5));
    act(() => es.emit("version", { version: 5, state: { summary: "stale" } }));
    expect(onRemoteUpdate).not.toHaveBeenCalled();
  });
});
