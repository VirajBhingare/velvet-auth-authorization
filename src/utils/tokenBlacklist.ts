import prisma from "../config/database";
import logger from "./logger";

export const addToBlacklist = async (
  token: string,
  expiresAt: number,
  userId?: string
): Promise<void> => {
  try {
    await prisma.blacklistedToken.create({
      data: {
        token,
        expiresAt: new Date(expiresAt),
        userId: userId ?? null,
      },
    });
  } catch (error) {
    logger.error("Error adding token to blacklist: ", error);
    throw new Error("Failed to blacklist token");
  }
};

export const isBlacklistedToken = async (token: string): Promise<boolean> => {
  try {
    const blacklisted = await prisma.blacklistedToken.findUnique({
      where: { token },
    });

    return blacklisted !== null;
  } catch (error) {
    logger.error("Error checking token blacklist: ", error);
    return false;
  }
};

export const removeExpiredTokens = async (): Promise<number> => {
  try {
    const result = await prisma.blacklistedToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(), // Less than current time
        },
      },
    });
    logger.info(`Cleaned up ${result.count} expired tokens`);
    return result.count;
  } catch (error) {
    logger.error("Error removing expired tokens:", error);
    return 0;
  }
};

// Cleanup every hour
if (process.env.NODE_ENV === "production") {
  setInterval(async () => {
    await removeExpiredTokens();
  }, 60 * 60 * 1000);
}
