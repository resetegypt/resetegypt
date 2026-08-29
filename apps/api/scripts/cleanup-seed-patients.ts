/**
 * cleanup-seed-patients.ts
 *
 * Supprime les 5 patients fictifs créés par prisma/seed.ts en prod, MAIS seulement
 * si leur dossier est vide (aucun paiement réel, aucun RDV futur, aucun email reçu).
 *
 * Usage :
 *   pnpm --filter @reset/api tsx scripts/cleanup-seed-patients.ts             # dry-run
 *   pnpm --filter @reset/api tsx scripts/cleanup-seed-patients.ts --confirm   # apply
 *
 * Safe-guards :
 *   - Dry-run par défaut (imprime la liste sans supprimer).
 *   - Refuse en dev sauf --force-dev (le script est destiné à la prod).
 *   - Un patient avec Payment (facture émise) est PROTÉGÉ : rétention fiscale 10 ans.
 *   - Un patient avec RDV futur ou en cours est PROTÉGÉ.
 *   - Un patient avec EmailThread lié est PROTÉGÉ (conversation réelle).
 *   - Suppression via transaction : tout ou rien pour chaque patient.
 */
import { PrismaClient } from '@prisma/client';

const SEED_PHONES = [
  '+201002345678', // Ahmed Mostafa
  '+201112345678', // Sara El-Hosseiny
  '+201223456789', // Khaled Salim
  '+201334567890', // Nour Hassan
  '+201445678901', // Mariam Adel
];

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const apply = args.has('--confirm');
  const forceDev = args.has('--force-dev');

  if (process.env.NODE_ENV !== 'production' && !forceDev) {
    console.log(
      '⏭️  NODE_ENV != production — script destiné à la prod. Ajoute --force-dev pour tester en local.',
    );
    process.exit(0);
  }

  const prisma = new PrismaClient();

  try {
    const candidates = await prisma.patient.findMany({
      where: { phone: { in: SEED_PHONES } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        _count: {
          select: {
            appointments: true,
            messages: true,
            scoreSnapshots: true,
            payments: true,
            emailThreads: true,
          },
        },
      },
    });

    if (candidates.length === 0) {
      console.log('✅ Aucun patient seed trouvé — DB déjà propre.');
      return;
    }

    console.log(`🔍 ${candidates.length} candidat(s) trouvé(s) :\n`);
    const toDelete: typeof candidates = [];
    const toKeep: Array<{ patient: (typeof candidates)[number]; reason: string }> = [];

    for (const p of candidates) {
      // Un paiement émis = facture ETA/fiscale — jamais toucher (rétention 10 ans)
      if (p._count.payments > 0) {
        toKeep.push({ patient: p, reason: 'facture émise (rétention fiscale 10 ans)' });
        continue;
      }
      // Un thread email = conversation réelle
      if (p._count.emailThreads > 0) {
        toKeep.push({ patient: p, reason: 'thread email lié' });
        continue;
      }
      // Un RDV futur ou en cours = usage réel actif
      // eslint-disable-next-line no-await-in-loop
      const activeAppointment = await prisma.appointment.findFirst({
        where: {
          patientId: p.id,
          status: { in: ['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS'] },
        },
        select: { id: true, scheduledAt: true },
      });
      if (activeAppointment) {
        toKeep.push({
          patient: p,
          reason: `RDV actif ${activeAppointment.scheduledAt.toISOString()}`,
        });
        continue;
      }
      // Une note de suivi manuelle = usage réel
      // eslint-disable-next-line no-await-in-loop
      const followUp = await prisma.followUpNote.findFirst({
        where: { patientId: p.id },
        select: { id: true },
      });
      if (followUp) {
        toKeep.push({ patient: p, reason: 'follow-up note' });
        continue;
      }
      // Une fiche médicale = usage réel
      // eslint-disable-next-line no-await-in-loop
      const medicalRecord = await prisma.medicalRecord.findUnique({
        where: { patientId: p.id },
        select: { id: true },
      });
      if (medicalRecord) {
        toKeep.push({ patient: p, reason: 'medical record' });
        continue;
      }
      toDelete.push(p);
    }

    console.log(`  À supprimer : ${toDelete.length}`);
    for (const p of toDelete) {
      console.log(
        `    - ${p.firstName} ${p.lastName} (${p.phone}) [appts:${p._count.appointments}, msg:${p._count.messages}]`,
      );
    }
    console.log(`  À conserver : ${toKeep.length}`);
    for (const k of toKeep) {
      console.log(
        `    - ${k.patient.firstName} ${k.patient.lastName} (${k.patient.phone}) — ${k.reason}`,
      );
    }

    if (!apply) {
      console.log('\n💡 Dry-run terminé. Relance avec --confirm pour appliquer.');
      return;
    }

    console.log('\n🗑️  Suppression en cours...');
    let deleted = 0;
    for (const p of toDelete) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await prisma.$transaction(async (tx) => {
          // Ordre respectant les FKs : suppression enfants d'abord.
          // On sait ici que le patient n'a NI payment, NI emailThread, NI followUp,
          // NI medicalRecord, NI RDV actif — mais il peut avoir des RDV passés
          // COMPLETED sans paiement, des messages, des scoreSnapshots (auto), etc.
          await tx.scoreSnapshot.deleteMany({ where: { patientId: p.id } });
          await tx.message.deleteMany({ where: { patientId: p.id } });
          await tx.appointment.deleteMany({ where: { patientId: p.id } });
          await tx.waitingList.deleteMany({ where: { patientId: p.id } });
          await tx.patient.delete({ where: { id: p.id } });
        });
        deleted++;
        console.log(`  ✓ ${p.firstName} ${p.lastName}`);
      } catch (err) {
        console.error(`  ✗ ${p.firstName} ${p.lastName} — ${(err as Error).message}`);
      }
    }
    console.log(`\n✅ Terminé : ${deleted}/${toDelete.length} patients supprimés.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
