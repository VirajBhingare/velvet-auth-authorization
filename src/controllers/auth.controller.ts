import { Request, Response } from "express";
import { AuthRequest } from "../types";
import { sendResponse } from "../utils/response";
import * as AuthService from "../services/auth.service";
import {
  RegisterInput,
  VerifyOtpInput,
  LoginInput,
  ResendOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../validation/auth.validation";

const handleError = (
  res: Response,
  error: unknown,
  defaultMessage = "Internal server error"
) => {
  const message = error instanceof Error ? error.message : defaultMessage;
  const statusCode = message === "Internal server error" ? 500 : 400;

  if (message === "User already exists")
    return sendResponse({ res, statusCode: 409, message });
  if (message === "Invalid credentials")
    return sendResponse({ res, statusCode: 401, message });

  return sendResponse({ res, statusCode, message });
};

// 1. Register
export const registerUser = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response
) => {
  try {
    const user = await AuthService.register(req.body);
    return sendResponse({
      res,
      statusCode: 201,
      message: "User registered successfully. Please check your email for OTP.",
      data: user,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// 2. Login
export const loginUser = async (
  req: Request<{}, {}, LoginInput>,
  res: Response
) => {
  try {
    await AuthService.login(req.body);
    return sendResponse({
      res,
      statusCode: 200,
      message: "OTP sent to your email. Please verify to complete login.",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// 3. Verify OTP
export const verifyOtp = async (
  req: Request<{}, {}, VerifyOtpInput>,
  res: Response
) => {
  try {
    const { user, accessToken, refreshToken } = await AuthService.verifyOtp(
      req.body
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 Days
      path: "/",
    });

    return sendResponse({
      res,
      statusCode: 200,
      message: "Verification successful. You are now logged in.",
      data: { user, accessToken },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// 4. Resend OTP
export const resendOtp = async (
  req: Request<{}, {}, ResendOtpInput>,
  res: Response
) => {
  try {
    await AuthService.resendOtp(req.body);
    return sendResponse({
      res,
      statusCode: 200,
      message: "OTP sent to your email.",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const forgotPassword = async (
  req: Request<{}, {}, ForgotPasswordInput>,
  res: Response
) => {
  try {
    await AuthService.forgotPassword(req.body);
    return sendResponse({
      res,
      statusCode: 200,
      message: "If an account exists, an OTP has been sent.",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const resetPassword = async (
  req: Request<{}, {}, ResetPasswordInput>,
  res: Response
) => {
  try {
    await AuthService.resetPassword(req.body);
    return sendResponse({
      res,
      statusCode: 200,
      message: "Password reset successfully. You can now login.",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token)
      return sendResponse({
        res,
        statusCode: 400,
        message: "Refresh token required",
      });

    const { newAccessToken, newRefreshToken } = await AuthService.refreshToken(
      token
    );

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 3 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return sendResponse({
      res,
      statusCode: 200,
      message: "Access token refreshed",
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 401,
      message: error instanceof Error ? error.message : "Unauthorized",
    });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const token = req.token;
    const userId = req.user?.id;
    const exp = req.user?.exp;
    const { refreshToken } = req.cookies;

    if (!token || !userId || !exp) {
      return sendResponse({ res, statusCode: 400, message: "Invalid session" });
    }

    await AuthService.logout(token, userId, exp, refreshToken);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });

    return sendResponse({ res, statusCode: 200, message: "Logout successful" });
  } catch (error) {
    return handleError(res, error);
  }
};

export const logoutAll = async (req: AuthRequest, res: Response) => {
  try {
    const token = req.token;
    const userId = req.user?.id;
    const exp = req.user?.exp;

    if (!token || !userId || !exp) {
      return sendResponse({ res, statusCode: 400, message: "Invalid session" });
    }

    await AuthService.logoutAll(token, userId, exp);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });

    return sendResponse({
      res,
      statusCode: 200,
      message: "Logged out from all devices",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await AuthService.getProfile(userId);
    return sendResponse({
      res,
      statusCode: 200,
      message: "Profile details retrieved.",
      data: user,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
