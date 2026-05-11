import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomUUID, createHash } from 'node:crypto';
import { recordAudit } from '../../lib/audit.js';

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
    const q = req.query as { patientId?: string; from?: string; to?: string };
    const where: Record<string, unknown> = {};
    if (q.patientId) where.patientId = q.patientId;
    if (q.from || q.to) {
      where.createdAt = {
        ...(q.from && { gte: new Date(q.from) }),
        ...(q.to && { lte: new Date(q.to) }),
      };
    }
    const payments = await app.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { firstName: true, lastName: true } },
      },
      take: 200,
    });
    return { payments };
  });
}
