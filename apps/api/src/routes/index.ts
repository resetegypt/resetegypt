import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { internalCronRoutes } from './internal-cron.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { totpRoutes } from '../modules/auth/totp.routes.js';
import { usersRoutes } from '../modules/users/users.routes.js';
import { patientsRoutes } from '../modules/patients/patients.routes.js';
import { appointmentsRoutes } from '../modules/appointments/appointments.routes.js';
import { medicalRecordsRoutes } from '../modules/medical-records/medical-records.routes.js';
import { paymentsRoutes } from '../modules/payments/payments.routes.js';
import { messagesRoutes } from '../modules/messages/messages.routes.js';
import { statsRoutes } from '../modules/stats/stats.routes.js';
import { automationsRoutes } from '../modules/automations/automations.routes.js';
import { bookingRoutes } from '../modules/booking/booking.routes.js';
import { waitingListRoutes } from '../modules/waiting-list/waiting-list.routes.js';
import { inboundRoutes } from '../modules/practitioner-mail/inbound.routes.js';
import { practitionerMailRoutes } from '../modules/practitioner-mail/practitioner-mail.routes.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes);
  await app.register(internalCronRoutes);
  await app.register(bookingRoutes);
  await app.register(authRoutes);
  await app.register(totpRoutes);
  await app.register(usersRoutes);
  await app.register(patientsRoutes);
  await app.register(appointmentsRoutes);
  await app.register(medicalRecordsRoutes);
  await app.register(paymentsRoutes);
  await app.register(messagesRoutes);
  await app.register(statsRoutes);
  await app.register(automationsRoutes);
  await app.register(waitingListRoutes);
  await app.register(inboundRoutes);
  await app.register(practitionerMailRoutes);
  await app.register(pushRoutes);
  await app.register(availabilityRoutes);
}
