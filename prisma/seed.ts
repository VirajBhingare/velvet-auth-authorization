import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const main = async () => {
  const ADMIN_PASS = process.env.ADMIN_PASS;
  if (!ADMIN_PASS) {
    throw new Error("ADMIN_PASS environment variable required");
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASS, 10);

  const admin = await prisma.user.upsert({
    where: { email: "virajbhingare360@gmail.com" },
    update: {},
    create: {
      email: "virajbhingare360@gmail.com",
      firstName: "Super",
      lastName: "Admin",
      password: hashedPassword,
      role: Role.ADMIN,
      isVerified: true,
      otp: null,
      otpExpires: null,
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: "viru3.b@proton.me" },
    update: {},
    create: {
      email: "viru3.b@proton.me",
      firstName: "Master",
      lastName: "Intructor",
      password: hashedPassword,
      role: Role.INSTRUCTOR,
      isVerified: true,
      otp: null,
      otpExpires: null,
    },
  });

  console.log({ admin });
  console.log("Admin user seeded.");

  console.log({ instructor });
  console.log("Instructor user seeded.");
};

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
