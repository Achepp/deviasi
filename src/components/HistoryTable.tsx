"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Download,
  RotateCcw,
  Eye,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { HasilTimbangan, AuthSession } from "@/types";
import { calculateWeighingStats } from "@/lib/utils";

interface HistoryTableProps {
  sessions: HasilTimbangan[];
  user: AuthSession;
  onSelectSession: (session: HasilTimbangan) => void;
  onRefresh: () => void;
}

export default function HistoryTable({
  sessions,
  user,
  onSelectSession,
  onRefresh,
}: HistoryTableProps) {
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [filterOperator, setFilterOperator] = useState("");
  const [filterMachine, setFilterMachine] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [outOfSpecOnly, setOutOfSpecOnly] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Deletion states
  const [deleteTarget, setDeleteTarget] = useState<HasilTimbangan | "all" | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter application
  const filteredData = useMemo(() => {
    return sessions.filter((s) => {
      const stats = calculateWeighingStats(s);

      // Free text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          s.id.toLowerCase().includes(query) ||
          s.batch.toLowerCase().includes(query) ||
          s.nama_produk.toLowerCase().includes(query) ||
          s.operator.toLowerCase().includes(query) ||
          s.no_mesin.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      if (filterBatch && !s.batch.toLowerCase().includes(filterBatch.toLowerCase())) {
        return false;
      }

      if (filterOperator && !s.operator.toLowerCase().includes(filterOperator.toLowerCase())) {
        return false;
      }

      if (filterMachine && !s.no_mesin.toLowerCase().includes(filterMachine.toLowerCase())) {
        return false;
      }

      if (filterMethod && !s.metode_kemas.toLowerCase().includes(filterMethod.toLowerCase())) {
        return false;
      }

      if (dateFrom && s.jam.slice(0, 10) < dateFrom) {
        return false;
      }

      if (dateTo && s.jam.slice(0, 10) > dateTo) {
        return false;
      }

      if (outOfSpecOnly && stats.outRangeCount === 0) {
        return false;
      }

      return true;
    });
  }, [
    sessions,
    searchQuery,
    filterBatch,
    filterOperator,
    filterMachine,
    filterMethod,
    dateFrom,
    dateTo,
    outOfSpecOnly,
  ]);

  // Pagination slices
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterBatch("");
    setFilterOperator("");
    setFilterMachine("");
    setFilterMethod("");
    setDateFrom("");
    setDateTo("");
    setOutOfSpecOnly(false);
    setCurrentPage(1);
  };

  // Export CSV handler
  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (filterBatch) params.set("batch", filterBatch);
    if (filterOperator) params.set("operator", filterOperator);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    window.open(`/api/weighing/export?${params.toString()}`, "_blank");
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const url =
        deleteTarget === "all"
          ? "/api/weighing?clearAll=true"
          : `/api/weighing?id=${encodeURIComponent(deleteTarget.id)}`;

      const res = await fetch(url, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghapus data.");
      }
      setDeleteTarget(null);
      onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      setDeleteError(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari Batch, Nama Produk, Operator, No Mesin..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>

          {/* Action buttons: Solid (NO gradient) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showAdvancedFilters
                  ? "bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/30 text-sky-700 dark:text-sky-400"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter Spesifik</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            {user.role === "Admin" && sessions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setDeleteTarget("all");
                }}
                className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Hapus seluruh data penimbangan"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-150 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-in fade-in">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-sky-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-sky-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Filter Operator
              </label>
              <input
                type="text"
                value={filterOperator}
                onChange={(e) => {
                  setFilterOperator(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Nama Operator"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-sky-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                No. Mesin
              </label>
              <input
                type="text"
                value={filterMachine}
                onChange={(e) => {
                  setFilterMachine(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="MSN-01"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-sky-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Metode Kemas
              </label>
              <input
                type="text"
                value={filterMethod}
                onChange={(e) => {
                  setFilterMethod(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Standing Pouch"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-sky-600"
              />
            </div>

            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 px-3 py-2 rounded-lg text-xs text-rose-700 dark:text-rose-300 w-full">
                <input
                  type="checkbox"
                  checked={outOfSpecOnly}
                  onChange={(e) => {
                    setOutOfSpecOnly(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="truncate font-medium">Hanya Luar Batas</span>
              </label>

              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset Filter"
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Responsive Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Waktu (WIB)</th>
                <th className="py-3.5 px-4">Batch</th>
                <th className="py-3.5 px-4">Nama Produk</th>
                <th className="py-3.5 px-4">Operator</th>
                <th className="py-3.5 px-3">Mesin / Timbangan</th>
                <th className="py-3.5 px-3">Metode</th>
                <th className="py-3.5 px-3 text-center">Jml Timbang</th>
                <th className="py-3.5 px-3 text-center">Rata-Rata</th>
                <th className="py-3.5 px-4 text-center">Status Rentang</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800/80">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    Tidak ditemukan data hasil penimbangan yang sesuai dengan kriteria.
                  </td>
                </tr>
              ) : (
                paginatedData.map((session) => {
                  const stats = calculateWeighingStats(session);
                  const isAllInSpec = stats.outRangeCount === 0;

                  return (
                    <tr
                      key={session.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {session.jam}
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500">{session.id}</span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 px-2 py-0.5 rounded">
                          {session.batch}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                        {session.nama_produk}
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {session.operator}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {session.no_mesin} / {session.no_timbangan}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {session.metode_kemas}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-300">
                        {stats.count}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 dark:text-slate-200">
                        {stats.average} g
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isAllInSpec
                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                              : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                          }`}
                        >
                          {isAllInSpec ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> Dalam Batas
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" /> {stats.outRangeCount} Di Luar Batas
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectSession(session)}
                            className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 border border-sky-300 dark:border-sky-500/30 text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            title="Lihat Detail Penimbangan"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>
                          {user.role === "Admin" && (
                            <button
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteTarget(session);
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                              title="Hapus data sesi penimbangan ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Hapus</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div>
            Menampilkan{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            sampai{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {Math.min(currentPage * pageSize, filteredData.length)}
            </span>{" "}
            dari <span className="font-semibold text-slate-900 dark:text-white">{filteredData.length}</span> data
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {deleteTarget === "all" ? "Hapus Semua Data Penimbangan?" : "Hapus Sesi Penimbangan?"}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {deleteTarget === "all" ? (
                    <>
                      Seluruh <strong>{sessions.length}</strong> sesi penimbangan akan dihapus secara permanen dari sistem dan Google Sheets. Tindakan ini tidak dapat dibatalkan.
                    </>
                  ) : (
                    <>
                      Sesi dengan ID <strong className="font-mono text-slate-800 dark:text-slate-200">{deleteTarget.id}</strong> (Batch: <strong>{deleteTarget.batch}</strong>, Produk: <strong>{deleteTarget.nama_produk}</strong>) akan dihapus secara permanen.
                    </>
                  )}
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (!isDeleting) {
                    setDeleteTarget(null);
                    setDeleteError(null);
                  }
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
