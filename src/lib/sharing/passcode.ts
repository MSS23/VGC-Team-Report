export async function hashPasscode(passcode: string): Promise<string> {
  const encoded = new TextEncoder().encode(passcode);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPasscode(
  attempt: string,
  storedHash: string
): Promise<boolean> {
  const attemptHash = await hashPasscode(attempt);
  return attemptHash === storedHash;
}
