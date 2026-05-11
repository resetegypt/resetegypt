import type { FastifyInstance } from 'fastify';

export async function statsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', app.authenticate);

  app.get('/stats/dashboard', async (req) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: Record<string, unknown> = {
      scheduledAt: { gte: today, lt: tomorrow },
    };
    if (req.currentUser!.role === 'PRACTITIONER') {
      where.practitionerId = req.currentUser!.sub;
    }

    const [todayAppointments, pendingMessages, remindersToSend, paymentsAgg] = await Promise.all([
      app.prisma.appointment.count({ where }),
      app.prisma.message.count({ where: { direction: 'INBOUND', readAt: null } }),
      app.prisma.message.count({ where: { status: 'QUEUED' } }),
      app.prisma.payment.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow } },
        _sum: { total: true },
      }),
    ]);

    return {
      todayAppointments,
      pendingMessages,
      remindersToSend,
      todayRevenue: Number(paymentsAgg._sum.total ?? 0),
    };
  });

  app.get('/stats/global', async (req, reply) => {
    if (req.currentUser!.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'AdminOnly' });
    }
    const q = req.query as { period?: string };
    const period = q.period ?? 'month';

    const now = new Date();
    const start = new Date(now);
    if (period === 'day') start.setHours(0, 0, 0, 0);
    else if (period === 'week') start.setDate(start.getDate() - 7);
    else if (period === 'year') start.setFullYear(start.getFullYear() - 1);
    else start.setDate(1);

    const previousStart = new Date(start);
    const periodMs = now.getTime() - start.getTime();
    previousStart.setTime(start.getTime() - periodMs);

    const [
      revenue,
      previousRevenue,
      appointmentsTotal,
      patientsActive,
      practitioners,
      payments,
      addictionBreakdown,
    ] = await Promise.all([
      app.prisma.payment.aggregate({
        where: { createdAt: { gte: start, lt: now } },
        _sum: { total: true },
        _count: true,
      }),
      app.prisma.payment.aggregate({
        where: { createdAt: { gte: previousStart, lt: start } },
        _sum: { total: true },
      }),
      app.prisma.appointment.count({
        where: { scheduledAt: { gte: start, lt: now } },
      }),
      app.prisma.patient.count({ where: { status: 'ACTIVE' } }),
      app.prisma.user.findMany({
        where: { role: 'PRACTITIONER', isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          _count: {
            select: {
              appointments: { where: { scheduledAt: { gte: start, lt: now } } },
            },
          },
        },
      }),
      app.prisma.payment.findMany({
        where: { createdAt: { gte: start, lt: now } },
        select: { items: true },
        take: 1000,
      }),
      app.prisma.appointment.groupBy({
        by: ['service'],
        where: { scheduledAt: { gte: start, lt: now } },
        _count: true,
      }),
    ]);

    const acquisitionAgg = await app.prisma.patient.findMany({
      where: { createdAt: { gte: start, lt: now } },
      select: { acquisitionSource: true },
    });
    const sourceCount: Record<string, number> = {};
    let totalSources = 0;
    acquisitionAgg.forEach((p) => {
      p.acquisitionSource.forEach((s) => {
        sourceCount[s] = (sourceCount[s] ?? 0) + 1;
        totalSources++;
      });
    });

    const currentRevenue = Number(revenue._sum.total ?? 0);
    const prevRevenue = Number(previousRevenue._sum.total ?? 0);
    const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const dailyRevenue = await app.prisma.$queryRawUnsafe<Array<{ day: Date; total: number }>>(
      `SELECT DATE_TRUNC('day', "createdAt") AS day, SUM("total")::float AS total
       FROM "Payment"
       WHERE "createdAt" >= $1 AND "createdAt" < $2
       GROUP BY day ORDER BY day ASC`,
      start,
      now,
    );

    return {
      period,
      revenue: currentRevenue,
      revenueChange: Math.round(revenueChange * 10) / 10,
      appointments: appointmentsTotal,
      patientsActive,
      practitioners: practitioners.map((p) => ({
        id: p.id,
        name: `Dr. ${p.firstName} ${p.lastName}`,
        appointments: p._count.appointments,
      })),
      sources: Object.entries(sourceCount).map(([source, count]) => ({
        source,
        percentage: totalSources > 0 ? Math.round((count / totalSources) * 100) : 0,
        count,
      })),
      addictions: addictionBreakdown.map((a) => ({
        service: a.service,
        count: a._count,
      })),
      revenueByDay: dailyRevenue.map((r) => ({
        day: r.day.toISOString().slice(0, 10),
        total: r.total,
      })),
      paymentsCount: payments.length,
    };
  });
}
