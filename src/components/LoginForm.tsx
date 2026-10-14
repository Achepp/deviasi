"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Scale,
  Shield,
  User,
  LogIn,
  CheckCircle2,
  FileSpreadsheet,
  Activity,
  X,
  Info,
  HelpCircle,
} from "lucide-react";
import { AuthSession } from "@/types";
import ThemeToggle from "./ThemeToggle";

interface LoginFormProps {
  onLoginSuccess: (user: AuthSession) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Restore remembered identifier on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("weighing_saved_identifier");
      if (savedUser) {
        setIdentifier(savedUser);
        setRememberMe(true);
      }
    } catch {
      // LocalStorage access might fail in restricted environments
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage("Silakan lengkapi NPK / Email dan kata sandi.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Gagal masuk. Periksa kembali kredensial Anda.");
        setLoading(false);
        return;
      }

      // Handle remember me safely
      try {
        if (rememberMe) {
          localStorage.setItem("weighing_saved_identifier", identifier.trim());
        } else {
          localStorage.removeItem("weighing_saved_identifier");
        }
      } catch {
        // ignore
      }

      onLoginSuccess(data.user);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(`Terjadi gangguan koneksi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (type: "admin" | "operator") => {
    if (type === "admin") {
      setIdentifier("admin@packaging.local");
      setPassword("admin123");
    } else {
      setIdentifier("budi@packaging.local");
      setPassword("operator123");
    }
    setErrorMessage("");
  };

  const handleClearIdentifier = () => {
    setIdentifier("");
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 bg-[#F3F8FE] dark:bg-[#070D18] text-[#102344] dark:text-slate-100 transition-colors selection:bg-[#087ED0]/20 selection:text-[#087ED0]">
      {/* Background Industrial Decorative Elements */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#087ED0]/10 dark:bg-sky-500/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#087ED0]/10 dark:bg-sky-500/5 blur-3xl" />
        <svg
          className="absolute inset-0 w-full h-full stroke-slate-300/40 dark:stroke-slate-800/40 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="industrial-grid-component"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path d="M0 48L48 0M0 0h48v48H0z" fill="none" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#industrial-grid-component)" />
        </svg>
      </div>

      {/* Top Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between mb-4 z-20 px-2 sm:px-0">
        <div className="flex items-center gap-2 text-xs font-medium text-[#60748F] dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-[#DCE6F2] dark:border-slate-800 px-3 py-1.5 rounded-full shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sistem Siap Operasi</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-5xl z-10">
        <div className="bg-white dark:bg-slate-900 border border-[#DCE6F2] dark:border-slate-800/80 rounded-[24px] sm:rounded-[28px] shadow-xl dark:shadow-2xl overflow-hidden flex flex-col lg:flex-row">
          {/* LEFT PANEL */}
          <section className="lg:w-[44%] bg-gradient-to-br from-[#087ED0] via-[#076EB6] to-[#0A4B82] text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                    Packaging Weighing
                  </h1>
                  <p className="text-xs sm:text-sm text-sky-100/90 font-medium tracking-wide">
                    Quality Control & Monitoring
                  </p>
                </div>
              </div>

              <p className="text-sm text-sky-100/90 leading-relaxed mb-6">
                Pencatatan hasil penimbangan produk setelah pengemasan secara digital dan terintegrasi.
              </p>

              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-white">Akurat:</span>{" "}
                    <span className="text-sky-100/90">Pencatatan hasil timbang yang valid.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <FileSpreadsheet className="w-4 h-4 text-sky-200" />
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-white">Terintegrasi:</span>{" "}
                    <span className="text-sky-100/90">Sinkron dengan Google Sheets.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-4 h-4 text-amber-200" />
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-white">Mudah Dipantau:</span>{" "}
                    <span className="text-sky-100/90">Monitoring kualitas secara terstruktur.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Industrial SVG Illustration */}
            <div className="relative z-10 mt-8 pt-4 border-t border-white/15">
              <div className="w-full bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl p-4 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-medium text-sky-100 mb-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Lini Pengemasan & Penimbangan Aktif
                  </span>
                  <span className="font-mono text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                    QC LINE-01
                  </span>
                </div>

                <svg
                  viewBox="0 0 380 150"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-auto drop-shadow-md select-none"
                  role="img"
                  aria-label="Ilustrasi konveyor pengemasan dan timbangan digital"
                >
                  <ellipse cx="190" cy="140" rx="170" ry="8" fill="rgba(0,0,0,0.18)" />
                  <rect x="50" y="88" width="8" height="46" rx="2" fill="#E2E8F0" />
                  <rect x="130" y="88" width="8" height="46" rx="2" fill="#CBD5E1" />
                  <rect x="238" y="88" width="8" height="46" rx="2" fill="#CBD5E1" />
                  <rect x="318" y="88" width="8" height="46" rx="2" fill="#E2E8F0" />
                  <rect x="30" y="80" width="320" height="14" rx="4" fill="#334155" />
                  <rect x="34" y="82" width="312" height="10" rx="2" fill="#475569" />
                  <circle cx="50" cy="87" r="4" fill="#94A3B8" />
                  <circle cx="80" cy="87" r="4" fill="#94A3B8" />
                  <circle cx="110" cy="87" r="4" fill="#94A3B8" />
                  <circle cx="140" cy="87" r="4" fill="#94A3B8" />
                  <circle cx="240" cy="87" r="4" fill="#94A3B8" />
                  <circle cx="270" cy="87" r="4" fill="#94A3B8" />
                  <circle cx="300" cy="87" r="4" fill="#94A3B8" />
                  <circle cx="330" cy="87" r="4" fill="#94A3B8" />
                  <g id="component-scale">
                    <rect x="160" y="74" width="76" height="12" rx="3" fill="#0F172A" />
                    <rect x="162" y="76" width="72" height="8" rx="2" fill="#1E293B" />
                    <rect x="156" y="68" width="84" height="6" rx="2" fill="#F1F5F9" />
                    <rect x="158" y="69" width="80" height="2" fill="#FFFFFF" />
                    <rect x="234" y="32" width="5" height="40" rx="1.5" fill="#64748B" />
                    <rect x="214" y="16" width="46" height="26" rx="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                    <rect x="217" y="19" width="40" height="20" rx="2" fill="#021526" />
                    <text x="220" y="29" fill="#38BDF8" fontSize="6.5" fontFamily="monospace" fontWeight="bold">
                      500.00g
                    </text>
                    <rect x="220" y="32" width="16" height="5" rx="1" fill="#10B981" />
                    <text x="222" y="36" fill="#FFFFFF" fontSize="4.5" fontFamily="sans-serif" fontWeight="bold">
                      PASS
                    </text>
                  </g>
                  <g id="component-carton-on-scale">
                    <rect x="175" y="32" width="46" height="36" rx="3" fill="#D97706" />
                    <path d="M175 32 L198 22 L221 32 Z" fill="#F59E0B" />
                    <rect x="175" y="32" width="23" height="36" fill="#B45309" opacity="0.15" />
                    <rect x="194" y="24" width="8" height="44" rx="1" fill="#FEF3C7" opacity="0.85" />
                    <rect x="180" y="44" width="18" height="12" rx="1.5" fill="#FFFFFF" />
                    <line x1="183" y1="47" x2="183" y2="53" stroke="#0F172A" strokeWidth="1" />
                    <line x1="186" y1="47" x2="186" y2="53" stroke="#0F172A" strokeWidth="1.5" />
                    <line x1="190" y1="47" x2="190" y2="53" stroke="#0F172A" strokeWidth="0.8" />
                    <line x1="193" y1="47" x2="193" y2="53" stroke="#0F172A" strokeWidth="1.2" />
                  </g>
                  <g id="component-incoming-carton">
                    <rect x="68" y="44" width="40" height="36" rx="3" fill="#D97706" opacity="0.95" />
                    <rect x="85" y="44" width="6" height="36" fill="#FEF3C7" opacity="0.8" />
                  </g>
                  <g id="component-outgoing-carton">
                    <rect x="274" y="44" width="40" height="36" rx="3" fill="#D97706" opacity="0.95" />
                    <rect x="291" y="44" width="6" height="36" fill="#FEF3C7" opacity="0.8" />
                    <circle cx="304" cy="52" r="6" fill="#10B981" />
                    <path d="M301.5 52 L303.5 54 L306.5 50" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                  <line x1="198" y1="6" x2="198" y2="30" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" />
                  <circle cx="198" cy="6" r="3" fill="#38BDF8" />
                </svg>

                <p className="text-[10px] text-sky-200/80 text-center mt-1">
                  *Visualisasi proses penimbangan produk pada conveyor pengemasan
                </p>
              </div>
            </div>
          </section>

          {/* RIGHT PANEL */}
          <section className="lg:w-[56%] p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
            <div className="mb-6">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#087ED0]/10 dark:bg-sky-500/20 text-[#087ED0] dark:text-sky-400 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold tracking-wider uppercase text-[#087ED0] dark:text-sky-400">
                  Portal Masuk
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#102344] dark:text-white">
                Packaging Weighing
              </h2>
              <p className="text-sm text-[#60748F] dark:text-slate-400 mt-1">
                Quality Control & Monitoring
              </p>
              <div className="w-12 h-1 bg-[#087ED0] rounded-full mt-3" />
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-sm flex items-start gap-3 transition-all"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span className="flex-1 text-xs sm:text-sm font-medium">{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage("")}
                  className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 p-0.5 rounded cursor-pointer"
                  aria-label="Tutup pesan kesalahan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="form-identifier-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#102344] dark:text-slate-300 mb-1.5"
                >
                  NPK / Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#60748F] dark:text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="form-identifier-input"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@packaging.local atau USR-001"
                    required
                    autoComplete="username"
                    className="w-full pl-10 pr-9 py-3 bg-[#F8FAFC] dark:bg-slate-950 border border-[#DCE6F2] dark:border-slate-800 rounded-xl text-sm text-[#102344] dark:text-white placeholder-[#60748F]/60 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#087ED0] focus:border-transparent transition-all"
                  />
                  {identifier.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearIdentifier}
                      aria-label="Hapus teks NPK / Email"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#60748F] hover:text-[#102344] dark:text-slate-500 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="form-password-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#102344] dark:text-slate-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-medium text-[#087ED0] hover:text-[#076EB6] dark:text-sky-400 dark:hover:text-sky-300 focus:outline-none focus:underline transition-colors cursor-pointer"
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#60748F] dark:text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="form-password-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun"
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-3 bg-[#F8FAFC] dark:bg-slate-950 border border-[#DCE6F2] dark:border-slate-800 rounded-xl text-sm text-[#102344] dark:text-white placeholder-[#60748F]/60 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#087ED0] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#60748F] hover:text-[#102344] dark:text-slate-500 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-[#60748F] dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#087ED0] border-[#DCE6F2] dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-[#087ED0] cursor-pointer"
                  />
                  <span>Ingat saya di perangkat ini</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 sm:h-14 px-5 bg-[#087ED0] hover:bg-[#076EB6] active:bg-[#065A98] text-white font-semibold rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#087ED0] focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Masuk ke Dashboard</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#DCE6F2] dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-3 text-[#60748F] dark:text-slate-500 font-medium tracking-wider">
                  atau
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-center text-[#60748F] dark:text-slate-400 mb-3 font-medium">
                Akses Cepat Pengujian (Demo Akun):
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickFill("admin")}
                  className="min-h-[44px] py-2.5 px-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF4FB] dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-[#DCE6F2] dark:border-slate-700 text-xs font-semibold text-[#102344] dark:text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#087ED0]"
                >
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>Akun Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("operator")}
                  className="min-h-[44px] py-2.5 px-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF4FB] dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-[#DCE6F2] dark:border-slate-700 text-xs font-semibold text-[#102344] dark:text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#087ED0]"
                >
                  <User className="w-4 h-4 text-[#087ED0] dark:text-sky-400" />
                  <span>Akun Operator</span>
                </button>
              </div>
              <p className="text-[11px] text-center text-[#60748F]/80 dark:text-slate-500 mt-2.5">
                Kredensial demo akan diisikan ke form. Role tetap diverifikasi oleh sistem saat masuk.
              </p>
            </div>
          </section>
        </div>
      </main>

     

      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="form-forgot-password-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 border border-[#DCE6F2] dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#087ED0] dark:text-sky-400 flex items-center justify-center mb-4">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3
              id="form-forgot-password-title"
              className="text-lg font-bold text-[#102344] dark:text-white"
            >
              Reset Kata Sandi
            </h3>
            <p className="text-xs sm:text-sm text-[#60748F] dark:text-slate-400 mt-2 leading-relaxed">
              Untuk menjaga integritas data penimbangan dan keamanan lini produksi, reset kata sandi operator dilakukan melalui{" "}
              <strong className="text-[#102344] dark:text-slate-200">
                Administrator Produksi
              </strong>{" "}
              atau Supervisor Unit Pengemasan.
            </p>
            <div className="mt-3 p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-[#DCE6F2] dark:border-slate-800 text-xs text-[#60748F] dark:text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#087ED0] shrink-0" />
              <span>Gunakan tombol Akun Demo di halaman login untuk pengujian.</span>
            </div>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full min-h-[44px] py-2.5 px-4 bg-[#087ED0] hover:bg-[#076EB6] text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
