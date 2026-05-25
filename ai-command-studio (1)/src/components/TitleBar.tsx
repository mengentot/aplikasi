/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Cpu, Maximize2, Minus, X, Activity, HardDrive } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function TitleBar() {
  const { metrics, apiConfigs } = useApp();
  const [ramUsage, setRamUsage] = useState(114.2);
  const [cpuUsage, setCpuUsage] = useState(1.4);

  // Micro-simulation of hyper-optimized RAM and CPU fluctuations
  useEffect(() => {
    const timer = setInterval(() => {
      setRamUsage(prev => {
        const offset = (Math.random() * 1.5 - 0.75);
        const next = prev + offset;
        return next < 105 ? 105 : next > 125 ? 125 : parseFloat(next.toFixed(1));
      });
      setCpuUsage(prev => {
        const offset = (Math.random() * 2 - 1);
        const next = prev + offset;
        return next < 0.2 ? 0.2 : next > 4.5 ? 4.5 : parseFloat(next.toFixed(1));
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const totalSuccesses = metrics.filter(m => m.success).length;
  const activeProvidersCount = apiConfigs.filter(c => c.enabled).length;

  return (
    <div className="h-11 bg-[#0A0A0B] border-b border-slate-800/50 flex items-center justify-between px-4 select-none" id="sim-desktop-titlebar">
      {/* Red, Yellow, Green Window Controls (Mac/Windows hybrid luxury aesthetic) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 mr-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500 opacity-80 hover:opacity-100 cursor-pointer flex items-center justify-center group">
            <X className="w-2 h-2 text-indigo-950 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="w-3 h-3 rounded-full bg-slate-700 hover:bg-slate-650 cursor-pointer flex items-center justify-center group">
            <Minus className="w-2 h-2 text-slate-950 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="w-3 h-3 rounded-full bg-slate-850 border border-slate-700/60 hover:bg-slate-800 cursor-pointer flex items-center justify-center group">
            <Maximize2 className="w-1.5 h-1.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Windows Release Indicator */}
        <span className="text-xs text-slate-400 font-sans tracking-wide">
          AI Command Studio
          <span className="text-slate-700 px-2">|</span>
          <span className="text-[10px] text-slate-500 font-mono">v1.0.4</span>
        </span>
      </div>

      {/* Center Process Metrics (Highlights Low usage) */}
      <div className="hidden md:flex items-center gap-4 bg-[#0F0F11] px-3 py-1 rounded-md border border-slate-800/50">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <HardDrive className="w-3 h-3 text-indigo-400" />
          <span>RAM: <strong className="text-indigo-300">{ramUsage} MB</strong></span>
        </div>
        <div className="w-[1px] h-3 bg-slate-800/50" />
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <Cpu className="w-3 h-3 text-indigo-400" />
          <span>CPU: <strong className="text-indigo-300">{cpuUsage}%</strong></span>
        </div>
        <div className="w-[1px] h-3 bg-slate-800/50" />
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>Klaster: <strong className="text-emerald-300">{activeProvidersCount} Aktif</strong></span>
        </div>
      </div>

      {/* Right Indicator Check */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-900/40 px-2 py-0.5 rounded border border-slate-800/50">
          {totalSuccesses} Transaksi
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-0.5 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">SISTEM STABIL</span>
        </div>
      </div>
    </div>
  );
}
