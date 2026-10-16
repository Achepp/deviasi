import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { User, MasterProduk, HasilTimbangan } from "@/types";
import { DEFAULT_USERS } from "./auth";

// Default Google Sheets targets (used automatically when env vars are not set in Vercel/Production)
export const DEFAULT_SHEET_ID = "1T0_QKtgkU3d8DHYdUamDGZb5c--TQ_Wpjre1bPcol0g";
export const DEFAULT_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwejby2jp3fF-xYoUJ9S7-rOIipk7Fz9dHD9jio-U97yUd5EZbh0pIAb3S1V8YtmXsN/exec";

export function getEffectiveSheetId(): string {
  return process.env.GOOGLE_SHEET_ID?.trim() || DEFAULT_SHEET_ID;
}

export function getEffectiveWebAppUrl(): string {
  return process.env.GOOGLE_SCRIPT_WEBAPP_URL?.trim() || DEFAULT_SCRIPT_WEBAPP_URL;
}

// Initial seed master products (69 real production products as offline/cold fallback)
export const DEFAULT_PRODUCTS: MasterProduk[] = [
  {
    "batch": "26059378",
    "nama_produk": "ULTRAN P-01 SHP BROWN P503-1L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26051255",
    "nama_produk": "PASTIGLOSS PMSS-512-0.9L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26063483",
    "nama_produk": "11-256 AF PU THINNER-200LK",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26063652",
    "nama_produk": "AKL-73201 EX UV PLUS NATURAL 15-20LP",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26038272",
    "nama_produk": "ASLC-543-2K SB-0.225K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26063586",
    "nama_produk": "ASLC-543-2K SB-0.9K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26063664",
    "nama_produk": "CEMENT POWDER PFC-235 EPOCEM-16KZ",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26059003",
    "nama_produk": "CERAKOTE CTP-980 WB-0.8K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26058446",
    "nama_produk": "DECOR DF-97 GL BASE A-20LP",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26063663",
    "nama_produk": "DSE-520 TERRACE GARDEN 162-1-25KP",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26062836",
    "nama_produk": "ECO TEXTURE-25KP",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26062838",
    "nama_produk": "ECO TEXTURE-4K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26063069",
    "nama_produk": "EPCH-50500 PS-4L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26062305",
    "nama_produk": "FIBERKOTE 888 WALNUT BROWN-2.5L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26061882",
    "nama_produk": "FIBERKOTE 889 BASE D-1L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26061880",
    "nama_produk": "FIBERKOTE 889 BASE D-2.5L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26049861",
    "nama_produk": "HARDENER MX-99-0.25L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26062317",
    "nama_produk": "IMPRA AWF-911 TEAK-1K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26063073",
    "nama_produk": "IMPRA BOND IBW-630-0.7K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26059780",
    "nama_produk": "IMPRA NC-141 CLEAR GLOSS-1L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26063802",
    "nama_produk": "L DZ 10157 (10%)",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26063381",
    "nama_produk": "L WG 12 SEC P",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26061431",
    "nama_produk": "MHRC-18102 SILVER ATM-5L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26057799",
    "nama_produk": "MHRC-18102 SILVER ATM-5L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26063295",
    "nama_produk": "ML-41310 CLEAR 15-20LP",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26063551",
    "nama_produk": "ML-41340 CLEAR 30-20LP",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26062353",
    "nama_produk": "MSS-41222 S-20LP",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26062617",
    "nama_produk": "MULTIPOX MX-99 BASE B-16LP",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26062823",
    "nama_produk": "MX-94-2K SB GREY-16KP",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26062824",
    "nama_produk": "MX-94-2K SB GREY-16KP",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26063562",
    "nama_produk": "MX-98-2K SB BASE D-0.75K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26063703",
    "nama_produk": "MX-98-2K SB LIGHT BLUE-0.75K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26044892",
    "nama_produk": "MX-98-2K SB LIGHT GREY-0.75K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26062211",
    "nama_produk": "NCL-11302 DN LC CLEAR 20-20LP",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26060194",
    "nama_produk": "NCSS-11207-200LB",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26063651",
    "nama_produk": "NCSS-11210-20LP",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26063545",
    "nama_produk": "PASTIGLOSS PMSS-512-0.9L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26074071",
    "nama_produk": "HARDENER MX-99-0.25L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26081240",
    "nama_produk": "BETON ADMIXTURE PBAX-100-1K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26080685",
    "nama_produk": "ULTRAN P-05 BALI YELLOW Y14-1L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26076130",
    "nama_produk": "THINNER EPOXY-0.25L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26081084",
    "nama_produk": "IMPRA BOND IBW-630-0.7K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26081469",
    "nama_produk": "FIBERKOTE 888 BASE Y-2.5L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26077764",
    "nama_produk": "DECOFLAKE GRANITE GREY-9491-1K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26079578",
    "nama_produk": "PFT-215 M-2K SF LEAF GREEN 8416-17.5KP",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26080689",
    "nama_produk": "ULTRAN P-05 DARK MAHONY Y505-1L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26071806",
    "nama_produk": "MX-99-2K MP SB CLEAR GLOSS-0.5L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26079909",
    "nama_produk": "MULTIPOX MX-99 BASE A-2L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26073324",
    "nama_produk": "STONKOTE SFC-633 CLEAR GLOSS-0.5L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26072671",
    "nama_produk": "HARDENER ASLC-543-0.1K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26081819",
    "nama_produk": "ULTRAPROOF 960 TRANSPARANT-1K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26081817",
    "nama_produk": "ULTRAPROOF 960 TRANSPARANT-1K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26081818",
    "nama_produk": "ULTRAPROOF 960 TRANSPARANT-4K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26080186",
    "nama_produk": "PASTIGLOSS HARDENER PMH-50-2L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26080186",
    "nama_produk": "PASTIGLOSS HARDENER PMH-50-2L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26080186",
    "nama_produk": "PASTIGLOSS HARDENER PMH-50-2L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26081416",
    "nama_produk": "PC 8Y3 SF-15LP",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26071713",
    "nama_produk": "PC 8Y3-1L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26080685",
    "nama_produk": "ULTRAN P-05 BALI YELLOW Y14-1L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26079875",
    "nama_produk": "PFT-253-2K SB LEAF GREEN 8416-16KP",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26080601",
    "nama_produk": "IMPRA NC-141 SEMI GLOSS-1L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26080228",
    "nama_produk": "FILLER PFT-615-22.1KZ",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26073324",
    "nama_produk": "STONKOTE SFC-633 CLEAR GLOSS-0.5L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26080073",
    "nama_produk": "AEROSOL PRIMTOP DTM BLACK DOF-0.6L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26078570",
    "nama_produk": "TENNOKOTE SILICA SAND-2.5K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26080067",
    "nama_produk": "PFT-253-2K SB LEAF GREEN 8416-4K",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26081336",
    "nama_produk": "THPU-71362 M-20LJ",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26082105",
    "nama_produk": "HARDENER UPL-77 E-1L",
    "status": "Aktif",
    "keterangan": ""
  },
  {
    "batch": "26078570",
    "nama_produk": "TENNOKOTE SILICA SAND-2.5K",
    "status": "Aktif",
    "keterangan": ""
  }
];

