#!/usr/bin/env bash
# TravelCRM VPS deploy — run on the Hostinger VPS (you have SSH).
# Isolated under /var/www/travelcrm; binds only to 127.0.0.1:${EDGE_PORT}.
# Idempotent: safe to re-run to deploy updates.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/meit-swami/travelcrm.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/var/www/travelcrm}"
COMPOSE_DIR="$APP_DIR/infra/docker"

echo "▶ Deploying TravelCRM to $APP_DIR (branch: $BRANCH)"

# 1. Clone or update the repo
if [ ! -d "$APP_DIR/.git" ]; then
  sudo mkdir -p "$APP_DIR"
  sudo chown "$(id -u):$(id -g)" "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
fi

# 2. Ensure env exists (first run: copy template and stop for editing)
if [ ! -f "$COMPOSE_DIR/.env" ]; then
  cp "$COMPOSE_DIR/.env.prod.example" "$COMPOSE_DIR/.env"
  echo "⚠ Created $COMPOSE_DIR/.env from template."
  echo "  Edit it (domain, secrets, EDGE_PORT, bootstrap admin) then re-run this script."
  exit 1
fi

# 3. Build images, run migrations + seed, then start the stack
cd "$COMPOSE_DIR"
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm migrate
docker compose -f docker-compose.prod.yml up -d

echo "✓ Stack is up. Edge listening on 127.0.0.1:${EDGE_PORT:-8090}."
echo "  Point your sub-domain vhost at it (see infra/nginx/travelcrm.host-vhost.conf)."
docker compose -f docker-compose.prod.yml ps
