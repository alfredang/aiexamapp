/**
 * One-off: create/upsert Mohan as an ADMIN user.
 * Run: npx tsx prisma/seeds/create-mohan.ts
 */
import argon2 from 'argon2';
import { PrismaClient, Role } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const email = 'mohanpothula@gmail.com';
  const name = 'Mohan';
  const password = process.env.MOHAN_PASSWORD || 'password123';

  const passwordHash = await argon2.hash(password);
  const user = await db.user.upsert({
    where: { email },
    update: { name, role: Role.ADMIN, emailVerified: new Date(), passwordHash },
    create: { email, name, passwordHash, role: Role.ADMIN, emailVerified: new Date() }
  });
  console.log(`Upserted ${user.email} (id=${user.id}, role=${user.role})`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
