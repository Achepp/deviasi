import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const data = [
    {
      "No Batch": "BCH-2026-001",
      "Nama Produk": "Susu Bubuk Vanilla 500g",
    },
    {
      "No Batch": "BCH-2026-002",
      "Nama Produk": "Kopi Instan Premium 200g",
    },
    {
      "No Batch": "BCH-2026-003",
      "Nama Produk": "Gula Pasir Kristal Putih 1kg",
    },
    {
      "No Batch": "BCH-2026-004",
      "Nama Produk": "Tepung Terigu Serbaguna 1kg",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 20 }, // No Batch
    { wch: 40 }, // Nama Produk
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Master_Produk");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Template_Master_Produk.xlsx"',
    },
  });
}
