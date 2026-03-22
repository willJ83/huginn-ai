import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Reset token is invalid or expired" },
        { status: 400 }
      );
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { token },
      });

      return NextResponse.json(
        { error: "Reset token is invalid or expired" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      await prisma.passwordResetToken.delete({
        where: { token },
      });

      return NextResponse.json(
        { error: "User no longer exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: resetToken.email },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return NextResponse.json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
