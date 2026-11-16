import { createElement, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Regression guard (SEO-NAVBAR-SSR): PersistentNavbar used to call
 * useSearchParams() at the top level. During static prerendering that bails
 * the nearest Suspense boundary — the root layout's `fallback={null}` — so
 * 97 of 98 prerendered pages shipped zero navigation links in their HTML.
 *
 * The `?s=` read now lives in a child with its own Suspense boundary, so the
 * bailout can no longer swallow the navbar.
 */

// usePathname resolves statically; useSearchParams is what bails. Reproduce
// the bailout by suspending forever, exactly as Next's static render does.
const mockPathname = vi.fn(() => "/champions");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useSearchParams: () => {
    throw new Promise(() => {});
  },
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isSignedIn: false, isLoaded: true }),
  SignInButton: ({ children }: { children?: ReactNode }) => children ?? null,
  UserButton: () => null,
}));

import { PersistentNavbar } from "@/components/layout/PersistentNavbar";

const NAV_MARKER = 'aria-label="Primary navigation"';

function prerender(pathname: string): string {
  mockPathname.mockReturnValue(pathname);
  return renderToString(createElement(PersistentNavbar));
}

/** Internal hrefs in the markup, ignoring assets. */
function internalLinks(html: string): string[] {
  const hrefs = html.match(/href="\/[^"]*"/g) ?? [];
  return [...new Set(hrefs)].filter((h) => !h.startsWith('href="/_next'));
}

describe("PersistentNavbar static prerendering", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/champions");
  });

  it("does not call useSearchParams at the top level", () => {
    const source = readFileSync(
      path.resolve(__dirname, "../PersistentNavbar.tsx"),
      "utf-8",
    );
    const body = source.slice(source.indexOf("export function PersistentNavbar"));
    const topLevel = body
      .slice(0, body.indexOf("\n}\n"))
      .replace(/\/\/.*$/gm, ""); // comments explain the bailout; they are not calls
    expect(topLevel).not.toContain("useSearchParams(");
  });

  it("prerenders the navbar and its links even when the ?s= read bails", () => {
    const html = prerender("/champions");
    expect(html).toContain(NAV_MARKER);

    const links = internalLinks(html);
    // The desktop nav alone carries Home/Explore/Champions/Compare/Updates/Feedback.
    expect(links.length).toBeGreaterThanOrEqual(6);
    for (const href of ["/", "/explore", "/champions", "/compare", "/changelog", "/feedback"]) {
      expect(links).toContain(`href="${href}"`);
    }
  });

  it("prerenders the navbar on every non-share route", () => {
    for (const route of ["/champions", "/explore", "/faq", "/compare", "/changelog", "/privacy"]) {
      expect(prerender(route), route).toContain(NAV_MARKER);
    }
  });

  it("keeps the navbar out of the prerendered homepage so ?s= share links do not flash a second header", () => {
    expect(prerender("/")).not.toContain(NAV_MARKER);
  });

  it("still renders nothing on share and embed routes", () => {
    expect(prerender("/s/abc123")).toBe("");
    expect(prerender("/embed/abc123")).toBe("");
  });
});
