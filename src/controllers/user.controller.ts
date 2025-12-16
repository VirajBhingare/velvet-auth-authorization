import { AuthRequest } from "../types";
import { Response } from "express";
import prisma from "../config/database";

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
      return res.status(404).json("No users found");
    }

    res.status(200).json({ users: allUsers, count: allUsers.length });
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal server error");
  }
};