// Initial weighing records
export const DEFAULT_SESSIONS: HasilTimbangan[] = [
  {
    "id": "WT-20261014-KXRV5449",
    "operator_id": "USR-002",
    "operator": "Budi Santoso",
    "nama_produk": "IMPRA WF-115 JATI-1K",
    "batch": "26035807",
    "no_mesin": "MS 01",
    "no_timbangan": "TB 01",
    "metode_kemas": "Botol PET",
    "lower": 495,
    "upper": 498,
    "jam": "2026-10-14 13:30:35",
    "timbang_1": 490,
    "timbang_2": 494,
    "timbang_3": 500,
    "timbang_4": 486,
    "timbang_5": null,
    "timbang_6": null,
    "timbang_7": null,
    "timbang_8": null,
    "timbang_9": null,
    "timbang_10": null,
    "timbang_11": null,
    "timbang_12": null,
    "timbang_13": null,
    "timbang_14": null,
    "timbang_15": null
  },
  {
    "id": "WT-20261014-I3BT7144",
    "operator_id": "USR-002",
    "operator": "Budi Santoso",
    "nama_produk": "IMPRA WF-115 JATI-1K",
    "batch": "26045516",
    "no_mesin": "MSN-01",
    "no_timbangan": "TB-01",
    "metode_kemas": "Box Karton",
    "lower": 495,
    "upper": 505,
    "jam": "2026-10-14 06:02:47",
    "timbang_1": 485,
    "timbang_2": 500,
    "timbang_3": 501,
    "timbang_4": 470,
    "timbang_5": 450,
    "timbang_6": null,
    "timbang_7": null,
    "timbang_8": null,
    "timbang_9": null,
    "timbang_10": null,
    "timbang_11": null,
    "timbang_12": null,
    "timbang_13": null,
    "timbang_14": null,
    "timbang_15": null
  }
];

