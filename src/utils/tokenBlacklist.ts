import prisma from "../config/database";

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
    console.error("Error adding token to blacklist: ", error);
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
    console.error("Error checking token blacklist: ", error);
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
    console.log(`Cleaned up ${result.count} expired tokens`);
    return result.count;
  } catch (error) {
    console.error("Error removing expired tokens:", error);
    return 0;
  }
};

// Cleanup every hour
setInterval(async () => {
  await removeExpiredTokens();
}, 60 * 60 * 1000);
