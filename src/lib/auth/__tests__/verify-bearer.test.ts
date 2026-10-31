import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { verifyBearer } from "@/lib/auth/verify-bearer";

// ---------------------------------------------------------------------------
// verifyBearer (VGC-6.1 security guards): constant-time bearer comparison for
// Authorization headers backed by an env-var secret. Fails closed on every
// malformed / missing / mismatched input.
// ---------------------------------------------------------------------------

const ENV_VAR = "TEST_BEARER_SECRET";

function req(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/protected", { headers });
}

describe("verifyBearer", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("accepts the correct bearer token", () => {
    process.env[ENV_VAR] = "s3cr3t-token";
    expect(verifyBearer(req({ authorization: "Bearer s3cr3t-token" }), ENV_VAR)).toBe(true);
  });

  it("rejects a wrong bearer token of the same length", () => {
    process.env[ENV_VAR] = "s3cr3t-token";
    expect(verifyBearer(req({ authorization: "Bearer wr0ng-token!" }), ENV_VAR)).toBe(false);
  });

  it("rejects a wrong bearer token of a different length", () => {
    process.env[ENV_VAR] = "s3cr3t-token";
    expect(verifyBearer(req({ authorization: "Bearer nope" }), ENV_VAR)).toBe(false);
  });

  it("rejects a missing Authorization header", () => {
    process.env[ENV_VAR] = "s3cr3t-token";
    expect(verifyBearer(req(), ENV_VAR)).toBe(false);
  });

  it("rejects a header without the 'Bearer ' scheme prefix", () => {
    process.env[ENV_VAR] = "s3cr3t-token";
    expect(verifyBearer(req({ authorization: "s3cr3t-token" }), ENV_VAR)).toBe(false);
    expect(verifyBearer(req({ authorization: "Basic s3cr3t-token" }), ENV_VAR)).toBe(false);
  });

  it("is case-sensitive on the scheme (does not accept lowercase 'bearer ')", () => {
    process.env[ENV_VAR] = "s3cr3t-token";
    // startsWith("Bearer ") is case-sensitive, so "bearer " must fail closed.
    expect(verifyBearer(req({ authorization: "bearer s3cr3t-token" }), ENV_VAR)).toBe(false);
  });

  it("fails closed when the named env var is unset", () => {
    delete process.env[ENV_VAR];
    expect(verifyBearer(req({ authorization: "Bearer anything" }), ENV_VAR)).toBe(false);
  });

  it("fails closed when the env var is an empty string", () => {
    process.env[ENV_VAR] = "";
    expect(verifyBearer(req({ authorization: "Bearer " }), ENV_VAR)).toBe(false);
  });

  it("rejects a token that only prefixes the secret (length guard)", () => {
    process.env[ENV_VAR] = "longer-secret-value";
    expect(verifyBearer(req({ authorization: "Bearer longer-secret" }), ENV_VAR)).toBe(false);
  });

  it("rejects a token with extra internal characters (exact match required)", () => {
    process.env[ENV_VAR] = "token";
    expect(verifyBearer(req({ authorization: "Bearer to ken" }), ENV_VAR)).toBe(false);
    expect(verifyBearer(req({ authorization: "Bearer tokenX" }), ENV_VAR)).toBe(false);
  });
});
