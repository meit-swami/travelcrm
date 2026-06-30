/**
 * Demo data generator — rich sample records so every module is populated for
 * testing/demos. Gated behind SEED_DEMO=true and applied to the bootstrap
 * tenant. Idempotent: a marker lead (DEMO-L-001) short-circuits re-runs.
 *
 * Creates: a user per role (incl. super admin), lead sources, ~24 leads across
 * every pipeline stage with activities/notes/tasks, quotations, confirmed
 * bookings with invoices + payments, and WhatsApp/email conversations.
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { SystemRole } from '@travelos/types';

const DESTINATIONS = [
  'Bali', 'Maldives', 'Dubai', 'Thailand', 'Switzerland', 'Singapore', 'Kerala',
  'Goa', 'Andaman', 'Kashmir', 'Vietnam', 'Europe', 'Ladakh', 'Rajasthan',
];
const FIRST = [
  'Aarav', 'Vivaan', 'Aditya', 'Diya', 'Ananya', 'Ishaan', 'Kabir', 'Saanvi',
  'Riya', 'Arjun', 'Meera', 'Rohan', 'Neha', 'Karan', 'Priya', 'Anjali',
  'Vikram', 'Sneha', 'Rahul', 'Pooja', 'Amit', 'Divya', 'Sahil', 'Tara',
];
const LAST = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Gupta', 'Singh',
  'Mehta', 'Joshi', 'Kapoor', 'Rao', 'Desai', 'Bose',
];

type Stage =
  | 'new' | 'contacted' | 'interested' | 'quotation_sent'
  | 'negotiation' | 'follow_up' | 'confirmed' | 'lost';

// Pipeline distribution for the 24 demo leads.
const STAGE_PLAN: Stage[] = [
  ...Array<Stage>(5).fill('new'),
  ...Array<Stage>(4).fill('contacted'),
  ...Array<Stage>(3).fill('interested'),
  ...Array<Stage>(3).fill('quotation_sent'),
  ...Array<Stage>(2).fill('negotiation'),
  ...Array<Stage>(2).fill('follow_up'),
  ...Array<Stage>(3).fill('confirmed'),
  ...Array<Stage>(2).fill('lost'),
];

const pick = <T>(arr: T[], i: number): T => arr[i % arr.length];
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const DEMO_USERS = [
  { key: SystemRole.SuperAdmin, email: 'superadmin', name: 'Sara (Super Admin)' },
  { key: SystemRole.SalesManager, email: 'sales.manager', name: 'Manish (Sales Manager)' },
  { key: SystemRole.SalesExecutive, email: 'sales.exec1', name: 'Priya (Sales Exec)' },
  { key: SystemRole.SalesExecutive, email: 'sales.exec2', name: 'Rohit (Sales Exec)' },
  { key: SystemRole.OperationsManager, email: 'ops.manager', name: 'Deepa (Ops Manager)' },
  { key: SystemRole.AccountsTeam, email: 'accounts', name: 'Anil (Accounts)' },
];

export async function seedDemoData(prisma: PrismaClient, tenantId: string): Promise<void> {
  // Idempotency guard.
  const marker = await prisma.lead.findFirst({
    where: { tenantId, referenceCode: 'DEMO-L-001' },
  });
  if (marker) {
    console.log('• Demo data already present — skipping.');
    return;
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const emailDomain = (tenant?.billingEmail?.split('@')[1]) ?? 'demo.travelos.ai';
  const demoPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'Demo@12345';
  const passwordHash = await argon2.hash(demoPassword);

  // ── Users with roles ──────────────────────────────────────────────────────
  const roleByKey = new Map(
    (await prisma.role.findMany({ where: { isSystem: true } })).map((r) => [r.key, r]),
  );
  const salesUserIds: string[] = [];
  let opsUserId: string | undefined;

  for (const u of DEMO_USERS) {
    const email = `${u.email}@${emailDomain}`;
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email } },
      update: { fullName: u.name, status: 'active' },
      create: { tenantId, email, fullName: u.name, status: 'active', passwordHash },
    });
    const role = roleByKey.get(u.key);
    if (role) {
      const exists = await prisma.userRole.findFirst({
        where: { userId: user.id, roleId: role.id, scopeTeamId: null },
      });
      if (!exists) {
        await prisma.userRole.create({ data: { tenantId, userId: user.id, roleId: role.id } });
      }
    }
    if (u.key === SystemRole.SalesManager || u.key === SystemRole.SalesExecutive) salesUserIds.push(user.id);
    if (u.key === SystemRole.OperationsManager) opsUserId = user.id;
  }

  // ── Lead source ───────────────────────────────────────────────────────────
  let source = await prisma.leadSource.findFirst({ where: { tenantId, name: 'Main Website' } });
  if (!source) {
    source = await prisma.leadSource.create({
      data: { tenantId, type: 'website', name: 'Main Website' },
    });
  }

  // ── Leads + child records ────────────────────────────────────────────────
  let confirmedCount = 0;
  for (let i = 0; i < STAGE_PLAN.length; i++) {
    const stage = STAGE_PLAN[i];
    const first = pick(FIRST, i);
    const last = pick(LAST, i * 3 + 1);
    const name = `${first} ${last}`;
    const destination = pick(DESTINATIONS, i * 2);
    const ref = `DEMO-L-${String(i + 1).padStart(3, '0')}`;
    const assignee = pick(salesUserIds, i);
    const status = stage === 'lost' ? 'lost' : stage === 'confirmed' ? 'won' : 'open';
    const priority = (['low', 'medium', 'high', 'hot'] as const)[i % 4];
    const adults = rand(1, 4);
    const children = rand(0, 3);
    const budget = rand(60, 600) * 1000;
    const monthOffset = rand(1, 6);
    const travelDate = new Date(2026, 5 + monthOffset, rand(1, 27));
    const returnDate = new Date(travelDate);
    returnDate.setDate(returnDate.getDate() + rand(4, 12));

    const lead = await prisma.lead.create({
      data: {
        tenantId,
        sourceId: source.id,
        referenceCode: ref,
        stage,
        status,
        name,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
        phone: `+9198${String(rand(10000000, 99999999))}`,
        destination,
        travelDate,
        returnDate,
        adults,
        children,
        budgetAmount: budget,
        budgetCurrency: 'INR',
        priority,
        score: rand(20, 95),
        assignedUserId: assignee,
        specialRequests: i % 3 === 0 ? 'Honeymoon couple — prefer sea-view rooms.' : undefined,
      },
    });

    // Activity timeline.
    await prisma.leadActivity.create({
      data: { tenantId, leadId: lead.id, type: 'system', title: 'Lead created from Main Website' },
    });
    if (stage !== 'new') {
      await prisma.leadActivity.create({
        data: { tenantId, leadId: lead.id, type: 'call', title: 'Intro call completed', body: 'Discussed dates & budget.' },
      });
    }

    // A note on every 2nd lead.
    if (i % 2 === 0) {
      await prisma.note.create({
        data: { tenantId, leadId: lead.id, authorUserId: assignee, body: `Client keen on ${destination}. Follow up with options.`, isPinned: i % 6 === 0 },
      });
    }

    // A pending follow-up task on open leads.
    if (status === 'open') {
      const due = new Date();
      due.setDate(due.getDate() + rand(-2, 6));
      await prisma.task.create({
        data: {
          tenantId,
          leadId: lead.id,
          title: `Follow up with ${first}`,
          type: 'follow_up',
          status: 'pending',
          dueAt: due,
          remindAt: due,
          assigneeUserId: assignee,
        },
      });
    }

    // Quotation for mid/late-stage leads.
    const needsQuote = ['quotation_sent', 'negotiation', 'confirmed'].includes(stage);
    let quotation: { id: string } | undefined;
    if (needsQuote) {
      const subtotal = budget;
      const tax = Math.round(subtotal * 0.05);
      const total = subtotal + tax;
      const q = await prisma.quotation.create({
        data: {
          tenantId,
          leadId: lead.id,
          referenceCode: `DEMO-Q-${String(i + 1).padStart(3, '0')}`,
          title: `${destination} package — ${adults} adults`,
          status: stage === 'confirmed' ? 'accepted' : stage === 'negotiation' ? 'viewed' : 'sent',
          sentAt: new Date(),
          totalAmount: total,
          currency: 'INR',
        },
      });
      const version = await prisma.quotationVersion.create({
        data: {
          tenantId,
          quotationId: q.id,
          versionNo: 1,
          lineItems: [
            { label: `${destination} stay (5N)`, qty: 1, unitPrice: Math.round(subtotal * 0.6) },
            { label: 'Flights (return)', qty: adults, unitPrice: Math.round((subtotal * 0.3) / adults) },
            { label: 'Transfers & tours', qty: 1, unitPrice: Math.round(subtotal * 0.1) },
          ],
          subtotal,
          tax,
          total,
          currency: 'INR',
        },
      });
      await prisma.quotation.update({
        where: { id: q.id },
        data: { currentVersionId: version.id, revisionCount: 1 },
      });
      quotation = q;
    }

    // Confirmed → booking + invoice + payment.
    if (stage === 'confirmed') {
      confirmedCount++;
      const total = Number(budget) + Math.round(budget * 0.05);
      const booking = await prisma.booking.create({
        data: {
          tenantId,
          leadId: lead.id,
          quotationId: quotation?.id,
          referenceCode: `DEMO-B-${String(confirmedCount).padStart(3, '0')}`,
          destination,
          travelStart: travelDate,
          travelEnd: returnDate,
          paxAdults: adults,
          paxChildren: children,
          totalValue: total,
          currency: 'INR',
          opsStage: 'confirmed',
          opsOwnerUserId: opsUserId,
        },
      });
      const advance = Math.round(total * 0.4);
      const invoice = await prisma.invoice.create({
        data: {
          tenantId,
          bookingId: booking.id,
          invoiceNo: `DEMO-INV-${String(confirmedCount).padStart(3, '0')}`,
          status: 'partially_paid',
          subtotal: budget,
          tax: Math.round(budget * 0.05),
          total,
          amountPaid: advance,
          currency: 'INR',
          issuedAt: new Date(),
          lineItems: [{ label: `${destination} package`, qty: 1, unitPrice: total }],
        },
      });
      await prisma.payment.create({
        data: {
          tenantId,
          bookingId: booking.id,
          invoiceId: invoice.id,
          type: 'advance',
          amount: advance,
          currency: 'INR',
          status: 'paid',
          gateway: 'manual',
          method: 'upi',
          paidAt: new Date(), // current month → shows in Revenue (MTD)
        },
      });
    }

    // A WhatsApp conversation for the first few leads.
    if (i < 6) {
      const convo = await prisma.conversation.create({
        data: {
          tenantId,
          leadId: lead.id,
          channel: 'whatsapp',
          contactHandle: lead.phone ?? `+9198${rand(10000000, 99999999)}`,
          lastMessageAt: new Date(),
          unreadCount: i % 2,
          status: 'open',
        },
      });
      await prisma.message.createMany({
        data: [
          { tenantId, conversationId: convo.id, direction: 'inbound', sender: name, body: `Hi, I'm interested in a ${destination} trip.`, status: 'read' },
          { tenantId, conversationId: convo.id, direction: 'outbound', sender: 'Agent', body: 'Wonderful! For how many travellers and which dates?', status: 'delivered' },
          { tenantId, conversationId: convo.id, direction: 'inbound', sender: name, body: `${adults} adults, sometime next month.`, status: 'read' },
        ],
      });
    }
  }

  console.log(
    `✓ Demo data seeded: ${DEMO_USERS.length} role users (password: same as admin), ` +
      `${STAGE_PLAN.length} leads, quotations, ${confirmedCount} confirmed bookings w/ invoices & payments, conversations.`,
  );
}
