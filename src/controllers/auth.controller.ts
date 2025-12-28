import { Request, Response } from "express";
import prisma from "../config/database";
import bcrypt from "bcrypt";
import { RegisterDTO, LoginDTO, AuthRequest } from "../types/index";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../utils/jwt";
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

      res.status(201).json({
        message: "User registered successfully. Please login to continue.",
        user,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginDTO = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 3);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
      },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV,
      sameSite: "strict",
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 Days
      path: "/",
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    // Get refresh token from HTTP-only cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token" });
    }

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      id: decoded.id,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      role: decoded.role,
    });

    res.status(200).json({
      message: "Access token refreshed",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const token = req.token;
    const userId = req.user?.id;
    const { refreshToken } = req.cookies.refreshToken;

    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get the expiry from decoded payload
    const exp = req.user?.exp || Math.floor(Date.now() / 1000) + 60 * 60; // Expires in 1 hour

    if (!exp) {
      return res
        .status(400)
        .json({ message: "Invalid token: missing expiration" });
    }

    const expiresAt = exp * 1000; // Convert to milliseconds

    // Add access token to database blacklist
    await addToBlacklist(token!, expiresAt, userId);

    // Remove refresh token from database if provided
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: {
          token: refreshToken,
          userId: userId,
        },
      });
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      // secure: process.env.NODE_ENV,
      sameSite: "strict",
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 Days
      path: "/",
    });

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

export const logoutAll = async (req: AuthRequest, res: Response) => {
  try {
    const token = req.token;
    const userId = req.user?.id;
    const exp = req.user?.exp;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (token && userId && exp) {
      // Blacklist current access token
      await addToBlacklist(token, exp * 1000, userId);

      // Remove all refresh tokens for this user
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }

    res.status(200).json({
      message: "Logged out from all devices successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
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
