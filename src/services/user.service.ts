import prisma from "../config/database";

export const getAllUsers = async () => {
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return allUsers;
};

// --- Instructor: Create Courses ---
export const createCourse = async (
  title: string,
  description: string,
  instructorId: string
) => {
  return await prisma.course.create({
    data: {
      title,
      description,
      instructorId,
    },
  });
};

// --- Instructor: Get My Courses ---
export const getMyCourses = async (instructorId: string) => {
  return await prisma.course.findMany({
    where: { instructorId },
    orderBy: { createdAt: "desc" },
  });
};

// --- Employee/Public: Get All Courses ---
export const getAllCourses = async () => {
  return await prisma.course.findMany({
    include: {
      instructor: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};
