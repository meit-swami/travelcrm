/**
 * Seed: permission catalogue + system roles (always), plus a demo tenant and
 * admin user (dev only — never in production). Idempotent.
 *
 * Run: pnpm db:seed
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  PERMISSION_CATALOGUE,
  ROLE_PERMISSIONS,
  ALL_PERMISSIONS,
  SystemRole,
} from '@travelos/types';

const prisma = new PrismaClient();

const ROLE_NAMES: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_executive: 'Sales Executive',
  operations_manager: 'Operations Manager',
  operations_executive: 'Operations Executive',
  accounts_team: 'Accounts Team',
  vendor_team: 'Vendor Team',
  customer: 'Customer',
};

async function seedPermissions() {
  for (const key of PERMISSION_CATALOGUE) {
    const [resource, action] = key.split('.');
    await prisma.permission.upsert({
      where: { key },
      update: { resource, action },
      create: { key, resource, action },
    });
  }
  console.log(`✓ ${PERMISSION_CATALOGUE.length} permissions seeded.`);
}

async function seedSystemRoles() {
  const allPermissions = await prisma.permission.findMany();
  const byKey = new Map(allPermissions.map((p) => [p.key, p.id]));

  for (const roleKey of Object.values(SystemRole)) {
    // NULLs are distinct in SQL uniques, so upsert-on-(null tenant, key) is unsafe.
    // Find-then-write keeps the seed idempotent for system roles.
    const existingRole = await prisma.role.findFirst({
      where: { tenantId: null, key: roleKey, isSystem: true },
    });
    const role = existingRole
      ? await prisma.role.update({
          where: { id: existingRole.id },
          data: { name: ROLE_NAMES[roleKey], isSystem: true },
        })
      : await prisma.role.create({
          data: { key: roleKey, name: ROLE_NAMES[roleKey], isSystem: true, tenantId: null },
        });

    const grant = ROLE_PERMISSIONS[roleKey];
    const permissionIds =
      grant === ALL_PERMISSIONS
        ? allPermissions.map((p) => p.id)
        : grant.map((k) => byKey.get(k)).filter((id): id is string => Boolean(id));

    // Reset and re-apply this role's permissions.
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permissionIds.length) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }
  }
  console.log(`✓ ${Object.values(SystemRole).length} system roles seeded.`);
}

async function seedDemoTenant(): Promise<string | undefined> {
  if (process.env.NODE_ENV === 'production') {
    console.log('• Skipping demo tenant (production).');
    return undefined;
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Travel Co.',
      slug: 'demo',
      status: 'active',
      plan: 'growth',
      billingEmail: 'admin@demo.travelos.ai',
    },
  });

  const passwordHash = await argon2.hash('Demo@12345');
  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo.travelos.ai' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.travelos.ai',
      fullName: 'Demo Admin',
      status: 'active',
      passwordHash,
    },
  });

  const adminRole = await prisma.role.findFirst({
    where: { key: SystemRole.Admin, isSystem: true },
  });
  if (adminRole) {
    const existingAssignment = await prisma.userRole.findFirst({
      where: { userId: admin.id, roleId: adminRole.id, scopeTeamId: null },
    });
    if (!existingAssignment) {
      await prisma.userRole.create({
        data: { tenantId: tenant.id, userId: admin.id, roleId: adminRole.id },
      });
    }
  }

  // Default lost reasons (feed AI loss analytics later).
  const lostReasons = [
    { label: 'Price too high', category: 'pricing' },
    { label: 'Chose competitor', category: 'competition' },
    { label: 'Plan postponed', category: 'timing' },
    { label: 'No response', category: 'engagement' },
    { label: 'Out of budget', category: 'pricing' },
  ];
  for (const lr of lostReasons) {
    const exists = await prisma.lostReason.findFirst({ where: { tenantId: tenant.id, label: lr.label } });
    if (!exists) {
      await prisma.lostReason.create({ data: { tenantId: tenant.id, ...lr } });
    }
  }

  // A default manual + website source.
  for (const src of [
    { type: 'manual' as const, name: 'Manual Entry' },
    { type: 'website' as const, name: 'Main Website' },
  ]) {
    const exists = await prisma.leadSource.findFirst({ where: { tenantId: tenant.id, name: src.name } });
    if (!exists) {
      await prisma.leadSource.create({ data: { tenantId: tenant.id, type: src.type, name: src.name } });
    }
  }

  console.log('✓ Demo tenant + admin (admin@demo.travelos.ai / Demo@12345) + sources + lost reasons.');
  return tenant.id;
}

/**
 * Production bootstrap: creates a first tenant + admin from env vars, so a live
 * deployment has a working login without seeding demo data. Idempotent.
 * Set BOOTSTRAP_TENANT_SLUG, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD.
 */
async function seedBootstrap(): Promise<string | undefined> {
  const slug = process.env.BOOTSTRAP_TENANT_SLUG;
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!slug || !email || !password) return undefined;

  const tenant = await prisma.tenant.upsert({
    where: { slug },
    update: {},
    create: {
      name: process.env.BOOTSTRAP_TENANT_NAME ?? slug,
      slug,
      status: 'active',
      plan: 'growth',
      billingEmail: email,
    },
  });

  const passwordHash = await argon2.hash(password);
  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email } },
    update: { status: 'active' },
    create: { tenantId: tenant.id, email, fullName: 'Administrator', status: 'active', passwordHash },
  });

  const adminRole = await prisma.role.findFirst({ where: { key: SystemRole.Admin, isSystem: true } });
  if (adminRole) {
    const exists = await prisma.userRole.findFirst({
      where: { userId: admin.id, roleId: adminRole.id, scopeTeamId: null },
    });
    if (!exists) {
      await prisma.userRole.create({ data: { tenantId: tenant.id, userId: admin.id, roleId: adminRole.id } });
    }
  }
  console.log(`✓ Bootstrap tenant "${slug}" + admin ${email}.`);
  return tenant.id;
}

/** Default email templates + a quotation-sent automation for a tenant. */
async function seedTenantEmail(tenantId: string) {
  const templates = [
    {
      key: 'quotation_sent',
      name: 'Quotation Sent',
      subject: 'Your travel quotation {{quotationRef}}',
      htmlBody:
        '<p>Dear {{customerName}},</p><p>Please find your quotation <b>{{quotationRef}}</b> for {{currency}} {{amount}}. Reply to this email with any questions.</p><p>Warm regards,<br/>The Travel Team</p>',
      variables: ['customerName', 'quotationRef', 'amount', 'currency'],
    },
    {
      key: 'payment_received',
      name: 'Payment Received',
      subject: 'Payment received — thank you!',
      htmlBody: '<p>Dear {{customerName}},</p><p>We have received your payment of {{currency}} {{amount}}. Thank you!</p>',
      variables: ['customerName', 'amount', 'currency'],
    },
  ];
  for (const t of templates) {
    const exists = await prisma.emailTemplate.findFirst({ where: { tenantId, key: t.key } });
    if (!exists) await prisma.emailTemplate.create({ data: { tenantId, ...t } });
  }
  const hasAutomation = await prisma.automation.findFirst({
    where: { tenantId, triggerEvent: 'quotation_sent' },
  });
  if (!hasAutomation) {
    await prisma.automation.create({
      data: { tenantId, triggerEvent: 'quotation_sent', templateKey: 'quotation_sent' },
    });
  }
}

async function main() {
  await seedPermissions();
  await seedSystemRoles();
  const demo = await seedDemoTenant();
  if (demo) await seedTenantEmail(demo);
  const bootstrap = await seedBootstrap();
  if (bootstrap) await seedTenantEmail(bootstrap);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
