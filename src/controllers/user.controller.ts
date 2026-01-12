import { AuthRequest } from "../types";
import { Response } from "express";
import { sendResponse } from "../utils/response";
import * as UserService from "../services/user.service";
import logger from "../utils/logger";
import { CreateCourseInput } from "../validation/user.validation";

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
    logger.error(error);
    return sendResponse({
      res,
      statusCode: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const input: CreateCourseInput = req.body;
    const instructorId = req.user?.id;

    if (!instructorId) {
      return sendResponse({ res, statusCode: 401, message: "Unauthorized" });
    }

    const course = await UserService.createCourse(
      input.title,
      input.description || "",
      instructorId
    );

    return sendResponse({
      res,
      statusCode: 201,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    logger.error(error);
    return sendResponse({
      res,
      statusCode: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

// --- Get All Courses (All Roles allowed) ---
export const getAllCourses = async (req: AuthRequest, res: Response) => {
  try {
    const courses = await UserService.getAllCourses();

    return sendResponse({
      res,
      statusCode: 200,
      message: "All courses retrieved successfully",
      data: courses,
    });
  } catch (error) {
    logger.error(error);
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
    });
  }
};

// --- Get My Courses (Instructor Only) ---
export const getMyCourses = async (req: AuthRequest, res: Response) => {
  try {
    const instructorId = req.user?.id;
    if (!instructorId)
      return sendResponse({ res, statusCode: 401, message: "Unauthorized" });

    const courses = await UserService.getMyCourses(instructorId);

    return sendResponse({
      res,
      statusCode: 200,
      message: "Your courses retrieved successfully",
      data: courses,
    });
  } catch (error) {
    logger.error(error);
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
    });
  }
};
