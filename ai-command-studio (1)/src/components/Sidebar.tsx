/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Terminal, Database, Shield, Settings, BarChart2, FolderCode } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Sidebar() {
  const { currentView, setCurrentView, workspaceTabs, providerStatusSimulator, apiConfigs, virtualFiles } = useApp();

  const activeTabsCount = workspaceTabs.length;
  // Count outage simulated items to show warning badge
  const outageCount = Object.values(providerStatusSimulator).filter(s => s === 'outage').length;
  // Count enabled networks
  const configuredProviders = apiConfigs.filter(c => c.enabled).length;

  const menuItems = [
    {
      id: "workspace",
      label: "Ruang Kerja AI",
      icon: Terminal,
      badge: activeTabsCount > 1 ? activeTabsCount : undefined,
    },
    {
      id: "file-explorer",
      label: "Pengeksplor File",
      icon: FolderCode,
      badge: virtualFiles ? virtualFiles.length : undefined,
    },
    {
      id: "api-manager",
      label: "Kelola Kunci API",
      icon: Database,
      badge: outageCount > 0 ? `${outageCount} Gangguan` : undefined,
      badgeColor: outageCount > 0 ? "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
    },
    {
      id: "analytics",
      label: "Metrik & Log Aliran",
      icon: BarChart2,
    },
    {
      id: "settings",
      label: "Pengaturan Sistem",
      icon: Settings,
    }
  ];

  return (
    <div className="w-16 md:w-56 bg-[#0A0A0B] border-r border-slate-800/50 flex flex-col justify-between select-none transition-all duration-300 shrink-0" id="sidebar-main">
      <div className="p-2 md:p-4 flex-1">
        {/* Branding header / Workspace info */}
        <div className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2.5 mb-6 bg-slate-900/10 rounded-xl border border-slate-805/50" id="sidebar-brand-box">
          <div className="w-7.5 h-7.5 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/10 shrink-0">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex flex-col min-w-0 hidden md:flex">
            <span className="text-[11px] font-semibold text-slate-200 tracking-wide font-sans truncate">AI CMD STUDIO</span>
            <span className="text-[9px] text-slate-500 font-mono tracking-wider truncate">REDUNDANT MATRIX</span>
          </div>
        </div>

        {/* Dynamic Nav Rail list */}
        <nav className="space-y-1" id="sidebar-navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`w-full flex items-center justify-center md:justify-between px-2 md:px-3 py-2.5 rounded-lg text-xs font-sans transition-all duration-200 outline-none group border ${
                  isSelected 
                    ? "bg-slate-800/40 text-slate-100 border-slate-800/60 shadow-sm" 
                    : "text-slate-400 border-transparent hover:bg-slate-800/20 hover:text-slate-200"
                }`}
                id={`sidebar-nav-${item.id}`}
                title={item.label}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-105 shrink-0 ${
                    isSelected ? "text-indigo-400" : "text-slate-500"
                  }`} />
                  <span className="font-medium hidden md:inline truncate">{item.label}</span>
                </div>
                
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border hidden md:inline-block ${
                    item.badgeColor || "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Elegant Quota progress representation & Cluster Node status */}
      <div className="p-4 border-t border-slate-800/50 bg-[#0C0C0E]/30 space-y-4 hidden md:block" id="sidebar-footer-stats">
        <div className="p-2.5 bg-slate-900/30 rounded-xl border border-slate-800/40 space-y-2">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500 font-bold font-sans uppercase tracking-tight">BEBAN KUOTA</span>
            <span className="text-slate-400 font-mono font-semibold">68%</span>
          </div>
          <div className="h-1 bg-slate-800/80 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-[68%] rounded-full transition-all"></div>
          </div>
        </div>

        <div className="space-y-1 bg-transparent">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-mono">
            <span>Status Klaster</span>
            <span className={outageCount > 0 ? "text-amber-400 font-medium" : "text-emerald-400 font-medium"}>
              {outageCount > 0 ? "Terganggu" : "Normal"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-1">
            <span>Endpoint Aktif:</span>
            <span className="text-slate-400 font-semibold">{configuredProviders}/5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
