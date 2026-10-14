import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import {
  fetchHasilTimbanganList,
  appendHasilTimbangan,
  findMasterProdukByBatch,
  deleteHasilTimbangan,
  clearAllDummyHasilTimbangan,
} from "@/lib/sheets";
import {
  generateSessionId,
  getJakartaTimestamp,
  calculateWeighingStats,
} from "@/lib/utils";
import { HasilTimbangan } from "@/types";

// Memory cache for active submission keys to prevent rapid double-clicks (BR-07)
const recentSubmissions = new Map<string, number>();

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Akses ditolak. Silakan login." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const batchFilter = searchParams.get("batch")?.toLowerCase();
    const productFilter = searchParams.get("product")?.toLowerCase();
    const operatorFilter = searchParams.get("operator")?.toLowerCase();
    const machineFilter = searchParams.get("machine")?.toLowerCase();
    const scaleFilter = searchParams.get("scale")?.toLowerCase();
    const methodFilter = searchParams.get("method")?.toLowerCase();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const outOfSpecFilter = searchParams.get("outOfSpec");

    let list = await fetchHasilTimbanganList();

    if (batchFilter) {
      list = list.filter((item) => item.batch.toLowerCase().includes(batchFilter));
    }
    if (productFilter) {
      list = list.filter((item) => item.nama_produk.toLowerCase().includes(productFilter));
    }
    if (operatorFilter) {
      list = list.filter((item) => item.operator.toLowerCase().includes(operatorFilter));
    }
    if (machineFilter) {
      list = list.filter((item) => item.no_mesin.toLowerCase().includes(machineFilter));
    }
    if (scaleFilter) {
      list = list.filter((item) => item.no_timbangan.toLowerCase().includes(scaleFilter));
    }
    if (methodFilter) {
      list = list.filter((item) => item.metode_kemas.toLowerCase().includes(methodFilter));
    }
    if (dateFrom) {
      list = list.filter((item) => item.jam.slice(0, 10) >= dateFrom);
    }
    if (dateTo) {
      list = list.filter((item) => item.jam.slice(0, 10) <= dateTo);
    }
    if (outOfSpecFilter === "true") {
      list = list.filter((item) => {
        const stats = calculateWeighingStats(item);
        return stats.outRangeCount > 0;
      });
    }

    return NextResponse.json({
      success: true,
      data: list,
      total: list.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, message: `Gagal memuat data: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Akses ditolak. Sesi tidak ditemukan. Silakan login kembali." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const {
      batch,
      no_mesin,
      no_timbangan,
      metode_kemas,
      lower,
      upper,
      weights, // array of 15 items: number | null | undefined | ""
      clientRequestId, // optional idempotency key
    } = body;

    // BR-07: Idempotency check against double submit
    if (clientRequestId) {
      const now = Date.now();
      const lastTime = recentSubmissions.get(clientRequestId);
      if (lastTime && now - lastTime < 5000) {
        return NextResponse.json(
          {
            success: false,
            message: "Permintaan sedang diproses. Mohon jangan menekan tombol Simpan berulang kali.",
          },
          { status: 429 }
        );
      }
      recentSubmissions.set(clientRequestId, now);
      // Clean up old keys
      if (recentSubmissions.size > 200) {
        for (const [k, v] of recentSubmissions.entries()) {
          if (now - v > 10000) recentSubmissions.delete(k);
        }
      }
    }

    // BR-06: Required field validations
    if (!batch || !String(batch).trim()) {
      return NextResponse.json(
        { success: false, message: "Kode Batch wajib diisi." },
        { status: 400 }
      );
    }

    // BR-03: Validate Batch against Master Data
    const masterProduct = await findMasterProdukByBatch(String(batch).trim());
    if (!masterProduct) {
      return NextResponse.json(
        { success: false, message: "Batch tidak ditemukan pada master data Google Sheets." },
        { status: 400 }
      );
    }
    if (masterProduct.status !== "Aktif") {
      return NextResponse.json(
        {
          success: false,
          message: `Batch '${masterProduct.batch}' berstatus Nonaktif dan tidak dapat digunakan.`,
        },
        { status: 400 }
      );
    }

    if (!no_mesin || !String(no_mesin).trim()) {
      return NextResponse.json({ success: false, message: "Nomor Mesin wajib diisi." }, { status: 400 });
    }
    if (!no_timbangan || !String(no_timbangan).trim()) {
      return NextResponse.json({ success: false, message: "Nomor Timbangan wajib diisi." }, { status: 400 });
    }
    if (!metode_kemas || !String(metode_kemas).trim()) {
      return NextResponse.json({ success: false, message: "Metode Kemas wajib diisi." }, { status: 400 });
    }

    // BR-05: Lower and Upper validations
    const lowerNum = Number(lower);
    const upperNum = Number(upper);
    if (isNaN(lowerNum) || isNaN(upperNum)) {
      return NextResponse.json(
        { success: false, message: "Batas Lower dan Upper harus berupa angka yang valid." },
        { status: 400 }
      );
    }
    if (lowerNum > upperNum) {
      return NextResponse.json(
        { success: false, message: "Nilai batas Lower tidak boleh lebih besar dari Upper." },
        { status: 400 }
      );
    }

    // BR-02: Validate weighing entries (1 to 15, at least one required)
    if (!Array.isArray(weights) || weights.length === 0) {
      return NextResponse.json(
        { success: false, message: "Minimal satu nilai penimbangan harus diisi." },
        { status: 400 }
      );
    }

    const cleanedWeights: (number | null)[] = [];
    let validCount = 0;

    for (let i = 0; i < 15; i++) {
      const val = weights[i];
      if (val !== undefined && val !== null && val !== "" && !isNaN(Number(val))) {
        cleanedWeights.push(Number(val));
        validCount++;
      } else {
        cleanedWeights.push(null);
      }
    }

    if (validCount === 0) {
      return NextResponse.json(
        { success: false, message: "Minimal satu hasil penimbangan (Timbang 1–15) harus diisi dengan angka valid." },
        { status: 400 }
      );
    }

    // Generate unique session ID (BR-01, BR-07)
    const sessionId = generateSessionId();
    // Auto timestamp in Asia/Jakarta timezone (BR-04)
    const jamTimestamp = getJakartaTimestamp();

    // Construct record
    const newRecord: HasilTimbangan = {
      id: sessionId,
      operator_id: session.userId,
      operator: session.nama,
      nama_produk: masterProduct.nama_produk,
      batch: masterProduct.batch,
      no_mesin: String(no_mesin).trim(),
      no_timbangan: String(no_timbangan).trim(),
      metode_kemas: String(metode_kemas).trim(),
      lower: lowerNum,
      upper: upperNum,
      jam: jamTimestamp,
      timbang_1: cleanedWeights[0],
      timbang_2: cleanedWeights[1],
      timbang_3: cleanedWeights[2],
      timbang_4: cleanedWeights[3],
      timbang_5: cleanedWeights[4],
      timbang_6: cleanedWeights[5],
      timbang_7: cleanedWeights[6],
      timbang_8: cleanedWeights[7],
      timbang_9: cleanedWeights[8],
      timbang_10: cleanedWeights[9],
      timbang_11: cleanedWeights[10],
      timbang_12: cleanedWeights[11],
      timbang_13: cleanedWeights[12],
      timbang_14: cleanedWeights[13],
      timbang_15: cleanedWeights[14],
    };

    // Save to Google Sheets / Storage
    await appendHasilTimbangan(newRecord);

    const stats = calculateWeighingStats(newRecord);

    return NextResponse.json({
      success: true,
      message: "Data hasil penimbangan berhasil disimpan.",
      data: newRecord,
      stats,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        message: `Gagal menyimpan data penimbangan: ${err.message}`,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Akses ditolak. Silakan login." },
      { status: 401 }
    );
  }

  if (session.role !== "Admin") {
    return NextResponse.json(
      { success: false, message: "Hanya Admin yang berwenang menghapus data hasil penimbangan." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      const count = await clearAllDummyHasilTimbangan();
      return NextResponse.json({
        success: true,
        message: `Berhasil membersihkan ${count} data hasil penimbangan.`,
        deletedCount: count,
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID data penimbangan wajib disertakan." },
        { status: 400 }
      );
    }

    const deleted = await deleteHasilTimbangan(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: `Data dengan ID '${id}' tidak ditemukan.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Data penimbangan dengan ID '${id}' berhasil dihapus.`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, message: `Gagal menghapus data: ${err.message}` },
      { status: 500 }
    );
  }
}

