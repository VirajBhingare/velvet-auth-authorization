import { Router } from "express";
import {
  createCourse,
  getAllCourses,
  getAllUsers,
  getMyCourses,
} from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { Role } from "@prisma/client";
import { createCourseSchema } from "../validation/user.validation";
import { validate } from "../middleware/validate.middleware";

const router = Router();

// ADMIN Routes
router.get("/all", authenticate, authorize(Role.ADMIN), getAllUsers);

// INSTRUCTOR Routes
router.post(
  "/course",
  authenticate,
  authorize(Role.INSTRUCTOR),
  validate(createCourseSchema),
  createCourse
);

router.get(
  "/instructor/courses",
  authenticate,
  authorize(Role.INSTRUCTOR),
  getMyCourses
);

// All roles can VIEW all courses
router.get(
  "/courses",
  authenticate,
  authorize(Role.ADMIN, Role.EMPLOYEE, Role.INSTRUCTOR),
  getAllCourses
);

export default router;
