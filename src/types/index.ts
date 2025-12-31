import { Request } from "express";
import { Role } from "../generated/prisma/client";

export interface JWTPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    exp: number;
    iat: number;
  };
  token?: string;
}
