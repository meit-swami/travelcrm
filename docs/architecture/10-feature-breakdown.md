# 10 — Feature Breakdown

All 20 modules decomposed into epics & features, with the data and APIs they rely on. This is the
scope contract that maps requirements → build work. Phase references point to [07 — Roadmap](07-development-roadmap.md).

---

## Module 1 — Lead Capture Engine · _Phase 1_
**Sources:** websites, contact forms, landing pages, manual entry, WhatsApp, Facebook & Instagram Lead
Ads, Google Lead Forms.

| Epic | Features |
|------|----------|
| Source ingestion | Public `/capture/{sourceId}` (secret-scoped), provider webhooks (Meta/Google/WhatsApp/website), raw payload persistence |
| Source tracking | `lead_source` registry, per-source config & attribution on every lead |
| Auto lead creation | Normalize → create `lead` with source linkage |
| Duplicate detection | Phone/email exact + fuzzy (pg_trgm) matching, `lead_dedupe_match` |
| Deduplication | Merge UI/API, link to existing lead, conflict resolution |
| Assignment rules | `assignment_rule` engine: round-robin, team, destination, load-balanced, manual |
| Round-robin | Per-rule cursor state, fair distribution |

**Key tables:** `lead_source`, `lead`, `lead_dedupe_match`, `assignment_rule`, `assignment_rule_state`, `integration_event`.

## Module 2 — Lead Management CRM · _Phase 1_
**Stages:** New → Contacted → Interested → Quotation Sent → Negotiation → Follow Up → Confirmed → Lost / Cancelled.

| Epic | Features |
|------|----------|
| Lead board & detail | Kanban + list, filters/search, lead profile |
| Stage machine | Guarded transitions, reason capture on lost/cancelled |
| Timeline | Unified `lead_activity` feed across all channels & events |
| Notes | Pinned notes, mentions |
| Tasks & reminders | Due dates, reminder scheduling, my-tasks views |
| Follow-ups | Follow-up tasks, SLA nudges |
| Histories | Call / WhatsApp / Email histories surfaced inline |
| Attachments | Lead documents via signed-URL storage |

**Key tables:** `lead`, `lead_activity`, `note`, `task`, `tag`, `attachment`, `lost_reason`.

## Module 3 — AI Assistant · _Phase 2_
| Epic | Features |
|------|----------|
| Conversation understanding | Summarize calls & WhatsApp chats |
| Requirement extraction | Destination, travel date, budget, adults, children, hotel preference, flight requirement, special requests |
| Customer profiling | Generate structured customer profile from interactions |
| Lead intelligence | Identify hot leads, conversion-probability scoring (0–100) |
| Insight surfacing | Timeline insights, notifications, priority auto-set |

**Key tables:** `ai_insight`, `ai_extracted_requirement`, `ai_job`. **Providers:** OpenAI + Gemini (abstracted).

## Module 4 — Call Management · _Phase 3_
| Epic | Features |
|------|----------|
| Telephony integration | Exotel & Knowlarity adapters, click-to-call, inbound routing |
| Call logging | `call` records, manual logs, agent attribution |
| Recordings | Fetch → store in S3 against customer profile |
| AI on calls | Transcription + summaries → timeline |
| Call notes | Per-call notes |

**Key tables:** `call`, `file`, `ai_insight`. **Webhooks:** `/webhooks/telephony`.

## Module 5 — WhatsApp Business Integration · _Phase 2_
| Epic | Features |
|------|----------|
| Sync | Inbound/outbound message sync, conversation inbox |
| Auto lead creation | Unknown sender → new lead |
| Media storage | Images/docs/audio/video → S3 |
| Voice notes | Transcription via AI |
| Timeline & summary | Full chat history + AI summary |
| Outbound | Template messages, delivery-status tracking |

**Key tables:** `conversation`, `message`, `file`. **Webhooks:** `/webhooks/whatsapp`.

## Module 6 — Quotation Management · _Phase 2_
| Epic | Features |
|------|----------|
| Multiple quotations | Many quotations per lead |
| Versioning | `quotation_version` revisions, revision count |
| Lifecycle | Draft → Sent → Viewed → Accepted → Rejected → Expired |
| Tracking | Sent date, viewed date, acceptance status, rejection reason, validity/expiry |
| PDF | Branded quotation PDF generation |
| Triggers | Accept → booking; send → email automation |

