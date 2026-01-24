import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const main = async () => {
  const ADMIN_PASS = process.env.ADMIN_PASS;
  const INSTRUCTOR_PASS = process.env.INSTRUCTOR_PASS;
  if (!ADMIN_PASS) {
    throw new Error("ADMIN_PASS environment variable required");
  }

  if (!INSTRUCTOR_PASS) {
    throw new Error("INSTRUCTOR_PASS environment variable required");
  }

  const hashedAdminPassword = await bcrypt.hash(ADMIN_PASS, 10);
  const hashedInstructorPassword = await bcrypt.hash(INSTRUCTOR_PASS, 10);

  // Seed Admin user
  const admin = await prisma.user.upsert({
    where: { email: "virajbhingare360@gmail.com" },
    update: {},
    create: {
      email: "virajbhingare360@gmail.com",
      firstName: "Super",
      lastName: "Admin",
      password: hashedAdminPassword,
      role: Role.ADMIN,
      isVerified: true,
      otp: null,
      otpExpires: null,
    },
  });

  // Seed Instructor user
  const instructor = await prisma.user.upsert({
    where: { email: "viru3.b@proton.me" },
    update: {},
    create: {
      email: "viru3.b@proton.me",
      firstName: "Master",
      lastName: "Intructor",
      password: hashedInstructorPassword,
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

  // Check for existing courses and delete to avoid duplicates
  await prisma.course.deleteMany({
    where: { instructorId: instructor.id },
  });

  const dummyCourses = [
    {
      title: "Docker Mastery: From Zero to Hero",
      description:
        "Learn how to build, ship, and run distributed applications with Docker.",
    },
    {
      title: "Advanced TypeScript Patterns",
      description:
        "Deep dive into generics, utility types, and design patterns in TS.",
    },
    {
      title: "PostgreSQL Database Administration",
      description:
        "Master indexing, partitioning, and performance tuning in Postgres.",
    },
  ];

  for (const course of dummyCourses) {
    await prisma.course.create({
      data: {
        title: course.title,
        description: course.description,
        instructorId: instructor.id, // Link to the instructor just created/found
      },
    });
  }

  console.log(
    `${dummyCourses.length} dummy courses seeded for ${instructor.firstName} ${instructor.lastName} (${instructor.email}).`
  );
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
