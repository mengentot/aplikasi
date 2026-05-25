/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useApp } from "../context/AppContext";
import { 
  BarChart, 
  Clock, 
  Coins, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Zap, 
  HelpCircle,
  Activity,
  Trash2
} from "lucide-react";

export default function AnalyticsPanel() {
  const { metrics, clearMetrics } = useApp();

  const totalReq = metrics.length;
  const successes = metrics.filter(m => m.success);
  const failures = metrics.filter(m => !m.success);
  const successCount = successes.length;
  const failCount = failures.length;

  const successRate = totalReq > 0 ? ((successCount / totalReq) * 100).toFixed(1) : "100.0";
  const cumulativeCost = metrics.reduce((acc, m) => acc + m.estimatedCost, 0);
  const totalTokensUsed = metrics.reduce((acc, m) => acc + m.totalTokens, 0);

  // Filter metrics with valid latency and compute averages
  const validLatencies = metrics.filter(m => m.latencyMs > 0);
  const avgLatency = validLatencies.length > 0
    ? Math.round(validLatencies.reduce((acc, m) => acc + m.latencyMs, 0) / validLatencies.length)
    : 0;

  // Render lightweight inline custom responsive SVG scatter graph representing latencies in ms
  // Latency graph heights
  const chartHeight = 120;
  const chartWidth = 500;
  // Get latest 15 metric logs in chronological format (oldest first)
  const chartLogs = [...metrics].slice(0, 15).reverse();
  const maxMetricLatency = Math.max(...chartLogs.map(m => m.success ? m.latencyMs : 200), 1000);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none bg-transparent text-left scrollbar-none h-full" id="analytics-panel-canvas">
      {/* 1. Header segment */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-800/50 pb-4" id="analytics-header">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">Audit Statistik</span>
          <h2 className="text-sm font-semibold text-slate-200 font-sans flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Analisis Klaster & Log Transaksi</span>
          </h2>
        </div>

        <button
          onClick={clearMetrics}
          className="p-1.5 px-3 rounded border border-slate-800/50 text-[11px] font-sans font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/25 flex items-center gap-1.5 self-start md:self-auto transition-all cursor-pointer"
          id="analytics-clear-btn"
        >
          <Trash2 className="w-3.5 h-3.5 animate-pulse" />
          <span>Hapus Cache Analisis</span>
        </button>
      </div>

      {/* 2. Analytical Scorecards (Dynamic Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="analytics-cards-grid">
        {/* Scorecard 1: Success Rate */}
        <div className="bg-[#0C0C0E]/30 border border-slate-800/50 p-4 rounded space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-mono tracking-wider">Rasio Keberhasilan</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 pt-1 font-bold">
            <span className="text-xl font-bold font-mono text-slate-100">{successRate}%</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {successCount} Berhasil / {failCount} Gangguan dilewati
          </div>
        </div>

        {/* Scorecard 2: Speed Latency */}
        <div className="bg-[#0C0C0E]/30 border border-slate-800/50 p-4 rounded space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-mono tracking-wider">Durasi Rata-rata</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2 pt-1 font-bold">
            <span className="text-xl font-bold font-mono text-slate-100">{avgLatency} ms</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Lag pemrosesan jaringan simpul dinamis
          </div>
        </div>

        {/* Scorecard 3: Quota Cost */}
        <div className="bg-[#0C0C0E]/30 border border-slate-800/50 p-4 rounded space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-mono tracking-wider">Estimasi Biaya</span>
            <Coins className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2 pt-1 font-bold">
            <span className="text-xl font-bold font-mono text-cyan-300">${cumulativeCost.toFixed(5)}</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Indeks tarif terbobot di berbagai ukuran model
          </div>
        </div>

        {/* Scorecard 4: Transactions Allocated */}
        <div className="bg-[#0C0C0E]/30 border border-slate-800/50 p-4 rounded space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-mono tracking-wider">Permintaan Dialokasikan</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 pt-1 font-bold">
            <span className="text-xl font-bold font-mono text-slate-100">{totalReq} total</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Total token: {totalTokensUsed.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 3. LIGHTWEIGHT GRAPH CANVAS MODULE (Custom SVG chart with zero CPU overhead) */}
      <div className="bg-[#0C0C0E]/30 border border-slate-800/50 rounded p-5 space-y-4" id="analytics-chart-panel">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Jalur latensi kronologis</span>
          <h3 className="text-xs font-semibold text-slate-300 font-sans">Latensi Transaksi Simpul (15 Panggilan Terakhir)</h3>
        </div>

        {chartLogs.length > 0 ? (
          <div className="space-y-2">
            <div className="relative w-full overflow-x-auto" id="latency-svg-wrapper">
              <svg 
                className="w-full min-w-[500px]" 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Horizontal Guide lines */}
                <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="#1E1E22" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2={chartWidth} y2="60" stroke="#1E1E22" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2={chartWidth} y2="100" stroke="#1E1E22" strokeDasharray="3 3" />

                {/* Left indicators text */}
                <text x="5" y="15" fill="#475569" className="text-[8px] font-mono">{maxMetricLatency}ms</text>
                <text x="5" y="55" fill="#475569" className="text-[8px] font-mono">{Math.round(maxMetricLatency / 2)}ms</text>
                <text x="5" y="95" fill="#475569" className="text-[8px] font-mono">0ms</text>

                {/* Plot line paths */}
                {chartLogs.map((item, idx) => {
                  if (idx === 0) return null;
                  const prev = chartLogs[idx - 1];
                  const x1 = ((idx - 1) * (chartWidth - 40)) / (chartLogs.length - 1) + 20;
                  const y1 = chartHeight - ((prev.success ? prev.latencyMs : 0) * (chartHeight - 40)) / maxMetricLatency - 20;
                  const x2 = (idx * (chartWidth - 40)) / (chartLogs.length - 1) + 20;
                  const y2 = chartHeight - ((item.success ? item.latencyMs : 0) * (chartHeight - 40)) / maxMetricLatency - 20;

                  return (
                    <line 
                      key={idx} 
                      x1={x1} 
                      y1={y1} 
                      x2={x2} 
                      y2={y2} 
                      stroke={item.success ? "#6366f1" : "#ef4444"} 
                      strokeWidth="1.5" 
                    />
                  );
                })}

                {/* Interactive Node plot points */}
                {chartLogs.map((item, idx) => {
                  const x = (idx * (chartWidth - 40)) / (chartLogs.length - 1) + 20;
                  const y = chartHeight - ((item.success ? item.latencyMs : 0) * (chartHeight - 40)) / maxMetricLatency - 20;

                  return (
                    <g key={idx} className="group cursor-help">
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="3.5" 
                        fill={item.success ? "#818cf8" : "#f87171"} 
                        className="transition-all hover:r-5 hover:fill-indigo-300"
                      />
                      <title>
                        {`[${item.provider.toUpperCase()}] Model: ${item.model}\nSukses: ${item.success}\nLatensi: ${item.latencyMs}ms\nBiaya: $${item.estimatedCost.toFixed(6)}`}
                      </title>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
              <span>◄ Awal Riwayat Kronologis</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Kode Berhasil</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Kode Gangguan API</span>
              </div>
              <span>Transaksi Terakhir ►</span>
            </div>
          </div>
        ) : (
          <div className="h-28 flex flex-col items-center justify-center border border-slate-800/40 border-dashed rounded font-mono text-slate-600 text-[10px] italic">
            Belum ada entri transaksi kronologis yang disimpan.
          </div>
        )}
      </div>

      {/* 4. CHRONOLOGICAL TRANSACTION HISTORICAL LOG (Rich table) */}
      <div className="bg-[#0C0C0E]/30 border border-slate-800/50 rounded p-5 space-y-3" id="analytics-logs-list">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest font-bold">Kisi Riwayat Transaksi</span>
          <h3 className="text-xs font-semibold text-slate-300 font-sans">Log Eksekusi Sistem Mentah (15 Terakhir)</h3>
        </div>

        <div className="overflow-x-auto" id="analytics-table-wrapper">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/40 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                <th className="py-2.5 px-3">Stempel Waktu</th>
                <th className="py-2.5 px-3">Penyedia Rute</th>
                <th className="py-2.5 px-3">Target Mesin</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-3 text-right">Kompleksitas</th>
                <th className="py-2.5 px-3 text-right">Latensi</th>
                <th className="py-2.5 px-3 text-right">Estimasi Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/20 font-mono text-[11px] text-slate-400">
              {metrics.length > 0 ? (
                metrics.slice(0, 15).map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-905/30 transition-all">
                      {/* Date/Time */}
                      <td className="py-2 px-3 text-slate-500 text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>

                      {/* Source network */}
                      <td className="py-2 px-3">
                        <span className="uppercase text-[10px] font-bold tracking-wider text-slate-300">
                          {log.provider}
                        </span>
                      </td>

                      {/* Model */}
                      <td className="py-2 px-3 text-slate-500">
                        {log.model}
                      </td>

                      {/* Success / Error badge */}
                      <td className="py-2 px-2 text-[10px]">
                        {log.success ? (
                          <span className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded leading-none text-[9px] font-bold">
                            SUCCESS
                          </span>
                        ) : (
                          <span 
                            className="bg-red-955/40 border border-red-500/25 text-red-400 px-1.5 py-0.5 rounded cursor-help leading-none text-[9px] font-bold"
                            title={log.errorMessage}
                          >
                            BYPASS ACTIVE
                          </span>
                        )}
                      </td>

                      {/* Tokens count */}
                      <td className="py-2 px-3 text-right text-indigo-300">
                        {log.totalTokens > 0 ? log.totalTokens.toLocaleString() : "-"}
                      </td>

                      {/* Latency */}
                      <td className="py-2 px-3 text-right text-slate-300">
                        {log.latencyMs > 0 ? `${log.latencyMs}ms` : "-"}
                      </td>

                      {/* Cost */}
                      <td className="py-2 px-3 text-right text-cyan-405 font-medium">
                        {log.estimatedCost > 0 ? `$${log.estimatedCost.toFixed(6)}` : "-"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-650 text-[10px] italic">
                    Historical transaction list is currently empty. Run prompts to record operational telemetry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
