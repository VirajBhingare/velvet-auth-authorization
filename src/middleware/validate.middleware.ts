import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        return res.status(400).json({
          message: "Validation failed",
          errors,
        });
      }

      return res.status(500).json({ message: "Internal server error" });
    }
  };
};
