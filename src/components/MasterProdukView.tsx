"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Package,
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { MasterProduk, AuthSession } from "@/types";

interface MasterProdukViewProps {
  user: AuthSession;
}

interface ParsedRow {
  batch: string;
  nama_produk: string;
  isValid: boolean;
  notes: string;
}

export default function MasterProdukView({ user: _user }: MasterProdukViewProps) {
  const [products, setProducts] = useState<MasterProduk[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Single Add / Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [formBatch, setFormBatch] = useState("");
  const [formNama, setFormNama] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  // Delete confirmation modal states
  const [deleteTarget, setDeleteTarget] = useState<MasterProduk | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Import Excel Modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccessMessage, setImportSuccessMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const res = await fetch(`/api/master/products${forceRefresh ? "?refresh=true" : ""}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProducts(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isModalOpen) setIsModalOpen(false);
        if (isImportModalOpen) setIsImportModalOpen(false);
        if (deleteTarget) setDeleteTarget(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isImportModalOpen, deleteTarget]);

  // Handler Single Add
  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormBatch("");
    setFormNama("");
    setModalError("");
    setIsModalOpen(true);
  };

  // Handler Single Edit
  const handleOpenEdit = (p: MasterProduk) => {
    setIsEditMode(true);
    setFormBatch(p.batch);
    setFormNama(p.nama_produk);
    setModalError("");
    setIsModalOpen(true);
  };

  // Save Single Add / Edit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBatch.trim() || !formNama.trim()) {
      setModalError("No Batch dan Nama Produk wajib diisi.");
      return;
    }

    setIsSaving(true);
    setModalError("");

    try {
      const res = await fetch("/api/master/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch: formBatch.trim().toUpperCase(),
          nama_produk: formNama.trim(),
          status: "Aktif",
          keterangan: "",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setModalError(json.message || "Gagal menyimpan master produk.");
        setIsSaving(false);
        return;
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: unknown) {
      const error = err as Error;
      setModalError(`Gagal menghubungi server: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/master/products?batch=${encodeURIComponent(deleteTarget.batch)}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setDeleteError(json.message || "Gagal menghapus produk.");
        setIsDeleting(false);
        return;
      }

      setDeleteTarget(null);
      fetchProducts();
    } catch (err: unknown) {
      const error = err as Error;
      setDeleteError(`Gagal menghubungi server: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler Excel File Upload & Parse
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError("");
    setImportSuccessMessage("");

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: "",
      });

      if (!rawJson || rawJson.length === 0) {
        setImportError("File Excel kosong atau tidak memiliki baris data.");
        setParsedRows([]);
        return;
      }

      // Map rows flexibly
      const parsed: ParsedRow[] = rawJson.map((row) => {
        let batchVal = "";
        let namaVal = "";

        // Find batch value
        for (const key of Object.keys(row)) {
          const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
          if (
            cleanKey.includes("batch") ||
            cleanKey.includes("nobatch") ||
            cleanKey.includes("kodebatch")
          ) {
            batchVal = String(row[key] || "").trim();
            break;
          }
        }

        // Find nama produk value
        for (const key of Object.keys(row)) {
          const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
          if (
            cleanKey.includes("produk") ||
            cleanKey.includes("product") ||
            cleanKey.includes("namaproduk") ||
            cleanKey.includes("namabarang")
          ) {
            namaVal = String(row[key] || "").trim();
            break;
          }
        }

        // Fallback: if not matched by name, check first two columns
        if (!batchVal && !namaVal) {
          const values = Object.values(row);
          if (values.length >= 2) {
            batchVal = String(values[0] || "").trim();
            namaVal = String(values[1] || "").trim();
          }
        }

        const isValid = Boolean(batchVal && namaVal);
        const notes = !batchVal && !namaVal
          ? "Baris kosong"
          : !batchVal
          ? "No Batch kosong"
          : !namaVal
          ? "Nama Produk kosong"
          : "Valid";

        return {
          batch: batchVal.toUpperCase(),
          nama_produk: namaVal,
          isValid,
          notes,
        };
      });

      setParsedRows(parsed);
    } catch (err: unknown) {
      const error = err as Error;
      setImportError(`Gagal membaca file Excel: ${error.message}`);
      setParsedRows([]);
    }
  };

  // Submit Bulk Import
  const handleProcessImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setImportError("Tidak ada baris data yang valid untuk diimpor.");
      return;
    }

    setIsImporting(true);
    setImportError("");
    setImportSuccessMessage("");

    try {
      const res = await fetch("/api/master/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: validRows.map((r) => ({
            batch: r.batch,
            nama_produk: r.nama_produk,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setImportError(json.message || "Gagal mengimpor produk.");
        setIsImporting(false);
        return;
      }

      setImportSuccessMessage(
        json.message || `Berhasil mengimpor ${validRows.length} produk ke master data.`
      );
      fetchProducts();

      // Reset file input after 1.5s
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportFile(null);
        setParsedRows([]);
        setImportSuccessMessage("");
      }, 1500);
    } catch (err: unknown) {
      const error = err as Error;
      setImportError(`Gagal menghubungi server: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = "/api/master/products/template";
  };

  const filtered = products.filter(
    (p) =>
      p.batch.toLowerCase().includes(search.toLowerCase()) ||
      p.nama_produk.toLowerCase().includes(search.toLowerCase())
  );

  const validRowCount = parsedRows.filter((r) => r.isValid).length;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Master Produk & Batch</h2>
              
            </div>
            
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Sinkronkan Google Sheets Button */}
          <button
            onClick={() => fetchProducts(true)}
            disabled={isRefreshing || isLoading}
            type="button"
            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
            title="Tarik pembaruan data Batch dan Produk langsung dari tab MasterProduk Google Sheets"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Menyinkronkan..." : "Refresh"}</span>
          </button>

          {/* Download Template Button */}
          <button
            onClick={handleDownloadTemplate}
            type="button"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Download Template Excel untuk import massal"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>Download Template</span>
          </button>

          {/* Import Excel Button */}
          <button
            onClick={() => {
              setImportFile(null);
              setParsedRows([]);
              setImportError("");
              setImportSuccessMessage("");
              setIsImportModalOpen(true);
            }}
            type="button"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            <span>Import Excel</span>
          </button>

          {/* Single Add Button */}
          <button
            onClick={handleOpenAdd}
            type="button"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Search Input & Total Count */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari No Batch atau Nama Produk..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 px-1 whitespace-nowrap">
          Total: <strong className="text-slate-800 dark:text-slate-200">{products.length}</strong> produk terdaftar
        </div>
      </div>

      {/* Products Table (Only No Batch, Nama Produk, Aksi) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-44">No Batch</th>
                <th className="py-3.5 px-4">Nama Produk</th>
                <th className="py-3.5 px-4 w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    Memuat data master produk...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    {search ? "Tidak ditemukan produk yang cocok dengan pencarian." : "Belum ada produk tersimpan."}
                  </td>
                </tr>
              ) : (
                filtered.map((p, index) => (
                  <tr
                    key={p.batch}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-700 dark:text-sky-400">
                      {p.batch}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {p.nama_produk}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Edit Produk"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(p);
                            setDeleteError("");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: Tambah / Edit Produk (Hanya No Batch & Nama Produk)  */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {isEditMode ? "Edit Master Produk" : "Tambah Master Produk Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No Batch <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formBatch}
                  onChange={(e) => setFormBatch(e.target.value.toUpperCase())}
                  placeholder="Contoh: BCH-2026-001"
                  required
                  disabled={isEditMode}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-sky-600 uppercase disabled:opacity-60"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Kode unik batch produk untuk verifikasi otomatis operator.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Susu Bubuk Vanilla 500g"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: Import Massal dari File Excel (.xlsx / .xls / .csv)   */}
      {/* ------------------------------------------------------------- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Import Produk Sekaligus dari Excel
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {/* Petunjuk & Download Template Card */}
              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-sky-900 dark:text-sky-200 space-y-1">
                  <p className="font-bold">Format File Excel (.xlsx / .csv):</p>
                  <p>
                    Gunakan kolom header: <span className="font-mono font-bold">No Batch</span> dan{" "}
                    <span className="font-mono font-bold">Nama Produk</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40 text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template Excel</span>
                </button>
              </div>

              {/* Upload Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih File Excel (.xlsx, .xls, .csv)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200 dark:hover:file:bg-slate-700 cursor-pointer border border-slate-300 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{importSuccessMessage}</span>
                </div>
              )}

              {/* Data Preview */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Pratinjau Data ({validRowCount} valid dari {parsedRows.length} baris)
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {importFile?.name}
                    </span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                        <tr>
                          <th className="py-2 px-3 w-10 text-center">No</th>
                          <th className="py-2 px-3 w-36">No Batch</th>
                          <th className="py-2 px-3">Nama Produk</th>
                          <th className="py-2 px-3 w-28 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-slate-800/80">
                        {parsedRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={
                              row.isValid
                                ? "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                : "bg-rose-50/50 dark:bg-rose-950/20 text-slate-400"
                            }
                          >
                            <td className="py-2 px-3 text-center font-mono text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-sky-700 dark:text-sky-400">
                              {row.batch || "-"}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                              {row.nama_produk || "-"}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {row.isValid ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                  Siap Impor
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                                  {row.notes}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0 mt-3">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProcessImport}
                disabled={isImporting || validRowCount === 0}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {isImporting ? (
                  <span>Mengimpor...</span>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Simpan {validRowCount > 0 ? `${validRowCount} ` : ""}Produk ke Master</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: Konfirmasi Hapus Produk                              */}
      {/* ------------------------------------------------------------- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Hapus Produk?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="p-3 mb-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div>
                <span className="text-slate-500">No Batch:</span>{" "}
                <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                  {deleteTarget.batch}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Nama Produk:</span>{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {deleteTarget.nama_produk}
                </span>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "Menghapus..." : "Hapus Produk"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
