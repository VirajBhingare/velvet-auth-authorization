import { z } from "zod";
import { Role } from "@prisma/client";
import { otpLength } from "../utils/email";

const firstNameValidation = z
  .string()
  .min(1, "First name must be atleast one character")
  .max(14, "First name must not be more than 14 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "First name must not contain special characters");

const lastNameValidation = z
  .string()
  .min(1, "Last name must be atleast one character")
  .max(22, "Last name must not be more than 22 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Last name must be alphabetic only");

const passwordValidation = z
  .string()
  .min(8, "Password must be atleast 8 characters long")
  .regex(/[A-Z]/, "Password must have atleast one uppercase character")
  .regex(/[a-z]/, "Password must have atleast one lowercase character")
  .regex(/[0-9]/, "Password must have atleast one numeric character")
  .regex(/[^A-Za-z0-9]/, "Password must atleast have one special character");

export const registerSchema = z
  .object({
    email: z.email({ error: "Invalid email address" }),
    password: passwordValidation,
    firstName: firstNameValidation,
    lastName: lastNameValidation,
    role: z.enum(Role).optional(),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.email({ error: "Invalid email address" }),
  password: z.string().min(1, "Password is required"),
});

export const verifyOtpSchema = z.object({
  email: z.email({ error: "Invalid email address" }),
  otp: z.string().length(otpLength, `OTP must be ${otpLength} digits`),
});

export const resendOtpSchema = z.object({
  email: z.email({ error: "Invalid email address" }),
});

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Invalid email address" }),
});

export const resetPasswordSchema = z
  .object({
    email: z.email(),
    otp: z.string().length(otpLength, `OTP must be ${otpLength} digits`),
    password: passwordValidation,
    confirmPassword: z.string({ error: "Confirm password is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const createUserByAdminSchema = z.object({
  email: z.email({ error: "Invalid email address" }),
  firstName: firstNameValidation,
  lastName: lastNameValidation,
  role: z.enum(Role, "Invalid Role"), // Admin can pick Role
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateUserByAdminInput = z.infer<typeof createUserByAdminSchema>;
