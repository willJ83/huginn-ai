"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export type ChangePasswordResult =
  | { success: true }
  | { success: false; error: string };

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> {
  // 1. Require an authenticated session.
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in to change your password." };
  }

  // 2. Validate inputs.
  if (!currentPassword || !newPassword) {
    return { success: false, error: "Both current and new passwords are required." };
  }
  if (newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters." };
  }
  if (currentPassword === newPassword) {
    return { success: false, error: "New password must be different from your current password." };
  }

  // 3. Fetch the user's current hashed password from DB.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, password: true },
  });
  if (!user) {
    return { success: false, error: "Account not found." };
  }

  // 4. Verify the supplied current password is correct.
  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return { success: false, error: "Your current password is incorrect." };
  }

  // 5. Hash the new password with a strong work factor.
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // 6. Atomically update password + increment sessionVersion.
  //    Incrementing sessionVersion invalidates every JWT that was issued before
  //    this moment. The client then calls update() to re-stamp the current
  //    device's token with the new version, keeping it logged in while all
  //    other devices are kicked out on their next request.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      sessionVersion: { increment: 1 },
    },
  });

  return { success: true };
}