interface LocalDatabase {
  users: User[];
  masterProduk: MasterProduk[];
  hasilTimbangan: HasilTimbangan[];
  deletedIds?: string[];
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NEXT_RUNTIME === "edge");
const LOCAL_DB_PATH = isServerless
  ? path.join("/tmp", "weighing_database.json")
  : path.join(process.cwd(), ".data", "database.json");

function getLocalDb(): LocalDatabase {
  try {
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {}
    }
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      const initial: LocalDatabase = {
        users: DEFAULT_USERS,
        masterProduk: DEFAULT_PRODUCTS,
        hasilTimbangan: DEFAULT_SESSIONS,
        deletedIds: [],
      };
      try {
        fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2), "utf8");
      } catch {}
      return initial;
    }
    const raw = fs.readFileSync(LOCAL_DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.deletedIds) parsed.deletedIds = [];
    if (!parsed.masterProduk || parsed.masterProduk.length === 0) parsed.masterProduk = DEFAULT_PRODUCTS;
    return parsed;
  } catch (err) {
    console.error("Error reading local db:", err);
    return {
      users: DEFAULT_USERS,
      masterProduk: DEFAULT_PRODUCTS,
      hasilTimbangan: DEFAULT_SESSIONS,
      deletedIds: [],
    };
  }
}

function saveLocalDb(data: LocalDatabase) {
  try {
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {}
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("Warning saving local db (may be read-only in serverless):");
  }
}

export function isGoogleSheetsConfigured(): boolean {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = getEffectiveSheetId();
  return Boolean(email && key && sheetId);
}

function getGoogleSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

export async function getStorageStatus() {
  const configured = isGoogleSheetsConfigured();
  const sheetId = getEffectiveSheetId();
  const webAppUrl = getEffectiveWebAppUrl();

  if (configured) {
    try {
      const sheets = getGoogleSheetsClient();
      const res = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      return {
        type: "google_sheets" as const,
        configured: true,
        spreadsheetTitle: res.data.properties?.title || "Google Sheets Connected",
        sheetId: sheetId,
        message: "Terhubung langsung ke Google Sheets API (Service Account)",
      };
    } catch (error: unknown) {
      const err = error as Error;
      return {
        type: "google_sheets_error" as const,
        configured: true,
        message: `Gagal mengakses Google Sheets API: ${err.message}`,
        sheetId: sheetId,
      };
    }
  }

  // If Service Account is not set, Direct Sync via CSV Export and Apps Script is active
  if (sheetId) {
    return {
      type: "google_sheets_direct" as const,
      configured: true,
      spreadsheetTitle: "Packaging Weighing Sheet (Direct Sync)",
      sheetId: sheetId,
      webAppConfigured: Boolean(webAppUrl),
      message: "Terhubung via Direct Google Sheets & Google Apps Script Sync",
    };
  }

  return {
    type: "local" as const,
    configured: false,
    message: "Menggunakan database lokal",
    sheetId: null,
  };
}

