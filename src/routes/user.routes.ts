import { Router } from "express";
import { getAllUsers } from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

router.get("/all", authenticate, authorize(Role.ADMIN), getAllUsers);

export default router;
