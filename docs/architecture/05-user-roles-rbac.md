# 05 — User Roles & RBAC

Access control is **role-based with granular, resource+action permissions**, scoped by tenant and
optionally by team. Roles are bundles of permissions; users hold one or more roles. Record-level rules
(e.g. "a Sales Executive sees only their own leads") layer on top of permission checks.

---

## 1. Roles

| Role | Scope | Summary |
|------|-------|---------|
| **Super Admin** | Platform | TravelOS operator. Manages tenants, plans, platform config. Cross-tenant via audited admin tooling only. |
| **Admin** | Tenant | Full control within a tenant: users, roles, settings, all modules. |
| **Sales Manager** | Tenant / Team | Oversees sales teams; sees all leads in scope, reassigns, reviews quotations, sales reports. |
| **Sales Executive** | Own records | Works assigned leads: timeline, tasks, calls, chats, quotations. Limited to own/team leads. |
| **Operations Manager** | Tenant / Team | Owns the ops pipeline; assigns ops tasks, manages vendors, oversees vouchers & bookings. |
| **Operations Executive** | Own records | Executes assigned operation tasks, procurement, voucher generation. |
| **Accounts Team** | Tenant | Manages payments, invoices, receipts, refunds, revenue reports. |
| **Vendor Team** | Tenant | Manages vendor database, rate cards, vendor communications. |
| **Customer** | Portal | OTP-only access to own quotations, itinerary, invoices, payments, vouchers. No staff app. |

Roles are seeded as **system roles**; tenants may clone them into **custom roles** with tailored
permission sets (Admin-configurable).

## 2. Permission Model

A permission is `resource.action`. Resources map to modules; actions are a small stable verb set.

**Actions:** `create`, `read`, `read_own`, `update`, `delete`, `assign`, `transition`, `export`, `manage`.

> `read` = all records in tenant/scope · `read_own` = only records owned/assigned to the user ·
> `manage` = full control incl. configuration of that resource.

**Resource keys (catalogue excerpt):**
```
tenant, user, role, team, settings,
lead, lead_source, assignment_rule, task, note, attachment,
conversation, message, call, ai_insight,
quotation, itinerary,
booking, operation_task, vendor, vendor_rate, hotel_booking, transport_booking,
voucher, invoice, payment,
report, dashboard, ai_analytics,
audit_log, webhook
```

Example keys: `lead.create`, `lead.read_own`, `lead.assign`, `quotation.transition`,
`payment.manage`, `vendor.read`, `report.export`, `audit_log.read`, `settings.manage`.

## 3. Permission Matrix

Legend: ✅ full · 🟡 own/scoped (`read_own` / limited) · — none.

| Resource / Capability | Super Admin | Admin | Sales Mgr | Sales Exec | Ops Mgr | Ops Exec | Accounts | Vendor | Customer |
|---|---|---|---|---|---|---|---|---|---|
| Tenant config / settings | ✅ | ✅ | — | — | — | — | — | — | — |
| Users & roles | ✅ | ✅ | 🟡(team) | — | 🟡(team) | — | — | — | — |
| Leads | ✅ | ✅ | ✅ | 🟡 | 🟡(read) | — | 🟡(read) | — | — |
| Lead sources & rules | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| Assign / reassign leads | ✅ | ✅ | ✅ | 🟡(self) | — | — | — | — | — |
| Tasks & reminders | ✅ | ✅ | ✅ | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | — |
| Conversations (WA/Email) | ✅ | ✅ | ✅ | 🟡 | 🟡 | 🟡 | — | 🟡(vendor) | — |
| Calls & recordings | ✅ | ✅ | ✅ | 🟡 | 🟡 | 🟡 | — | — | — |
| AI insights | ✅ | ✅ | ✅ | 🟡 | 🟡 | 🟡 | 🟡(read) | — | — |
| Quotations | ✅ | ✅ | ✅ | 🟡 | 🟡(read) | — | 🟡(read) | — | 🟡(own) |
| Itinerary | ✅ | ✅ | ✅ | 🟡 | ✅ | 🟡 | — | — | 🟡(own) |
| Bookings / Ops pipeline | ✅ | ✅ | 🟡(read) | 🟡(read) | ✅ | 🟡 | 🟡(read) | — | — |
| Vendors & rates | ✅ | ✅ | 🟡(read) | — | ✅ | 🟡(read) | 🟡(read) | ✅ | — |
| Hotel/Transport bookings | ✅ | ✅ | — | — | ✅ | ✅ | 🟡(read) | 🟡(read) | — |
| Vouchers | ✅ | ✅ | — | — | ✅ | ✅ | 🟡(read) | 🟡(read) | 🟡(own) |
| Invoices | ✅ | ✅ | 🟡(read) | — | 🟡(read) | — | ✅ | — | 🟡(own) |
| Payments / refunds | ✅ | ✅ | 🟡(read) | — | 🟡(read) | — | ✅ | — | 🟡(own,read) |
| Reports & dashboards | ✅ | ✅ | ✅(sales) | 🟡(own) | ✅(ops) | 🟡(own) | ✅(revenue) | 🟡(vendor) | — |
| AI analytics (mgmt) | ✅ | ✅ | 🟡 | — | 🟡 | — | 🟡 | — | — |
| Audit log | ✅ | ✅ | 🟡(team) | — | 🟡(team) | — | — | — | — |
| Export data | ✅ | ✅ | ✅ | — | ✅ | — | ✅ | 🟡 | — |

> The matrix is the **default seed**. Admins can adjust any non-system permission per custom role.

## 4. Record-Level (Row) Access

Beyond permission keys, ownership rules constrain rows:

- **Sales Executive:** `lead.read_own` → only leads where `assigned_user_id = me` OR in a team they belong to.
- **Operations Executive:** only bookings/operation_tasks where `assignee/ops_owner = me`.
- **Manager roles:** team scope — all records assigned to any member of teams they manage.
- **Customer:** only resources linked to their `portal_identity` via `portal_access_grant`.

These are enforced in the repository layer (query scoping) **and** are independent from RLS tenant
isolation (which is enforced unconditionally in the DB).

## 5. Enforcement Architecture

```mermaid
flowchart LR
    R[Request + JWT] --> A[AuthGuard<br/>verify token]
    A --> T[TenantGuard<br/>set RLS tenant]
    T --> P[PermissionGuard<br/>@Can('lead.create')]
    P --> S[Service<br/>row-scope filter for read_own]
    S --> DB[(Postgres RLS<br/>tenant_isolation)]
```

- **`@Can('resource.action')`** decorator on controllers declares required permission.
- **PermissionGuard** loads the user's effective permissions (roles → permissions, cached in Redis) and
  authorizes; returns `403` on failure, `404` on cross-tenant.
- **Effective permissions** are computed as the union of all the user's roles' permissions, minus any
  explicit denies (deny-overrides), scoped by team where the role assignment carries `scope_team_id`.
- **Frontend** mirrors permissions for UI gating only — the server is always authoritative.

## 6. Special Considerations

- **Super Admin cross-tenant access** never uses normal app credentials; it goes through a separate,
  fully-audited admin surface with `platform_admin` DB role and is logged to `audit_log` with
  `actor_type=system`.
- **Customer tokens** are a distinct scope (`scope: portal`) and cannot call any staff endpoint even if
  a path were guessed — guards reject non-portal scopes on `/api/v1/*` staff routes and vice-versa.
- **Permission changes** are themselves audited (`action=permission_change`) and invalidate the user's
  cached permission set.
- **2FA-enforced roles:** Admin/Super Admin/Accounts can be required to have 2FA enabled (tenant policy).
