import { Request, Response } from "express";
import prisma from "../config/database";
import bcrypt from "bcrypt";
import { AuthRequest } from "../types";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyToken,
} from "../utils/jwt";
import { addToBlacklist } from "../utils/tokenBlacklist";
import { sendResponse } from "../utils/response";
import {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendOtpInput,
  ResetPasswordInput,
  VerifyOtpInput,
} from "../validation/auth.validation";
import { Role } from "../generated/prisma/enums";
import { generateOTP, sendEmail } from "../utils/email";

export const registerUser = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response
) => {
  try {
    const { email, password, firstName, lastName, confirmPassword } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendResponse({
        res,
        statusCode: 409,
        message: "User already exists",
      });
    }

    if (password === confirmPassword) {
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate OTP
      const otp = generateOTP();
      const hashedOTP = await bcrypt.hash(otp, 10);
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes

      // Create User (unverified)
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: Role.EMPLOYEE,
          isVerified: false,
          otp: hashedOTP,
          otpExpires,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      await sendEmail(email, otp);

      return sendResponse({
        res,
        statusCode: 201,
        message:
          "User registered successfully. Please check your email for OTP and verify your account",
        data: user,
      });
    }
  } catch (error) {
    console.error(error);

    return sendResponse({
      res,
      statusCode: 500,
      message:
        error instanceof Error
          ? error.message
          : error instanceof Error
          ? error.message
          : "Internal server error",
    });
  }
};

export const verifyEmail = async (
  req: Request<{}, {}, VerifyOtpInput>,
  res: Response
) => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    if (user.isVerified) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "User already verified",
      });
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      return sendResponse({ res, statusCode: 400, message: "OTP expired" });
    }

    // Check OTP
    const isMatch = user.otp && (await bcrypt.compare(otp, user.otp));

    if (!isMatch) {
      return sendResponse({ res, statusCode: 400, message: "Invalid OTP" });
    }

    // Verify User
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otp: null, otpExpires: null },
    });

    return sendResponse({
      res,
      statusCode: 200,
      message: "Email verified successfully. You can now login",
    });
  } catch (error) {
    console.error(error);
    return sendResponse({
      res,
      statusCode: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const loginUser = async (
  req: Request<{}, {}, LoginInput>,
  res: Response
) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    if (!user.isVerified) {
      return sendResponse({
        res,
        statusCode: 403,
        message: "Please verify your email first",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    // Generate OTP for login
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { otp: hashedOTP, otpExpires },
    });

    await sendEmail(email, otp);

    return sendResponse({
      res,
      statusCode: 200,
      message: "OTP sent to your email. Please verify to complete login",
    });
  } catch (error) {
    console.log(error);
    return sendResponse({
      res,
      statusCode: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const verifyLogin = async (
  req: Request<{}, {}, VerifyOtpInput>,
  res: Response
) => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    // Check Expiry
    if (!user.otpExpires || user.otpExpires < new Date()) {
      return sendResponse({ res, statusCode: 400, message: "OTP expired" });
    }

    const isMatch = user.otp && (await bcrypt.compare(otp, user.otp));
    if (!isMatch) {
      return sendResponse({ res, statusCode: 400, message: "Invalid OTP" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpires: null },
    });

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
        token: hashToken(refreshToken),
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

    return sendResponse({
      res,
      statusCode: 200,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
      },
    });
  } catch (error) {
    console.error(error);
    return sendResponse({
      res,
      statusCode: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const resendVerificationOtp = async (
  req: Request<{}, {}, ResendOtpInput>,
  res: Response
) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    if (user.isVerified) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "User is already verified. Please login.",
      });
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: hashedOTP,
        otpExpires: otpExpires,
      },
    });

    await sendEmail(email, otp);

    return sendResponse({
      res,
      statusCode: 200,
      message: "New verification OTP sent to your email.",
    });
  } catch (error) {}
};

