import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { fetchHasilTimbanganList } from "@/lib/sheets";
import { convertSessionsToCSV, getJakartaTimestamp } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Akses ditolak. Silakan login." }, { status: 401 });
  }

  // Operator or Admin can export if authorized, Admin definitely can
  const { searchParams } = new URL(req.url);
  const batch = searchParams.get("batch")?.toLowerCase();
  const operator = searchParams.get("operator")?.toLowerCase();
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  let list = await fetchHasilTimbanganList();

  if (batch) {
    list = list.filter((item) => item.batch.toLowerCase().includes(batch));
  }
  if (operator) {
    list = list.filter((item) => item.operator.toLowerCase().includes(operator));
  }
  if (dateFrom) {
    list = list.filter((item) => item.jam.slice(0, 10) >= dateFrom);
  }
  if (dateTo) {
    list = list.filter((item) => item.jam.slice(0, 10) <= dateTo);
  }

  const csvContent = convertSessionsToCSV(list);
  const timestampStr = getJakartaTimestamp().replace(/[: ]/g, "-");
  const filename = `Laporan_Hasil_Timbangan_${timestampStr}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
