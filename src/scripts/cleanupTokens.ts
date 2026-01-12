import "dotenv/config";
import { removeExpiredTokens } from "../utils/tokenBlacklist";
import prisma from "../config/database";
import logger from "../utils/logger";

const cleanUpTokens = async () => {
  try {
    logger.info("Starting token removal...");
    const count = await removeExpiredTokens();
    logger.info(`Token cleanup complete. Removed ${count} expired tokens`);
    process.exit(0);
  } catch (error) {
    logger.error("Token cleanup failed", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

cleanUpTokens();
