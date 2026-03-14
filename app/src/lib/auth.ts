import { prisma } from "./prisma";
import { createSupabaseServerClient } from "./supabase/server";

/**
 * Get the current authenticated user from Supabase, or fall back to
 * the first user in the database (MVP mode when Supabase is not configured).
 */
export async function getCurrentUser() {
  // Try Supabase auth first
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        // Find or create Prisma user linked to Supabase auth user
        let user = await prisma.user.findFirst({
          where: { email: authUser.email! },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: authUser.email!,
              name: authUser.user_metadata?.name || authUser.email!.split("@")[0],
            },
          });
        }

        return user;
      }
    } catch {
      // Fall through to MVP mode
    }
  }

  // MVP fallback: use first user or create one
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
