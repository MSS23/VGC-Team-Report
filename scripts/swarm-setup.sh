#!/usr/bin/env bash
# swarm-setup.sh — Run ONCE at the start of every overnight swarm session,
# BEFORE npm install and before any Linear/Discord work:
#
#   source scripts/swarm-setup.sh
#
# (source it, don't execute it — the npm proxy fix must land in the
# session's own environment.)
#
# Fixes the two standing container problems observed across nightly runs:
#   1. npm install ECONNRESET — the container exports HTTPS_PROXY/https_proxy
#      but registry.npmjs.org is in no_proxy; npm's proxy handling resets the
#      connection. Direct curl to the registry works, so we strip proxy vars
#      for this session.
#   2. Cypress binary 403 — the Cypress CDN is blocked by the proxy. The
#      binary is never needed in the swarm (Cypress doesn't run headless
#      here), so skip the download.
#
# It then runs the connection preflight so the session knows up front which
# integrations to skip — instead of discovering it 10 failures deep.

# ── 1. npm proxy fix ─────────────────────────────────────────────────────────
unset HTTPS_PROXY https_proxy HTTP_PROXY http_proxy 2>/dev/null || true
unset npm_config_proxy npm_config_https_proxy 2>/dev/null || true

# ── 2. Skip the Cypress binary ───────────────────────────────────────────────
export CYPRESS_INSTALL_BINARY=0

# ── 3. Connection preflight ──────────────────────────────────────────────────
# Sourcing linear.sh resolves LINEAR_API_KEY / DISCORD_BUILDS_WEBHOOK
# environment-first, with .env.local as fallback (works both in the
# container and on the local machine).
_SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$_SETUP_DIR/../.claude/scripts/linear.sh" ]]; then
  # shellcheck source=../.claude/scripts/linear.sh
  source "$_SETUP_DIR/../.claude/scripts/linear.sh"
  echo "── Swarm connection preflight ──"
  linear_preflight || true
else
  echo "⚠️  .claude/scripts/linear.sh not found — Linear/Discord helpers unavailable"
fi

echo "── Swarm setup complete: proxy vars cleared, CYPRESS_INSTALL_BINARY=0 ──"
echo "   Next: npm install, then tsc/vitest/build gate."
