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

  // Get initials from user name (e.g. "Budi Santoso" -> "BS")
  const initials = (user.nama || "OP")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-3.5 sm:px-5 h-14 flex items-center justify-between transition-colors shadow-xs">
      {/* Brand Identity */}
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

      {/* Right Controls: Online Pill, Theme Toggle, Profile Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Connection status pill */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isOnline
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
              : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
          }`}
          title={isOnline ? "Koneksi Terhubung" : "Koneksi Terputus (Offline)"}
        >
          {isOnline ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden xs:inline">Online</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="hidden xs:inline">Offline</span>
            </>
          )}
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Operator Profile Avatar Link */}
        <Link
          href="/operator/profile"
          className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
          title={`Profil Operator: ${user.nama}`}
        >
          {initials}
        </Link>
      </div>
    </header>
  );
}
