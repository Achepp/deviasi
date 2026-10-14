import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { AuthSession, User } from "@/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "packaging-weighing-secret-key-32-bytes-long!"
);

export const COOKIE_NAME = "pwa_weighing_session";

export async function createSessionToken(payload: AuthSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      nama: payload.nama as string,
      email: payload.email as string,
      role: payload.role as AuthSession["role"],
    };
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

// Default seeded users for instant testing/setup
export const DEFAULT_USERS: User[] = [
  {
    user_id: "USR-001",
    nama: "Administrator Produksi",
    email: "admin@packaging.local",
    role: "Admin",
    status: "Aktif",
    password_hash: hashPassword("admin123"),
  },
  {
    user_id: "USR-002",
    nama: "Budi Santoso",
    email: "budi@packaging.local",
    role: "Operator",
    status: "Aktif",
    password_hash: hashPassword("operator123"),
  },
  {
    user_id: "USR-003",
    nama: "Siti Rahma",
    email: "siti@packaging.local",
    role: "Operator",
    status: "Aktif",
    password_hash: hashPassword("operator123"),
  },
];
