// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

// Clerk's modal wrapper just needs to render its trigger child here.
vi.mock("@clerk/nextjs", () => ({
  SignInButton: ({ children }: { children: ReactNode }) => children,
}));

import { ShareViewCTA } from "@/components/ui/ShareViewCTA";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const containers: HTMLElement[] = [];

function render(isSignedIn: boolean) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  containers.push(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      createElement(ShareViewCTA, {
        isSignedIn,
        onDuplicate: () => {},
        onDismiss: () => {},
      }),
    );
  });
  return container;
}

afterEach(() => {
  containers.splice(0).forEach((c) => c.remove());
});

describe("ShareViewCTA — no-auth path for signed-out viewers", () => {
  it("offers a signed-out viewer a plain link to build their own report", async () => {
    const container = render(false);
    const link = container.querySelector<HTMLAnchorElement>('a[href="/"]');
    expect(link).not.toBeNull();
    // Secondary affordance, not a second filled button: Duplicate stays the
    // only primary CTA on the screen.
    expect(link!.className).not.toContain("bg-accent");
    // Tappable at the 44px minimum even though it reads as a text link.
    expect(link!.className).toContain("min-h-[44px]");
    // Accessible name is descriptive on its own, out of context.
    expect(link!.getAttribute("aria-label")).toBe("Build your own team report");
  });

  it("hides it from a signed-in viewer, who already has the app", async () => {
    const container = render(true);
    expect(container.querySelector('a[href="/"]')).toBeNull();
  });

  it("keeps Duplicate as the primary action in both auth states", async () => {
    for (const isSignedIn of [false, true]) {
      const container = render(isSignedIn);
      const primaries = [...container.querySelectorAll("button")].filter((b) =>
        b.className.includes("bg-accent"),
      );
      expect(primaries).toHaveLength(1);
      expect(primaries[0].textContent).toBe("Duplicate");
    }
  });
});
