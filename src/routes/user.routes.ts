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
import { createUserByAdminSchema } from "../validation/auth.validation";
import { createUserByAdmin } from "../controllers/auth.controller";

const router = Router();

// ADMIN Routes
router.get("/all", authenticate, authorize(Role.ADMIN), getAllUsers);
router.post(
  "/create",
  authenticate,
  authorize(Role.ADMIN),
  validate(createUserByAdminSchema),
  createUserByAdmin
);

// INSTRUCTOR Routes
router.post(
  "/instructor/create-course",
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
  "/all-courses",
  authenticate,
  authorize(Role.ADMIN, Role.EMPLOYEE, Role.INSTRUCTOR),
  getAllCourses
);

export default router;
