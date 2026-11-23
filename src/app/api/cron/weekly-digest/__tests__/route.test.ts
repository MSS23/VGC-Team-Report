import { expect, it, vi } from "vitest";
vi.mock("@/lib/cron-auth", () => ({ isCronAuthorized: () => true }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(), escapeHtml: (s: string) => s }));
vi.mock("@clerk/nextjs/server", () => ({ clerkClient: vi.fn() }));
import { getDb } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { clerkClient } from "@clerk/nextjs/server";
import { GET } from "../route";
it("does not send digests if account opt-outs cannot be read", async () => {
  vi.mocked(getDb).mockReturnValue(vi.fn(async (strings: TemplateStringsArray) => {
    if (strings.join("").includes("user_preferences")) throw new Error("preferences unavailable");
    return [];
  }) as never);
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    expect((await GET(new Request("https://example.test/api/cron/weekly-digest"))).status).toBe(500);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(clerkClient).not.toHaveBeenCalled();
  } finally { log.mockRestore(); }
});

// RFC 8058: `List-Unsubscribe-Post: List-Unsubscribe=One-Click` is a promise that
// the mail provider can POST the List-Unsubscribe URL and the opt-out will happen
// unattended. /dashboard/notifications is behind Clerk auth and cannot honour that
// POST, so the digest must advertise a plain RFC 2369 unsubscribe link and nothing
// more. This pins the pair: One-Click may only be claimed once the header points at
// an unauthenticated POST endpoint.
it("sets a List-Unsubscribe link and does not claim one-click against the auth-walled page", async () => {
  vi.mocked(getDb).mockReturnValue(vi.fn(async (strings: TemplateStringsArray) => {
    const query = strings.join("");
    if (query.includes("DISTINCT owner_id")) return [{ owner_id: "user_1" }];
    if (query.includes("new_reports")) return [{ new_reports: 2, total_views: 9, total_shares: 3, new_comments: 1, new_reactions: 4 }];
    return [];
  }) as never);
  vi.mocked(clerkClient).mockResolvedValue({
    users: {
      getUserList: async () => ({
        data: [{ id: "user_1", firstName: "Trainer", emailAddresses: [{ emailAddress: "trainer@example.test" }], publicMetadata: {} }],
      }),
    },
  } as never);
  vi.mocked(sendEmail).mockResolvedValue({ id: "email_1" } as never);

  expect((await GET(new Request("https://example.test/api/cron/weekly-digest"))).status).toBe(200);
  expect(sendEmail).toHaveBeenCalledTimes(1);

  const headers = vi.mocked(sendEmail).mock.calls[0][0].headers ?? {};
  // A bracketed https unsubscribe URI on the app's own domain (RFC 2369).
  const target = headers["List-Unsubscribe"];
  expect(target).toMatch(/^<https:\/\/pokemonvgcteamreport\.com\/.+>$/);

  const oneClick = Object.keys(headers).some((name) => name.toLowerCase() === "list-unsubscribe-post");
  if (oneClick) {
    // Claiming One-Click is fine — but only against an endpoint that can POST.
    expect(target).not.toMatch(/\/dashboard\//);
  }
});
