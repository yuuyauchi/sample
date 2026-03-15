import { prisma } from "./prisma";

/**
 * Get the current user from the database.
 * Uses the first user, or creates a default one if none exists.
 */
export async function getCurrentUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "me@example.com",
        name: "自分",
      },
    });
  }
  return user;
}
