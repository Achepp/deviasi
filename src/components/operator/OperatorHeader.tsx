"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Scale, Wifi, WifiOff, User } from "lucide-react";
import { AuthSession } from "@/types";
import ThemeToggle from "@/components/ThemeToggle";

interface OperatorHeaderProps {
  user: AuthSession;
  title?: string;
}

export default function OperatorHeader({ user, title }: OperatorHeaderProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Get initials from user name (e.g. "Hermanto" -> "H")
  const initials = (user.nama?.trim() ? user.nama.charAt(0) : "H").toUpperCase();

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-3.5 sm:px-5 h-14 flex items-center justify-between transition-colors shadow-xs">
      {/* Brand Identity: Logo di kiri, Judul, Subtitle */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Scale className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-sm text-slate-900 dark:text-white leading-tight truncate">
            {title || "Deviasi QC"}
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5 truncate font-medium">
            Packaging Quality Control
          </p>
        </div>
      </div>

      {/* Right Controls: Online Pill, Theme Toggle (Moon Icon), Profile Avatar (H) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Status Online dengan indikator hijau */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
            isOnline
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-500/20"
              : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
          }`}
          title={isOnline ? "Koneksi Terhubung (Online)" : "Koneksi Terputus (Offline)"}
        >
          {isOnline ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Tombol dark mode berbentuk icon bulan */}
        <ThemeToggle />

        {/* Avatar kecil berisi huruf "H" */}
        <Link
          href="/operator/profile"
          className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center text-xs font-bold transition-all shadow-xs cursor-pointer select-none active:scale-95"
          title={`Profil Operator: ${user.nama || "Hermanto"}`}
        >
          {initials}
        </Link>
      </div>
    </header>
  );
}
