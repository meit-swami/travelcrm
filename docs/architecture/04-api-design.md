# 04 — API Design

A **versioned REST API** (`/api/v1`) documented with **OpenAPI 3.1** (served at `/api/docs` via Swagger,
spec at `/api/openapi.json`). The frontend, customer portal, future mobile apps, and B2B partners all
consume the same contracts. The OpenAPI spec generates the typed `@travelos/api-client`.

---

## 1. Conventions

| Topic | Convention |
|-------|------------|
| Base path | `/api/v1` |
| Format | JSON; `application/json`; UTF-8 |
| Naming | Resources plural, kebab nouns: `/leads`, `/quotations`, `/hotel-bookings` |
| IDs | UUID v7 in path: `/leads/{leadId}` |
| Verbs | `GET` (read), `POST` (create), `PATCH` (partial update), `PUT` (replace), `DELETE` (soft) |
| Actions | Sub-resource verbs for state transitions: `POST /leads/{id}/assign`, `POST /quotations/{id}/send` |
| Filtering | Query params: `?stage=new&assignedUserId=..&destination=Goa` |
| Search | `?q=` free-text where supported |
| Pagination | Cursor-based: `?limit=25&cursor=...` → `{ data, nextCursor }`; offset fallback for tables |
| Sorting | `?sort=createdAt:desc,priority:asc` |
| Sparse fields | `?include=timeline,quotations` for expansions |
| Idempotency | `Idempotency-Key` header on POST creating money/messages |
| Versioning | URI version `/v1`; breaking changes → `/v2` |
| Time | ISO-8601 UTC (`2026-06-27T10:00:00Z`) |

## 2. Authentication & Headers

| Header | Purpose |
|--------|---------|
| `Authorization: Bearer <accessToken>` | Staff & portal access (short-lived JWT) |
| `X-Tenant` | Optional explicit tenant (normally derived from token/host) |
| `Idempotency-Key` | De-dupe unsafe POSTs |
| `X-Request-Id` | Correlation (echoed back; generated if absent) |

- **Access token:** JWT, ~15 min, claims `{ sub, tenant_id, roles, scope }`.
- **Refresh token:** httpOnly secure cookie, rotated on use, stored hashed (`session`).
- **OTP login** (staff optional, portal mandatory): `request-otp` → `verify-otp` → tokens.
- **2FA-ready:** TOTP step injected between password and token issuance when enabled.

## 3. Standard Envelopes

**Success (collection):**
```json
{
  "data": [ { "id": "...", "..." : "..." } ],
  "pagination": { "nextCursor": "eyJ...", "limit": 25, "total": 1340 }
}
```

**Error (RFC 9457 Problem Details):**
```json
{
  "type": "https://travelos.ai/errors/validation",
  "title": "Validation failed",
  "status": 422,
  "code": "VALIDATION_ERROR",
  "detail": "phone must be a valid E.164 number",
  "errors": [ { "field": "phone", "message": "invalid format" } ],
  "requestId": "req_01J..."
}
```

| Status | Used for |
|--------|----------|
| 200 / 201 / 204 | OK / created / no content |
| 400 | Malformed request |
| 401 / 403 | Unauthenticated / forbidden (RBAC) |
| 404 | Not found (also returned for cross-tenant access — never leak existence) |
| 409 | Conflict (duplicate, stale version) |
| 422 | Validation error |
| 429 | Rate limited (`Retry-After`) |
| 5xx | Server / upstream integration error |

## 4. Endpoint Catalogue (by domain)

> Representative, not exhaustive. Each resource follows CRUD + explicit transition endpoints.

### Auth & Identity
```
POST   /auth/login                  # email+password
POST   /auth/request-otp            # phone/email → OTP
POST   /auth/verify-otp             # OTP → tokens
POST   /auth/2fa/verify             # TOTP step
POST   /auth/refresh                # rotate refresh → new access
POST   /auth/logout                 # revoke session
GET    /auth/me                     # current user + permissions
```

### Tenancy & Admin (Super Admin / Admin)
```
GET    /tenants                     # (super admin) list tenants
POST   /tenants                     # provision tenant
PATCH  /tenants/{id}                # settings, branding, plan
GET    /settings                    # current tenant settings
PATCH  /settings                    # update branding/locale/flags
```