// -------------------------------------------------------------
// MASTER PRODUK (Target Sheet: 'MasterProduk')
// -------------------------------------------------------------
export const MASTER_PRODUK_SHEET_NAME = "MasterProduk";

export async function fetchMasterProdukList(forceRefresh: boolean = false): Promise<MasterProduk[]> {
  const configured = isGoogleSheetsConfigured();
  const sheetId = getEffectiveSheetId();

  // 1. Google Sheets API v4 (if GCP Service Account credentials provided)
  if (configured && sheetId) {
    try {
      const sheets = getGoogleSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${MASTER_PRODUK_SHEET_NAME}!A2:D`,
      });

      const rows = response.data.values || [];
      if (rows.length > 0) {
        const products = rows
          .map((r) => ({
            batch: String(r[0] || "").trim(),
            nama_produk: String(r[1] || "").trim(),
            status: (String(r[2] || "").trim().toLowerCase() === "nonaktif" ? "Nonaktif" : "Aktif") as "Aktif" | "Nonaktif",
            keterangan: String(r[3] || "").trim(),
          }))
          .filter((p) => p.batch.length > 0 && p.batch.toLowerCase() !== "batch");

        if (products.length > 0) {
          try {
            const db = getLocalDb();
            db.masterProduk = products;
            saveLocalDb(db);
          } catch {}
          return products;
        }
      }
    } catch (err) {
      console.warn("Gagal membaca MasterProduk via Google Sheets API:", err);
    }
  }

  // 2. Direct Sync via Google Sheets gviz CSV export (reads tab 'MasterProduk' in real time)
  if (sheetId) {
    try {
      const cacheBust = forceRefresh ? `&_t=${Date.now()}` : "";
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(MASTER_PRODUK_SHEET_NAME)}${cacheBust}`;
      const res = await fetch(gvizUrl, { cache: "no-store" });
      if (res.ok) {
        const text = await res.text();
        const XLSX = await import("xlsx");
        const wb = XLSX.read(text, { type: "string", raw: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const allRows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: "", raw: true });

        if (allRows.length > 1) {
          const dataRows = allRows.slice(1);
          const products = dataRows
            .map((r) => ({
              batch: String(r[0] || "").trim(),
              nama_produk: String(r[1] || "").trim(),
              status: (String(r[2] || "").trim().toLowerCase() === "nonaktif" ? "Nonaktif" : "Aktif") as "Aktif" | "Nonaktif",
              keterangan: String(r[3] || "").trim(),
            }))
            .filter((p) => p.batch.length > 0 && p.batch.toLowerCase() !== "batch");

          if (products.length > 0) {
            try {
              const db = getLocalDb();
              db.masterProduk = products;
              saveLocalDb(db);
            } catch {}
            return products;
          }
        }
      }
    } catch (err) {
      console.warn("Gagal membaca MasterProduk via CSV export:", err);
    }
  }

  // 3. Fallback to cached local DB
  const db = getLocalDb();
  return db.masterProduk && db.masterProduk.length > 0 ? db.masterProduk : DEFAULT_PRODUCTS;
}

export async function findMasterProdukByBatch(batchQuery: string): Promise<MasterProduk | null> {
  const list = await fetchMasterProdukList();
  const normalized = batchQuery.trim().toUpperCase();
  return list.find((p) => p.batch.toUpperCase() === normalized) || null;
}

