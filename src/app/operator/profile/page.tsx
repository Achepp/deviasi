"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  LogOut,
  Mail,
  IdCard,
  Palette,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
} from "lucide-react";
import { AuthSession } from "@/types";
import ThemeToggle from "@/components/ThemeToggle";

export default function OperatorProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthSession | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.user) {
          setUser(json.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  // User initials
  const initials = (user?.nama || "OP")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Profil Operator
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Informasi identitas dan konfigurasi akun operasional.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Header Profile Identity */}
        <div className="flex items-center gap-3.5 pb-3.5 border-b border-slate-150 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-base shadow-xs shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
              {user?.nama || "Operator"}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/20">
                <ShieldCheck className="w-3 h-3" /> Role: Operator Produksi
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Account Details List */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <IdCard className="w-4 h-4 text-slate-400" />
              <span>User ID</span>
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {user?.userId || "-"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>Email Akun</span>
            </span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {user?.email || "-"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <span>Sistem Database</span>
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Google Sheets (Packaging)
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Palette className="w-4 h-4 text-slate-400" />
              <span>Tema Aplikasi</span>
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer select-none"
        >
          {isLoggingOut ? (
            <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span>Keluar dari Aplikasi (Logout)</span>
        </button>
      </div>
    </div>
  );
}
