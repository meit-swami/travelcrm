/**
 * Shared domain enums — the single source of truth across API and web.
 * Keep these in sync with the Prisma enums in apps/api/prisma/schema.prisma.
 */

export const TenantStatus = {
  Active: 'active',
  Trial: 'trial',
  Suspended: 'suspended',
  Cancelled: 'cancelled',
} as const;
export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

export const TenantPlan = {
  Starter: 'starter',
  Growth: 'growth',
  Enterprise: 'enterprise',
} as const;
export type TenantPlan = (typeof TenantPlan)[keyof typeof TenantPlan];

export const UserStatus = {
  Active: 'active',
  Invited: 'invited',
  Disabled: 'disabled',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const TeamType = {
  Sales: 'sales',
  Operations: 'operations',
  Accounts: 'accounts',
  Vendor: 'vendor',
} as const;
export type TeamType = (typeof TeamType)[keyof typeof TeamType];

/** Canonical system roles (see docs/architecture/05-user-roles-rbac.md). */
export const SystemRole = {
  SuperAdmin: 'super_admin',
  Admin: 'admin',
  SalesManager: 'sales_manager',
  SalesExecutive: 'sales_executive',
  OperationsManager: 'operations_manager',
  OperationsExecutive: 'operations_executive',
  AccountsTeam: 'accounts_team',
  VendorTeam: 'vendor_team',
  Customer: 'customer',
} as const;
export type SystemRole = (typeof SystemRole)[keyof typeof SystemRole];

/** Lead pipeline stages (Module 2). */
export const LeadStage = {
  New: 'new',
  Contacted: 'contacted',
  Interested: 'interested',
  QuotationSent: 'quotation_sent',
  Negotiation: 'negotiation',
  FollowUp: 'follow_up',
  Confirmed: 'confirmed',
  Lost: 'lost',
  Cancelled: 'cancelled',
} as const;
export type LeadStage = (typeof LeadStage)[keyof typeof LeadStage];

export const LeadStatus = {
  Open: 'open',
  Won: 'won',
  Lost: 'lost',
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

/** Token scopes — staff app vs customer portal are isolated. */
export const TokenScope = {
  Staff: 'staff',
  Portal: 'portal',
} as const;
export type TokenScope = (typeof TokenScope)[keyof typeof TokenScope];

/** Audit actions (Module 19). */
export const AuditAction = {
  Created: 'created',
  Updated: 'updated',
  Deleted: 'deleted',
  Assigned: 'assigned',
  Transferred: 'transferred',
  StatusChanged: 'status_changed',
  PaymentUpdated: 'payment_updated',
  QuotationUpdated: 'quotation_updated',
  Login: 'login',
  Logout: 'logout',
  Export: 'export',
  PermissionChange: 'permission_change',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const AuditActorType = {
  User: 'user',
  Customer: 'customer',
  System: 'system',
  Integration: 'integration',
} as const;
export type AuditActorType = (typeof AuditActorType)[keyof typeof AuditActorType];
