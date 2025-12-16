import { Router } from "express";
import { getAllUsers } from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { Role } from "../../prisma/generated/client";

const router = Router();

router.get(
  "/all",
  authenticate,
  authorize(Role.ADMIN, Role.MANAGER),
  getAllUsers
);

export default router;
