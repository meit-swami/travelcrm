/**
 * Permission catalogue and the default role → permission matrix.
 * Permissions are `resource.action`. See docs/architecture/05-user-roles-rbac.md.
 *
 * This is the single source of truth consumed by:
 *  - the API PermissionGuard (authorization)
 *  - the database seed (system roles & role_permission rows)
 *  - the web client (UI gating only — server is authoritative)
 */

import { SystemRole } from './enums';

export const PermissionAction = {
  Create: 'create',
  Read: 'read',
  ReadOwn: 'read_own',
  Update: 'update',
  Delete: 'delete',
  Assign: 'assign',
  Transition: 'transition',
  Export: 'export',
  Manage: 'manage',
} as const;
export type PermissionAction = (typeof PermissionAction)[keyof typeof PermissionAction];

/** Resource keys map to modules/aggregates. */
export const Resource = {
  Tenant: 'tenant',
  User: 'user',
  Role: 'role',
  Team: 'team',
  Settings: 'settings',
  Lead: 'lead',
  LeadSource: 'lead_source',
  AssignmentRule: 'assignment_rule',
  Task: 'task',
  Note: 'note',
  Attachment: 'attachment',
  Conversation: 'conversation',
  Message: 'message',
  Call: 'call',
  AiInsight: 'ai_insight',
  Quotation: 'quotation',
  Itinerary: 'itinerary',
  Booking: 'booking',
  OperationTask: 'operation_task',
  Vendor: 'vendor',
  VendorRate: 'vendor_rate',
  HotelBooking: 'hotel_booking',
  TransportBooking: 'transport_booking',
  Voucher: 'voucher',
  Invoice: 'invoice',
  Payment: 'payment',
  Report: 'report',
  Dashboard: 'dashboard',
  AiAnalytics: 'ai_analytics',
  AuditLog: 'audit_log',
  Webhook: 'webhook',
} as const;
export type Resource = (typeof Resource)[keyof typeof Resource];

/** A fully-qualified permission key, e.g. "lead.create". */
export type PermissionKey = `${string}.${PermissionAction}`;

const A = PermissionAction;

/** Helper to build `resource.action` keys for a resource. */
function p(resource: string, ...actions: PermissionAction[]): PermissionKey[] {
  return actions.map((a) => `${resource}.${a}` as PermissionKey);
}

/**
 * Full catalogue of permission keys that exist in the system.
 * The seed inserts exactly these into the `permission` table.
 */
export const PERMISSION_CATALOGUE: PermissionKey[] = [
  ...p(Resource.Tenant, A.Read, A.Manage),
  ...p(Resource.User, A.Create, A.Read, A.Update, A.Delete, A.Manage),
  ...p(Resource.Role, A.Read, A.Manage),
  ...p(Resource.Team, A.Create, A.Read, A.Update, A.Delete, A.Manage),
  ...p(Resource.Settings, A.Read, A.Manage),
  ...p(Resource.Lead, A.Create, A.Read, A.ReadOwn, A.Update, A.Delete, A.Assign, A.Transition, A.Export),
  ...p(Resource.LeadSource, A.Read, A.Manage),
  ...p(Resource.AssignmentRule, A.Read, A.Manage),
  ...p(Resource.Task, A.Create, A.Read, A.ReadOwn, A.Update, A.Delete),
  ...p(Resource.Note, A.Create, A.Read, A.Delete),
  ...p(Resource.Attachment, A.Create, A.Read, A.Delete),
  ...p(Resource.Conversation, A.Read, A.ReadOwn, A.Update),
  ...p(Resource.Message, A.Create, A.Read),
  ...p(Resource.Call, A.Create, A.Read, A.ReadOwn),
  ...p(Resource.AiInsight, A.Read, A.ReadOwn, A.Manage),
  ...p(Resource.Quotation, A.Create, A.Read, A.ReadOwn, A.Update, A.Transition),
  ...p(Resource.Itinerary, A.Create, A.Read, A.Update),
  ...p(Resource.Booking, A.Create, A.Read, A.ReadOwn, A.Update, A.Transition),
  ...p(Resource.OperationTask, A.Create, A.Read, A.ReadOwn, A.Update),
  ...p(Resource.Vendor, A.Create, A.Read, A.Update, A.Delete, A.Manage),
  ...p(Resource.VendorRate, A.Create, A.Read, A.Update),
  ...p(Resource.HotelBooking, A.Create, A.Read, A.Update),
  ...p(Resource.TransportBooking, A.Create, A.Read, A.Update),
  ...p(Resource.Voucher, A.Create, A.Read, A.ReadOwn),
  ...p(Resource.Invoice, A.Create, A.Read, A.ReadOwn),
  ...p(Resource.Payment, A.Create, A.Read, A.ReadOwn, A.Manage),
  ...p(Resource.Report, A.Read, A.Export),
  ...p(Resource.Dashboard, A.Read),
  ...p(Resource.AiAnalytics, A.Read),
  ...p(Resource.AuditLog, A.Read),
  ...p(Resource.Webhook, A.Read, A.Manage),
];

/** Wildcard meaning "every permission" — used only by Super Admin / Admin. */
export const ALL_PERMISSIONS = '*' as const;

/**
 * Default role → permission assignment (the seed matrix).
 * `*` grants the full catalogue. Row-level scoping (read_own / team) is enforced
 * in services on top of these grants.
 */
