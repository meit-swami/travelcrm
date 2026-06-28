#!/bin/bash
# Switch VPS TravelCRM from local Docker Postgres to Supabase.
set -euo pipefail

ENV_FILE="${ENV_FILE:-/var/www/travelcrm/infra/docker/.env}"
COMPOSE_DIR="${COMPOSE_DIR:-/var/www/travelcrm/infra/docker}"

SUPABASE_URL='postgresql://postgres:Brandzaha%4012345@db.bbwnwrgtiwpfewswjfhd.supabase.co:5432/postgres?schema=public&sslmode=require'

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

# Update DATABASE_URL and APP_DATABASE_URL (keep other env vars intact).
sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${SUPABASE_URL}|" "$ENV_FILE"
sed -i "s|^APP_DATABASE_URL=.*|APP_DATABASE_URL=${SUPABASE_URL}|" "$ENV_FILE"

echo "Updated database URLs in $ENV_FILE"

cd "$COMPOSE_DIR"

# Stop local Postgres — app now uses Supabase.
docker compose -f docker-compose.prod.yml stop postgres 2>/dev/null || true

# Recreate app services with new env.
docker compose -f docker-compose.prod.yml up -d api worker scheduler web edge

sleep 12

echo "--- Container status ---"
docker compose -f docker-compose.prod.yml ps api worker scheduler

echo "--- Health check ---"
curl -sf "http://127.0.0.1:${EDGE_PORT:-8090}/travelcrm/api/v1/health/ready" && echo || echo "Health check failed"

echo "Done."
