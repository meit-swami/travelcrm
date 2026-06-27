# Deploying TravelCRM on a Hostinger VPS (isolated sub-domain)

This guide deploys TravelCRM under **`/var/www/travelcrm`** on a VPS that already
runs other projects, **without touching the main/public IP**. The app stack binds
only to `127.0.0.1`, and the host's nginx serves it on a **sub-domain**.

> The whole app runs inside Docker on an internal network. Only a single edge port
> is published, and only on `127.0.0.1` — so it cannot collide with or expose
> anything on the VPS's primary IP.

## Prerequisites (on the VPS)
- Docker + Docker Compose plugin (`docker compose version`).
- The host's nginx (or the panel's web server) for the sub-domain vhost.
- A DNS **A record** for `travelcrm.YOURDOMAIN.com` → the VPS IP (via Hostinger DNS).

## 1. Get the code
```bash
sudo mkdir -p /var/www/travelcrm && sudo chown "$USER" /var/www/travelcrm
git clone https://github.com/meit-swami/travelcrm.git /var/www/travelcrm
cd /var/www/travelcrm
```

## 2. Configure environment
```bash
cp infra/docker/.env.prod.example infra/docker/.env
# Edit infra/docker/.env:
#  - PUBLIC_BASE_URL / *_BASE_URL / CORS_ORIGINS → https://travelcrm.YOURDOMAIN.com
#  - EDGE_PORT → a free localhost port (e.g. 8090)
#  - Generate secrets:  openssl rand -hex 32   /   openssl rand -base64 24
#  - BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD → your first login
nano infra/docker/.env
```

## 3. Build, migrate, run
```bash
bash infra/scripts/deploy.sh
# Builds images → runs DB migrations + RLS + seed (incl. bootstrap admin) → starts the stack.
```
The edge now listens on `127.0.0.1:<EDGE_PORT>`. Nothing is on the public IP yet.

## 4. Expose it on the sub-domain (host nginx)
```bash
sudo cp infra/nginx/travelcrm.host-vhost.conf /etc/nginx/sites-available/travelcrm.conf
# Edit server_name → travelcrm.YOURDOMAIN.com and proxy_pass port → your EDGE_PORT
sudo ln -s /etc/nginx/sites-available/travelcrm.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d travelcrm.YOURDOMAIN.com   # TLS
```

## 5. Verify
```bash
curl -s http://127.0.0.1:<EDGE_PORT>/api/v1/health/ready   # {"status":"ok",...}
```
Then open `https://travelcrm.YOURDOMAIN.com` and log in with the bootstrap admin.

## Updating to a new version
```bash
cd /var/www/travelcrm && bash infra/scripts/deploy.sh   # pulls latest, rebuilds, migrates, restarts
```

## Notes
- **Isolation:** only `edge` publishes a port, bound to `127.0.0.1`. Postgres, Redis,
  MinIO, API, worker, and web are internal-only.
- **Data persistence:** named Docker volumes (`pgdata`, `redisdata`, `miniodata`).
- **Backups:** `docker compose -f infra/docker/docker-compose.prod.yml exec postgres pg_dump -U travelcrm travelcrm > backup.sql`.
- **Hostinger DNS:** add the sub-domain A record in hPanel/DNS (or via the Hostinger DNS API).