export const ROLE_PERMISSIONS: Record<SystemRole, PermissionKey[] | typeof ALL_PERMISSIONS> = {
  [SystemRole.SuperAdmin]: ALL_PERMISSIONS,
  [SystemRole.Admin]: ALL_PERMISSIONS,

  [SystemRole.SalesManager]: [
    ...p(Resource.User, A.Read),
    ...p(Resource.Team, A.Read),
    ...p(Resource.Lead, A.Create, A.Read, A.Update, A.Assign, A.Transition, A.Export),
    ...p(Resource.LeadSource, A.Read, A.Manage),
    ...p(Resource.AssignmentRule, A.Read, A.Manage),
    ...p(Resource.Task, A.Create, A.Read, A.Update),
    ...p(Resource.Note, A.Create, A.Read),
    ...p(Resource.Conversation, A.Read, A.Update),
    ...p(Resource.Message, A.Create, A.Read),
    ...p(Resource.Call, A.Create, A.Read),
    ...p(Resource.AiInsight, A.Read),
    ...p(Resource.Quotation, A.Create, A.Read, A.Update, A.Transition),
    ...p(Resource.Itinerary, A.Create, A.Read, A.Update),
    ...p(Resource.Booking, A.Read),
    ...p(Resource.Report, A.Read, A.Export),
    ...p(Resource.Dashboard, A.Read),
    ...p(Resource.AiAnalytics, A.Read),
    ...p(Resource.AuditLog, A.Read),
  ],

  [SystemRole.SalesExecutive]: [
    ...p(Resource.Lead, A.Create, A.ReadOwn, A.Update, A.Transition),
    ...p(Resource.Task, A.Create, A.ReadOwn, A.Update),
    ...p(Resource.Note, A.Create, A.Read),
    ...p(Resource.Conversation, A.ReadOwn, A.Update),
    ...p(Resource.Message, A.Create, A.Read),
    ...p(Resource.Call, A.Create, A.ReadOwn),
    ...p(Resource.AiInsight, A.ReadOwn),
    ...p(Resource.Quotation, A.Create, A.ReadOwn, A.Update, A.Transition),
    ...p(Resource.Itinerary, A.Create, A.Read, A.Update),
    ...p(Resource.Dashboard, A.Read),
  ],

  [SystemRole.OperationsManager]: [
    ...p(Resource.User, A.Read),
    ...p(Resource.Team, A.Read),
    ...p(Resource.Lead, A.Read),
    ...p(Resource.Task, A.Create, A.Read, A.Update),
    ...p(Resource.Booking, A.Create, A.Read, A.Update, A.Transition),
    ...p(Resource.OperationTask, A.Create, A.Read, A.Update),
    ...p(Resource.Itinerary, A.Read, A.Update),
    ...p(Resource.Vendor, A.Create, A.Read, A.Update, A.Manage),
    ...p(Resource.VendorRate, A.Create, A.Read, A.Update),
    ...p(Resource.HotelBooking, A.Create, A.Read, A.Update),
    ...p(Resource.TransportBooking, A.Create, A.Read, A.Update),
    ...p(Resource.Voucher, A.Create, A.Read),
    ...p(Resource.Report, A.Read, A.Export),
    ...p(Resource.Dashboard, A.Read),
    ...p(Resource.AiAnalytics, A.Read),
    ...p(Resource.AuditLog, A.Read),
  ],

  [SystemRole.OperationsExecutive]: [
    ...p(Resource.Booking, A.ReadOwn, A.Update),
    ...p(Resource.OperationTask, A.ReadOwn, A.Update),
    ...p(Resource.Itinerary, A.Read, A.Update),
    ...p(Resource.Vendor, A.Read),
    ...p(Resource.VendorRate, A.Read),
    ...p(Resource.HotelBooking, A.Create, A.Read, A.Update),
    ...p(Resource.TransportBooking, A.Create, A.Read, A.Update),
    ...p(Resource.Voucher, A.Create, A.Read),
    ...p(Resource.Task, A.ReadOwn, A.Update),
    ...p(Resource.Dashboard, A.Read),
  ],

  [SystemRole.AccountsTeam]: [
    ...p(Resource.Lead, A.Read),
    ...p(Resource.Booking, A.Read),
    ...p(Resource.Invoice, A.Create, A.Read),
    ...p(Resource.Payment, A.Create, A.Read, A.Manage),
    ...p(Resource.Voucher, A.Read),
    ...p(Resource.AiInsight, A.Read),
    ...p(Resource.Report, A.Read, A.Export),
    ...p(Resource.Dashboard, A.Read),
    ...p(Resource.AiAnalytics, A.Read),
  ],

  [SystemRole.VendorTeam]: [
    ...p(Resource.Vendor, A.Create, A.Read, A.Update, A.Manage),
    ...p(Resource.VendorRate, A.Create, A.Read, A.Update),
    ...p(Resource.HotelBooking, A.Read),
    ...p(Resource.TransportBooking, A.Read),
    ...p(Resource.Voucher, A.Read),
    ...p(Resource.Conversation, A.ReadOwn, A.Update),
    ...p(Resource.Report, A.Read),
    ...p(Resource.Dashboard, A.Read),
  ],

  // Customers never receive staff permissions; portal access is granted via
  // portal_access_grant rows, not role permissions.
  [SystemRole.Customer]: [],
};
