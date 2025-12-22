import "dotenv/config";
import { removeExpiredTokens } from "../utils/tokenBlacklist";
import prisma from "../config/database";

const cleanUpTokens = async () => {
  try {
    console.log("Starting token removal...");
    const count = await removeExpiredTokens();
    console.log(`Token cleanup complete. Removed ${count} expired tokens`);
    process.exit(0);
  } catch (error) {
    console.error("Token cleanup failed", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

cleanUpTokens();
