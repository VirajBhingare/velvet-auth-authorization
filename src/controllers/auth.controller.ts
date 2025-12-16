import { Request, Response } from "express";
import prisma from "../config/database";
import bcrypt from "bcrypt";
import { RegisterDTO, LoginDTO, AuthRequest } from "../types/index";
import { generateToken } from "../utils/jwt";
import { addToBlacklist } from "../utils/tokenBlacklist";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      confirmPassword,
      role,
    }: RegisterDTO = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    if (password === confirmPassword) {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: role || "EMPLOYEE",
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      res.status(201).json({ message: "User registered successfully", user });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password }: LoginDTO = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  });

  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    token,
  });
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const token = req.token;
    const userId = req.user?.id;

    if (!token) {
      res.status(400).json({ message: "No token provided" });
    }

    // Get the expiry from decoded payload
    const exp = req.user?.exp || Math.floor(Date.now() / 1000) + 60 * 60; // Expires in 1 hour

    if (!exp) {
      return res
        .status(400)
        .json({ message: "Invalid token: missing expiration" });
    }

    const expiresAt = exp * 1000; // Convert to milliseconds

    await addToBlacklist(token!, expiresAt, userId);

    res
      .status(200)
      .json({ message: "Logout successful. Token has been invalidated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
