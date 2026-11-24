import { describe, expect, it } from "vitest";
import { readJsonBody } from "@/lib/api/json-body";

const post = (body?: string) => new Request("http://localhost/api/x", { method: "POST", body });

describe("readJsonBody", () => {
  it("returns the parsed body", async () => {
    expect(await readJsonBody(post('{"a":1}'))).toEqual({ body: { a: 1 } });
    expect(await readJsonBody(post("null"))).toEqual({ body: null });
  });

  it.each([["malformed", "{nope"], ["empty", undefined]])("returns a 400 for %s JSON", async (_label, body) => {
    const parsed = await readJsonBody(post(body));
    expect("error" in parsed).toBe(true);
    if (!("error" in parsed)) return;
    expect(parsed.error.status).toBe(400);
    expect(await parsed.error.json()).toEqual({ error: "Invalid JSON body" });
  });
});
