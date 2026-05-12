import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomUUID, createHash } from 'node:crypto';
import { recordAudit } from '../../lib/audit.js';
import { sendEmail } from '../../lib/email.js';
import { renderInvoiceHtml, renderInvoiceEmailBody } from '../../lib/invoice-html.js';

const lineItemSchema = z.object({
  description: z.string(),
  service: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  vatRate: z.number().default(14),
});

const createPaymentSchema = z.object({
  appointmentId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  items: z.array(lineItemSchema).min(1),
  discount: z.number().nonnegative().default(0),
  paymentMethod: z.enum(['CASH', 'CARD', 'VODAFONE_CASH', 'INSTAPAY', 'FAWRY', 'BANK_TRANSFER']),
  paymentRef: z.string().optional(),
});

function nextInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${year}-${random}`;
}

function mockETASubmit(payload: object): { uuid: string; hash: string } {
  // Mock ETA submission - in production this calls https://api.invoicing.eta.gov.eg
  const json = JSON.stringify(payload);
  const hash = createHash('sha256').update(json).digest('hex').slice(0, 32);
  const uuid = randomUUID().toUpperCase();
  return { uuid, hash };
}

export async function paymentsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', app.authenticate);
  app.addHook('preHandler', app.requireRole('SECRETARY', 'ADMIN'));

  app.post('/payments', async (req, reply) => {
    const parsed = createPaymentSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
    const d = parsed.data;

    const subtotalRaw = d.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const subtotal = subtotalRaw - d.discount;
    const vat = subtotal * 0.14;
    const total = subtotal + vat;

    const invoiceNumber = nextInvoiceNumber();
    const etaResult = mockETASubmit({
      invoiceNumber,
      items: d.items,
      subtotal,
      vat,
      total,
      paymentMethod: d.paymentMethod,
    });

    const payment = await app.prisma.payment.create({
      data: {
        appointmentId: d.appointmentId,
        patientId: d.patientId,
        invoiceNumber,
        items: d.items as never,
        subtotal,
        discount: d.discount,
        vat,
        total,
        paymentMethod: d.paymentMethod,
        paymentRef: d.paymentRef,
        etaUuid: etaResult.uuid,
        etaHash: etaResult.hash,
        etaSubmittedAt: new Date(),
        createdById: req.currentUser!.sub,
      },
    });

    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'payment_validated',
      resource: `payment:${payment.id}`,
      details: { invoiceNumber, total, paymentMethod: d.paymentMethod },
    });

    return reply.status(201).send({ payment });
  });

  app.get('/payments/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const payment = await app.prisma.payment.findUnique({
      where: { id },
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true, email: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!payment) return reply.status(404).send({ error: 'NotFound' });
    return { payment };
  });

  app.get('/payments', async (req) => {
    const q = req.query as {
      patientId?: string;
      from?: string;
      to?: string;
      method?: string;
      search?: string;
    };
    const where: Record<string, unknown> = {};
    if (q.patientId) where.patientId = q.patientId;
    if (q.method) where.paymentMethod = q.method;
    if (q.from || q.to) {
      where.createdAt = {
        ...(q.from && { gte: new Date(q.from) }),
        ...(q.to && { lte: new Date(q.to) }),
      };
    }
    if (q.search?.trim()) {
      const s = q.search.trim();
      where.OR = [
        { invoiceNumber: { contains: s, mode: 'insensitive' } },
        { patient: { firstName: { contains: s, mode: 'insensitive' } } },
        { patient: { lastName: { contains: s, mode: 'insensitive' } } },
        { patient: { phone: { contains: s } } },
      ];
    }
    const payments = await app.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true, email: true } },
      },
      take: 500,
    });
    return { payments };
  });

  app.get('/payments/accounting/summary', async (req) => {
    const q = req.query as { from?: string; to?: string };
    const where: Record<string, unknown> = {};
    if (q.from || q.to) {
      where.createdAt = {
        ...(q.from && { gte: new Date(q.from) }),
        ...(q.to && { lte: new Date(q.to) }),
      };
    }

    const [totalAgg, byMethodAgg, dailyAgg] = await Promise.all([
      app.prisma.payment.aggregate({
        where,
        _sum: { total: true, subtotal: true, vat: true },
        _count: true,
      }),
      app.prisma.payment.groupBy({
        by: ['paymentMethod'],
        where,
        _sum: { total: true },
        _count: true,
      }),
      app.prisma.$queryRawUnsafe<Array<{ day: Date; total: number; count: bigint }>>(
        `SELECT DATE_TRUNC('day', "createdAt") AS day, SUM("total")::float AS total, COUNT(*) AS count
         FROM "Payment"
         ${q.from || q.to ? 'WHERE 1=1' : ''}
         ${q.from ? ` AND "createdAt" >= '${new Date(q.from).toISOString()}'` : ''}
         ${q.to ? ` AND "createdAt" <= '${new Date(q.to).toISOString()}'` : ''}
         GROUP BY day
         ORDER BY day DESC
         LIMIT 31`,
      ),
    ]);

    return {
      count: totalAgg._count,
      totalTTC: Number(totalAgg._sum.total ?? 0),
      totalHT: Number(totalAgg._sum.subtotal ?? 0),
      totalVAT: Number(totalAgg._sum.vat ?? 0),
      byMethod: byMethodAgg.map((m) => ({
        method: m.paymentMethod,
        total: Number(m._sum.total ?? 0),
        count: m._count,
      })),
      byDay: dailyAgg.map((r) => ({
        day: r.day.toISOString().slice(0, 10),
        total: r.total,
        count: Number(r.count),
      })),
    };
  });

  app.get('/payments/:id/invoice.html', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const payment = await app.prisma.payment.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!payment) return reply.status(404).send({ error: 'NotFound' });
    reply.header('Content-Type', 'text/html; charset=utf-8');
    return renderInvoiceHtml(payment, payment.patient);
  });

  app.post('/payments/:id/email', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const schema = z.object({ to: z.string().email().optional() });
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError' });

    const payment = await app.prisma.payment.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!payment) return reply.status(404).send({ error: 'NotFound' });

    const target = parsed.data.to ?? payment.patient.email;
    if (!target) {
      return reply.status(400).send({
        error: 'EmailMissing',
        message: "Le patient n'a pas d'email enregistré. Précise une adresse via le champ 'to'.",
      });
    }

    const html = renderInvoiceEmailBody(payment, payment.patient, 'https://app.reset-egypt.com');
    const invoiceHtml = renderInvoiceHtml(payment, payment.patient);
    const result = await sendEmail({
      to: target,
      subject: `Reset Egypt — Facture ${payment.invoiceNumber}`,
      html,
      attachments: [
        {
          filename: `facture-${payment.invoiceNumber}.html`,
          content: invoiceHtml,
          contentType: 'text/html; charset=utf-8',
        },
      ],
    });

    if (!result.sent) {
      return reply.status(500).send({ error: 'EmailFailed', message: result.error });
    }

    await app.prisma.payment.update({
      where: { id },
      data: { emailSentAt: new Date(), emailSentTo: target },
    });

    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'invoice_emailed',
      resource: `payment:${id}`,
      details: { to: target, mocked: result.mocked },
    });

    return { ok: true, to: target, mocked: result.mocked };
  });

  app.get('/payments/accounting/export.csv', async (req, reply) => {
    const q = req.query as { from?: string; to?: string };
    const where: Record<string, unknown> = {};
    if (q.from || q.to) {
      where.createdAt = {
        ...(q.from && { gte: new Date(q.from) }),
        ...(q.to && { lte: new Date(q.to) }),
      };
    }
    const payments = await app.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: { patient: { select: { firstName: true, lastName: true, phone: true } } },
    });

    const headers = [
      'Date',
      'N° Facture',
      'Patient',
      'Téléphone',
      'Sous-total HT',
      'Remise',
      'TVA',
      'Total TTC',
      'Mode de paiement',
      'Référence',
      'UUID ETA',
      'Email envoyé',
    ];
    const rows = payments.map((p) =>
      [
        p.createdAt.toISOString(),
        p.invoiceNumber,
        `${p.patient.firstName} ${p.patient.lastName}`,
        p.patient.phone,
        Number(p.subtotal).toFixed(2),
        Number(p.discount).toFixed(2),
        Number(p.vat).toFixed(2),
        Number(p.total).toFixed(2),
        p.paymentMethod,
        p.paymentRef ?? '',
        p.etaUuid ?? '',
        p.emailSentAt ? p.emailSentAt.toISOString() : '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    const csv = [headers.join(','), ...rows].join('\n');

    reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header(
        'Content-Disposition',
        `attachment; filename="reset-egypt-comptabilite-${new Date().toISOString().slice(0, 10)}.csv"`,
      );
    return csv;
  });
}
