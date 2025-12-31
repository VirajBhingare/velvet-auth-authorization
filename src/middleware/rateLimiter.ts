import rateLimit from "express-rate-limit";
import { sendResponse } from "../utils/response";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  limit: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendResponse({
      res,
      statusCode: 429,
      message: "Too many login attempts, please try again after 15 minutes",
    });
  },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 100, // Limit each IP to 100 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendResponse({
      res,
      statusCode: 429,
      message: "Too many requests from this IP, please try again after an hour",
    });
  },
});
