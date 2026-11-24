interface ClerkNameFields {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}

/**
 * "First Last" (or "First"), else username, else `fallback`.
 *
 * Route copies differ in how an empty-string username is handled: most use
 * `username ?? fallback` (empty string is returned as is); `user/profile` uses
 * `username || fallback`. Pass `{ emptyUsernameFallsBack: true }` for the latter.
 */
export function clerkDisplayName<F extends string | null>(
  user: ClerkNameFields | null | undefined,
  fallback: F,
  { emptyUsernameFallsBack = false }: { emptyUsernameFallsBack?: boolean } = {},
): string | F {
  if (user?.firstName) return `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`;
  return emptyUsernameFallsBack ? user?.username || fallback : user?.username ?? fallback;
}
