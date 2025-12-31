import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import { sendResponse } from "../utils/response";

export const validate = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        return sendResponse({
          res,
          statusCode: 400,
          message: "Validation failed",
          error: errors,
        });
      }

      return sendResponse({
        res,
        statusCode: 500,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  };
};
