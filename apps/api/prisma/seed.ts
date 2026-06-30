import { PrismaClient, Role, Addiction, Gender, AppointmentStatus, VisitType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD_PLAIN = 'TempPass123!';

const PRACTITIONERS_DATA = [
  { email: 'dr.ahmadalashry@reset-egypt.com', firstName: 'Ahmad', lastName: 'Al Ashry' },
] as const;

const SECRETARIES_DATA = [
  { email: 'sara@reset-egypt.com', firstName: 'Sara', lastName: 'Mostafa' },
  { email: 'nora@reset-egypt.com', firstName: 'Nora', lastName: 'Ibrahim' },
] as const;

const PATIENTS_DATA: Array<{
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: Date;
  gender: Gender;
  governorate: string;
  primaryAddiction: Addiction;
  preferredLanguage: string;
}> = [
  {
    firstName: 'Ahmed',
    lastName: 'Mostafa',
    phone: '+201002345678',
    dateOfBirth: new Date('1985-03-12'),
    gender: 'MALE',
    governorate: 'Le Caire',
    primaryAddiction: 'TOBACCO',
    preferredLanguage: 'ar',
  },
  {
    firstName: 'Sara',
    lastName: 'El-Hosseiny',
    phone: '+201112345678',
    dateOfBirth: new Date('1990-07-22'),
    gender: 'FEMALE',
    governorate: 'Gizeh',
    primaryAddiction: 'STRESS',
    preferredLanguage: 'fr',
  },
  {
    firstName: 'Khaled',
    lastName: 'Salim',
    phone: '+201223456789',
    dateOfBirth: new Date('1978-11-05'),
    gender: 'MALE',
    governorate: 'Le Caire',
    primaryAddiction: 'SUGAR',
    preferredLanguage: 'ar',
  },
  {
    firstName: 'Nour',
    lastName: 'Hassan',
    phone: '+201334567890',
    dateOfBirth: new Date('1995-02-18'),
    gender: 'FEMALE',
    governorate: 'Alexandrie',
    primaryAddiction: 'ALCOHOL',
    preferredLanguage: 'en',
  },
  {
    firstName: 'Mariam',
    lastName: 'Adel',
    phone: '+201445678901',
    dateOfBirth: new Date('1982-08-30'),
    gender: 'FEMALE',
    governorate: 'Le Caire',
    primaryAddiction: 'TOBACCO',
    preferredLanguage: 'ar',
  },
];

const PRICE_BY_SERVICE: Record<Addiction, { first: number; followup: number }> = {
  TOBACCO: { first: 3500, followup: 1500 },
  DRUGS: { first: 4000, followup: 1800 },
  ALCOHOL: { first: 4000, followup: 1800 },
  SUGAR: { first: 2500, followup: 1100 },
  STRESS: { first: 2000, followup: 900 },
};

function ageFromDob(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function slotForDay(dayOffset: number, slotIndex: number): Date {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + dayOffset);
  const startMinutes = 10 * 60 + slotIndex * 40;
  base.setMinutes(startMinutes);
  return base;
}

async function main() {
  console.log('🌱 Seeding database...');
  const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'direction@reset-egypt.com' },
    update: {},
    create: {
      email: 'direction@reset-egypt.com',
      passwordHash,
      role: Role.ADMIN,
      firstName: 'Direction',
      lastName: 'Reset Egypt',
      preferredLanguage: 'fr',
    },
  });
  console.log(`✔ Admin: ${admin.email}`);

  const practitioners = await Promise.all(
    PRACTITIONERS_DATA.map((p) =>
      prisma.user.upsert({
        where: { email: p.email },
        update: {},
        create: {
          ...p,
          passwordHash,
          role: Role.PRACTITIONER,
          preferredLanguage: 'fr',
        },
      }),
    ),
  );
  practitioners.forEach((p) => console.log(`✔ Practitioner: ${p.email}`));

  const secretaries = await Promise.all(
    SECRETARIES_DATA.map((s) =>
      prisma.user.upsert({
        where: { email: s.email },
        update: {},
        create: {
          ...s,
          passwordHash,
          role: Role.SECRETARY,
          preferredLanguage: 'fr',
        },
      }),
    ),
  );
  secretaries.forEach((s) => console.log(`✔ Secretary: ${s.email}`));

  const secretarySara = secretaries[0]!;

  const patients = await Promise.all(
    PATIENTS_DATA.map((p) =>
      prisma.patient.upsert({
        where: { phone: p.phone },
        update: {},
        create: {
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone,
          dateOfBirth: p.dateOfBirth,
          age: ageFromDob(p.dateOfBirth),
          gender: p.gender,
          governorate: p.governorate,
          primaryAddiction: p.primaryAddiction,
          preferredLanguage: p.preferredLanguage,
          acquisitionSource: ['instagram'],
          consents: {
            dataProtection: { accepted: true, timestamp: new Date().toISOString() },
            smsAuthorization: { accepted: true, timestamp: new Date().toISOString() },
            nonMedicalAcknowledgement: { accepted: true, timestamp: new Date().toISOString() },
          },
          createdById: secretarySara.id,
        },
      }),
    ),
  );
  patients.forEach((p) => console.log(`✔ Patient: ${p.firstName} ${p.lastName}`));

  let appointmentsCreated = 0;
  for (let i = 0; i < 20; i++) {
    const patient = patients[i % patients.length]!;
    const practitioner = practitioners[i % practitioners.length]!;
    const dayOffset = Math.floor(i / 3);
    const slotIndex = i % 9;
    const scheduledAt = slotForDay(dayOffset, slotIndex);
    const isFirst = i < patients.length;
    const visitType: VisitType = isFirst ? 'FIRST' : 'FOLLOWUP';
    const price = isFirst
      ? PRICE_BY_SERVICE[patient.primaryAddiction].first
      : PRICE_BY_SERVICE[patient.primaryAddiction].followup;

    const existing = await prisma.appointment.findFirst({
      where: { patientId: patient.id, scheduledAt },
    });
    if (existing) continue;

    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        practitionerId: practitioner.id,
        scheduledAt,
        service: patient.primaryAddiction,
        visitType,
        status: i < 5 ? AppointmentStatus.COMPLETED : AppointmentStatus.SCHEDULED,
        source: 'phone',
        price,
      },
    });
    appointmentsCreated++;
  }
  console.log(`✔ Appointments created: ${appointmentsCreated}`);

  console.log('🎉 Seed complete!');
  // SECURITE — n'affiche les mots de passe qu'en dev. En prod = jamais.
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\nLogin credentials (dev only):`);
    console.log(`  Admin       : direction@reset-egypt.com / ${PASSWORD_PLAIN}`);
    console.log(`  Practitioner: dr.ahmadalashry@reset-egypt.com / ${PASSWORD_PLAIN}`);
    console.log(`  Secretary   : sara@reset-egypt.com / ${PASSWORD_PLAIN}`);
  } else {
    console.log('Passwords reset to default — staff must change them on first login.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
