import prisma from "../config/database";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyToken,
} from "../utils/jwt";
import { generateOTP, sendEmail } from "../utils/email";
import { addToBlacklist } from "../utils/tokenBlacklist";
import {
  RegisterInput,
  LoginInput,
  VerifyOtpInput,
  ResendOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../validation/auth.validation";

// --- Register Service ---
export const register = async (input: RegisterInput) => {
  const { email, password, firstName, lastName, confirmPassword } = input;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User already exists");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOTP();
  const hashedOTP = await bcrypt.hash(otp, 10);
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  // Hardcode role to EMPLOYEE for public registration
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: Role.EMPLOYEE,
      isVerified: false,
      otp: hashedOTP,
      otpExpires,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  await sendEmail(email, otp);
  return user;
};

// --- Login Service ---
export const login = async (input: LoginInput) => {
  const { email, password } = input;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error("Invalid credentials");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error("Invalid credentials");

  const otp = generateOTP();
  const hashedOTP = await bcrypt.hash(otp, 10);
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { otp: hashedOTP, otpExpires },
  });

  await sendEmail(email, otp);
  return true;
};

// --- Verify OTP Service ---
// Handles both New User Verification AND 2FA Login
export const verifyOtp = async (input: VerifyOtpInput) => {
  const { email, otp } = input;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error("Invalid credentials");
  if (!user.otpExpires || user.otpExpires < new Date())
    throw new Error("OTP expired");

  const isMatch = user.otp && (await bcrypt.compare(otp, user.otp));
  if (!isMatch) throw new Error("Invalid OTP");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      otp: null,
      otpExpires: null,
    },
  });

  // Auto-Login: Generate Tokens
  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  });

  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 3);

  await prisma.refreshToken.create({
    data: {
      token: hashToken(refreshToken),
      userId: user.id,
      expiresAt: refreshTokenExpiry,
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

// --- Resend OTP ---
export const resendOtp = async (input: ResendOtpInput) => {
  const { email } = input;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error("Invalid credentials");

  const otp = generateOTP();
  const hashedOTP = await bcrypt.hash(otp, 10);
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { otp: hashedOTP, otpExpires },
  });

  await sendEmail(email, otp);
  return true;
};

// --- Forgot Password ---
export const forgotPassword = async (input: ForgotPasswordInput) => {
  const { email } = input;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent Email Enumeration
  if (!user) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return true;
  }

  const otp = generateOTP();
  const hashedOTP = await bcrypt.hash(otp, 10);
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { otp: hashedOTP, otpExpires },
  });

  await sendEmail(email, otp);
  return true;
};

// --- Reset Password ---
export const resetPassword = async (input: ResetPasswordInput) => {
  const { email, otp, password } = input;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error("User not found");
  if (!user.otpExpires || user.otpExpires < new Date())
    throw new Error("OTP expired");

  const isMatch = user.otp && (await bcrypt.compare(otp, user.otp));
  if (!isMatch) throw new Error("Invalid OTP");

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, otp: null, otpExpires: null },
  });

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  return true;
};

// --- Refresh Token Service ---
export const refreshToken = async (incomingRefreshToken: string) => {
  let decoded;
  try {
    decoded = verifyToken(incomingRefreshToken);
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }

  const hashedRefreshToken = hashToken(incomingRefreshToken);

  const storedToken = await prisma.refreshToken
    .delete({
      where: { token: hashedRefreshToken },
    })
    .catch(() => null);

  if (!storedToken) throw new Error("Refresh token reused or invalid");

  const newAccessToken = generateAccessToken({
    id: decoded.id,
    email: decoded.email,
    firstName: decoded.firstName,
    lastName: decoded.lastName,
    role: decoded.role,
  });

  const newRefreshToken = generateRefreshToken({
    id: decoded.id,
    email: decoded.email,
    firstName: decoded.firstName,
    lastName: decoded.lastName,
    role: decoded.role,
  });

  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 3);

  await prisma.refreshToken.create({
    data: {
      token: hashToken(newRefreshToken),
      userId: decoded.id,
      expiresAt: refreshTokenExpiry,
    },
  });

  return { newAccessToken, newRefreshToken };
};

// --- Logout ---
export const logout = async (
  token: string,
  userId: string,
  exp: number,
  refreshToken?: string
) => {
  await addToBlacklist(token, exp * 1000, userId);
  if (refreshToken) {
    const hashedRefreshToken = hashToken(refreshToken);
    await prisma.refreshToken.deleteMany({
      where: { token: hashedRefreshToken, userId },
    });
  }
};

// --- Logout All ---
export const logoutAll = async (token: string, userId: string, exp: number) => {
  await addToBlacklist(token, exp * 1000, userId);
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

// --- Get Profile ---
export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw new Error("User not found");
  return user;
};