**Key tables:** `quotation`, `quotation_version`.

## Module 7 — Itinerary Builder Integration · _Phase 2_
| Epic | Features |
|------|----------|
| Integration layer | Adapter to external builder API |
| Import / export | Import itinerary, export back |
| Versioning | Store `itinerary_version` snapshots |
| Sync | Webhook-driven updates, link versions to quotations |

**Key tables:** `itinerary`, `itinerary_version`. **Webhooks:** `/webhooks/itinerary`.

## Module 8 — Operations Management · _Phase 3_
**Pipeline:** Confirmed → Hotel Procurement → Transport Procurement → Voucher Generation → Final Itinerary → Customer Delivery.

| Epic | Features |
|------|----------|
| Handover | Sales → operations transfer on confirmation |
| Pipeline | `ops_stage` machine + per-stage `operation_task` checklists |
| Tracking | Every operation activity timelined & audited |
| Assignment | Ops owner + task assignees |

**Key tables:** `booking`, `operation_task`.

## Module 9 — Hotel / Vendor Management · _Phase 3_
| Epic | Features |
|------|----------|
| Vendor DB | Hotel name, destination, contact person, phone, email |
| Rates | Contract & negotiated rates, rate cards, seasons |
| History | Past bookings per vendor |
| Procurement | Rate requests, vendor communications, booking status |

**Key tables:** `vendor`, `vendor_rate`, `hotel_booking`, `vendor_communication`.

## Module 10 — Transport Management · _Phase 3_
| Epic | Features |
|------|----------|
| Transport vendors | Taxi, tempo traveller, coaches, drivers |
| Rates & booking | Vendor rates, booking status |
| Vouchers & payments | Transport vouchers, vendor payments |

**Key tables:** `vendor` (type=transport), `transport_booking`, `vendor_rate`, `voucher`, `payment`.

## Module 11 — Payment Management · _Phase 4_
| Epic | Features |
|------|----------|
| Payment types | Advance, partial, final |
| Statuses | Pending, partial, paid, refunded, cancelled |
| Gateways | Razorpay, Cashfree (orders + webhooks), manual/cash/bank |
| Documents | Invoices, receipts (PDF) |
| Reports | Payment reports, reconciliation |

**Key tables:** `invoice`, `payment`, `payment_webhook`, `file`. **Webhooks:** `/webhooks/razorpay`, `/webhooks/cashfree`.

## Module 12 — Customer Portal · _Phase 4_
| Epic | Features |
|------|----------|
| OTP login | Phone/email OTP only, portal-scoped token |
| Views | Quotations, itinerary, invoices, payment status, vouchers |
| Downloads | Allowed files via signed URLs + access grants |
| UX | Mobile-responsive, branded per tenant |

**Key tables:** `portal_identity`, `otp_challenge`, `portal_access_grant`.

## Module 13 — Voucher Management · _Phase 3_
| Epic | Features |
|------|----------|
| Voucher types | Customer, hotel, transport, vendor |
| Generation | HTML template → headless Chromium → PDF → S3 |
| Delivery | Send via email/WhatsApp/portal |

**Key tables:** `voucher`, `file`.

## Module 14 — Email Automation · _Phase 2_
| Epic | Features |
|------|----------|
| Templates | `email_template` with variables |
| Rule engine | `automation` triggers + delays + conditions |
| Triggers | Quotation sent, payment received, invoice generated, voucher generated, travel reminder, feedback request |
| Delivery & logs | SMTP/provider send, `email_log` (sent/failed/bounced/opened) |

**Key tables:** `email_template`, `automation`, `email_log`.

## Module 15 — Reports & Analytics · _Phase 5_
| Epic | Features |
|------|----------|
| Dashboards | Lead, Sales, Operations, Revenue, Destination, Vendor |
| Reports | Lead source performance, conversion rate, revenue analysis, employee performance, destination-wise revenue |
| Infra | Materialized views + rollup jobs, read-replica queries, export |

