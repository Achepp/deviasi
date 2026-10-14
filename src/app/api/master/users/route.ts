import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hashPassword } from "@/lib/auth";
import { fetchUsersList, saveUser } from "@/lib/sheets";
import { User } from "@/types";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "Admin") {
    return NextResponse.json(
      { success: false, message: "Hanya Administrator yang berwenang melihat daftar pengguna." },
      { status: 403 }
    );
  }

  const users = await fetchUsersList();
  // Strip password hash from response
  const sanitized = users.map((u) => ({
    user_id: u.user_id,
    nama: u.nama,
    email: u.email,
    role: u.role,
    status: u.status,
  }));

  return NextResponse.json({ success: true, data: sanitized });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.role !== "Admin") {
    return NextResponse.json(
      { success: false, message: "Hanya Administrator yang berwenang mengelola pengguna." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { user_id, nama, email, role, status, password } = body;

    if (!user_id || !nama || !email) {
      return NextResponse.json(
        { success: false, message: "User ID, Nama, dan Email wajib diisi." },
        { status: 400 }
      );
    }

    const allUsers = await fetchUsersList();
    const existing = allUsers.find(
      (u) =>
        u.user_id.toLowerCase() === String(user_id).trim().toLowerCase() ||
        u.email.toLowerCase() === String(email).trim().toLowerCase()
    );

    let password_hash = existing?.password_hash || "";
    if (password && String(password).trim().length > 0) {
      password_hash = hashPassword(String(password).trim());
    } else if (!password_hash) {
      // Default initial password if newly created without password
      password_hash = hashPassword("password123");
    }

    const userToSave: User = {
      user_id: String(user_id).trim().toUpperCase(),
      nama: String(nama).trim(),
      email: String(email).trim().toLowerCase(),
      role: role === "Admin" ? "Admin" : "Operator",
      status: status === "Nonaktif" ? "Nonaktif" : "Aktif",
      password_hash,
    };

    await saveUser(userToSave);

    return NextResponse.json({
      success: true,
      message: `Pengguna '${userToSave.nama}' berhasil disimpan.`,
      data: {
        user_id: userToSave.user_id,
        nama: userToSave.nama,
        email: userToSave.email,
        role: userToSave.role,
        status: userToSave.status,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, message: `Gagal menyimpan pengguna: ${err.message}` },
      { status: 500 }
    );
  }
}
