import jwt from "jsonwebtoken";
import { JWTPayload } from "../types/index";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-LHASHDlHDHEDP_JSK";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = (
  token: string
): JWTPayload & { exp: number; iat: number } => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload & {
    exp: number;
    iat: number;
  };
};
