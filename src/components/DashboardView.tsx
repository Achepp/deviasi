"use client";

import React, { useMemo } from "react";
import {
  Activity,
  Layers,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Clock,
  PlusCircle,
} from "lucide-react";
import { HasilTimbangan, AuthSession } from "@/types";
import { calculateWeighingStats } from "@/lib/utils";

interface DashboardViewProps {
  sessions: HasilTimbangan[];
  user: AuthSession;
  onNavigateToInput: () => void;
  onSelectSession: (session: HasilTimbangan) => void;
}

export default function DashboardView({
  sessions,
  user,
  onNavigateToInput,
  onSelectSession,
}: DashboardViewProps) {
  // Aggregate KPIs
  const kpis = useMemo(() => {
    let totalMeasurements = 0;
    let inRangeTotal = 0;
    let outRangeTotal = 0;
    const batchSet = new Set<string>();

    sessions.forEach((s) => {
      batchSet.add(s.batch);
      const st = calculateWeighingStats(s);
      totalMeasurements += st.count;
      inRangeTotal += st.inRangeCount;
      outRangeTotal += st.outRangeCount;
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

  // Recent 6 sessions
  const recentSessions = useMemo(() => {
    return [...sessions].slice(0, 6);
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner (Solid, no gradient) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-sky-700 dark:text-sky-400 text-xs font-semibold mb-3">
              <Activity className="w-3.5 h-3.5" />
              <span>Monitoring Produksi Real-Time</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Selamat datang, {user.nama}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
              Dashboard pencatatan penimbangan pengemasan terintegrasi Google Sheets. Pantau kepatuhan berat produk dan catat sesi baru dengan cepat.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Solid Button (NO gradient) */}
            <button
              onClick={onNavigateToInput}
              className="px-5 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-sm shadow-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Input Penimbangan Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Sesi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm">
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
              {kpis.totalSessions}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Sesi tercatat di database</p>
          </div>
        </div>

        {/* Total Pengukuran */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm">
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
              {kpis.totalMeasurements}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Titik data pengukuran</p>
          </div>
        </div>

        {/* Total Batch */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm">
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
              {kpis.uniqueBatches}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Batch unik diproduksi</p>
          </div>
        </div>

        {/* Dalam Batas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm">
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
              {kpis.inRangeTotal}
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 mt-1">
              {kpis.complianceRate}% tingkat lolos QC
            </p>
          </div>
        </div>

        {/* Di Luar Batas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm col-span-2 sm:col-span-1">
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
              {kpis.outRangeTotal}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Perlu evaluasi kalibrasi</p>
          </div>
        </div>
      </div>

      {/* QC Compliance Progress Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              Kepatuhan Standar Penimbangan (QC Compliance)
            </span>
          </div>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{kpis.complianceRate}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${kpis.complianceRate}%` }}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-500"
            style={{ width: `${100 - kpis.complianceRate}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Sesuai Standar: {kpis.inRangeTotal} data
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Di Luar Standar: {kpis.outRangeTotal} data
          </span>
        </div>
      </div>

      {/* Recent Sessions Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              Aktivitas Penimbangan Terbaru
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan {recentSessions.length} sesi terakhir
          </span>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-500">
            <Scale className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
            <p className="text-sm">Belum ada data penimbangan.</p>
            <button
              onClick={onNavigateToInput}
              className="mt-3 text-xs text-sky-600 dark:text-sky-400 hover:underline"
            >
              Mulai input sesi pertama sekarang →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-150 dark:divide-slate-800/80">
            {recentSessions.map((session) => {
              const st = calculateWeighingStats(session);
              const isAllInSpec = st.outRangeCount === 0;

              return (
                <div
                  key={session.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
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

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => onSelectSession(session)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Lihat Detail</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
