import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { User, MasterProduk, HasilTimbangan } from "@/types";
import { DEFAULT_USERS } from "./auth";

// Initial sample master products
export const DEFAULT_PRODUCTS: MasterProduk[] = [
  {
    batch: "BCH-2026-001",
    nama_produk: "Susu Bubuk Vanilla 500g",
    status: "Aktif",
    keterangan: "Lini Kemas 1 - Sachet Aluminium",
  },
  {
    batch: "BCH-2026-002",
    nama_produk: "Kopi Instan Premium 200g",
    status: "Aktif",
    keterangan: "Lini Kemas 2 - Standing Pouch",
  },
  {
    batch: "BCH-2026-003",
    nama_produk: "Biskuit Gandum Cokelat 350g",
    status: "Aktif",
    keterangan: "Lini Kemas 3 - Box Karton",
  },
  {
    batch: "BCH-2026-004",
    nama_produk: "Sereal Jagung Manis 250g",
    status: "Aktif",
    keterangan: "Lini Kemas 1 - Pouch Segel",
  },
  {
    batch: "BCH-2026-005",
    nama_produk: "Teh Celup Melati 100g",
    status: "Nonaktif",
    keterangan: "Batch Disetop Sementara (QC Hold)",
  },
];

// Initial weighing records (empty by default; data originates from actual production entries or Google Sheets)
export const DEFAULT_SESSIONS: HasilTimbangan[] = [];

interface LocalDatabase {
  users: User[];
  masterProduk: MasterProduk[];
  hasilTimbangan: HasilTimbangan[];
  deletedIds?: string[];
}

const LOCAL_DB_PATH = path.join(process.cwd(), ".data", "database.json");