### Users, Roles, Teams (RBAC)
```
GET    /users        POST /users        PATCH /users/{id}      DELETE /users/{id}
POST   /users/{id}/invite            # send invite
GET    /roles        POST /roles        PATCH /roles/{id}
GET    /permissions                  # catalogue
POST   /users/{id}/roles             # assign roles (optionally team-scoped)
GET    /teams        POST /teams        PATCH /teams/{id}
POST   /teams/{id}/members
```

### Lead Capture
```
GET    /lead-sources   POST /lead-sources   PATCH /lead-sources/{id}
GET    /assignment-rules   POST /assignment-rules   PATCH /assignment-rules/{id}
POST   /leads/{id}/assign            # manual/auto assign
GET    /leads/{id}/duplicates        # dedupe candidates
POST   /leads/{id}/merge             # merge duplicate
# Public capture (no auth, signed/secret-scoped):
POST   /capture/{sourceId}           # form / landing-page submission
```

### Leads & CRM
```
GET    /leads                        # filter: stage, assignee, source, destination, dateRange, q
POST   /leads
GET    /leads/{id}
PATCH  /leads/{id}
DELETE /leads/{id}                   # soft delete
POST   /leads/{id}/stage             # transition stage (+ reason on lost/cancelled)
GET    /leads/{id}/timeline          # unified activity feed
GET    /leads/{id}/notes    POST /leads/{id}/notes
GET    /leads/{id}/tasks    POST /leads/{id}/tasks
GET    /leads/{id}/attachments  POST /leads/{id}/attachments
```

### Tasks & Reminders
```
GET    /tasks                        # my tasks, filters by due/status/assignee
POST   /tasks    PATCH /tasks/{id}
POST   /tasks/{id}/complete
```

### Conversations (WhatsApp / Email)
```
GET    /conversations                # inbox, filters by channel/unread
GET    /conversations/{id}/messages
POST   /conversations/{id}/messages  # send (template or freeform)
POST   /whatsapp/send                # start new outbound (template)
GET    /conversations/{id}/summary   # AI summary (cached)
```

### Calls
```
GET    /calls                        # filter by lead/agent/date
POST   /calls                        # log manual call / click-to-call
GET    /calls/{id}
GET    /calls/{id}/recording         # signed URL
POST   /calls/{id}/transcribe        # trigger AI (async)
```

### AI Assistant
```
POST   /ai/leads/{id}/summarize      # summarize all conversations
POST   /ai/leads/{id}/extract        # extract travel requirements
POST   /ai/leads/{id}/score          # conversion probability
GET    /ai/leads/{id}/insights       # latest insights
POST   /ai/calls/{id}/summarize
```

### Quotations
```
GET    /leads/{id}/quotations        # all quotations for a lead
POST   /leads/{id}/quotations        # create draft
GET    /quotations/{id}
POST   /quotations/{id}/versions     # new revision
POST   /quotations/{id}/send         # → status sent (+ email automation)
POST   /quotations/{id}/accept       # status accepted (→ trigger booking)
POST   /quotations/{id}/reject       # + rejection_reason
GET    /quotations/{id}/pdf          # signed URL
```

### Itinerary
```
POST   /itinerary/import             # import from external builder
GET    /itinerary/{id}
POST   /itinerary/{id}/sync          # pull latest version
GET    /itinerary/{id}/versions
POST   /quotations/{id}/itinerary    # link itinerary version to quotation
```

### Operations
```
POST   /bookings                     # (auto on quotation accept) confirm
GET    /bookings    GET /bookings/{id}
POST   /bookings/{id}/stage          # advance ops pipeline
GET    /bookings/{id}/tasks   POST /bookings/{id}/tasks
POST   /bookings/{id}/handover       # sales → operations
GET    /bookings/{id}/timeline
```

### Vendors / Hotels / Transport
```
GET    /vendors    POST /vendors    PATCH /vendors/{id}
GET    /vendors/{id}/rates   POST /vendors/{id}/rates
POST   /vendors/{id}/communications  # log rate request / message
GET    /bookings/{id}/hotel-bookings   POST /bookings/{id}/hotel-bookings
PATCH  /hotel-bookings/{id}          # status: requested→confirmed
GET    /bookings/{id}/transport-bookings  POST /bookings/{id}/transport-bookings
PATCH  /transport-bookings/{id}
```

