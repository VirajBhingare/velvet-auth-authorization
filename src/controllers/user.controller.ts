import { AuthRequest } from "../types";
import { Response } from "express";
import { sendResponse } from "../utils/response";
import * as UserService from "../services/user.service";

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const allUsers = await UserService.getAllUsers();

    if (!allUsers || allUsers.length === 0) {
      return sendResponse({ res, statusCode: 404, message: "No users found" });
    }

    return sendResponse({
      res,
      statusCode: 200,
      message: "All users retrieved successfully",
      data: { users: allUsers, count: allUsers.length },
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
