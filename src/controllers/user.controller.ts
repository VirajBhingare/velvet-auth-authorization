import { AuthRequest } from "../types";
import { Response } from "express";
import prisma from "../config/database";
import { sendResponse } from "../utils/response";

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!allUsers) {
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
