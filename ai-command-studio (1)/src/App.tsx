/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import TitleBar from "./components/TitleBar";
import Sidebar from "./components/Sidebar";
import TokenMonitor from "./components/TokenMonitor";
import WorkspaceMain from "./components/WorkspaceMain";
import FileExplorerPanel from "./components/FileExplorerPanel";
import ApiManager from "./components/ApiManager";
import AnalyticsPanel from "./components/AnalyticsPanel";
import SettingsPanel from "./components/SettingsPanel";

function AppContent() {
  const { currentView, theme } = useApp();

  // Map theme presets to distinct, elegant dark-matte variations
  const themeClassMap = {
    "matte-dark": "bg-[#0A0A0B] text-slate-300 selection:bg-indigo-500/30 selection:text-white",
    "slate-grey": "bg-[#0C0C0E] text-zinc-300 selection:bg-zinc-800 selection:text-zinc-100",
    "glass-purple": "bg-[#0F0F11] text-slate-300 selection:bg-purple-950/80 selection:text-white"
  };

  const activeThemeClass = themeClassMap[theme] || themeClassMap["matte-dark"];

  return (
    <div className={`h-screen flex flex-col overflow-hidden font-sans select-none ${activeThemeClass}`} id="app-window-root">
      {/* simulated OS title-bar */}
      <TitleBar />

      {/* Primary Workspace rows */}
      <div className="flex-1 flex overflow-hidden" id="app-workspace-body">
        
        {/* Navigation panel */}
        <Sidebar />

        {/* Dynamic center interactive panel view */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-900/10" id="main-panel-container">
          {currentView === "workspace" && <WorkspaceMain />}
          {currentView === "file-explorer" && <FileExplorerPanel />}
          {currentView === "api-manager" && <ApiManager />}
          {currentView === "analytics" && <AnalyticsPanel />}
          {currentView === "settings" && <SettingsPanel />}
        </main>

        {/* Dynamic monitoring telemetry HUD */}
        <TokenMonitor />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

