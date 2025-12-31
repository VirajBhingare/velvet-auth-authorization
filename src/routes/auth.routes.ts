import { Router } from "express";
import {
  getProfile,
  loginUser,
  logout,
  registerUser,
  logoutAll,
  refreshAccessToken,
  verifyEmail,
  verifyLogin,
  resendVerificationOtp,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendOtpSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from "../validation/auth.validation";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Registration Flow
router.post("/register", validate(registerSchema), registerUser);
router.post("/verify-email", validate(verifyOtpSchema), verifyEmail);
router.post("/resend-otp", validate(resendOtpSchema), resendVerificationOtp);

// Login Flow
router.post("/login", validate(loginSchema), loginUser);
router.post("/verify-login", validate(verifyOtpSchema), verifyLogin);

// Password Reset Flow
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

// Token management
router.post("/refresh", refreshAccessToken);

// Protected Routes (Require Bearer Token)
router.post("/logout", authenticate, logout);
router.post("/logout-all", authenticate, logoutAll);
router.get("/profile", authenticate, getProfile);

export default router;
