#!/usr/bin/env bash
# linear.sh — Reusable Linear API helpers for Claude Code workflows
# Source this file: source .claude/scripts/linear.sh

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
# Credentials resolve environment-first, then fall back to .env.local.
# This lets headless/swarm containers inject LINEAR_API_KEY and
# DISCORD_BUILDS_WEBHOOK as env vars without needing a .env.local file,
# while local dev keeps working unchanged. All lookups are guarded so a
# missing file or key can't kill `source` under `set -euo pipefail`.
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"

_env_local_get() {
  # Usage: _env_local_get KEY  → value from .env.local, or empty
  grep -m1 "^${1}=" "$PROJECT_ROOT/.env.local" 2>/dev/null | cut -d= -f2- || true
}

LINEAR_API_KEY="${LINEAR_API_KEY:-$(_env_local_get LINEAR_API_KEY)}"
LINEAR_TEAM_ID="${LINEAR_TEAM_ID:-06531926-0387-4a3e-8325-8b7be754ced5}"

# ── State IDs ─────────────────────────────────────────────────────────────────
# NOTE: STATE_BACKLOG is resolved lazily (see linear_state_backlog below) —
# the old eager lookup ran before linear_query was defined and was always "".
STATE_IN_PROGRESS="0cbef347-0afb-4fa1-8dc2-79e9e04d1abe"
STATE_IN_REVIEW="89e58e68-05e3-4dc9-a0e8-20344f1b1a00"

# ── GitHub ────────────────────────────────────────────────────────────────────
GITHUB_REPO="MSS23/VGC-Team-Report"
GITHUB_BASE_URL="https://github.com/$GITHUB_REPO"

# ── Discord ───────────────────────────────────────────────────────────────────
DISCORD_BUILDS_WEBHOOK="${DISCORD_BUILDS_WEBHOOK:-$(_env_local_get DISCORD_BUILDS_WEBHOOK)}"

# ── Preflight ────────────────────────────────────────────────────────────────
linear_preflight() {
  # Reports which connections are usable. Exit 0 if all configured, 1 otherwise.
  # Swarm sessions should run this ONCE at start and skip unavailable
  # integrations for the rest of the run instead of retrying them.
  local ok=0
  if [[ -n "$LINEAR_API_KEY" ]]; then
    echo "✅ LINEAR_API_KEY present"
  else
    echo "❌ LINEAR_API_KEY missing (env var or .env.local) — skip all Linear ops this run"
    ok=1
  fi
  if [[ -n "$DISCORD_BUILDS_WEBHOOK" ]]; then
    echo "✅ DISCORD_BUILDS_WEBHOOK present"
  else
    echo "❌ DISCORD_BUILDS_WEBHOOK missing (env var or .env.local) — skip Discord notifications this run"
    ok=1
  fi
  return $ok
}

# ── Core API ──────────────────────────────────────────────────────────────────

linear_query() {
  # Usage: linear_query '{ viewer { id } }'
  local query="$1"
  curl -s -X POST 'https://api.linear.app/graphql' \
    -H 'Content-Type: application/json' \
    -H "Authorization: $LINEAR_API_KEY" \
    -d "{\"query\":\"$query\"}"
}

linear_mutate() {
  # Usage: linear_mutate 'mutation { ... }'
  linear_query "$1"
}

linear_state_backlog() {
  # Lazily resolves (and caches) the Backlog state UUID. Safe to call anytime
  # after sourcing — unlike the old top-of-file lookup, linear_query exists now.
  if [[ -z "${STATE_BACKLOG:-}" ]]; then
    STATE_BACKLOG="$(linear_query '{ team(id: \"'"$LINEAR_TEAM_ID"'\") { states { nodes { id type } } } }' 2>/dev/null | python3 -c "import sys,json; states=json.load(sys.stdin)['data']['team']['states']['nodes']; print([s['id'] for s in states if s['type']=='backlog'][0])" 2>/dev/null || echo "")"
  fi
  echo "$STATE_BACKLOG"
}

# ── Issue Operations ──────────────────────────────────────────────────────────

linear_get_in_progress() {
  # Returns In Progress issues as JSON
  linear_query "{ team(id: \\\"$LINEAR_TEAM_ID\\\") { issues(filter: { state: { name: { eq: \\\"In Progress\\\" } } }, orderBy: updatedAt, first: 10) { nodes { id identifier title description labels { nodes { name } } } } } }"
}

linear_move_issue() {
  # Usage: linear_move_issue <issue_uuid> <state_id>
  local issue_id="$1"
  local state_id="$2"
  linear_mutate "mutation { issueUpdate(id: \\\"$issue_id\\\", input: { stateId: \\\"$state_id\\\" }) { success } }"
}

linear_comment() {
  # Usage: linear_comment <issue_uuid> <markdown_body>
  local issue_id="$1"
  local body="$2"
  linear_mutate "mutation { commentCreate(input: { issueId: \\\"$issue_id\\\", body: \\\"$body\\\" }) { success } }"
}

