#!/bin/bash
set -e
ENV=/var/www/travelcrm/infra/docker/.env
POOLER='postgresql://postgres.bbwnwrgtiwpfewswjfhd:Brandzaha%4012345@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?schema=public&sslmode=require'

sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"${POOLER}\"|" "$ENV"
sed -i "s|^APP_DATABASE_URL=.*|APP_DATABASE_URL=\"${POOLER}\"|" "$ENV"

grep DATABASE_URL "$ENV"

cd /var/www/travelcrm/infra/docker
docker compose -f docker-compose.prod.yml up -d --force-recreate api worker scheduler
sleep 18
docker compose -f docker-compose.prod.yml ps api worker scheduler
curl -sf http://127.0.0.1:8090/travelcrm/api/v1/health/ready && echo OK || echo FAIL
curl -sf http://187.127.185.243/travelcrm/api/v1/health/ready && echo PUBLIC_OK || echo PUBLIC_FAIL