**Key artifacts:** `mv_lead_funnel`, `mv_source_performance`, `mv_revenue_*`, `mv_employee_performance`, `mv_vendor_summary`.

## Module 16 — AI Analytics · _Phase 5_
| Epic | Features |
|------|----------|
| Loss analysis | Why leads are lost; why quotations are rejected |
| Performance | Sales team performance signals |
| Trends | Top converting destinations, common customer requirements |
| Insights | Auto-generated management insights & narratives |

**Key tables:** `ai_insight` (kind=mgmt_insight), feeds from `lost_reason`, `quotation`, reporting views.

## Module 17 — Role-Based Access Control · _Phase 0_
| Epic | Features |
|------|----------|
| Roles | Super Admin, Admin, Sales Mgr/Exec, Ops Mgr/Exec, Accounts, Vendor, Customer |
| Permissions | Granular `resource.action`, custom roles, team scoping |
| Enforcement | Guards + row-scope + cached effective permissions |

**Key tables:** `role`, `permission`, `role_permission`, `user_role`. See [05](05-user-roles-rbac.md).

## Module 18 — Security · _Phase 0 (hardened Phase 6)_
| Epic | Features |
|------|----------|
| AuthN/Z | JWT + refresh rotation, OTP, 2FA-ready, RBAC |
| Tracking | Audit logs, IP tracking, session tracking, login history |
| Data | Encryption at rest/in transit, no direct DB exposure |
| Activity | Activity logs across modules |

**Key tables:** `session`, `login_history`, `audit_log`. See [08](08-security-architecture.md).

## Module 19 — Audit Trail · _Phase 0_
| Epic | Features |
|------|----------|
| Coverage | Created, updated, deleted, assigned, transferred, payment updated, quotation updated |
| Record | User, timestamp, before/after, IP, UA |
| Integrity | Append-only, partitioned, outbox-guaranteed |

**Key tables:** `audit_log`.

## Module 20 — Future-Ready Features · _Cross-cutting seams_
Designed-for, not built now. The architecture leaves explicit seams:

| Future capability | Seam already in design |
|-------------------|------------------------|
| AI calling agents / voice bots | Telephony adapter + AI provider interface + call pipeline |
| Multilingual support | i18n keys, tenant locale in `settings`, template variables |
| B2B agents | Outbound `webhook_endpoint`, scoped tokens, tenant relationships |
| DMC integrations | Vendor & itinerary adapter pattern |
| Flight / Hotel APIs | `ItineraryProvider`/vendor adapters, normalized payloads |
| Mobile apps | API-first REST + OpenAPI client |
| White-label SaaS | `tenant.custom_domain`, branding settings, theming tokens |
| Multi-tenant | Foundational: `tenant_id` + RLS everywhere |

---

## Traceability Matrix (Module → Phase → Primary Tables)

| Module | Phase | Primary Tables |
|--------|-------|----------------|
| 1 Lead Capture | 1 | lead_source, lead, lead_dedupe_match, assignment_rule |
| 2 Lead CRM | 1 | lead, lead_activity, note, task, attachment |
| 3 AI Assistant | 2 | ai_insight, ai_extracted_requirement, ai_job |
| 4 Calls | 3 | call, file |
| 5 WhatsApp | 2 | conversation, message, file |
| 6 Quotations | 2 | quotation, quotation_version |
| 7 Itinerary | 2 | itinerary, itinerary_version |
| 8 Operations | 3 | booking, operation_task |
| 9 Hotel/Vendor | 3 | vendor, vendor_rate, hotel_booking |
| 10 Transport | 3 | transport_booking, vendor, voucher |
| 11 Payments | 4 | invoice, payment, payment_webhook |
| 12 Portal | 4 | portal_identity, otp_challenge, portal_access_grant |
| 13 Vouchers | 3 | voucher, file |
| 14 Email Automation | 2 | email_template, automation, email_log |
| 15 Reports | 5 | materialized views |
| 16 AI Analytics | 5 | ai_insight, reporting views |
| 17 RBAC | 0 | role, permission, role_permission, user_role |
| 18 Security | 0/6 | session, login_history, audit_log |
| 19 Audit | 0 | audit_log |
| 20 Future | — | seams across all |
