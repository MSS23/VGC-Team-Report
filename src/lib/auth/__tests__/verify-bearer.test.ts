import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { verifyBearer } from "@/lib/auth/verify-bearer";

describe("verifyBearer", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns false when Authorization header is missing", () => {
    process.env.TEST_SECRET = "my-secret";
    const req = new Request("http://localhost/api/test");
    expect(verifyBearer(req, "TEST_SECRET")).toBe(false);
  });

  it("returns false when Authorization header does not start with 'Bearer '", () => {
    process.env.TEST_SECRET = "my-secret";
    const req = new Request("http://localhost/api/test", {
      headers: { authorization: "Basic my-secret" },
    });
    expect(verifyBearer(req, "TEST_SECRET")).toBe(false);
  });

  it("fails closed when the named env var is unset", () => {
    delete process.env.TEST_SECRET;
    const req = new Request("http://localhost/api/test", {
      headers: { authorization: "Bearer anything" },
    });
    expect(verifyBearer(req, "TEST_SECRET")).toBe(false);
  });

  it("fails closed when the named env var is the empty string", () => {
    process.env.TEST_SECRET = "";
    const req = new Request("http://localhost/api/test", {
      headers: { authorization: "Bearer " },
    });
    expect(verifyBearer(req, "TEST_SECRET")).toBe(false);
  });

  it("returns false when the bearer token has the wrong length", () => {
    process.env.TEST_SECRET = "my-secret";
    const req = new Request("http://localhost/api/test", {
      headers: { authorization: "Bearer short" },
    });
    expect(verifyBearer(req, "TEST_SECRET")).toBe(false);
  });

  it("returns false when the bearer token is the correct length but wrong content", () => {
    process.env.TEST_SECRET = "abcdefghij";
    const req = new Request("http://localhost/api/test", {
      headers: { authorization: "Bearer klmnopqrst" },
    });
    expect(verifyBearer(req, "TEST_SECRET")).toBe(false);
  });

  it("returns true for an exact bearer match", () => {
    process.env.TEST_SECRET = "my-secret";
    const req = new Request("http://localhost/api/test", {
      headers: { authorization: "Bearer my-secret" },
    });
    expect(verifyBearer(req, "TEST_SECRET")).toBe(true);
  });

  it("treats header lookup case-insensitively (Authorization vs authorization)", () => {
    process.env.TEST_SECRET = "my-secret";
    const req = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer my-secret" },
    });
    expect(verifyBearer(req, "TEST_SECRET")).toBe(true);
  });

  it("rejects bearer with prefix-only match (constant-time comparison is strict)", () => {
    process.env.TEST_SECRET = "my-secret-long";
    const req = new Request("http://localhost/api/test", {
      headers: { authorization: "Bearer my-secret" },
    });
    expect(verifyBearer(req, "TEST_SECRET")).toBe(false);
  });
});
