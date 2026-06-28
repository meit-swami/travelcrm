#!/bin/bash
echo "DATABASE_URL=$DATABASE_URL"
docker exec travelcrm-api-1 printenv DATABASE_URL 2>/dev/null || true
docker exec travelcrm-api-1 getent hosts db.bbwnwrgtiwpfewswjfhd.supabase.co 2>/dev/null || echo "DNS_FAIL_IN_CONTAINER"
