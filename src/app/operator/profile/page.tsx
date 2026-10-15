"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Edit3,
  LogOut,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Clock,
  IdCard,
  User,
  X,
  Check,
} from "lucide-react";
import { AuthSession } from "@/types";

export default function OperatorProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthSession | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [editName, setEditName] = useState("Hermanto");
  const [editEmail, setEditEmail] = useState("hermanto@deviasi.my.id");
  const [showToast, setShowToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.user) {
          setUser(json.user);
          if (json.user.nama) setEditName(json.user.nama);
          if (json.user.email) setEditEmail(json.user.email);
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      triggerToast("Foto profil berhasil diperbarui");
    }
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast(null);
    }, 3000);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      setUser({
        ...user,
        nama: editName,
        email: editEmail,
      });
    }
    setIsEditModalOpen(false);
    triggerToast("Data profil berhasil diperbarui");
  };

  // Default values matching company operational requirements
  const displayName = user?.nama || "Hermanto";
  const displayUserId = user?.userId || "USR-002";
  const displayEmail = user?.email || "hermanto@deviasi.my.id";
  const displayRole = "Operator Produksi";
  const displayStatus = "Aktif";
  const lastLogin = "15 Okt 2026, 23:28";

  // Initial letter
  const initialLetter = displayName.charAt(0).toUpperCase() || "H";

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Page Heading */}
      <div className="px-0.5">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Profil Operator
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
          Informasi identitas dan konfigurasi akun operasional.
        </p>
      </div>

      {/* Hidden File Input for Ubah Foto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoSelect}
        accept="image/*"
        className="hidden"
      />

      {/* 1. LARGE PROFILE CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] flex flex-col items-center text-center relative overflow-hidden transition-colors">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-50 dark:bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Big Circular Avatar with "H" & Online Indicator */}
        <div className="relative mt-1 mb-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-blue-600 to-blue-700 text-white font-bold text-3xl sm:text-4xl flex items-center justify-center shadow-md shadow-blue-600/20 ring-4 ring-blue-50 dark:ring-blue-950/40 select-none overflow-hidden">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initialLetter}</span>
            )}
          </div>

          {/* Green Online Indicator */}
          <div
            className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2.5 border-white dark:border-slate-900 flex items-center justify-center shadow-xs ring-2 ring-emerald-400/20"
            title="Status: Online"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>
        </div>

        {/* Name */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          {displayName}
        </h3>

        {/* Badges: Operator Produksi & Aktif */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{displayRole}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{displayStatus}</span>
          </span>
        </div>

        {/* Meta Identitas (User ID & Email) */}
        <div className="mt-3.5 flex flex-col items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <IdCard className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">User ID:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
              {displayUserId}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-300">
              {displayEmail}
            </span>
          </div>
        </div>

        {/* Tombol Biru Ubah Foto */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold shadow-xs shadow-blue-600/25 transition-all cursor-pointer active:scale-98 select-none"
        >
          <Camera className="w-4 h-4" />
          <span>Ubah Foto</span>
        </button>
      </div>

      {/* 2. CARD INFORMASI AKUN */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] space-y-4 transition-colors">
        {/* Header Card dengan Tombol Edit di Kanan Atas */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
              Informasi Akun
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Data identitas operator dalam sistem
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-xs font-semibold transition-colors cursor-pointer select-none"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        </div>

        {/* List Informasi */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
          {/* User ID */}
          <div className="py-2.5 first:pt-0 flex items-center justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              User ID
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-xs">
              {displayUserId}
            </span>
          </div>

          {/* Email Akun */}
          <div className="py-2.5 flex items-center justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Email Akun
            </span>
            <span className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[210px] text-right">
              {displayEmail}
            </span>
          </div>

          {/* Role */}
          <div className="py-2.5 flex items-center justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Role
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {displayRole}
            </span>
          </div>

          {/* Status Akun */}
          <div className="py-2.5 flex items-center justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Status Akun
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{displayStatus}</span>
            </span>
          </div>

          {/* Login Terakhir */}
          <div className="py-2.5 last:pb-0 flex items-center justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Login terakhir
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{lastLogin}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. TOMBOL BESAR LOGOUT */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200/80 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200/80 dark:border-rose-500/30 flex items-center gap-3.5 transition-all cursor-pointer select-none text-left shadow-xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {isLoggingOut ? (
              <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-sm text-rose-700 dark:text-rose-300 leading-tight">
              Keluar dari Aplikasi (Logout)
            </h5>
            <p className="text-[11px] text-rose-500/90 dark:text-rose-400/80 mt-0.5">
              Akhiri sesi dan keluar dari sistem
            </p>
          </div>
        </button>
      </div>

      {/* MODAL EDIT INFORMASI */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Edit Data Operator
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nama Operator
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Email Akun
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  User ID (Read-only)
                </label>
                <input
                  type="text"
                  value={displayUserId}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-500 font-mono cursor-not-allowed select-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
