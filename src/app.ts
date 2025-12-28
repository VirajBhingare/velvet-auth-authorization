// PACKAGE IMPORTS
import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from "express";
import cors from "cors";
import prisma from "./config/database";
import cookieParser from "cookie-parser";

// ROUTE IMPORTS
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";

// CONFIG
const app = express();
app.use(
  cors({
    origin: ["http://localhost:8000", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ENV VARS
const PORT = process.env.PORT || 8001;
const HOST = process.env.HOST;

// ROUTES
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// APP LISTEN
let server: ReturnType<typeof app.listen>;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully.");

    server = app.listen(PORT, () => {
      console.log(`Server is running on ${HOST}:${PORT}`);
      console.log(`Health check: ${HOST}:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start the server", error);
    process.exit(1);
  }
};

startServer();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});
