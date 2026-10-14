import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getStorageStatus, initializeGoogleSheetsStructure } from "@/lib/sheets";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 401 });
  }

  const status = await getStorageStatus();
  return NextResponse.json({ success: true, status });
}

export async function POST() {
  const session = await getCurrentSession();
  if (!session || session.role !== "Admin") {
    return NextResponse.json({ success: false, message: "Hanya Admin yang dapat menginisialisasi spreadsheet." }, { status: 403 });
  }

  const result = await initializeGoogleSheetsStructure();
  return NextResponse.json(result);
}
