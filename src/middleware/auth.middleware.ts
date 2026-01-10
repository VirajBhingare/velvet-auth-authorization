import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { verifyToken } from "../utils/jwt";
import { Role } from "@prisma/client";
import { isBlacklistedToken } from "../utils/tokenBlacklist";
import { sendResponse } from "../utils/response";

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "No token provided",
      });
    }

    const token = authHeader.substring(7);

    const blacklisted = await isBlacklistedToken(token);

    if (blacklisted) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "Token has been revoked",
      });
    }

    const decoded = verifyToken(token);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      exp: decoded.exp,
      iat: decoded.iat,
    };

    req.token = token;

    next();
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 401,
      message: "Invalid or expired token",
    });
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendResponse({ res, statusCode: 401, message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return sendResponse({
        res,
        statusCode: 403,
        message: "Forbidden: Insufficient permissions",
      });
    }

    next();
  };
};
