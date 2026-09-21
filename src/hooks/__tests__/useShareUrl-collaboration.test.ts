// @vitest-environment jsdom
import { act } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderHook } from "./render-hook";
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("s=abcd1234") }));
vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ isLoaded: true, userId: "owner" }) }));
import { useShareUrl } from "../useShareUrl";
const state = { paste: "Pikachu\n- Protect", notes: {}, matchupPlans: [], creatorName: "Trainer" };
let hook: ReturnType<typeof renderHook<ReturnType<typeof useShareUrl>>>;
beforeEach(async () => {
  window.history.replaceState({}, "", "/?s=abcd1234");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ...state, _editable: true, _isOwner: true, _isUnlisted: true, _isPublic: false, _editToken: "token", _version: 1 }))));
  await act(async () => { hook = renderHook(useShareUrl); await new Promise(resolve => setTimeout(resolve, 0)); });
});
afterEach(() => { hook.unmount(); vi.unstubAllGlobals(); });
it("preserves unsaved local edits when a newer remote version arrives", () => {
  const local = { ...state, teamSummary: "My local strategy" };
  const remote = { ...state, teamSummary: "Teammate strategy" };
  let accepted = true;
  act(() => { accepted = hook.current.receiveRemote(remote, 2, local); });
  expect(accepted).toBe(false);
  expect(hook.current.conflict?.state).toEqual(remote);
  expect(hook.current.getVersion()).toBe(1);
  act(() => { hook.current.resolveConflict("local"); });
  expect(hook.current.conflict).toBeNull();
  expect(hook.current.getVersion()).toBe(2);
});
it("accepts a remote update when local content is unchanged", () => {
  let accepted = false;
  act(() => { accepted = hook.current.receiveRemote({ ...state, teamSummary: "Remote" }, 2, state); });
  expect(accepted).toBe(true); expect(hook.current.conflict).toBeNull(); expect(hook.current.getVersion()).toBe(2);
});
it("does not mistake a device's default theme for unsaved report content", () => {
  let accepted = false;
  act(() => { accepted = hook.current.receiveRemote({ ...state, teamSummary: "Remote" }, 2, { ...state, genTheme: "gen9" }); });
  expect(accepted).toBe(true);
  expect(hook.current.conflict).toBeNull();
});
it("sends the loaded version, pauses after 409, and retries only after explicit resolution", async () => {
  const remote = { ...state, teamSummary: "Teammate" };
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ state: remote, version: 2, error: "Conflict" }), { status: 409 }));
  await act(async () => { await hook.current.autoSave({ ...state, teamSummary: "Mine" }); });
  expect(JSON.parse(vi.mocked(fetch).mock.calls.at(-1)![1]!.body as string).expectedVersion).toBe(1);
  const calls = vi.mocked(fetch).mock.calls.length;
  await act(async () => { await hook.current.autoSave(state); });
  expect(fetch).toHaveBeenCalledTimes(calls);
  act(() => { hook.current.resolveConflict("local"); });
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ version: 3 })));
  await act(async () => { await hook.current.autoSave({ ...state, teamSummary: "Mine" }); });
  expect(JSON.parse(vi.mocked(fetch).mock.calls.at(-1)![1]!.body as string).expectedVersion).toBe(2);
  expect(hook.current.getVersion()).toBe(3);
});
