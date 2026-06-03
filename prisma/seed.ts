import "dotenv/config";
import { PrismaClient, JobTitle, Role } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Only seed if the database is empty — safe to run repeatedly in CI/deploy pipelines
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("Database already seeded — skipping.");
    return;
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set when seeding an empty database.",
    );
  }

  if (adminPassword.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
  }

  const passwordHash = bcrypt.hashSync(adminPassword, 12);

  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      name: "Admin",
      role: Role.EMPLOYEE,
      isAdmin: true,
    },
  });

  // Default staffing requirements — all zeros, ready to configure
  for (let day = 0; day < 7; day++) {
    for (const jobTitle of [JobTitle.SERVER, JobTitle.HOST, JobTitle.BUSSER, JobTitle.BARTENDER]) {
      await prisma.staffingRequirement.upsert({
        where: { dayOfWeek_jobTitle: { dayOfWeek: day, jobTitle } },
        create: { dayOfWeek: day, jobTitle, count: 0 },
        update: {},
      });
    }
  }

  console.log(`✓ Seeded database with admin account: ${adminEmail}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
