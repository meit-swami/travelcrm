# TravelOS AI

**An AI-Powered Tour & Travel CRM, Lead Management, Operations, Vendor Management, Quotation Management, Customer Portal & Analytics Platform.**

> **Status:** ✅ Architecture approved · 🏗️ **Phase 0 (Foundation) implemented** — multi-tenant platform core is live.
>
> The architecture deliverables live in [`docs/architecture/`](docs/architecture/). Implementation has begun following the [roadmap](docs/architecture/07-development-roadmap.md); Phase 0 (tenancy, auth, RBAC, audit, security, core infra + app shell) is in the codebase and builds clean.

---

## 📐 What is TravelOS AI?

TravelOS AI is a production-grade, multi-tenant SaaS platform that runs the full lifecycle of a tour & travel business:

```
Lead Capture → Lead Management → AI Enrichment → Quotation → Sales Confirmation
   → Operations (Hotels / Transport / Vouchers) → Payments → Customer Delivery → Analytics
```

It unifies omnichannel lead capture (websites, WhatsApp, Meta/Google lead ads), an AI assistant that
reads conversations and predicts conversions, a quotation & itinerary engine, an operations & vendor
back-office, a payments stack (Razorpay/Cashfree), a customer self-service portal, and an analytics
layer — all behind granular role-based access control and a complete audit trail.

---

## 🧱 Technology Stack

| Layer            | Technology |
|------------------|------------|
| Frontend         | Next.js 15 (App Router), TypeScript, Tailwind CSS, ShadCN UI |
| Backend          | NestJS (modular monolith → service-extractable), TypeScript |
| Database         | PostgreSQL 16 (multi-tenant, Row-Level Security) |
| Cache / Queue    | Redis 7 (cache, BullMQ job queues, rate limiting, pub/sub) |
| Object Storage   | AWS S3 / S3-compatible (MinIO for dev) |
| Auth             | JWT access + refresh tokens, OTP login, 2FA-ready |
| AI               | OpenAI GPT + Google Gemini (provider-abstracted) |
| Communication    | WhatsApp Business API, SMTP Email, Exotel / Knowlarity (telephony) |
| Payments         | Razorpay, Cashfree |
| Deployment       | Docker, Docker Compose, Ubuntu Server, GitHub Actions CI/CD |

---

## 📚 Architecture Deliverables

All deliverables live in [`docs/architecture/`](docs/architecture/):

| # | Document | Description |
|---|----------|-------------|
| 00 | [Overview & Index](docs/architecture/00-overview.md) | Vision, principles, glossary, and reading guide |
| 01 | [System Architecture](docs/architecture/01-system-architecture.md) | C4 diagrams, components, integrations, data flow, multi-tenancy |
| 02 | [Database Schema & ER Diagram](docs/architecture/02-database-schema.md) | Full ERD, tables, relationships, indexing, RLS strategy |
| 03 | [Folder Structure](docs/architecture/03-folder-structure.md) | Monorepo layout for backend, frontend, shared packages |
| 04 | [API Design](docs/architecture/04-api-design.md) | REST conventions, endpoint catalog, webhooks, error model |
| 05 | [User Roles & RBAC](docs/architecture/05-user-roles-rbac.md) | Roles, permission matrix, access model |
| 06 | [Workflow Diagrams](docs/architecture/06-workflow-diagrams.md) | Lead, sales, operations, payment, AI & messaging workflows |
| 07 | [Development Roadmap](docs/architecture/07-development-roadmap.md) | Phased sprint plan, milestones, definition of done |
| 08 | [Security Architecture](docs/architecture/08-security-architecture.md) | AuthN/AuthZ, encryption, audit, tenancy isolation, compliance |
| 09 | [Deployment Architecture](docs/architecture/09-deployment-architecture.md) | Environments, Docker topology, CI/CD, scaling, observability |
| 10 | [Feature Breakdown](docs/architecture/10-feature-breakdown.md) | All 20 modules decomposed into epics & features |

> 💡 All diagrams use **Mermaid**, which renders natively on GitHub. No external tooling required to view them.

---

## 🗂️ Monorepo Layout

```
apps/
  api/        NestJS backend (modular monolith) — tenancy, auth, RBAC, audit, core infra
  web/        Next.js 15 app shell — login + dashboard, RBAC-gated
packages/
  types/      Shared enums, permission catalogue, role→permission matrix
infra/
  docker/     Dev compose stack + production Dockerfiles
  nginx/      Reverse proxy config
docs/         Architecture deliverables + MCP setup
```

## 🚀 Getting Started (local dev)

```bash
# 1. Install
pnpm install

# 2. Start the dev stack (Postgres, Redis, MinIO, Mailhog)
pnpm dev:up

# 3. Configure env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Migrate (schema + RLS policies) and seed (system roles, permissions, demo tenant)
pnpm --filter @travelos/api db:migrate:deploy
pnpm db:seed

# 5. Run API + web
pnpm dev
```

API: http://localhost:4000 (Swagger at `/api/docs`) · Web: http://localhost:3000
Demo login (dev seed): workspace `demo`, `admin@demo.travelos.ai` / `Demo@12345`.

### What Phase 0 delivers
- **Multi-tenancy** with PostgreSQL **Row-Level Security** (DB-enforced) + app-layer scoping.
- **Auth**: Argon2 passwords, JWT access + rotating refresh tokens (reuse-detection), OTP, 2FA-ready, sessions + login history.
- **RBAC**: granular `resource.action` permissions, role matrix, `@Can()` guard, Redis-cached resolution.
- **Audit trail**: append-only, context-aware.
- **Core infra**: zod-validated config, BullMQ queues, S3/MinIO storage (signed URLs), event bus, Problem-Details errors, health checks, helmet + rate limiting.

## ✅ Approval Gate

Implementation begins **only after** the architecture above is approved. Suggested review order:

1. Read [00 – Overview](docs/architecture/00-overview.md) for context and principles.
2. Review [01 – System Architecture](docs/architecture/01-system-architecture.md) and [02 – Database Schema](docs/architecture/02-database-schema.md) (the foundations).
3. Validate [05 – RBAC](docs/architecture/05-user-roles-rbac.md) and [08 – Security](docs/architecture/08-security-architecture.md).
4. Confirm scope & sequencing via [07 – Development Roadmap](docs/architecture/07-development-roadmap.md).

Please leave review comments or request changes. Once approved, Phase 0 (foundation) implementation can start.

---

## 📄 License

Proprietary — © TravelOS AI. All rights reserved.
