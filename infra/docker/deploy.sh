#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────────────────────
# TravelCRM — one-shot VPS deploy / redeploy.
#
# Run from anywhere on the VPS:  bash infra/docker/deploy.sh
#
# It is SELF-CONTAINED: the stack ships its own Postgres, Redis and MinIO, so
# there is no external database to reach (this is what fixes the prior
# "P1001: can't reach database server" failures).
#
# Safe to re-run. It force-syncs the working tree to the remote branch (clearing
# stale untracked files that block `git pull`), keeps your infra/docker/.env,
# rebuilds images, runs migrations+seed+RLS once, then starts everything.
# ───────────────────────────────────────────────────────────────────────────
set -euo pipefail

BRANCH="${DEPLOY_BRANCH:-claude/travelos-crm-architecture-v0zstd}"

# Resolve repo root from this script's location (infra/docker/deploy.sh).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"
echo "▶ Repo: $REPO_ROOT   Branch: $BRANCH"

# ── 1. Sync code (clear stale untracked files that block a pull) ────────────
echo "▶ Syncing code…"
git fetch origin "$BRANCH"
# Preserve the real env file across the hard reset / clean.
ENV_FILE="infra/docker/.env"
if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" /tmp/travelcrm.env.bak
  echo "  • backed up $ENV_FILE"
fi
git reset --hard "origin/$BRANCH"
# Remove untracked files/dirs (but NOT gitignored ones like .env) so the next
# pull/checkout can never be blocked again. -x is intentionally NOT used.
git clean -fd
if [ -f /tmp/travelcrm.env.bak ] && [ ! -f "$ENV_FILE" ]; then
  cp /tmp/travelcrm.env.bak "$ENV_FILE"
  echo "  • restored $ENV_FILE"
fi
echo "  ✓ now at $(git rev-parse --short HEAD)"

cd infra/docker

# ── 2. Ensure .env exists ───────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "✗ infra/docker/.env not found."
  echo "  Create it from the template and fill in secrets, then re-run:"
  echo "     cp infra/docker/.env.prod.example infra/docker/.env && nano infra/docker/.env"
  exit 1
fi

COMPOSE="docker compose -f docker-compose.prod.yml"

# ── 3. Build images ─────────────────────────────────────────────────────────
echo "▶ Building images (this can take a few minutes)…"
$COMPOSE build

# ── 4. Bring up datastores, then run migrate (migrate waits for healthy pg) ──
echo "▶ Starting datastores…"
$COMPOSE up -d postgres redis minio minio-init

echo "▶ Running migrations + roles + seed + RLS…"
$COMPOSE run --rm migrate

# ── 5. Start the app ────────────────────────────────────────────────────────
# --no-deps: datastores are already up and migrate just ran via `run --rm`
# (its one-off container is gone), so skip re-resolving depends_on here.
echo "▶ Starting app services…"
$COMPOSE up -d --no-deps api worker scheduler web edge

echo ""
echo "✓ Deploy complete. Containers:"
$COMPOSE ps
echo ""
echo "  Edge proxy is on 127.0.0.1:${EDGE_PORT:-8090} (host nginx should proxy your sub-domain / sub-path here)."
echo "  Tail logs with:  docker compose -f docker-compose.prod.yml logs -f api web"