export async function saveMasterProduk(item: MasterProduk): Promise<void> {
  if (!isGoogleSheetsConfigured()) {
    const db = getLocalDb();
    const idx = db.masterProduk.findIndex((p) => p.batch.toUpperCase() === item.batch.toUpperCase());
    if (idx >= 0) {
      db.masterProduk[idx] = item;
    } else {
      db.masterProduk.push(item);
    }
    saveLocalDb(db);
    return;
  }

  const sheets = getGoogleSheetsClient();
  const sheetId = getEffectiveSheetId();

  // Read existing to check if update or append
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${MASTER_PRODUK_SHEET_NAME}!A2:D`,
  });
  const rows = response.data.values || [];
  const rowIndex = rows.findIndex((r) => String(r[0] || "").trim().toUpperCase() === item.batch.toUpperCase());

  if (rowIndex >= 0) {
    const targetRow = rowIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${MASTER_PRODUK_SHEET_NAME}!A${targetRow}:D${targetRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[item.batch, item.nama_produk, item.status, item.keterangan || ""]],
      },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${MASTER_PRODUK_SHEET_NAME}!A:D`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[item.batch, item.nama_produk, item.status, item.keterangan || ""]],
      },
    });
  }
}

export async function saveMasterProdukBulk(
  items: MasterProduk[]
): Promise<{ total: number; added: number; updated: number }> {
  if (!items || items.length === 0) {
    return { total: 0, added: 0, updated: 0 };
  }

  if (!isGoogleSheetsConfigured()) {
    const db = getLocalDb();
    let added = 0;
    let updated = 0;
    for (const item of items) {
      const idx = db.masterProduk.findIndex(
        (p) => p.batch.toUpperCase() === item.batch.toUpperCase()
      );
      if (idx >= 0) {
        db.masterProduk[idx] = {
          ...db.masterProduk[idx],
          nama_produk: item.nama_produk,
          status: item.status || "Aktif",
          keterangan: item.keterangan || "",
        };
        updated++;
      } else {
        db.masterProduk.push({
          batch: item.batch,
          nama_produk: item.nama_produk,
          status: item.status || "Aktif",
          keterangan: item.keterangan || "",
        });
        added++;
      }
    }
    saveLocalDb(db);
    return { total: items.length, added, updated };
  }

  const sheets = getGoogleSheetsClient();
  const sheetId = getEffectiveSheetId();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${MASTER_PRODUK_SHEET_NAME}!A2:D`,
  });
  const rows = response.data.values || [];

  let added = 0;
  let updated = 0;
  const newRows: string[][] = [];

  for (const item of items) {
    const rowIndex = rows.findIndex(
      (r) => String(r[0] || "").trim().toUpperCase() === item.batch.toUpperCase()
    );
    if (rowIndex >= 0) {
      const targetRow = rowIndex + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${MASTER_PRODUK_SHEET_NAME}!A${targetRow}:D${targetRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[item.batch, item.nama_produk, item.status || "Aktif", item.keterangan || ""]],
        },
      });
      rows[rowIndex] = [item.batch, item.nama_produk, item.status || "Aktif", item.keterangan || ""];
      updated++;
    } else {
      newRows.push([item.batch, item.nama_produk, item.status || "Aktif", item.keterangan || ""]);
      rows.push([item.batch, item.nama_produk, item.status || "Aktif", item.keterangan || ""]);
      added++;
    }
  }

  if (newRows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${MASTER_PRODUK_SHEET_NAME}!A:D`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: newRows },
    });
  }

  return { total: items.length, added, updated };
}

