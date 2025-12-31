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
import { authLimiter, apiLimiter } from "../middleware/rateLimiter";

const router = Router();

// Registration Flow
router.post("/register", authLimiter, validate(registerSchema), registerUser);
router.post(
  "/verify-email",
  authLimiter,
  validate(verifyOtpSchema),
  verifyEmail
);
router.post(
  "/resend-otp",
  authLimiter,
  validate(resendOtpSchema),
  resendVerificationOtp
);

// Login Flow
router.post("/login", authLimiter, validate(loginSchema), loginUser);
router.post(
  "/verify-login",
  authLimiter,
  validate(verifyOtpSchema),
  verifyLogin
);

// Password Reset Flow
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  resetPassword
);

// Token management
router.post("/refresh", apiLimiter, refreshAccessToken);

// Protected Routes (Require Bearer Token)
router.post("/logout", authenticate, apiLimiter, logout);
router.post("/logout-all", authenticate, apiLimiter, logoutAll);
router.get("/profile", authenticate, apiLimiter, getProfile);

export default router;
