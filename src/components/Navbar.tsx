"use client";

import React, { useState, useEffect } from "react";
import { User, LogOut, Wifi, WifiOff, Database, ShieldCheck, UserCheck } from "lucide-react";
import { AuthSession } from "@/types";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  user: AuthSession;
  onLogout: () => void;
  storageInfo?: {
    type: "google_sheets" | "local" | "google_sheets_error";
    spreadsheetTitle?: string;
  };
}

export default function Navbar({ user, onLogout, storageInfo }: NavbarProps) {
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

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white sticky top-0 z-40 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
                <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
                <path d="M7 21h10" />
                <path d="M12 3v18" />
                <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                  Weighing Dashboard
                </h1>
                <span className="text-[10px] font-semibold bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-500/30 px-1.5 py-0.5 rounded uppercase">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                Packaging Weighing & Quality Control System
              </p>
            </div>
          </div>

          {/* Right Status Indicators, Theme Toggle & User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Storage Status Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Database className={`w-3.5 h-3.5 ${storageInfo?.type === "google_sheets" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`} />
              <span className="text-slate-700 dark:text-slate-300">
                {storageInfo?.type === "google_sheets" ? "Google Sheets Online" : "Local Storage Mode"}
              </span>
            </div>

            {/* Network Online/Offline Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline text-slate-700 dark:text-slate-300">Online</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="text-rose-600 dark:text-rose-300">Offline</span>
                </>
              )}
            </div>

            {/* Dark/Light Theme Toggle */}
            <ThemeToggle />

            {/* User Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-tight">{user.nama}</p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  {user.role === "Admin" ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-300 dark:border-amber-500/20">
                      <ShieldCheck className="w-3 h-3" /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-300 dark:border-sky-500/20">
                      <UserCheck className="w-3 h-3" /> Operator
                    </span>
                  )}
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <User className="w-4 h-4" />
              </div>

              <button
                onClick={onLogout}
                title="Keluar"
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
