"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  RotateCcw,
  Clock,
  Filter,
} from "lucide-react";
import { HasilTimbangan } from "@/types";
import { calculateWeighingStats } from "@/lib/utils";
import SessionDetailModal from "@/components/SessionDetailModal";

export default function OperatorHistoryPage() {
  const [sessions, setSessions] = useState<HasilTimbangan[]>([]);
  const [search, setSearch] = useState("");
  const [outOfSpecOnly, setOutOfSpecOnly] = useState(false);
  const [selectedSession, setSelectedSession] = useState<HasilTimbangan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/weighing");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSessions(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const st = calculateWeighingStats(s);

      if (outOfSpecOnly && st.outRangeCount === 0) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.batch.toLowerCase().includes(q) ||
          s.nama_produk.toLowerCase().includes(q) ||
          s.no_mesin.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sessions, search, outOfSpecOnly]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Riwayat Penimbangan
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Daftar sesi penimbangan produk yang tercatat di Google Sheets.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari No Batch, Nama Produk, atau Mesin..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setOutOfSpecOnly(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                !outOfSpecOnly
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              }`}
            >
              Semua ({sessions.length})
            </button>
            <button
              type="button"
              onClick={() => setOutOfSpecOnly(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                outOfSpecOnly
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Luar Batas</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchSessions}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer text-xs font-medium"
            title="Segarkan riwayat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Card List View (Mobile-First responsive cards, NO wide horizontal scroll tables) */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Memuat riwayat penimbangan...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
            {search || outOfSpecOnly
              ? "Tidak ditemukan data penimbangan yang cocok dengan filter."
              : "Belum ada sesi penimbangan yang tercatat."}
          </div>
        ) : (
          filtered.map((session) => {
            const st = calculateWeighingStats(session);
            const isAllInSpec = st.outRangeCount === 0;

            return (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="p-3.5 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 shadow-xs cursor-pointer transition-all active:scale-[0.99]"
              >
                {/* Header: Batch & Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-2 py-0.5 rounded">
                    {session.batch}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isAllInSpec
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                        : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                    }`}
                  >
                    {isAllInSpec ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Dalam Toleransi
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" /> {st.outRangeCount} Luar Toleransi
                      </>
                    )}
                  </span>
                </div>

                {/* Product Name */}
                <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                  {session.nama_produk}
                </p>

                {/* Grid Parameters: Mesin, Terisi, Rata-Rata */}
                <div className="grid grid-cols-3 gap-2 py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase font-semibold">Mesin</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{session.no_mesin}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[9px] text-slate-400 uppercase font-semibold">Terisi</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">{st.count} / 15</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] text-slate-400 uppercase font-semibold">Rata-Rata</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{st.average} g</span>
                  </div>
                </div>

                {/* Footer: Timestamp & Action indicator */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span className="font-mono text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{session.jam}</span>
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5 text-xs">
                    <span>Detail</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      <SessionDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
}