export async function deleteMasterProduk(batch: string): Promise<boolean> {
  const normBatch = batch.trim().toUpperCase();

  if (!isGoogleSheetsConfigured()) {
    const db = getLocalDb();
    const initialLen = db.masterProduk.length;
    db.masterProduk = db.masterProduk.filter(
      (p) => p.batch.toUpperCase() !== normBatch
    );
    if (db.masterProduk.length !== initialLen) {
      saveLocalDb(db);
      return true;
    }
    return false;
  }

  const sheets = getGoogleSheetsClient();
  const sheetId = getEffectiveSheetId();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${MASTER_PRODUK_SHEET_NAME}!A2:D`,
  });
  const rows = response.data.values || [];
  const remainingRows = rows.filter(
    (r) => String(r[0] || "").trim().toUpperCase() !== normBatch
  );

  if (remainingRows.length === rows.length) {
    return false;
  }

  // Clear existing range and write remaining
  await sheets.spreadsheets.values.clear({
    spreadsheetId: sheetId,
    range: `${MASTER_PRODUK_SHEET_NAME}!A2:D`,
  });

  if (remainingRows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${MASTER_PRODUK_SHEET_NAME}!A2:D${remainingRows.length + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: remainingRows },
    });
  }

  return true;
}

// -------------------------------------------------------------
// USERS
// -------------------------------------------------------------
export async function fetchUsersList(): Promise<User[]> {
  if (!isGoogleSheetsConfigured()) {
    const db = getLocalDb();
    return db.users;
  }

  try {
    const sheets = getGoogleSheetsClient();
    const sheetId = getEffectiveSheetId();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Users!A2:F",
    });

    const rows = response.data.values || [];
    return rows.map((r) => ({
      user_id: String(r[0] || ""),
      nama: String(r[1] || ""),
      email: String(r[2] || ""),
      role: (String(r[3] || "").toLowerCase() === "admin" ? "Admin" : "Operator") as "Admin" | "Operator",
      status: (String(r[4] || "").toLowerCase() === "nonaktif" ? "Nonaktif" : "Aktif") as "Aktif" | "Nonaktif",
      password_hash: String(r[5] || ""),
    })).filter((u) => u.user_id && u.email);
  } catch (err) {
    console.warn("Falling back to local users:", err);
    return getLocalDb().users;
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await fetchUsersList();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function saveUser(user: User): Promise<void> {
  if (!isGoogleSheetsConfigured()) {
    const db = getLocalDb();
    const idx = db.users.findIndex((u) => u.user_id === user.user_id || u.email.toLowerCase() === user.email.toLowerCase());
    if (idx >= 0) {
      db.users[idx] = user;
    } else {
      db.users.push(user);
    }
    saveLocalDb(db);
    return;
  }

  const sheets = getGoogleSheetsClient();
  const sheetId = getEffectiveSheetId();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Users!A2:F",
  });
  const rows = response.data.values || [];
  const rowIndex = rows.findIndex((r) => String(r[0] || "") === user.user_id || String(r[2] || "").toLowerCase() === user.email.toLowerCase());

  const userRow = [
    user.user_id,
    user.nama,
    user.email,
    user.role,
    user.status,
    user.password_hash,
  ];

  if (rowIndex >= 0) {
    const targetRow = rowIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Users!A${targetRow}:F${targetRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [userRow] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Users!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [userRow] },
    });
  }
}

// -------------------------------------------------------------
// HASIL TIMBANGAN (Target Sheet: 'Report', gid: 885811287)
// -------------------------------------------------------------
const WEIGHING_SHEET_NAME = "Report";

export function parseNumericValue(val: unknown): number | null {
  if (val === undefined || val === null || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  const str = String(val).trim().replace(/\s+/g, "").replace(",", ".");
  const num = Number(str);
  return isNaN(num) ? null : num;
}

export function parseDateValue(val: unknown): string {
  if (!val) return "";
  if (typeof val === "number" && val > 30000 && val < 60000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const ms = val * 86400 * 1000;
    const date = new Date(excelEpoch.getTime() + ms);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
  }
  return String(val).trim();
}

function parseReportRows(rows: (string | number)[][]): HasilTimbangan[] {
  return rows
    .map((r, idx) => {
      const noMesinTimbangan = String(r[5] || "");
      const parts = noMesinTimbangan.split("/").map((s) => s.trim());
      const no_mesin = parts[0] || "";
      const no_timbangan = parts[1] || "";

      const session: HasilTimbangan = {
        id: String(r[0] || `WT-${idx + 1}`),
        jam: parseDateValue(r[1]),
        batch: String(r[2] || ""),
        nama_produk: String(r[3] || ""),
        operator: String(r[4] || ""),
        operator_id: "",
        no_mesin,
        no_timbangan,
        metode_kemas: String(r[6] || ""),
        lower: parseNumericValue(r[7]) ?? 0,
        upper: parseNumericValue(r[8]) ?? 0,
      };

      for (let i = 1; i <= 15; i++) {
        const colIdx = 8 + i; // Col J is index 9 (8 + 1)
        const val = r[colIdx];
        const key = `timbang_${i}` as keyof HasilTimbangan;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any)[key] = parseNumericValue(val);
      }

      return session;
    })
    .filter((s) => s.batch.length > 0 || s.id.length > 0);
}

export async function fetchHasilTimbanganList(forceRefresh: boolean = false): Promise<HasilTimbangan[]> {
  const configured = isGoogleSheetsConfigured();
  const sheetId = getEffectiveSheetId();
  const db = getLocalDb();
  const deletedSet = new Set((db.deletedIds || []).map((id) => id.toUpperCase()));

  const filterValid = (items: HasilTimbangan[]) =>
    items.filter((s) => {
      if (!s.id || deletedSet.has(s.id.toUpperCase())) return false;
      if (s.id.includes("DEMO") || s.batch.startsWith("BCH-2026-")) return false;
      return true;
    });

  if (configured && sheetId) {
    try {
      const sheets = getGoogleSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${WEIGHING_SHEET_NAME}!A3:X`,
      });

      const rows = response.data.values || [];
      if (rows.length > 0) {
        return filterValid(parseReportRows(rows));
      }
    } catch (err) {
      console.warn("Error reading from Google Sheets API, trying fallback:", err);
    }
  }

  // Attempt reading via public CSV export if sheetId is present
  if (sheetId) {
    try {
      const cacheBust = forceRefresh ? `&_t=${Date.now()}` : "";
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=885811287${cacheBust}`;
      const res = await fetch(csvUrl, { cache: "no-store" });
      if (res.ok) {
        const text = await res.text();
        const XLSX = await import("xlsx");
        const wb = XLSX.read(text, { type: "string", raw: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const allRows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: "", raw: true });
        // Rows 0 and 1 are headers; rows from index 2 onwards are data
        if (allRows.length > 2) {
          const dataRows = allRows.slice(2);
          const parsed = parseReportRows(dataRows);
          if (parsed.length > 0) {
            return filterValid(parsed);
          }
        }
      }
    } catch (err) {
      console.warn("Error reading public CSV export:", err);
    }
  }

  return filterValid(db.hasilTimbangan);
}

export async function appendHasilTimbangan(session: HasilTimbangan): Promise<void> {
  const sheetId = getEffectiveSheetId();
  const webAppUrl = getEffectiveWebAppUrl();

  // Prepare 24 columns row matching Sheet 'Report' (A to X):
  const rowValues: (string | number)[] = [
    session.id,
    session.jam,
    session.batch,
    session.nama_produk,
    session.operator,
    `${session.no_mesin} / ${session.no_timbangan}`,
    session.metode_kemas,
    session.lower,
    session.upper,
  ];

  for (let i = 1; i <= 15; i++) {
    const key = `timbang_${i}` as keyof HasilTimbangan;
    const val = session[key];
    if (val !== undefined && val !== null && val !== "" && !isNaN(Number(val))) {
      rowValues.push(Number(val));
    } else {
      rowValues.push(""); // empty string (cell remains empty, not 0)
    }
  }

  // 1. Google Apps Script Web App Bridge (if configured)
  if (webAppUrl) {
    try {
      const res = await fetch(webAppUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "appendWeighing",
          sheetName: WEIGHING_SHEET_NAME,
          rowValues,
        }),
        redirect: "follow",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Google Apps Script error (${res.status}): ${text}`);
      }
      // Update local cache
      try {
        const db = getLocalDb();
        db.hasilTimbangan.unshift(session);
        saveLocalDb(db);
      } catch {}
      return;
    } catch (scriptErr) {
      console.warn("Google Apps Script append error, attempting alternative:", scriptErr);
      if (!isGoogleSheetsConfigured()) {
        const db = getLocalDb();
        if (!db.hasilTimbangan.some((s) => s.id === session.id)) {
          db.hasilTimbangan.unshift(session);
          saveLocalDb(db);
        }
        return;
      }
    }
  }

  // 2. Google Sheets API v4 with Service Account
  if (isGoogleSheetsConfigured()) {
    const sheets = getGoogleSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${WEIGHING_SHEET_NAME}!A:X`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowValues],
      },
    });

    // Update local cache
    try {
      const db = getLocalDb();
      db.hasilTimbangan.unshift(session);
      saveLocalDb(db);
    } catch {}
    return;
  }

  // 3. Fallback to local database while Google credentials are not set
  const db = getLocalDb();
  if (db.hasilTimbangan.some((s) => s.id === session.id)) {
    throw new Error(`Sesi dengan ID ${session.id} sudah ada.`);
  }
  db.hasilTimbangan.unshift(session);
  saveLocalDb(db);
}

export async function deleteHasilTimbangan(id: string): Promise<boolean> {
  const normId = id.trim().toUpperCase();
  const db = getLocalDb();
  if (!db.deletedIds) db.deletedIds = [];
  if (!db.deletedIds.includes(normId)) {
    db.deletedIds.push(normId);
  }
  const initialLen = db.hasilTimbangan.length;
  db.hasilTimbangan = db.hasilTimbangan.filter((s) => s.id.toUpperCase() !== normId);
  saveLocalDb(db);

  // If Google Sheets API configured, also remove from Report tab if present
  if (isGoogleSheetsConfigured()) {
    try {
      const sheets = getGoogleSheetsClient();
      const sheetId = getEffectiveSheetId();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${WEIGHING_SHEET_NAME}!A3:A`,
      });
      const rows = response.data.values || [];
      const rowIndex = rows.findIndex((r) => String(r[0] || "").trim().toUpperCase() === normId);
      if (rowIndex >= 0) {
        const targetRow = rowIndex + 3;
        await sheets.spreadsheets.values.clear({
          spreadsheetId: sheetId,
          range: `${WEIGHING_SHEET_NAME}!A${targetRow}:X${targetRow}`,
        });
      }
    } catch (err) {
      console.warn("Could not remove from Google Sheets directly:", err);
    }
  }

  return true;
}