function getLocalDb(): LocalDatabase {
  try {
    if (!fs.existsSync(path.dirname(LOCAL_DB_PATH))) {
      fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
    }
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      const initial: LocalDatabase = {
        users: DEFAULT_USERS,
        masterProduk: DEFAULT_PRODUCTS,
        hasilTimbangan: DEFAULT_SESSIONS,
        deletedIds: [],
      };
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const raw = fs.readFileSync(LOCAL_DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.deletedIds) parsed.deletedIds = [];
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
    if (!fs.existsSync(path.dirname(LOCAL_DB_PATH))) {
      fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving local db:", err);
  }
}

export function isGoogleSheetsConfigured(): boolean {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;
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
  if (!configured) {
    return {
      type: "local" as const,
      configured: false,
      message: "Menggunakan database lokal (Konfigurasi Google Sheets belum diisi di .env.local)",
      sheetId: null,
    };
  }

  try {
    const sheets = getGoogleSheetsClient();
    const sheetId = process.env.GOOGLE_SHEET_ID!;
    const res = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    return {
      type: "google_sheets" as const,
      configured: true,
      spreadsheetTitle: res.data.properties?.title || "Google Sheets Connected",
      sheetId: sheetId,
      message: "Terhubung langsung ke Google Sheets API",
    };
  } catch (error: unknown) {
    const err = error as Error;
    return {
      type: "google_sheets_error" as const,
      configured: true,
      message: `Gagal mengakses Google Sheets: ${err.message}`,
      sheetId: process.env.GOOGLE_SHEET_ID,
    };
  }
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// MASTER PRODUK (Target Sheet: 'MasterProduk')
// -------------------------------------------------------------
export const MASTER_PRODUK_SHEET_NAME = "MasterProduk";

export async function fetchMasterProdukList(forceRefresh: boolean = false): Promise<MasterProduk[]> {
  const configured = isGoogleSheetsConfigured();
  const sheetId = process.env.GOOGLE_SHEET_ID;

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
      const res = await fetch(gvizUrl, { next: { revalidate: forceRefresh ? 0 : 30 } });
      if (res.ok) {
        const text = await res.text();
        const XLSX = await import("xlsx");
        const wb = XLSX.read(text, { type: "string" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const allRows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: "" });

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
  return db.masterProduk;
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
  const sheetId = process.env.GOOGLE_SHEET_ID!;

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
  const sheetId = process.env.GOOGLE_SHEET_ID!;

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
  const sheetId = process.env.GOOGLE_SHEET_ID!;

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
    const sheetId = process.env.GOOGLE_SHEET_ID!;
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
  const sheetId = process.env.GOOGLE_SHEET_ID!;

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
    user.password_hash || "",
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

function parseReportRows(rows: (string | number)[][]): HasilTimbangan[] {
  return rows
    .map((r, idx) => {
      const noMesinTimbangan = String(r[5] || "");
      const parts = noMesinTimbangan.split("/").map((s) => s.trim());
      const no_mesin = parts[0] || "";
      const no_timbangan = parts[1] || "";

      const session: HasilTimbangan = {
        id: String(r[0] || `WT-${idx + 1}`),
        jam: String(r[1] || ""),
        batch: String(r[2] || ""),
        nama_produk: String(r[3] || ""),
        operator: String(r[4] || ""),
        operator_id: "",
        no_mesin,
        no_timbangan,
        metode_kemas: String(r[6] || ""),
        lower: Number(r[7] || 0),
        upper: Number(r[8] || 0),
      };

      for (let i = 1; i <= 15; i++) {
        const colIdx = 8 + i; // Col J is index 9 (8 + 1)
        const val = r[colIdx];
        const key = `timbang_${i}` as keyof HasilTimbangan;
        if (val !== undefined && val !== "" && val !== null && !isNaN(Number(val))) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (session as any)[key] = Number(val);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (session as any)[key] = null;
        }
      }

      return session;
    })
    .filter((s) => s.batch.length > 0 || s.id.length > 0);
}

export async function fetchHasilTimbanganList(): Promise<HasilTimbangan[]> {
  const configured = isGoogleSheetsConfigured();
  const sheetId = process.env.GOOGLE_SHEET_ID;
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
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=885811287`;
      const res = await fetch(csvUrl);
      if (res.ok) {
        const text = await res.text();
        const XLSX = await import("xlsx");
        const wb = XLSX.read(text, { type: "string" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const allRows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: "" });
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
  const sheetId = process.env.GOOGLE_SHEET_ID;

  // Prepare 24 columns row matching Sheet 'Report' (A to X):
  // Col A: No / ID Sesi
  // Col B: Waktu
  // Col C: Batch
  // Col D: Nama Produk
  // Col E: Operator
  // Col F: No Mesin/Timbangan
  // Col G: Metode
  // Col H: Lower
  // Col I: Upper
  // Col J..X: Timbang 1 s/d 15
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
  const webAppUrl = process.env.GOOGLE_SCRIPT_WEBAPP_URL;
  if (webAppUrl) {
    const res = await fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "appendWeighing",
        sheetName: WEIGHING_SHEET_NAME,
        rowValues,
      }),
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
  }

  // 2. Google Sheets API v4 with Service Account
  if (isGoogleSheetsConfigured()) {
    const sheets = getGoogleSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId!,
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
      const sheetId = process.env.GOOGLE_SHEET_ID!;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${WEIGHING_SHEET_NAME}!A3:X`,
      });
      const rows = response.data.values || [];
      const remainingRows = rows.filter((r) => String(r[0] || "").trim().toUpperCase() !== normId);
      if (remainingRows.length !== rows.length) {
        await sheets.spreadsheets.values.clear({
          spreadsheetId: sheetId,
          range: `${WEIGHING_SHEET_NAME}!A3:X`,
        });
        if (remainingRows.length > 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `${WEIGHING_SHEET_NAME}!A3:X${remainingRows.length + 2}`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: remainingRows },
          });
        }
      }
    } catch (err) {
      console.warn("Gagal menghapus baris dari Google Sheets API:", err);
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
    const sheetId = process.env.GOOGLE_SHEET_ID!;

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