linear_create_issue() {
  # Usage: linear_create_issue <title> <description> <priority> <project_id>
  local title="$1"
  local description="$2"
  local priority="$3"
  local project_id="$4"
  local state_id="$(linear_state_backlog)"

  local state_input=""
  if [[ -n "$state_id" ]]; then
    state_input=", stateId: \\\"$state_id\\\""
  fi

  linear_mutate "mutation { issueCreate(input: { teamId: \\\"$LINEAR_TEAM_ID\\\", title: \\\"$title\\\", description: \\\"$description\\\", priority: $priority, projectId: \\\"$project_id\\\"$state_input }) { issue { identifier url } } }"
}

linear_get_project_id() {
  # Usage: linear_get_project_id "Roadmap"
  local project_name="$1"
  linear_query "{ team(id: \\\"$LINEAR_TEAM_ID\\\") { projects { nodes { id name } } } }" \
    | python3 -c "import sys,json; projects=json.load(sys.stdin)['data']['team']['projects']['nodes']; print([p['id'] for p in projects if p['name']=='$project_name'][0])"
}

# ── Git Helpers ───────────────────────────────────────────────────────────────

git_commit_url() {
  # Returns GitHub URL for the current HEAD commit
  echo "$GITHUB_BASE_URL/commit/$(git rev-parse HEAD)"
}

git_commit_short() {
  git rev-parse --short HEAD
}

git_changed_files() {
  # Returns list of files changed in HEAD commit
  git diff-tree --no-commit-id --name-only -r HEAD
}

git_changed_files_count() {
  git diff-tree --no-commit-id --name-only -r HEAD | wc -l | tr -d ' '
}

# ── Composite Workflows ──────────────────────────────────────────────────────

linear_comment_with_changes() {
  # Posts a review comment on a Linear issue with commit + file details
  # Usage: linear_comment_with_changes <issue_uuid> [pr_url]
  local issue_id="$1"
  local pr_url="${2:-}"
  local commit_short=$(git_commit_short)
  local commit_url=$(git_commit_url)
  local file_list=$(git_changed_files | sed 's/^/- /' | tr '\n' '\\' | sed 's/\\/\\n/g')

  local pr_line=""
  if [[ -n "$pr_url" ]]; then
    pr_line="\\n[Review PR]($pr_url)\\n"
  fi

  local body="## Changes\\n\\n[View commit ($commit_short)]($commit_url)\\n${pr_line}\\n**Files changed:**\\n$file_list"
  linear_comment "$issue_id" "$body"
}

discord_notify_build() {
  # Posts build notification to Discord #builds
  # Usage: discord_notify_build [issue_id] [title] [pr_url]
  # If issue_id/title are empty, falls back to the git commit message.
  local issue_id="${1:-}"
  local title="${2:-}"
  local pr_url="${3:-}"
  local commit_short=$(git_commit_short)
  local commit_url=$(git_commit_url)
  local file_count=$(git_changed_files_count)
  local discord_files=$(git_changed_files | head -10 | sed 's/^/`/' | sed 's/$/`/' | tr '\n' '\\' | sed 's/\\/\\n/g')

  # Build the headline — use ticket info if available, otherwise commit message
  local headline
  if [[ -n "$issue_id" && -n "$title" ]]; then
    headline="**$issue_id: $title**"
  elif [[ -n "$title" ]]; then
    headline="**$title**"
  else
    local commit_msg
    commit_msg=$(git log -1 --pretty=%s)
    headline="**$commit_msg**"
  fi

  # Linear line — only mention Linear if this is a ticket
  local linear_line=""
  if [[ -n "$issue_id" ]]; then
    linear_line="\\n\\n📋 Linear: moved to **In Review**"
  fi

  if [[ -n "$pr_url" ]]; then
    # PR flow — needs merge before deploy
    curl -s -X POST "$DISCORD_BUILDS_WEBHOOK" \
      -H 'Content-Type: application/json' \
      -d "{\"embeds\":[{\"title\":\"🔍 Ready for Review\",\"description\":\"$headline\\n\\n[View commit \`$commit_short\`]($commit_url)\\n[Review PR]($pr_url)\\n\\n**Files changed ($file_count):**\\n$discord_files$linear_line\\n⏳ Waiting for PR merge to deploy.\",\"color\":16761095,\"footer\":{\"text\":\"VGC Team Report Builder\"}}]}"
  else
    # Direct-to-main — already deploying
    curl -s -X POST "$DISCORD_BUILDS_WEBHOOK" \
      -H 'Content-Type: application/json' \
      -d "{\"embeds\":[{\"title\":\"🚀 Pushed to Main\",\"description\":\"$headline\\n\\n[View commit \`$commit_short\`]($commit_url)\\n\\n**Files changed ($file_count):**\\n$discord_files$linear_line\\n✅ Auto-deploying via Vercel.\",\"color\":5763719,\"footer\":{\"text\":\"VGC Team Report Builder\"}}]}"
  fi
}
