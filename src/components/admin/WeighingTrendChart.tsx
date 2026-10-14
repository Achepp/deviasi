"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  TrendingUp,
  Filter,
  Calendar,
  Layers,
  Package,
  Cpu,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Info,
} from "lucide-react";
import { HasilTimbangan } from "@/types";
import { calculateWeighingStats } from "@/lib/utils";

interface WeighingTrendChartProps {
  sessions: HasilTimbangan[];
  isLoading?: boolean;
}

type PeriodFilter = "today" | "7d" | "30d" | "all";

interface ChartDataPoint {
  id: string;
  jam: string;
  dateObj: Date;
  batch: string;
  nama_produk: string;
  no_mesin: string;
  operator: string;
  avg: number;
  min: number;
  max: number;
  lower: number;
  upper: number;
  count: number;
  inRangeCount: number;
  outRangeCount: number;
  isAllInSpec: boolean;
}

export default function WeighingTrendChart({
  sessions,
  isLoading = false,
}: WeighingTrendChartProps) {
  // Filter States
  const [period, setPeriod] = useState<PeriodFilter>("7d");
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedMachine, setSelectedMachine] = useState<string>("all");

  // Hover / Active point for interactive tooltip
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  // SVG Container ref for width detection
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract unique options for dropdown filters
  const uniqueBatches = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.batch) set.add(s.batch);
    });
    return Array.from(set).sort();
  }, [sessions]);

  const uniqueProducts = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.nama_produk) set.add(s.nama_produk);
    });
    return Array.from(set).sort();
  }, [sessions]);

  const uniqueMachines = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.no_mesin) set.add(s.no_mesin);
    });
    return Array.from(set).sort();
  }, [sessions]);

  // Determine date boundary for period filter in Asia/Jakarta
  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    // YYYY-MM-DD
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [now]);

  // Filter and process points
  const { filteredPoints, kpisSummary } = useMemo(() => {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let totalMeasurementUnits = 0;
    let totalInRangeUnits = 0;
    let sumWeightValues = 0;

    const points: ChartDataPoint[] = [];

    sessions.forEach((s) => {
      // 1. Period filter
      const jamStr = s.jam || "";
      const datePart = jamStr.slice(0, 10);
      const parsedTime = new Date(jamStr.replace(" ", "T")).getTime();
      const sDate = isNaN(parsedTime) ? new Date(jamStr) : new Date(parsedTime);

      if (period === "today") {
        if (!datePart.startsWith(todayStr)) return;
      } else if (period === "7d") {
        if (!isNaN(sDate.getTime()) && sDate < sevenDaysAgo) return;
      } else if (period === "30d") {
        if (!isNaN(sDate.getTime()) && sDate < thirtyDaysAgo) return;
      }

      // 2. Batch filter
      if (selectedBatch !== "all" && s.batch !== selectedBatch) return;

      // 3. Product filter
      if (selectedProduct !== "all" && s.nama_produk !== selectedProduct) return;

      // 4. Machine filter
      if (selectedMachine !== "all" && s.no_mesin !== selectedMachine) return;

      // Calculate session measurements accurately (skips empty/NaN)
      const st = calculateWeighingStats(s);
      if (st.count === 0) return; // Ignore sessions without any filled weight

      totalMeasurementUnits += st.count;
      totalInRangeUnits += st.inRangeCount;
      sumWeightValues += st.average * st.count;

      points.push({
        id: s.id,
        jam: s.jam,
        dateObj: isNaN(sDate.getTime()) ? new Date() : sDate,
        batch: s.batch,
        nama_produk: s.nama_produk,
        no_mesin: s.no_mesin,
        operator: s.operator || "-",
        avg: st.average,
        min: st.min,
        max: st.max,
        lower: Number(s.lower),
        upper: Number(s.upper),
        count: st.count,
        inRangeCount: st.inRangeCount,
        outRangeCount: st.outRangeCount,
        isAllInSpec: st.outRangeCount === 0,
      });
    });

    // Sort chronologically ascending (oldest to newest)
    points.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    const overallAvg =
      totalMeasurementUnits > 0
        ? Number((sumWeightValues / totalMeasurementUnits).toFixed(2))
        : 0;

    const compliancePct =
      totalMeasurementUnits > 0
        ? Number(((totalInRangeUnits / totalMeasurementUnits) * 100).toFixed(1))
        : 100;

    return {
      filteredPoints: points,
      kpisSummary: {
        totalMeasurements: totalMeasurementUnits,
        overallAvg,
        compliancePct,
        sessionsCount: points.length,
      },
    };
  }, [sessions, period, selectedBatch, selectedProduct, selectedMachine, now, todayStr]);

  const hasFilterActive =
    period !== "7d" ||
    selectedBatch !== "all" ||
    selectedProduct !== "all" ||
    selectedMachine !== "all";

  const handleResetFilters = () => {
    setPeriod("7d");
    setSelectedBatch("all");
    setSelectedProduct("all");
    setSelectedMachine("all");
    setActivePointIndex(null);
  };

  // SVG Chart Geometry calculations
  const chartGeometry = useMemo(() => {
    const width = 800; // virtual SVG coordinate space
    const height = 320;
    const padding = { top: 30, right: 35, bottom: 45, left: 65 };

    if (filteredPoints.length === 0) {
      return {
        width,
        height,
        padding,
        yMin: 0,
        yMax: 100,
        yTicks: [],
        plotPoints: [],
      };
    }

    // Determine Y range (bounds among all avg, lower, upper, min, max)
    let minVal = Infinity;
    let maxVal = -Infinity;

    filteredPoints.forEach((p) => {
      minVal = Math.min(minVal, p.avg, p.lower, p.min);
      maxVal = Math.max(maxVal, p.avg, p.upper, p.max);
    });

    // Provide 8% margin headroom and footroom
    const span = Math.max(maxVal - minVal, 2);
    const yMin = Math.floor(minVal - span * 0.08);
    const yMax = Math.ceil(maxVal + span * 0.08);

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    // Helper to calculate coordinate Y from value
    const getY = (val: number) => {
      if (yMax === yMin) return padding.top + plotHeight / 2;
      const ratio = (val - yMin) / (yMax - yMin);
      return padding.top + plotHeight - ratio * plotHeight;
    };

    // Helper to calculate coordinate X from index
    const getX = (idx: number, total: number) => {
      if (total <= 1) return padding.left + plotWidth / 2;
      return padding.left + (idx / (total - 1)) * plotWidth;
    };

    // Generate 5 Y ticks
    const yTicks: { value: number; y: number }[] = [];
    const tickCount = 5;
    for (let i = 0; i < tickCount; i++) {
      const val = yMin + ((yMax - yMin) / (tickCount - 1)) * i;
      const rounded = Math.round(val * 10) / 10;
      yTicks.push({
        value: rounded,
        y: getY(rounded),
      });
    }

    // Map data points to SVG coordinates
    const plotPoints = filteredPoints.map((p, idx) => {
      const x = getX(idx, filteredPoints.length);
      const yAvg = getY(p.avg);
      const yLower = getY(p.lower);
      const yUpper = getY(p.upper);

      // Short label for X axis (e.g. "13/10 14:30")
      const timePart = p.jam.slice(11, 16);
      const dPart = p.jam.slice(8, 10) + "/" + p.jam.slice(5, 7);
      const label = `${dPart} ${timePart}`;

      return {
        ...p,
        x,
        yAvg,
        yLower,
        yUpper,
        label,
        index: idx,
      };
    });

    return {
      width,
      height,
      padding,
      yMin,
      yMax,
      yTicks,
      plotPoints,
    };
  }, [filteredPoints]);

  // Construct SVG paths
  const svgPaths = useMemo(() => {
    const { plotPoints, padding, height } = chartGeometry;
    if (plotPoints.length === 0) return { avgLine: "", avgArea: "", lowerLine: "", upperLine: "" };

    const avgLine = plotPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.yAvg.toFixed(1)}`)
      .join(" ");

    // Filled area under average line
    const firstX = plotPoints[0].x.toFixed(1);
    const lastX = plotPoints[plotPoints.length - 1].x.toFixed(1);
    const bottomY = (height - padding.bottom).toFixed(1);
    const avgArea = `${avgLine} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

    const lowerLine = plotPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.yLower.toFixed(1)}`)
      .join(" ");

    const upperLine = plotPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.yUpper.toFixed(1)}`)
      .join(" ");

    return { avgLine, avgArea, lowerLine, upperLine };
  }, [chartGeometry]);

  const activePoint =
    activePointIndex !== null && chartGeometry.plotPoints[activePointIndex]
      ? chartGeometry.plotPoints[activePointIndex]
      : null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5 transition-colors">
      {/* 1. Header: Title, Subtitle, & Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-150 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Tren Hasil Penimbangan
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Monitoring hasil penimbangan berdasarkan waktu dan batas toleransi.
              </p>
            </div>
          </div>
        </div>

        {/* Legend Indicators */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-blue-600 rounded-full" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Rata-Rata Timbang</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-rose-500" />
            <span className="font-semibold text-rose-600 dark:text-rose-400">Batas Upper</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-amber-500" />
            <span className="font-semibold text-amber-600 dark:text-amber-400">Batas Lower</span>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="inline-flex rounded-lg bg-white dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setPeriod("today")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                period === "today"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriod("7d")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                period === "7d"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => setPeriod("30d")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                period === "30d"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              30 Hari
            </button>
            <button
              type="button"
              onClick={() => setPeriod("all")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                period === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Semua
            </button>
          </div>

          {/* Batch Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              aria-label="Filter Batch"
              className="pl-2.5 pr-7 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="all">Semua Batch ({uniqueBatches.length})</option>
              {uniqueBatches.map((b) => (
                <option key={b} value={b}>
                  Batch {b}
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              aria-label="Filter Produk"
              className="max-w-[170px] sm:max-w-[220px] truncate pl-2.5 pr-7 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="all">Semua Produk</option>
              {uniqueProducts.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Machine Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              aria-label="Filter Mesin"
              className="pl-2.5 pr-7 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="all">Semua Mesin</option>
              {uniqueMachines.map((m) => (
                <option key={m} value={m}>
                  Mesin {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Filter Button */}
        {hasFilterActive && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium cursor-pointer transition-colors shadow-2xs"
            title="Kembalikan semua filter ke awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        )}
      </div>

      {/* 3. Ringkasan di Atas Grafik (3 Indikator Kecil) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Pengukuran */}
        <div className="bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Pengukuran Dianalisis
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {isLoading ? "-" : kpisSummary.totalMeasurements}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              titik timbang ({kpisSummary.sessionsCount} sesi)
            </span>
          </div>
        </div>

        {/* Rata-Rata Hasil Timbang */}
        <div className="bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
            Rata-Rata Penimbangan
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {isLoading || kpisSummary.totalMeasurements === 0 ? "-" : `${kpisSummary.overallAvg} g`}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              gram aktual
            </span>
          </div>
        </div>

        {/* Persentase Dalam Batas Toleransi */}
        <div className="bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Dalam Batas Toleransi
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {isLoading || kpisSummary.totalMeasurements === 0
                ? "-"
                : `${kpisSummary.compliancePct}%`}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              lolos spesifikasi QC
            </span>
          </div>
        </div>
      </div>

      {/* 4. Chart Visualization Area */}
      <div
        ref={containerRef}
        className="relative w-full rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-4 min-h-[320px] sm:min-h-[360px] flex items-center justify-center select-none"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Memuat data grafik dari Google Sheets...</span>
          </div>
        ) : filteredPoints.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-1">
              <Scale className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
              Tidak Ada Data Penimbangan
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tidak ditemukan data pengukuran pada periode atau kriteria filter yang dipilih.
            </p>
            {hasFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            <svg
              viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
              className="w-full h-[280px] sm:h-[340px] overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Area Gradient under Average line */}
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines & Y Axis Ticks */}
              {chartGeometry.yTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={chartGeometry.padding.left}
                    y1={tick.y}
                    x2={chartGeometry.width - chartGeometry.padding.right}
                    y2={tick.y}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-slate-200 dark:text-slate-800"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={chartGeometry.padding.left - 8}
                    y={tick.y + 4}
                    textAnchor="end"
                    className="text-[10px] sm:text-[11px] font-mono fill-slate-400 dark:fill-slate-500"
                  >
                    {tick.value}g
                  </text>
                </g>
              ))}

              {/* Area Under Line */}
              {svgPaths.avgArea && (
                <path d={svgPaths.avgArea} fill="url(#areaGradient)" />
              )}

              {/* Upper Tolerance Line (Dashed Rose) */}
              {svgPaths.upperLine && (
                <path
                  d={svgPaths.upperLine}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="1.75"
                  strokeDasharray="4 4"
                  opacity="0.85"
                />
              )}

              {/* Lower Tolerance Line (Dashed Amber) */}
              {svgPaths.lowerLine && (
                <path
                  d={svgPaths.lowerLine}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.75"
                  strokeDasharray="4 4"
                  opacity="0.85"
                />
              )}

              {/* Average Weight Line (Solid Blue) */}
              {svgPaths.avgLine && (
                <path
                  d={svgPaths.avgLine}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Vertical Guide Line on Active / Hover Point */}
              {activePoint && (
                <line
                  x1={activePoint.x}
                  y1={chartGeometry.padding.top}
                  x2={activePoint.x}
                  y2={chartGeometry.height - chartGeometry.padding.bottom}
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="opacity-75"
                />
              )}

              {/* Data Points (Dots) */}
              {chartGeometry.plotPoints.map((pt, i) => {
                const isActive = activePointIndex === i;
                const isOut = !pt.isAllInSpec;

                return (
                  <g
                    key={pt.id || i}
                    className="cursor-pointer"
                    onMouseEnter={() => setActivePointIndex(i)}
                    onClick={() => setActivePointIndex(isActive ? null : i)}
                  >
                    {/* Invisible hit area for comfortable tap/hover */}
                    <circle cx={pt.x} cy={pt.yAvg} r="16" fill="transparent" />

                    {/* Active highlight ring */}
                    {isActive && (
                      <circle
                        cx={pt.x}
                        cy={pt.yAvg}
                        r="8"
                        fill="none"
                        stroke={isOut ? "#f43f5e" : "#2563eb"}
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    )}

                    {/* Center point */}
                    <circle
                      cx={pt.x}
                      cy={pt.yAvg}
                      r={isActive ? "5" : "3.5"}
                      fill="#ffffff"
                      stroke={isOut ? "#e11d48" : "#2563eb"}
                      strokeWidth={isActive ? "3" : "2"}
                      className="transition-all duration-150"
                    />
                  </g>
                );
              })}

              {/* X Axis Baseline */}
              <line
                x1={chartGeometry.padding.left}
                y1={chartGeometry.height - chartGeometry.padding.bottom}
                x2={chartGeometry.width - chartGeometry.padding.right}
                y2={chartGeometry.height - chartGeometry.padding.bottom}
                stroke="currentColor"
                strokeWidth="1"
                className="text-slate-300 dark:text-slate-700"
              />

              {/* X Axis Labels (selective based on point count to avoid clutter) */}
              {chartGeometry.plotPoints.map((pt, i) => {
                const total = chartGeometry.plotPoints.length;
                // Show label if <= 10 points or at interval steps
                const step = total > 20 ? 4 : total > 10 ? 2 : 1;
                const isEdge = i === 0 || i === total - 1;
                if (i % step !== 0 && !isEdge) return null;

                return (
                  <text
                    key={i}
                    x={pt.x}
                    y={chartGeometry.height - chartGeometry.padding.bottom + 16}
                    textAnchor="middle"
                    className="text-[9px] sm:text-[10px] font-mono fill-slate-400 dark:fill-slate-500"
                  >
                    {pt.label}
                  </text>
                );
              })}
            </svg>

            {/* Interactive Tooltip Card */}
            {activePoint && (
              <div
                className={`mt-3 p-3.5 rounded-xl border bg-white dark:bg-slate-900 shadow-md text-xs space-y-2 transition-all ${
                  activePoint.isAllInSpec
                    ? "border-emerald-200 dark:border-emerald-500/30"
                    : "border-rose-200 dark:border-rose-500/30"
                }`}
              >
                {/* Header Tooltip: Time, Batch, Product */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-500/20">
                      {activePoint.batch}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {activePoint.nama_produk}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      activePoint.isAllInSpec
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                        : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                    }`}
                  >
                    {activePoint.isAllInSpec ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Dalam Batas Toleransi
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" /> {activePoint.outRangeCount} Di Luar Batas
                      </>
                    )}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Waktu Pencatatan</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {activePoint.jam}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Rata-Rata Timbang</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {activePoint.avg} g
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Batas Toleransi</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      L: {activePoint.lower}g | U: {activePoint.upper}g
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Rentang Min / Max</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      {activePoint.min}g - {activePoint.max}g ({activePoint.count} titik)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Mesin: <strong className="text-slate-600 dark:text-slate-300">{activePoint.no_mesin}</strong></span>
                  <span>Operator: <strong className="text-slate-600 dark:text-slate-300">{activePoint.operator}</strong></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
