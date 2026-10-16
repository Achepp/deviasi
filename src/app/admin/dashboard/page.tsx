"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Clock,
  Eye,
} from "lucide-react";
import { HasilTimbangan } from "@/types";
import { calculateWeighingStats } from "@/lib/utils";
import SessionDetailModal from "@/components/SessionDetailModal";
import WeighingTrendChart from "@/components/admin/WeighingTrendChart";

export default function AdminDashboardPage() {
  const [sessions, setSessions] = useState<HasilTimbangan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<HasilTimbangan | null>(null);

  useEffect(() => {
    fetch("/api/weighing")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setSessions(json.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  // Compute metrics from actual Google Sheets data for the 5 KPI cards
  const kpis = React.useMemo(() => {
    let totalMeasurements = 0;
    let inRangeTotal = 0;
    let outRangeTotal = 0;
    const batchSet = new Set<string>();

    sessions.forEach((s) => {
      const st = calculateWeighingStats(s);
      totalMeasurements += st.count;
      inRangeTotal += st.inRangeCount;
      outRangeTotal += st.outRangeCount;
      if (s.batch) batchSet.add(s.batch);
    });

    const complianceRate =
      totalMeasurements > 0 ? Math.round((inRangeTotal / totalMeasurements) * 100) : 100;

    return {
      totalSessions: sessions.length,
      totalMeasurements,
      uniqueBatches: batchSet.size,
      inRangeTotal,
      outRangeTotal,
      complianceRate,
    };
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Ringkasan Monitoring Deviasi
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/weighing"
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Scale className="w-4 h-4" />
            <span>Lihat Semua Data</span>
          </Link>

          <Link
            href="/admin/reports"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Laporan</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Sesi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Sesi
            </span>
            <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isLoading ? "-" : kpis.totalSessions}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Sesi terdata</p>
          </div>
        </div>

        {/* Total Timbang */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Timbang
            </span>
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Scale className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isLoading ? "-" : kpis.totalMeasurements}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Titik pengukuran</p>
          </div>
        </div>

        {/* Total Batch */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Batch
            </span>
            <span className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isLoading ? "-" : kpis.uniqueBatches}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Batch unik</p>
          </div>
        </div>

        {/* Dalam Batas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Dalam Batas
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {isLoading ? "-" : kpis.inRangeTotal}
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 mt-1">
              {kpis.complianceRate}% lolos QC
            </p>
          </div>
        </div>

        {/* Di Luar Batas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Di Luar Batas
            </span>
            <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className={`text-2xl sm:text-3xl font-black tracking-tight ${kpis.outRangeTotal > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400"}`}>
              {isLoading ? "-" : kpis.outRangeTotal}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Perlu perhatian</p>
          </div>
        </div>
      </div>

      {/* Visualisasi Utama: Tren Hasil Penimbangan (Line Chart) */}
      <WeighingTrendChart sessions={sessions} isLoading={isLoading} />

      {/* Recent Sessions Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              Aktivitas Penimbangan Terbaru
            </h3>
          </div>
          <Link
            href="/admin/weighing"
            className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Seluruh Data ({sessions.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-xs">Belum ada data penimbangan tersimpan.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-150 dark:divide-slate-800/80">
            {sessions.slice(0, 5).map((session) => {
              const st = calculateWeighingStats(session);
              const isAllInSpec = st.outRangeCount === 0;

              return (
                <div
                  key={session.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                        {session.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {session.batch}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isAllInSpec
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                          : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                      }`}>
                        {isAllInSpec ? "Lolos Standar" : `${st.outRangeCount} Di Luar Standar`}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                      {session.nama_produk}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Operator: <strong className="text-slate-700 dark:text-slate-300">{session.operator}</strong></span>
                      <span>•</span>
                      <span>Mesin: <strong className="text-slate-700 dark:text-slate-300">{session.no_mesin}</strong></span>
                      <span>•</span>
                      <span>Rata-rata: <strong className="text-slate-700 dark:text-slate-300 font-mono">{st.average} g</strong> ({st.count} data)</span>
                      <span>•</span>
                      <span>Waktu: <strong className="font-mono text-slate-600 dark:text-slate-400">{session.jam}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedSession(session)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1 self-end sm:self-auto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detail</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SessionDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
}
