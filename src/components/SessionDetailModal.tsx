"use client";

import React from "react";
import { X, Scale } from "lucide-react";
import { HasilTimbangan } from "@/types";
import { calculateWeighingStats } from "@/lib/utils";

interface SessionDetailModalProps {
  session: HasilTimbangan | null;
  onClose: () => void;
}

export default function SessionDetailModal({ session, onClose }: SessionDetailModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!session) return null;

  const stats = calculateWeighingStats(session);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Detail Sesi Penimbangan
              </h3>
              <p className="text-xs font-mono text-sky-600 dark:text-sky-400 mt-0.5">{session.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Kode Batch</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{session.batch}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Nama Produk</span>
              <span className="font-semibold text-slate-900 dark:text-white text-sm">{session.nama_produk}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Operator</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{session.operator}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">({session.operator_id})</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Waktu Simpan (WIB)</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{session.jam}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Metode Kemas</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{session.metode_kemas}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">No. Mesin</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{session.no_mesin}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">No. Timbangan</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{session.no_timbangan}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Rentang Standar (Lower: Upper)</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {session.lower} - {session.upper} g
              </span>
            </div>
          </div>

          {/* Statistical Calculations */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Hasil Perhitungan Statistik
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Jumlah Terisi</span>
                <p className="text-lg font-bold text-sky-600 dark:text-sky-400">
                  {stats.count} <span className="text-xs text-slate-400 font-normal">/ 15</span>
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Rata-Rata</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">{stats.average} g</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Min / Max</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono mt-1">
                  {stats.min} / {stats.max} g
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Dalam Batas</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.inRangeCount}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Di Luar Batas</span>
                <p className={`text-lg font-bold ${stats.outRangeCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400"}`}>
                  {stats.outRangeCount}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Tingkat Kesesuaian</span>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {stats.count > 0 ? Math.round((stats.inRangeCount / stats.count) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Full 15 Weighing Results Visual Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Rincian 15 Pengukuran (Timbang 1 s/d 15)
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {Array.from({ length: 15 }, (_, i) => {
                const key = `timbang_${i + 1}` as keyof HasilTimbangan;
                const rawVal = session[key];
                const hasVal = rawVal !== null && rawVal !== undefined && rawVal !== "" && !isNaN(Number(rawVal));
                const num = Number(rawVal);
                const inRange = hasVal ? num >= session.lower && num <= session.upper : true;

                return (
                  <div
                    key={i}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      !hasVal
                        ? "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60 opacity-60"
                        : inRange
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/40"
                        : "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/50"
                    }`}
                  >
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                      T{i + 1}
                    </span>
                    <p className={`text-sm font-bold font-mono ${
                      !hasVal
                        ? "text-slate-400 dark:text-slate-600"
                        : inRange
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-rose-700 dark:text-rose-300"
                    }`}>
                      {hasVal ? num : "-"}
                    </p>
                    <span className="text-[9px] font-semibold block mt-0.5">
                      {!hasVal ? (
                        <span className="text-slate-400 dark:text-slate-600">Kosong</span>
                      ) : inRange ? (
                        <span className="text-emerald-600 dark:text-emerald-400">OK</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">OUT</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