export const forgotPassword = async (
  req: Request<{}, {}, ForgotPasswordInput>,
  res: Response
) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Fake delay to mimic processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return sendResponse({
        res,
        statusCode: 200,
        message: "If an account exists, an OTP has been sent.", // Security measure
      });
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { otp: hashedOTP, otpExpires },
    });

    await sendEmail(email, otp);

    return sendResponse({
      res,
      statusCode: 200,
      message: "If an account exists, an OTP has been sent.",
    });
  } catch (error) {
    console.error(error);
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
    });
  }
};

export const resetPassword = async (
  req: Request<{}, {}, ResetPasswordInput>,
  res: Response
) => {
  try {
    const { email, otp, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendResponse({ res, statusCode: 404, message: "User not found" });
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      return sendResponse({ res, statusCode: 400, message: "OTP expired" });
    }

    const isMatch = user.otp && (await bcrypt.compare(otp, user.otp));
    if (!isMatch) {
      return sendResponse({ res, statusCode: 400, message: "Invalid OTP" });
    }

    // Hash NEW Password
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpires: null,
      },
    });

    // Revoke all refresh tokens on password change forcing user to login on all devices with new password
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    return sendResponse({
      res,
      statusCode: 200,
      message: "Password reset successfully. You can now login.",
    });
  } catch (error) {
    console.error(error);
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
    });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    // Get refresh token from HTTP-only cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "Refresh token is required",
      });
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

    const hashedRefreshToken = hashToken(refreshToken);

    // Token rotation: Delete OLD refresh token
    const storedToken = await prisma.refreshToken
      .delete({
        where: { token: hashedRefreshToken },
      })
      .catch(() => null);

    if (!storedToken) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "Refresh token reused or invalid",
      });
    }

    // Generate NEW tokens
    const newAccessToken = generateAccessToken({
      id: decoded.id,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      role: decoded.role,
    });

    const newRefreshToken = generateRefreshToken({
      id: decoded.id,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      role: decoded.role,
    });

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 3);

    await prisma.refreshToken.create({
      data: {
        token: hashToken(newRefreshToken),
        userId: decoded.id,
        expiresAt: refreshTokenExpiry,
      },
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV,
      sameSite: "strict",
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 Days
      path: "/",
    });

    return sendResponse({
      res,
      statusCode: 200,
      message: "Access token refreshed",
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    console.error(error);
    return sendResponse({
      res,
      statusCode: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const token = req.token;
    const userId = req.user?.id;
    const { refreshToken } = req.cookies.refreshToken;

    if (!token) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "No token provided",
      });
    }

    if (!userId) {
      return sendResponse({ res, statusCode: 400, message: "Unauthorized" });
    }

    // Get the expiry from decoded payload
    const exp = req.user?.exp || Math.floor(Date.now() / 1000) + 60 * 60; // Expires in 1 hour

    if (!exp) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "Invalid token: missing expiration",
      });
    }

    const expiresAt = exp * 1000; // Convert to milliseconds

    // Add access token to database blacklist
    await addToBlacklist(token!, expiresAt, userId);

    // Remove refresh token from database if provided
    if (refreshToken) {
      const hashedRefreshToken = hashToken(refreshToken);
      await prisma.refreshToken.deleteMany({
        where: {
          token: hashedRefreshToken,
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

    return sendResponse({
      res,
      statusCode: 200,
      message: "Logout successful. Token has been invalidated",
    });
  } catch (error) {
    console.log(error);

    return sendResponse({
      res,
      statusCode: 500,
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
      return sendResponse({ res, statusCode: 401, message: "Unauthorized" });
    }

    if (token && userId && exp) {
      // Blacklist current access token
      await addToBlacklist(token, exp * 1000, userId);

      // Remove all refresh tokens for this user
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      // secure: process.env.NODE_ENV,
      sameSite: "strict",
      path: "/",
    });

    return sendResponse({
      res,
      statusCode: 200,
      message: "Logged out from all devices successfully.",
    });
  } catch (error) {
    console.error(error);

    return sendResponse({
      res,
      statusCode: 500,
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
      return sendResponse({
        res,
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      message: "User is logged in. Profile details retrieved.",
      data: user,
    });
  } catch (error) {
    console.log(error);

    return sendResponse({
      res,
      statusCode: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};
