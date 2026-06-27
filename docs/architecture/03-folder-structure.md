# 03 — Folder Structure

A **pnpm + Turborepo monorepo**. One repo holds the NestJS backend, the Next.js frontend, and shared
packages (types, API client, config). This keeps the API contract and TypeScript types in lock-step
across frontend and backend.

## 1. Top-Level Layout

```
travelos-ai/
├── apps/
│   ├── api/                  # NestJS backend (REST + workers + scheduler)
│   ├── web/                  # Next.js 15 staff CRM + customer portal
│   └── worker/               # (optional) standalone BullMQ worker entry (shares api code)
│
├── packages/
│   ├── types/                # Shared domain types & enums (single source of truth)
│   ├── api-client/           # Generated typed client (OpenAPI → TS) for web
│   ├── ui/                   # ShadCN-based shared component library
│   ├── config/               # ESLint, TS, Tailwind, Prettier base configs
│   └── utils/                # Shared pure utilities (money, dates, phone, slug)
│
├── infra/
│   ├── docker/               # Dockerfiles + compose files (dev / prod)
│   ├── nginx/                # Reverse proxy config
│   └── scripts/              # Bootstrap, migrate, backup, seed scripts
│
├── docs/
│   ├── architecture/         # ← these documents
│   └── adr/                  # Architecture Decision Records (added during build)
│
├── .github/workflows/        # CI/CD pipelines
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

## 2. Backend — `apps/api`

NestJS, **feature-module per bounded context**. Each module is self-contained (controller, service,
DTOs, entities, events) so it can later be extracted.

```
apps/api/
├── src/
│   ├── main.ts                       # HTTP bootstrap
│   ├── worker.ts                     # BullMQ worker bootstrap
│   ├── scheduler.ts                  # Cron bootstrap
│   ├── app.module.ts
│   │
│   ├── core/                         # Platform Core (cross-cutting)
│   │   ├── auth/                     # JWT, refresh, OTP, 2FA, guards
│   │   ├── tenancy/                  # TenantContext, RLS session middleware
│   │   ├── rbac/                     # Roles, permissions, PermissionGuard, @Can()
│   │   ├── audit/                    # AuditService, @Audited(), interceptor
│   │   ├── events/                   # Domain event bus + outbox
│   │   ├── queue/                    # BullMQ registration & helpers
│   │   ├── storage/                  # S3/MinIO StorageProvider
│   │   ├── notifications/            # in-app + dispatch
│   │   ├── config/                   # typed env config (zod-validated)
│   │   ├── database/                 # Prisma service, base repo, RLS helper
│   │   └── common/                   # filters, pipes, interceptors, decorators
│   │
│   ├── modules/                      # Business modules (Modules 1–16)
│   │   ├── leads/
│   │   │   ├── leads.module.ts
│   │   │   ├── leads.controller.ts
│   │   │   ├── leads.service.ts
│   │   │   ├── dto/
│   │   │   ├── events/
│   │   │   └── tests/
│   │   ├── lead-capture/             # sources, webhooks, dedupe, assignment
│   │   ├── activities/               # timeline, notes, tasks, reminders
│   │   ├── whatsapp/
│   │   ├── calls/
│   │   ├── email/                    # templates + automation
│   │   ├── ai/                       # assistant + provider adapters
│   │   ├── quotations/
│   │   ├── itinerary/
│   │   ├── operations/
│   │   ├── vendors/                  # hotel + transport + rates + comms
│   │   ├── vouchers/                 # PDF generation
│   │   ├── payments/                 # gateways + invoices + receipts
│   │   ├── portal/                   # customer portal API (OTP-scoped)
│   │   ├── reports/                  # dashboards + materialized views
│   │   └── ai-analytics/             # management insights
│   │
│   ├── integrations/                 # Adapter implementations (ports/adapters)
│   │   ├── ai/                       # openai/, gemini/
│   │   ├── messaging/                # whatsapp-cloud/
│   │   ├── telephony/                # exotel/, knowlarity/
│   │   ├── payments/                 # razorpay/, cashfree/
│   │   ├── email/                    # smtp/, ses/
│   │   ├── storage/                  # s3/, minio/
│   │   └── itinerary/                # builder/
│   │
│   ├── jobs/                         # BullMQ processors (one per queue)
│   │   ├── ai-summarize.processor.ts
│   │   ├── voucher-pdf.processor.ts
│   │   ├── email-send.processor.ts
│   │   ├── whatsapp-in.processor.ts
│   │   ├── call-transcribe.processor.ts
│   │   ├── report-rollup.processor.ts
│   │   └── reminder-dispatch.processor.ts
│   │
│   └── webhooks/                     # inbound webhook controllers (verify→persist→enqueue)
│       ├── whatsapp.controller.ts
│       ├── meta-ads.controller.ts
│       ├── google-forms.controller.ts
│       ├── telephony.controller.ts
│       ├── payments.controller.ts
│       └── itinerary.controller.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   ├── rls/                          # SQL: RLS policies, partitions, enums
│   └── seed.ts
│
├── test/                             # e2e tests
├── Dockerfile
└── package.json
```

### Module anatomy (the repeated pattern)

```
modules/<feature>/
├── <feature>.module.ts       # wiring
├── <feature>.controller.ts   # HTTP routes (thin)
├── <feature>.service.ts      # business logic (transactional)
├── <feature>.repository.ts   # data access (tenant-scoped base repo)
├── dto/                      # request/response DTOs (class-validator)
├── events/                  # event definitions + handlers
├── policies/                # module-specific permission checks
└── tests/                   # unit tests
```

## 3. Frontend — `apps/web`

Next.js 15 App Router with **route groups** separating the staff CRM from the customer portal.

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (auth)/                   # login, OTP, forgot password
│   │   │   ├── login/
│   │   │   └── verify-otp/
│   │   │
│   │   ├── (staff)/                  # internal CRM (RBAC-guarded)
│   │   │   ├── layout.tsx            # app shell: sidebar, topbar
│   │   │   ├── dashboard/
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx          # Kanban + list
│   │   │   │   └── [id]/             # lead detail: timeline, tabs
│   │   │   ├── conversations/        # WhatsApp/email inbox
│   │   │   ├── calls/
│   │   │   ├── quotations/
│   │   │   ├── itinerary/
│   │   │   ├── operations/
│   │   │   ├── vendors/
│   │   │   ├── payments/
│   │   │   ├── vouchers/
│   │   │   ├── reports/
│   │   │   └── settings/             # users, roles, sources, templates, automations
│   │   │
│   │   ├── (portal)/                 # customer portal (OTP-scoped)
│   │   │   ├── layout.tsx            # minimal mobile-first shell
│   │   │   ├── quotations/
│   │   │   ├── itinerary/
│   │   │   ├── invoices/
│   │   │   ├── payments/
│   │   │   └── vouchers/
│   │   │
│   │   ├── api/                      # Next route handlers (BFF: token refresh, file proxy)
│   │   └── layout.tsx                # root layout, providers
│   │
│   ├── components/
│   │   ├── leads/                    # LeadKanban, LeadTimeline, LeadForm
│   │   ├── chat/                     # ConversationThread, MessageComposer
│   │   ├── quotations/
│   │   ├── operations/
│   │   ├── charts/                   # dashboard widgets
│   │   └── shared/
│   │
│   ├── lib/
│   │   ├── api/                      # api-client wiring, query hooks
│   │   ├── auth/                     # session, middleware helpers
│   │   ├── rbac/                     # client-side permission gates (UI only)
│   │   └── utils/
│   │
│   ├── hooks/
│   ├── stores/                       # Zustand stores
│   └── styles/
│
├── middleware.ts                     # route-group auth + tenant host resolution
├── public/
├── tailwind.config.ts
├── next.config.ts
├── Dockerfile
└── package.json
```

## 4. Shared Packages

| Package | Purpose |
|---------|---------|
| `packages/types` | Domain enums (lead stages, statuses), shared interfaces, permission keys — imported by both `api` and `web` to prevent drift. |
| `packages/api-client` | Generated from the API's OpenAPI spec at build time; gives `web` a fully typed SDK. |
| `packages/ui` | ShadCN components + TravelOS design tokens, theming for white-label. |
| `packages/config` | Base `tsconfig`, ESLint, Prettier, Tailwind presets. |
| `packages/utils` | Pure helpers: money formatting, E.164 phone, date ranges, slugify, reference-code generation. |

## 5. Conventions

- **Imports:** absolute via workspace aliases (`@travelos/types`, `@/modules/...`).
- **DTOs:** request validation with `class-validator`; responses are explicit DTOs (never raw entities).
- **No leaking entities:** controllers return mapped response DTOs only.
- **Tests:** unit next to code (`tests/`), e2e in `apps/api/test`, component tests in `apps/web`.
- **Lint/format:** shared config; CI blocks on type errors, lint, and tests.
- **Env:** validated at boot with a typed schema (`zod`); fail fast on missing config.
