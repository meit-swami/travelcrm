#!/bin/bash
set -e
docker exec travelcrm-postgres-1 psql -U travelcrm -d travelcrm -c "ALTER ROLE travelcrm_app WITH LOGIN PASSWORD '0P6fUKzU2sTwHT3EMLBipoYW';"
cd /var/www/travelcrm/infra/docker
docker compose -f docker-compose.prod.yml restart api worker scheduler
sleep 15
docker compose -f docker-compose.prod.yml ps api worker
curl -sf http://127.0.0.1:8090/travelcrm/api/v1/health/ready && echo OK || echo FAIL
