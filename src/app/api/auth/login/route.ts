import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, fetchUsersList } from "@/lib/sheets";
import { verifyPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "Email/User ID dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim();
    // Search user by email or user_id
    const allUsers = await fetchUsersList();
    const user = allUsers.find(
      (u) =>
        u.email.toLowerCase() === trimmed.toLowerCase() ||
        u.user_id.toLowerCase() === trimmed.toLowerCase()
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak ditemukan." },
        { status: 401 }
      );
    }

    if (user.status !== "Aktif") {
      return NextResponse.json(
        { success: false, message: "Akun Anda berstatus Nonaktif. Hubungi Administrator." },
        { status: 403 }
      );
    }

    const isMatch = user.password_hash
      ? verifyPassword(password, user.password_hash)
      : false;

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Kata sandi salah. Silakan coba lagi." },
        { status: 401 }
      );
    }

    // Create session token
    const token = await createSessionToken({
      userId: user.user_id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil.",
      user: {
        userId: user.user_id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, message: `Terjadi kesalahan server: ${err.message}` },
      { status: 500 }
    );
  }
}