export async function clearAllDummyHasilTimbangan(): Promise<number> {
  const currentList = await fetchHasilTimbanganList();
  const db = getLocalDb();
  if (!db.deletedIds) db.deletedIds = [];
  for (const item of currentList) {
    const norm = item.id.trim().toUpperCase();
    if (!db.deletedIds.includes(norm)) {
      db.deletedIds.push(norm);
    }
  }
  const count = currentList.length;
  db.hasilTimbangan = [];
  saveLocalDb(db);
  return count;
}

/**
 * Initialize sheets structure and headers if Google Sheets is configured
 */
export async function initializeGoogleSheetsStructure(): Promise<{ success: boolean; message: string }> {
  if (!isGoogleSheetsConfigured()) {
    return { success: true, message: "Menggunakan database lokal otomatis." };
  }

  try {
    const sheets = getGoogleSheetsClient();
    const sheetId = getEffectiveSheetId();

    const headersMasterProduk = [["Batch", "Nama_Produk", "Status", "Keterangan"]];
    const headersUsers = [["User_ID", "Nama", "Email", "Role", "Status", "Password_Hash"]];
    const headersHasilTimbangan = [
      [
        "ID",
        "Operator_ID",
        "Operator",
        "Nama_Produk",
        "Batch",
        "No_Mesin",
        "No_Timbangan",
        "Metode_Kemas",
        "Lower",
        "Upper",
        "Jam",
        ...Array.from({ length: 15 }, (_, i) => `Timbang_${i + 1}`),
      ],
    ];

    // Set headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${MASTER_PRODUK_SHEET_NAME}!A1:D1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: headersMasterProduk },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "Users!A1:F1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: headersUsers },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "Hasil_Timbangan!A1:Z1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: headersHasilTimbangan },
    });

    return { success: true, message: "Header spreadsheet berhasil disiapkan." };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, message: `Gagal inisialisasi sheet: ${err.message}` };
  }
}
