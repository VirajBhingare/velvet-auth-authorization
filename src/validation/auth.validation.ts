import { z } from "zod";
import { Role } from "../../prisma/generated/client";

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
  password: passwordValidation,
});
