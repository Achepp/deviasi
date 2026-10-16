"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Scale,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  RotateCcw,
  Check,
  Package,
  Sliders,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { AuthSession, HasilTimbangan, MasterProduk } from "@/types";

interface WeighingFormProps {
  user: AuthSession;
  onSessionSaved?: (savedRecord: HasilTimbangan) => void;
}

export default function WeighingForm({ user, onSessionSaved }: WeighingFormProps) {
  // Batch lookup state
  const [batch, setBatch] = useState("");
  const [productName, setProductName] = useState("");
  const [batchStatus, setBatchStatus] = useState<
    "idle" | "searching" | "found" | "not_found" | "inactive"
  >("idle");
  const [batchMessage, setBatchMessage] = useState("");

  // Packaging parameters state
  const [noMesin, setNoMesin] = useState("MSN-01");
  const [noTimbangan, setNoTimbangan] = useState("TB-01");
  const [metodeKemas, setMetodeKemas] = useState("Standing Pouch");
  const [lower, setLower] = useState<number | string>(495);
  const [upper, setUpper] = useState<number | string>(505);

  // 15 Weighing fields state (strings for free editing, empty string = unentered)
  const [weights, setWeights] = useState<string[]>(Array(15).fill(""));

  // Form submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successInfo, setSuccessInfo] = useState<{
    id: string;
    jam: string;
    count: number;
    avg: number;
    inRange: number;
    outRange: number;
  } | null>(null);

  // Quick preset samples
  const [recentBatches, setRecentBatches] = useState<MasterProduk[]>([]);

  // Refs for auto-scroll
  const formTopRef = useRef<HTMLDivElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);
  const weightFirstInputRef = useRef<HTMLInputElement>(null);

  // Load available batches for quick select
  useEffect(() => {
    fetch("/api/master/products")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setRecentBatches(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Debounced Batch lookup
  useEffect(() => {
    const trimmed = batch.trim();
    if (!trimmed) {
      setProductName("");
      setBatchStatus("idle");
      setBatchMessage("");
      return;
    }

    setBatchStatus("searching");
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/batch/search?batch=${encodeURIComponent(trimmed)}`);
        const result = await res.json();

        if (res.ok && result.success) {
          setProductName(result.data.nama_produk);
          setBatchStatus("found");
          setBatchMessage("");
        } else {
          setProductName("");
          if (result.product?.status === "Nonaktif") {
            setBatchStatus("inactive");
            setBatchMessage(
              `Batch ditemukan tetapi berstatus Nonaktif (${result.product.keterangan || "QC Hold"}).`
            );
          } else {
            setBatchStatus("not_found");
            setBatchMessage("Batch tidak ditemukan pada master data Google Sheets.");
          }
        }
      } catch {
        setBatchStatus("not_found");
        setBatchMessage("Gagal menghubungi server untuk verifikasi Batch.");
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [batch]);

  // Handle single weight input change
  const handleWeightChange = (index: number, val: string) => {
    const sanitized = val.replace(",", ".");
    const updated = [...weights];
    updated[index] = sanitized;
    setWeights(updated);
  };

  // Real-time calculation stats
  const stats = useMemo(() => {
    const lowerNum = Number(lower);
    const upperNum = Number(upper);

    const filled: { index: number; val: number; inRange: boolean }[] = [];
    weights.forEach((w, idx) => {
      if (w.trim() !== "" && !isNaN(Number(w))) {
        const val = Number(w);
        const inRange =
          !isNaN(lowerNum) && !isNaN(upperNum) ? val >= lowerNum && val <= upperNum : true;
        filled.push({ index: idx + 1, val, inRange });
      }
    });

    const count = filled.length;
    if (count === 0) {
      return {
        count: 0,
        avg: 0,
        min: 0,
        max: 0,
        inRangeCount: 0,
        outRangeCount: 0,
      };
    }

    const sum = filled.reduce((acc, curr) => acc + curr.val, 0);
    const avg = Number((sum / count).toFixed(2));
    const min = Math.min(...filled.map((f) => f.val));
    const max = Math.max(...filled.map((f) => f.val));
    const inRangeCount = filled.filter((f) => f.inRange).length;
    const outRangeCount = count - inRangeCount;

    return {
      count,
      avg,
      min,
      max,
      inRangeCount,
      outRangeCount,
    };
  }, [weights, lower, upper]);

  // Form validity check: all required fields filled and at least 1 weight entered
  const isFormValid = useMemo(() => {
    const lowerNum = Number(lower);
    const upperNum = Number(upper);
    return (
      batch.trim() !== "" &&
      batchStatus === "found" &&
      productName.trim() !== "" &&
      noMesin.trim() !== "" &&
      noTimbangan.trim() !== "" &&
      metodeKemas.trim() !== "" &&
      !isNaN(lowerNum) &&
      !isNaN(upperNum) &&
      lowerNum <= upperNum &&
      stats.count > 0
    );
  }, [batch, batchStatus, productName, noMesin, noTimbangan, metodeKemas, lower, upper, stats.count]);

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitError("");

    // Form validations with smooth scroll feedback
    if (!batch.trim()) {
      setSubmitError("Silakan isi Nomor / Kode Batch terlebih dahulu.");
      batchInputRef.current?.focus();
      batchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (batchStatus !== "found" || !productName) {
      setSubmitError("Kode Batch belum valid atau belum terdaftar di Master Produk.");
      batchInputRef.current?.focus();
      batchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const lowerNum = Number(lower);
    const upperNum = Number(upper);
    if (isNaN(lowerNum) || isNaN(upperNum)) {
      setSubmitError("Batas Lower dan Upper harus berupa angka valid.");
      return;
    }
    if (lowerNum > upperNum) {
      setSubmitError("Batas Lower tidak boleh lebih besar dari Upper.");
      return;
    }

    if (stats.count === 0) {
      setSubmitError("Minimal 1 nilai penimbangan (Timbang 1 s/d 15) harus diisi.");
      weightFirstInputRef.current?.focus();
      weightFirstInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);

    try {
      const clientRequestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const payload = {
        batch: batch.trim(),
        no_mesin: noMesin.trim(),
        no_timbangan: noTimbangan.trim(),
        metode_kemas: metodeKemas.trim(),
        lower: lowerNum,
        upper: upperNum,
        weights: weights.map((w) => (w.trim() === "" ? null : Number(w))),
        clientRequestId,
      };

      const res = await fetch("/api/weighing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setSubmitError(json.message || "Gagal menyimpan hasil penimbangan.");
        setIsSubmitting(false);
        return;
      }

      // Success confirmation
      setSuccessInfo({
        id: json.data.id,
        jam: json.data.jam,
        count: json.stats.count,
        avg: json.stats.average,
        inRange: json.stats.inRangeCount,
        outRange: json.stats.outRangeCount,
      });

      // Scroll to top to see confirmation
      formTopRef.current?.scrollIntoView({ behavior: "smooth" });

      if (onSessionSaved) {
        onSessionSaved(json.data);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setSubmitError(`Gangguan jaringan saat menyimpan: ${error.message}. Data Anda tidak hilang.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset actions
  const handleResetWeightsOnly = () => {
    setWeights(Array(15).fill(""));
    setSuccessInfo(null);
    setSubmitError("");
    weightFirstInputRef.current?.focus();
  };

  const handleResetEntireForm = () => {
    setBatch("");
    setProductName("");
    setBatchStatus("idle");
    setBatchMessage("");
    setWeights(Array(15).fill(""));
    setSuccessInfo(null);
    setSubmitError("");
    batchInputRef.current?.focus();
  };

  return (
    <div className="w-full space-y-4 relative pb-4" ref={formTopRef}>
      {/* Success Notification Alert */}
      {successInfo && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200 shadow-sm animate-in fade-in space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-emerald-900 dark:text-white">
                Data Penimbangan Berhasil Disimpan
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                Sesi <span className="font-mono font-bold">[{successInfo.id}]</span> telah dicatat ke Google Sheets pada{" "}
                <span className="font-medium">{successInfo.jam} WIB</span>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded-xl border border-emerald-200/80 dark:border-emerald-500/20">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-semibold">Total</span>
              <strong className="text-emerald-700 dark:text-emerald-300 font-mono text-sm">{successInfo.count} Data</strong>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded-xl border border-emerald-200/80 dark:border-emerald-500/20">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-semibold">Rata-Rata</span>
              <strong className="text-emerald-700 dark:text-emerald-300 font-mono text-sm">{successInfo.avg} g</strong>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded-xl border border-emerald-200/80 dark:border-emerald-500/20">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-semibold">Status</span>
              <strong className={`font-mono text-xs ${successInfo.outRange === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {successInfo.outRange === 0 ? "Standar OK" : `${successInfo.outRange} Out`}
              </strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={handleResetWeightsOnly}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Input Sesi Baru (Batch Tetap)</span>
            </button>
            <button
              type="button"
              onClick={handleResetEntireForm}
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Ganti Batch
            </button>
            <Link
              href="/operator/history"
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1 text-center"
            >
              <span>Lihat Riwayat</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {submitError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-rose-900 dark:text-rose-200">Perhatian</p>
            <p className="mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ============================================================== */}
        {/* CARD A: Identitas Batch & Nama Produk                           */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-150 dark:border-slate-800">
            <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Identitas Batch & Nama Produk
            </h3>
          </div>

          <div className="space-y-3">
            {/* Input Kode Batch */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                No Batch <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={batchInputRef}
                  type="text"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value.toUpperCase())}
                  placeholder="Contoh:26043572"
                  required
                  className={`w-full pl-3.5 pr-10 py-3 bg-white dark:bg-slate-950 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 font-mono uppercase tracking-wider transition-colors ${
                    batchStatus === "found"
                      ? "border-emerald-500 focus:ring-emerald-500"
                      : batchStatus === "not_found" || batchStatus === "inactive"
                      ? "border-rose-500 focus:ring-rose-500"
                      : "border-slate-300 dark:border-slate-800 focus:ring-blue-600"
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {batchStatus === "searching" && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  )}
                  {batchStatus === "found" && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                  {(batchStatus === "not_found" || batchStatus === "inactive") && (
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                  )}
                  {batchStatus === "idle" && (
                    <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  )}
                </div>
              </div>

              {/* Status helper text */}
              {batchMessage && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{batchMessage}</span>
                </p>
              )}
            </div>

            {/* Read-Only Nama Produk */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Produk <span className="text-rose-500">*</span>
                </label>
                {productName && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                    <Check className="w-3 h-3" /> Tervalidasi
                  </span>
                )}
              </div>
              <input
                type="text"
                value={productName}
                readOnly
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium focus:outline-none cursor-not-allowed select-none"
              />
              
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CARD B: Parameter Kemasan & Batas Toleransi                    */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-150 dark:border-slate-800">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Parameter Kemasan & Batas Toleransi
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. Mesin <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={noMesin}
                onChange={(e) => setNoMesin(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. Timbangan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={noTimbangan}
                onChange={(e) => setNoTimbangan(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Metode Kemas <span className="text-rose-500">*</span>
              </label>
              <select
                value={metodeKemas}
                onChange={(e) => setMetodeKemas(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="Standing Pouch">Shuangfeng</option>
                <option value="Sachet Aluminium">Manual</option>
                <option value="Box Karton">Devree</option>
              </select>
            </div>

            {/* Lower Limit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batas Bawah (Lower) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={lower}
                onChange={(e) => setLower(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            {/* Upper Limit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batas Atas (Upper) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={upper}
                onChange={(e) => setUpper(e.target.value)}
                required
                className={`w-full px-3 py-2 bg-white dark:bg-slate-950 border rounded-xl text-slate-900 dark:text-white font-mono text-xs sm:text-sm focus:ring-2 outline-none ${
                  Number(lower) > Number(upper)
                    ? "border-rose-500 focus:ring-rose-500"
                    : "border-slate-300 dark:border-slate-800 focus:ring-blue-600"
                }`}
              />
            </div>
          </div>

          {Number(lower) > Number(upper) && (
            <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium pt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Batas Lower ({lower}) tidak boleh lebih besar dari Upper ({upper}).</span>
            </p>
          )}
        </div>

        {/* ============================================================== */}
        {/* CARD C: Hasil Pengukuran Penimbangan (1 s/d 15)                */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-150 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                  Hasil Pengukuran Penimbangan
                </h3>  
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetWeightsOnly}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Kosongkan
            </button>
          </div>

          {/* 15 Responsive Touch-Friendly Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {weights.map((val, idx) => {
              const numVal = Number(val);
              const isFilled = val.trim() !== "" && !isNaN(numVal);
              const lowerNum = Number(lower);
              const upperNum = Number(upper);
              const inRange =
                isFilled && !isNaN(lowerNum) && !isNaN(upperNum)
                  ? numVal >= lowerNum && numVal <= upperNum
                  : true;
              const isOutOfRange = isFilled && !inRange;

              return (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border transition-colors ${
                    isOutOfRange
                      ? "bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40"
                      : isFilled
                      ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/40"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Timbang #{idx + 1}
                    </span>
                    {isFilled && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          inRange
                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                            : "bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300"
                        }`}
                      >
                        {inRange ? "OK" : "OUT"}
                      </span>
                    )}
                  </div>
                  <input
                    ref={idx === 0 ? weightFirstInputRef : undefined}
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={val}
                    onChange={(e) => handleWeightChange(idx, e.target.value)}
                    placeholder="Kosong"
                    className={`w-full px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border font-mono text-sm focus:outline-none focus:ring-2 transition-colors ${
                      isOutOfRange
                        ? "border-rose-400 dark:border-rose-500 text-rose-900 dark:text-rose-200 focus:ring-rose-500"
                        : isFilled
                        ? "border-emerald-400 dark:border-emerald-500 text-emerald-900 dark:text-emerald-200 focus:ring-emerald-500"
                        : "border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-blue-600 placeholder-slate-300 dark:placeholder-slate-600"
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* ============================================================== */}
          {/* CARD D: Ringkasan Pengukuran (Live Calculation)                */}
          {/* ============================================================== */}
          <div className="pt-2 border-t border-slate-150 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Ringkasan Pengukuran</span>
              </span>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                {stats.count} / 15 Terisi
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Rata-Rata</span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  {stats.count > 0 ? `${stats.avg} g` : "-"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Min / Max</span>
                <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                  {stats.count > 0 ? `${stats.min} / ${stats.max}` : "-"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Dalam Batas</span>
                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  {stats.inRangeCount}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">Luar Batas</span>
                <span className={`font-mono font-bold text-sm ${stats.outRangeCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400"}`}>
                  {stats.outRangeCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ruang bawah (spacer) agar Timbang 11-15 dan Ringkasan Pengukuran */}
        {/* dapat digulir penuh dan tidak tertutup oleh Sticky Save Action Bar */}
        <div className="h-28 sm:h-24 pointer-events-none" aria-hidden="true" />
      </form>

      {/* ============================================================== */}
      {/* STICKY SAVE ACTION BAR: TEPAT DI ATAS BOTTOM NAVIGATION        */}
      {/* Selaras dengan kontainer form pada HP, Tablet, dan Desktop      */}
      {/* ============================================================== */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-full sm:max-w-2xl md:max-w-3xl z-30 bg-white dark:bg-slate-900 border-t sm:border-x border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-3.5 sm:px-5 py-2.5 sm:py-3 transition-colors">
        <div className="w-full flex items-center gap-3">
          {/* Indikator Jumlah Titik Timbang Terisi */}
          <div className="shrink-0 flex flex-col justify-center px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 select-none">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 leading-tight">
              Terisi
            </span>
            <span className="font-mono text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400 leading-tight">
              {stats.count}/15
            </span>
          </div>

          {/* Tombol Utama: Simpan Penimbangan */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !isFormValid}
            title={
              !isFormValid
                ? "Lengkapi Kode Batch valid, parameter kemas, dan minimal 1 hasil timbang"
                : "Simpan data penimbangan ke Google Sheets"
            }
            className="flex-1 h-[52px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer select-none"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Menyimpan ke Google Sheets...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5 shrink-0" />
                <span>Simpan Penimbangan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
