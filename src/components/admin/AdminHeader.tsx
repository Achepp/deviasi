"use client";

import React, { useState, useEffect } from "react";
import { Menu, User, LogOut, Wifi, WifiOff, Database, ShieldCheck } from "lucide-react";
import { AuthSession } from "@/types";
import ThemeToggle from "@/components/ThemeToggle";
import { useRouter } from "next/navigation";

interface AdminHeaderProps {
  user: AuthSession;
  onOpenSidebar: () => void;
  title?: string;
}

export default function AdminHeader({ user, onOpenSidebar, title }: AdminHeaderProps) {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    fetch("/api/system/status")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStorageInfo(json.status);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
          aria-label="Buka Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
            {title || "Panel Administrator"}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            Packaging Weighing Quality Control & Monitoring
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Storage status pill */}
        

        {/* Network indicator */}
        

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              {user.nama}
            </p>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-300 dark:border-amber-500/20">
              <ShieldCheck className="w-3 h-3" /> Admin
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <User className="w-4 h-4" />
          </div>

          <button
            onClick={handleLogout}
            title="Keluar"
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
