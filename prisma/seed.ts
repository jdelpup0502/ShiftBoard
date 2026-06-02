import "dotenv/config";
import { PrismaClient, JobTitle, Role } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  await prisma.shiftOffer.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.employeeJob.deleteMany();
  await prisma.staffingRequirement.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  await prisma.user.create({
    data: {
      email: "admin@example.com",
      passwordHash: hash("password"),
      name: "Manager",
      role: Role.MANAGER,
    },
  });

  // Default staffing requirements — all zeros, ready to configure
  for (let day = 0; day < 7; day++) {
    for (const jobTitle of [JobTitle.SERVER, JobTitle.HOST, JobTitle.BUSSER, JobTitle.BARTENDER]) {
      await prisma.staffingRequirement.create({
        data: { dayOfWeek: day, jobTitle, count: 0 },
      });
    }
  }

  console.log("✓ Seeded database");
  console.log("  Manager: admin@example.com / password");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
