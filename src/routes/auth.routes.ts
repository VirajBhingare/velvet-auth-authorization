import { Router } from "express";
import {
  getProfile,
  loginUser,
  logout,
  registerUser,
  logoutAll,
  refreshAccessToken,
} from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { loginSchema, registerSchema } from "../validation/auth.validation";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", authenticate, logout);
router.post("/logout-all", authenticate, logoutAll);
router.get("/profile", authenticate, getProfile);

export default router;
