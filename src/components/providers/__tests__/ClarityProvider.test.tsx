// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClarityProvider } from "@/components/providers/ClarityProvider";
import { notifyConsentChange } from "@/lib/consent";

// react's act() requires this flag to be set in a test environment.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  clarity: { init: vi.fn(), consent: vi.fn() },
  failImport: false,
}));

// `default` is a getter so a single test can make the lazy import reject
// without poisoning the cached module for every other test.
vi.mock("@microsoft/clarity", () => ({
  get default() {
    if (mocks.failImport) throw new Error("ChunkLoadError");
    return mocks.clarity;
  },
}));

function setAnalyticsConsentCookie(accepted: boolean) {
  const value = encodeURIComponent(JSON.stringify({ categories: accepted ? ["analytics"] : [] }));
  document.cookie = `cc_cookie=${value}`;
}

function mount() {
  const container = document.createElement("div");
  let root!: Root;
  act(() => {
    root = createRoot(container);
    root.render(createElement(ClarityProvider));
  });
  return () => act(() => root.unmount());
}

/** Lets the in-flight dynamic import settle and React drain its work. */
async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_CLARITY_ID", "test-clarity-id");
  mocks.clarity.init.mockClear();
  mocks.clarity.consent.mockClear();
  mocks.failImport = false;
  setAnalyticsConsentCookie(true);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ClarityProvider", () => {
  it("does not start recording when consent is withdrawn mid-import", async () => {
    const unmount = mount();
    // Synchronous, so it lands while `await import("@microsoft/clarity")` is
    // still pending — the exact window where the old code let init() through.
    notifyConsentChange(false);
    await flush();

    expect(mocks.clarity.init).not.toHaveBeenCalled();
    expect(mocks.clarity.consent).not.toHaveBeenCalledWith(true);
    unmount();
  });

  it("still honours consent re-granted after a mid-import withdrawal", async () => {
    const unmount = mount();
    notifyConsentChange(false);
    await flush();
    expect(mocks.clarity.init).not.toHaveBeenCalled();

    notifyConsentChange(true);
    await flush();

    expect(mocks.clarity.init).toHaveBeenCalledTimes(1);
    expect(mocks.clarity.consent).toHaveBeenLastCalledWith(true);
    unmount();
  });

  it("stops tracking when consent is withdrawn after Clarity has started", async () => {
    const unmount = mount();
    await flush();
    expect(mocks.clarity.init).toHaveBeenCalledTimes(1);
    expect(mocks.clarity.consent).toHaveBeenLastCalledWith(true);

    notifyConsentChange(false);
    await flush();

    expect(mocks.clarity.consent).toHaveBeenLastCalledWith(false);
    expect(mocks.clarity.init).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("re-grants consent without initialising Clarity twice", async () => {
    const unmount = mount();
    await flush();
    notifyConsentChange(false);
    await flush();
    notifyConsentChange(true);
    await flush();

    expect(mocks.clarity.init).toHaveBeenCalledTimes(1);
    expect(mocks.clarity.consent).toHaveBeenLastCalledWith(true);
    unmount();
  });

  it("never initialises without consent", async () => {
    setAnalyticsConsentCookie(false);
    const unmount = mount();
    await flush();

    expect(mocks.clarity.init).not.toHaveBeenCalled();
    expect(mocks.clarity.consent).not.toHaveBeenCalled();
    unmount();
  });

  it("survives the Clarity import rejecting", async () => {
    mocks.failImport = true;
    const unmount = mount();
    await flush();

    expect(mocks.clarity.init).not.toHaveBeenCalled();

    // A later withdrawal must not throw even though the SDK never loaded.
    mocks.failImport = false;
    notifyConsentChange(false);
    await flush();
    expect(mocks.clarity.consent).not.toHaveBeenCalled();
    unmount();
  });
});
