// Crée (ou réactive) une Mailbox pour un praticien existant.
// Usage : pnpm --filter @reset/api exec tsx scripts/create-mailbox.ts <userEmail> <mailboxAddress> "<displayName>"
// Exemple : ... scripts/create-mailbox.ts dr.ahmad@reset-egypt.com ahmadalashry@reset-egypt.com "Dr Ahmad Al Ashry"
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [userEmail, mailboxAddress, displayName] = process.argv.slice(2);
  if (!userEmail || !mailboxAddress || !displayName) {
    console.error(
      'Usage : tsx scripts/create-mailbox.ts <userEmail> <mailboxAddress> "<displayName>"',
    );
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    console.error(`❌ Aucun utilisateur avec l'email ${userEmail}`);
    process.exit(1);
  }

  const mailbox = await prisma.mailbox.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      address: mailboxAddress.toLowerCase(),
      displayName,
      isActive: true,
    },
    update: {
      address: mailboxAddress.toLowerCase(),
      displayName,
      isActive: true,
    },
  });

  console.log(`✅ Mailbox prête : ${mailbox.address} (id ${mailbox.id}) → user ${userEmail}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
