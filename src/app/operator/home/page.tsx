"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Calendar,
  Database,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { HasilTimbangan } from "@/types";
import { calculateWeighingStats } from "@/lib/utils";

export default function OperatorHomePage() {
  const [sessions, setSessions] = useState<HasilTimbangan[]>([]);
  const [userName, setUserName] = useState("Operator");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.user) {
          setUserName(json.user.nama);
        }
      })
      .catch(() => {});

    fetch("/api/weighing")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setSessions(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Format today's date in Indonesian locale (e.g. "Selasa, 13 Oktober 2026")
  const todayDateFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  // Calculate today's stats (Asia/Jakarta date prefix YYYY-MM-DD)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter((s) => s.jam.startsWith(todayStr));
  let todayMeasurementsCount = 0;
  let todayInSpecCount = 0;

  todaySessions.forEach((s) => {
    const st = calculateWeighingStats(s);
    todayMeasurementsCount += st.count;
    if (st.outRangeCount === 0) {
      todayInSpecCount++;
    }
  });

  const recentSessions = sessions.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* 1. Sapaan Operator & Tanggal */}
      <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{todayDateFormatted}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Shift Aktif
          </span>
        </div>

        <div className="mt-2.5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Selamat bertugas,</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
            {userName}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Catat hasil penimbangan produk di area pengemasan secara digital.
          </p>
        </div>
      </div>

      {/* 2. Tombol Utama Besar: Input Hasil Penimbangan */}
      <Link
        href="/operator/input"
        className="w-full py-4 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-base shadow-sm flex items-center justify-center gap-3 transition-colors cursor-pointer select-none text-center"
      >
        <PlusCircle className="w-6 h-6 stroke-[2.5]" />
        <span>Input Hasil Penimbangan</span>
      </Link>

      {/* 3. Ringkasan Aktivitas Operasional Hari Ini */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
              Sesi Hari Ini
            </span>
            <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {isLoading ? "-" : todaySessions.length}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">Sesi tersimpan</span>
        </div>

        <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
              Total Titik Timbang
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {isLoading ? "-" : todayMeasurementsCount}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">Pengukuran terisi</span>
        </div>
      </div>

      {/* Status Sinkronisasi Google Sheets */}
      

      {/* 4. Aktivitas Penimbangan Terbaru (Kartu Mobile) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Aktivitas Penimbangan Terbaru</span>
          </h3>
          <Link
            href="/operator/history"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-0.5"
          >
            <span>Semua</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
            Memuat aktivitas penimbangan...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
            Belum ada aktivitas penimbangan yang tersimpan.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentSessions.map((session) => {
              const st = calculateWeighingStats(session);
              const isAllInSpec = st.outRangeCount === 0;

              return (
                <div
                  key={session.id}
                  className="p-3.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-2 py-0.5 rounded">
                      {session.batch}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                        isAllInSpec
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                          : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                      }`}
                    >
                      {isAllInSpec ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Standar Terpenuhi
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" /> {st.outRangeCount} Luar Toleransi
                        </>
                      )}
                    </span>
                  </div>

                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {session.nama_produk}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <span>Mesin: <strong className="text-slate-700 dark:text-slate-300">{session.no_mesin}</strong></span>
                    <span><strong className="text-slate-700 dark:text-slate-300">{st.count}</strong> nilai terisi</span>
                    <span className="font-mono text-[10px]">{session.jam.slice(11, 16)} WIB</span>
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
