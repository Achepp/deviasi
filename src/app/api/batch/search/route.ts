import { NextRequest, NextResponse } from "next/server";
import { findMasterProdukByBatch } from "@/lib/sheets";
import { getCurrentSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Akses ditolak. Silakan login." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const batchQuery = searchParams.get("batch");

  if (!batchQuery || !batchQuery.trim()) {
    return NextResponse.json(
      { success: false, message: "Parameter batch wajib disertakan." },
      { status: 400 }
    );
  }

  const product = await findMasterProdukByBatch(batchQuery.trim());

  if (!product) {
    return NextResponse.json(
      {
        success: false,
        message: "Batch tidak ditemukan pada master data.",
      },
      { status: 404 }
    );
  }

  if (product.status === "Nonaktif") {
    return NextResponse.json(
      {
        success: false,
        message: `Batch '${product.batch}' berstatus Nonaktif (${product.keterangan || "Tidak dapat digunakan"}).`,
        product,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      batch: product.batch,
      nama_produk: product.nama_produk,
      status: product.status,
      keterangan: product.keterangan,
    },
  });
}
