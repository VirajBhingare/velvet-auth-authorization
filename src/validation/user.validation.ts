import { z } from "zod";

export const createCourseSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title must not exceed 100 characters"),

  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
