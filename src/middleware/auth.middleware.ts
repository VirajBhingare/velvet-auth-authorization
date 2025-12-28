import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/index";
import { verifyToken } from "../utils/jwt";
import { Role } from "../generated/prisma/client";
import { isBlacklistedToken } from "../utils/tokenBlacklist";

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.substring(7);

    const blacklisted = await isBlacklistedToken(token);

    if (blacklisted) {
      return res.status(401).json({ message: "Token has been revoked" });
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
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};