### Vouchers
```
GET    /bookings/{id}/vouchers
POST   /bookings/{id}/vouchers       # generate (type: customer/hotel/transport/vendor) → async PDF
GET    /vouchers/{id}
GET    /vouchers/{id}/pdf            # signed URL
POST   /vouchers/{id}/send
```

### Payments & Invoices
```
GET    /bookings/{id}/invoices   POST /bookings/{id}/invoices
GET    /invoices/{id}/pdf
GET    /bookings/{id}/payments
POST   /bookings/{id}/payments       # record manual or create gateway order
POST   /payments/{id}/gateway-order  # Razorpay/Cashfree order
POST   /payments/{id}/refund
GET    /payments/{id}/receipt        # signed URL
```

### Customer Portal (OTP-scoped token; tenant + customer bound)
```
POST   /portal/request-otp
POST   /portal/verify-otp
GET    /portal/me
GET    /portal/quotations    GET /portal/quotations/{id}
GET    /portal/itinerary/{id}
GET    /portal/invoices      GET /portal/invoices/{id}
GET    /portal/payments
GET    /portal/vouchers
GET    /portal/files/{id}/download   # signed URL, access-grant checked
```

### Reports & Analytics
```
GET    /reports/lead-funnel
GET    /reports/source-performance
GET    /reports/conversion
GET    /reports/revenue?groupBy=destination|month|user
GET    /reports/employee-performance
GET    /reports/vendor-summary
GET    /dashboards/{type}            # lead|sales|operations|revenue|destination|vendor
GET    /ai-analytics/insights        # management insights (loss reasons, top destinations)
```

### Files
```
POST   /files                        # presigned upload init
GET    /files/{id}                   # signed download URL
```

### Notifications
```
GET    /notifications                # in-app bell
POST   /notifications/{id}/read
```

## 5. Webhooks (inbound)

All under `/webhooks/{provider}`, **unauthenticated but signature-verified**, returning `200` fast and
processing async. Raw payload persisted to `integration_event` / `payment_webhook`.

```
POST /webhooks/whatsapp           # messages, statuses, media
POST /webhooks/meta-leads         # FB / Instagram Lead Ads
POST /webhooks/google-forms       # Google Lead Forms
POST /webhooks/telephony          # Exotel / Knowlarity call events + recordings
POST /webhooks/razorpay           # payment events
POST /webhooks/cashfree           # payment events
POST /webhooks/itinerary          # itinerary builder updates
GET  /webhooks/whatsapp           # verification handshake (hub.challenge)
```

Each provider adapter: verifies signature/HMAC → de-dupes by provider event id → enqueues a typed job.

## 6. Outbound Webhooks (B2B / future)

Tenants can register endpoints (`webhook_endpoint`) to receive signed events
(`lead.created`, `quotation.accepted`, `payment.captured`, `booking.confirmed`). Deliveries are retried
with backoff and recorded in `webhook_delivery`.

## 7. Rate Limiting & Throttling

- Per-IP and per-tenant token buckets in Redis.
- Tighter limits on auth (`/auth/*`, `/portal/*`, OTP) to deter brute force.
- Public `/capture/*` endpoints: per-source secret + per-IP throttle + bot protection.
- `429` with `Retry-After`.

## 8. Validation, Errors & Observability

- DTOs validated with `class-validator`; reject unknown fields (`whitelist + forbidNonWhitelisted`).
- Global exception filter maps to Problem Details and attaches `requestId`.
- Every request emits a structured log line (method, route, tenant, user, status, latency) and a trace
  span; `X-Request-Id` ties logs ↔ traces ↔ client.

## 9. API Documentation Structure

```
/api/docs            # Swagger UI (interactive)
/api/openapi.json    # OpenAPI 3.1 spec (machine-readable; generates client)
docs/api/            # Hand-written guides: auth flow, webhooks, pagination, errors, changelog
```

Generated grouping (OpenAPI tags) mirrors the domain sections above: **Auth, Tenancy, Users & RBAC,
Lead Capture, Leads, Tasks, Conversations, Calls, AI, Quotations, Itinerary, Operations, Vendors,
Vouchers, Payments, Portal, Reports, Webhooks**.
