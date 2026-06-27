# MCP & Infrastructure Setup

This project ships a committed, secret-free MCP configuration in [`.mcp.json`](../.mcp.json):

- **Supabase** — managed Postgres/backend (project `bbwnwrgtiwpfewswjfhd`), via HTTP transport + OAuth.
- **Hostinger** — six control-plane servers (hosting, domains, DNS, billing, reach, VPS), via `npx`,
  authenticated with the `HOSTINGER_API_TOKEN` environment variable.

> 🔐 **No secrets are stored in this repo.** `.mcp.json` reads the Hostinger token from the
> `${HOSTINGER_API_TOKEN}` environment variable. The actual token must live in your local environment
> (or `.env`, which is git-ignored) — never committed.

---

## 1. Supabase MCP

`.mcp.json` already contains:

```json
"supabase": {
  "type": "http",
  "url": "https://mcp.supabase.com/mcp?project_ref=bbwnwrgtiwpfewswjfhd"
}
```

Equivalent CLI (already applied as project scope):

```bash
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=bbwnwrgtiwpfewswjfhd"
```

**Authenticate** (must be run in a real terminal, not the IDE extension):

```bash
claude /mcp        # select "supabase" → Authenticate → complete the OAuth flow
```

**(Optional) Install Supabase Agent Skills:**

```bash
npx skills add supabase/agent-skills
```

---

## 2. Hostinger MCP

`.mcp.json` registers `hostinger-hosting`, `hostinger-domains`, `hostinger-dns`, `hostinger-billing`,
`hostinger-reach`, and `hostinger-vps`. Each reads `HOSTINGER_API_TOKEN` from the environment.

**Set the token** (do NOT paste it into a committed file):

```bash
# macOS / Linux
export HOSTINGER_API_TOKEN="<your-hostinger-api-token>"

# Windows (PowerShell)
$env:HOSTINGER_API_TOKEN="<your-hostinger-api-token>"
```

…or copy `.env.example` → `.env` and set it there (`.env` is git-ignored).

> ⚠️ **Rotate your token** if it has ever been shared in chat, a ticket, or any non-secret channel.
> Regenerate it in the Hostinger panel and update only your local environment.

### Platform note (`npx` vs `npx.cmd`)
`.mcp.json` uses the portable `npx` command. On **Windows**, if a server fails to spawn, change that
server's `"command"` from `"npx"` to `"npx.cmd"` in your local copy.

---

## 3. Deployment constraint — do NOT host on the VPS main IP

Per project decision, **no application service may be bound to / publicly hosted on the Hostinger VPS's
primary (main) public IP.** This is recorded as an operational constraint for the deployment phase:

- Provision and bind services to a **secondary IP** (or private interface) on the VPS, and/or
- Front everything through the **reverse proxy (Nginx)** and a domain, keeping origin services off the
  main IP's public surface.

See [`docs/architecture/09-deployment-architecture.md`](architecture/09-deployment-architecture.md) for
the broader deployment topology; this constraint applies when that topology is provisioned on Hostinger.

---

## 4. Verifying configuration

```bash
claude /mcp            # lists configured servers and their auth status
```

Expected servers: `supabase`, `hostinger-hosting`, `hostinger-domains`, `hostinger-dns`,
`hostinger-billing`, `hostinger-reach`, `hostinger-vps`.
