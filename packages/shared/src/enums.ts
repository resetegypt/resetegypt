export const ROLES = ['ADMIN', 'PRACTITIONER', 'SECRETARY'] as const;
export type Role = (typeof ROLES)[number];

export const ADDICTIONS = ['TOBACCO', 'DRUGS', 'ALCOHOL', 'SUGAR', 'STRESS'] as const;
export type Addiction = (typeof ADDICTIONS)[number];

export const GENDERS = ['MALE', 'FEMALE'] as const;
export type Gender = (typeof GENDERS)[number];

export const PATIENT_STATUSES = ['ACTIVE', 'ARCHIVED', 'LOST'] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

export const VISIT_TYPES = ['FIRST', 'FOLLOWUP', 'CONSOLIDATION'] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

export const APPOINTMENT_STATUSES = [
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'NO_SHOW',
  'CANCELLED',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  'CASH',
  'CARD',
  'VODAFONE_CASH',
  'INSTAPAY',
  'FAWRY',
  'BANK_TRANSFER',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CHANNELS = ['WHATSAPP', 'INSTAGRAM', 'MESSENGER', 'EMAIL', 'SMS'] as const;
export type Channel = (typeof CHANNELS)[number];

export const DIRECTIONS = ['INBOUND', 'OUTBOUND'] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const MESSAGE_STATUSES = ['QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const SUPPORTED_LOCALES = ['fr', 'ar', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const EMAIL_STATUSES = ['RECEIVED', 'SENDING', 'SENT', 'FAILED'] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];
