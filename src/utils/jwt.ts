import jwt from "jsonwebtoken";
import { JWTPayload } from "../types";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-LHASHDlHDHEDP_JSK";
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "1h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "3d";

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = (
  token: string
): JWTPayload & { exp: number; iat: number } => {
  const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  return decoded as JWTPayload & {
    exp: number;
    iat: number;
  };
};

export const decodeToken = (
  token: string
): (JWTPayload & { exp?: number; iat?: number }) | null => {
  try {
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    return decoded as JWTPayload & { exp?: number; iat?: number };
  } catch (error) {
    return null;
  }
};

export const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
