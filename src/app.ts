// PACKAGE IMPORTS
import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from "express";
import cors from "cors";
import prisma from "./config/database";
import cookieParser from "cookie-parser";
import morganMiddleware from "./middleware/httpLogger";
import logger from "./utils/logger";

// ROUTE IMPORTS
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import helmet from "helmet";
import { sendResponse } from "./utils/response";

// CONFIG
const app = express();
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:8000", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morganMiddleware);

// ENV VARS
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "0.0.0.0";

// ROUTES
app.get("/health", (req: Request, res: Response) => {
  sendResponse({
    res,
    statusCode: 200,
    message: "Server is running successfully.",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// APP LISTEN
let server: ReturnType<typeof app.listen>;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully.");

    server = app.listen(PORT, () => {
      logger.info(`Server is running on ${HOST}:${PORT}`);
      logger.info(`Health check: ${HOST}:${PORT}/health`);
    });
  } catch (error) {
    logger.error("Failed to start the server", error);
    process.exit(1);
  }
};

startServer();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});
