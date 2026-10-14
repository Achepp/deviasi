import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { fetchMasterProdukList, saveMasterProduk } from "@/lib/sheets";
import { MasterProduk } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  const products = await fetchMasterProdukList(forceRefresh);
  return NextResponse.json({ success: true, data: products });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.role !== "Admin") {
    return NextResponse.json(
      { success: false, message: "Hanya Administrator yang berwenang mengubah Master Produk." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    // Check if bulk insert/update
    if (Array.isArray(body.items)) {
      const { saveMasterProdukBulk } = await import("@/lib/sheets");
      const validItems: MasterProduk[] = [];

      for (const raw of body.items) {
        const batch = String(raw.batch || raw.no_batch || raw.kode_batch || "").trim().toUpperCase();
        const nama_produk = String(raw.nama_produk || raw.nama || "").trim();
        if (batch && nama_produk) {
          validItems.push({
            batch,
            nama_produk,
            status: "Aktif",
            keterangan: String(raw.keterangan || "").trim(),
          });
        }
      }

      if (validItems.length === 0) {
        return NextResponse.json(
          { success: false, message: "Tidak ada baris data No Batch dan Nama Produk yang valid untuk diimpor." },
          { status: 400 }
        );
      }

      const result = await saveMasterProdukBulk(validItems);
      return NextResponse.json({
        success: true,
        message: `Berhasil mengimpor ${result.total} produk (${result.added} baru, ${result.updated} diperbarui).`,
        data: result,
      });
    }

    // Single item save
    const { batch, nama_produk, status, keterangan } = body;

    if (!batch || !nama_produk) {
      return NextResponse.json(
        { success: false, message: "No Batch dan Nama Produk wajib diisi." },
        { status: 400 }
      );
    }

    const item: MasterProduk = {
      batch: String(batch).trim().toUpperCase(),
      nama_produk: String(nama_produk).trim(),
      status: status === "Nonaktif" ? "Nonaktif" : "Aktif",
      keterangan: String(keterangan || "").trim(),
    };

    await saveMasterProduk(item);

    return NextResponse.json({
      success: true,
      message: `Master produk '${item.batch}' berhasil disimpan.`,
      data: item,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, message: `Gagal menyimpan master produk: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.role !== "Admin") {
    return NextResponse.json(
      { success: false, message: "Hanya Administrator yang berwenang menghapus Master Produk." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    let batch = searchParams.get("batch");

    if (!batch) {
      const body = await req.json().catch(() => ({}));
      batch = body.batch;
    }

    if (!batch) {
      return NextResponse.json(
        { success: false, message: "Parameter No Batch wajib disertakan." },
        { status: 400 }
      );
    }

    const { deleteMasterProduk } = await import("@/lib/sheets");
    const deleted = await deleteMasterProduk(batch);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: `Batch '${batch}' tidak ditemukan.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Master produk '${batch}' berhasil dihapus.`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, message: `Gagal menghapus master produk: ${err.message}` },
      { status: 500 }
    );
  }
}

