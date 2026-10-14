"use client";

import React, { useState, useEffect } from "react";
import { Database, CheckCircle2, AlertCircle, RefreshCw, FileSpreadsheet, HelpCircle } from "lucide-react";
import { AuthSession } from "@/types";

interface SystemStatusViewProps {
  user: AuthSession;
  onRefreshStorageStatus?: () => void;
}

export default function SystemStatusView({ user, onRefreshStorageStatus }: SystemStatusViewProps) {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initResult, setInitResult] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    setInitResult(null);
    try {
      const res = await fetch("/api/system/status");
      const json = await res.json();
      if (json.success) {
        setStatus(json.status);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleInitSheets = async () => {
    setIsInitializing(true);
    setInitResult(null);
    try {
      const res = await fetch("/api/system/status", { method: "POST" });
      const json = await res.json();
      setInitResult(json.message);
      if (onRefreshStorageStatus) onRefreshStorageStatus();
      fetchStatus();
    } catch (err: unknown) {
      const error = err as Error;
      setInitResult(`Gagal: ${error.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Status Penyimpanan & Integrasi Google Sheets</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitoring status database cloud dan panduan konfigurasi API.
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          disabled={isLoading}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Status Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
          Status Mode Database Saat Ini
        </h3>

        {isLoading ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">Memeriksa koneksi server...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {status?.type === "google_sheets" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : status?.type === "google_sheets_error" ? (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {status?.type === "google_sheets"
                    ? "Terhubung ke Google Sheets API"
                    : status?.type === "google_sheets_error"
                    ? "Gagal Menghubungkan Google Sheets"
                    : "Mode Database Lokal (Offline-Ready Demo)"}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">{status?.message}</p>
                {status?.sheetId && (
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    Spreadsheet ID: <span className="text-sky-600 dark:text-sky-400">{status.sheetId}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Admin Action: Initialize Google Sheet Headers */}
            {user.role === "Admin" && status?.configured && (
              <div className="pt-2">
                <button
                  onClick={handleInitSheets}
                  disabled={isInitializing}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isInitializing ? "Menginisialisasi..." : "Inisialisasi Header Sheet (A1:Z1)"}</span>
                </button>
                {initResult && (
                  <p className="mt-2 text-xs text-sky-700 dark:text-sky-300 font-medium">{initResult}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guide for Connecting Google Sheets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
          <HelpCircle className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Langkah Menghubungkan Google Spreadsheet Anda</span>
        </div>

        <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300">
          <li>
            Buka <strong className="text-slate-900 dark:text-white">Google Cloud Console</strong> & buat Project baru.
          </li>
          <li>
            Aktifkan API: <strong className="text-slate-900 dark:text-white">Google Sheets API</strong> & <strong className="text-slate-900 dark:text-white">Google Drive API</strong>.
          </li>
          <li>
            Buat <strong className="text-slate-900 dark:text-white">Service Account</strong> dan unduh kunci dalam format JSON.
          </li>
          <li>
            Buat Spreadsheet baru di Google Sheets dengan 3 tab: <code className="bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded text-sky-600 dark:text-sky-400">Master_Produk</code>, <code className="bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded text-sky-600 dark:text-sky-400">Users</code>, dan <code className="bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded text-sky-600 dark:text-sky-400">Hasil_Timbangan</code>.
          </li>
          <li>
            Bagikan (Share) spreadsheet Anda ke alamat email Service Account sebagai <strong className="text-slate-900 dark:text-white">Editor</strong>.
          </li>
          <li>
            Buka file <code className="bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded text-sky-600 dark:text-sky-400">.env.local</code> pada proyek ini, lalu masukkan kredensial Service Account.
          </li>
        </ol>
      </div>
    </div>
  );
}
