# TravelOS AI

**An AI-Powered Tour & Travel CRM, Lead Management, Operations, Vendor Management, Quotation Management, Customer Portal & Analytics Platform.**

> **Status:** 🏗️ Architecture & Design Phase — _Awaiting approval before implementation._
>
> This repository currently contains the **architecture deliverables only**. No application code is to be written until the architecture below is reviewed and approved.

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
