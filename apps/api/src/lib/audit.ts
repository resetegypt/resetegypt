import type { FastifyRequest } from 'fastify';
import type { PrismaClient } from '@prisma/client';

export interface AuditLogInput {
  userId?: string | null;
  action: string;
  resource?: string;
  details?: Record<string, unknown>;
}

export async function recordAudit(
  prisma: PrismaClient,
  req: FastifyRequest,
  data: AuditLogInput,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: data.userId ?? null,
      action: data.action,
      resource: data.resource ?? null,
      details: (data.details ?? {}) as never,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    },
  });
}
