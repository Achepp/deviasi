# Packaging Weighing Dashboard — PWA berbasis Google Sheets

Aplikasi Progressive Web App (PWA) modern untuk pencatatan parameter pengemasan dan hasil penimbangan produk digital yang terintegrasi langsung dengan **Google Sheets API**.

Dibuat sesuai spesifikasi **Product Requirements Document (PRD) v1.1**.

---

## 🌟 Fitur Utama

1. **Autentikasi & Hak Akses Berbasis Peran (RBAC)**:
   - **Administrator**: Kelola Master Produk, kelola akun pengguna, lihat seluruh dashboard dan riwayat, ekspor laporan.
   - **Operator**: Login, input hasil penimbangan, lihat riwayat & detail penimbangan.
   - Nama operator terisi otomatis dari sesi login aktif (operator tidak perlu mengetik nama).

2. **Master Data & Pencarian Batch Otomatis (BR-03)**:
   - Operator mengetik kode Batch (contoh: `BCH-2026-001`).
   - Sistem mencari pada sheet `Master_Produk`.
   - Nama produk muncul otomatis dan terkunci (read-only) untuk mencegah kesalahan manual.
   - Batch berstatus Nonaktif atau tidak terdaftar dicegah untuk disimpan.
   - Satu Batch dapat digunakan berulang kali pada sesi penimbangan berbeda (BR-01).

3. **Input Fleksibel 1–15 Hasil Timbang (BR-02)**:
   - Operator dapat mengisi 1, 3, 5, 10, atau hingga 15 nilai penimbangan.
   - Sel yang tidak diisi dibiarkan **kosong** (tidak diisi nol dan tidak dihitung dalam statistik).
   - Indikator real-time: Hijau (OK/Dalam Batas) dan Merah (OUT/Di Luar Batas) berdasarkan batas Lower dan Upper (BR-05). Nilai asli tidak pernah diubah.

4. **Timestamp Otomatis & Sesi Unik (BR-04, BR-07)**:
   - ID Sesi unik dibuat otomatis oleh backend (contoh: `WT-20261013-XXXX`).
   - Timestamp dicatat otomatis dalam zona waktu `Asia/Jakarta (WIB)`.
   - Proteksi idempotensi untuk mencegah duplikasi baris akibat klik ganda tombol Simpan.

5. **Dashboard & Riwayat Interaktif**:
   - Kartu KPI: Total sesi, total pengukuran, total batch, persentase lolos QC, total di luar batas.
   - Filter pencarian: Tanggal, Batch, Nama Produk, Operator, No Mesin, No Timbangan, Metode Kemas, serta filter khusus "Hanya Luar Batas".
   - Modal Detail Sesi: Menampilkan rincian lengkap 15 kotak timbang, nilai Min, Max, Rata-rata, Jumlah Sesuai & Tidak Sesuai.
   - Ekspor laporan ke format file CSV dengan seluruh 26 kolom Google Sheets.

6. **Progressive Web App (PWA)**:
   - Mendukung instalasi di Smartphone (Android / iOS), Tablet, dan Desktop.
   - Disertai Web App Manifest (`manifest.json`) dan Service Worker (`sw.js`).
   - Tampilan responsif (portrait & landscape) dan ramah layar sentuh (`inputMode="decimal"`).

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Prasyarat
- Node.js versi 18+ (disarankan Node.js 20+ / 24+)
- npm

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Menjalankan Server Development
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 4. Menjalankan Build Produksi
```bash
npm run build
npm run start
```

---

## 🔑 Kredensial Pengujian (Demo)

Tersedia tombol pintas **"Akses Cepat Pengujian (Demo)"** di halaman login:

| Peran | Email / Identitas | Kata Sandi | Keterangan |
|---|---|---|---|
| **Administrator** | `admin@packaging.local` | `admin123` | Akses penuh (Master Produk & Pengguna) |
| **Operator** | `budi@packaging.local` | `operator123` | Akses input penimbangan & riwayat |
| **Operator** | `siti@packaging.local` | `operator123` | Operator alternatif |

---

## 📊 Konfigurasi Integrasi Google Sheets

Aplikasi telah dilengkapi fallback otomatis sehingga dapat langsung diuji dan dijalankan secara lokal tanpa konfigurasi awal.

Jika Anda ingin menghubungkan data langsung ke Google Sheets Cloud:

1. Salin `.env.example` menjadi `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Buka [Google Cloud Console](https://console.cloud.google.com/), buat project dan aktifkan **Google Sheets API**.
3. Buat **Service Account**, lalu unduh JSON key.
4. Buat Spreadsheet Google Sheets dengan 3 sheet / tab:
   - `Master_Produk`
   - `Users`
   - `Hasil_Timbangan`
5. Bagikan (Share) spreadsheet tersebut kepada email Service Account Anda sebagai **Editor**.
6. Isi variabel di `.env.local`:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
   GOOGLE_SHEET_ID="your-spreadsheet-id-from-url"
   ```
7. Buka menu **Status Cloud / Sheets** di aplikasi (sebagai Admin) dan klik **"Inisialisasi Header Sheet"** untuk mengisi struktur kolom A–Z secara otomatis.

---

## 🧪 Pengujian Otomatis

Jalankan script verifikasi end-to-end:
```bash
node src/test-runner.js
```
Script akan memvalidasi autentikasi, aturan bisnis BR-01 sampai BR-08, validasi batas toleransi, pencarian batch, fleksibilitas 1–15 data, dan ekspor CSV.
