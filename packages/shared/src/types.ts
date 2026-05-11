import type { Addiction, AppointmentStatus, Role, VisitType } from './enums.js';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Consents {
  dataProtection: { accepted: boolean; timestamp: string; ipAddress?: string };
  smsAuthorization: { accepted: boolean; timestamp: string };
  nonMedicalAcknowledgement: { accepted: boolean; timestamp: string };
}

export interface InvoiceLineItem {
  description: string;
  service: Addiction | 'OTHER';
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface AppointmentSummary {
  id: string;
  patientId: string;
  patientName: string;
  practitionerId: string;
  practitionerName: string;
  scheduledAt: string;
  service: Addiction;
  visitType: VisitType;
  status: AppointmentStatus;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  preferredLanguage: string;
}
