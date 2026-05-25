/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Code, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  Save, 
  File, 
  FolderPlus, 
  FilePlus, 
  Play,
  ArrowRight,
  Code2,
  Settings,
  X,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { VirtualFile } from "../types";

export default function FileExplorerPanel() {
  const { 
    virtualFiles, 
    setVirtualFiles,
    activeFileId, 
    setActiveFileId, 
    createVirtualFile, 
    updateVirtualFileContent, 
    deleteVirtualFile, 
    renameVirtualFile,
    setCurrentView,
    workspaceTabs,
    updateTabPrompt,
    submitWorkspacePrompt
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [editorText, setEditorText] = useState("");
  const [isSaved, setIsSaved] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // File System modals or inputs state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFilePath, setNewFilePath] = useState("");
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [renameInputValue, setRenameInputValue] = useState("");

  const [explorerMinimized, setExplorerMinimized] = useState(() => {
    const saved = localStorage.getItem("ai_cmd_explorer_minimized");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("ai_cmd_explorer_minimized", String(explorerMinimized));
  }, [explorerMinimized]);

  // AI Enhancer sub-module
  const [aiAction, setAiAction] = useState("optimize");
  const [aiRunning, setAiRunning] = useState(false);
  const [aiResultNotice, setAiResultNotice] = useState<string | null>(null);
  const [aiPanelMinimized, setAiPanelMinimized] = useState(() => {
    const saved = localStorage.getItem("ai_cmd_panel_minimized");
    return saved === "true";
  });

  // Track panel minimize selection
  useEffect(() => {
    localStorage.setItem("ai_cmd_panel_minimized", String(aiPanelMinimized));
  }, [aiPanelMinimized]);

  // Reference for lines syncing
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineCounterRef = useRef<HTMLDivElement>(null);

  const activeFile = virtualFiles.find(f => f.id === activeFileId);

  // Sync editor when active file changes
  useEffect(() => {
    if (activeFile) {
      setEditorText(activeFile.content);
      setIsSaved(true);
      setAiResultNotice(null);
    } else {
      setEditorText("");
    }
  }, [activeFileId, activeFile]);

  // Alert on unsaved change
  const handleEditorChange = (val: string) => {
    setEditorText(val);
    if (isSaved) {
      setIsSaved(false);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveFile = () => {
    if (!activeFileId) return;
    updateVirtualFileContent(activeFileId, editorText);
    setIsSaved(true);
    triggerToast("✓ Perubahan file berhasil disimpan ke disk virtual.");
  };

  // Synchronize dynamic line numbering scroll positions
  const handleScroll = () => {
    if (textareaRef.current && lineCounterRef.current) {
      lineCounterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleDownloadFile = () => {
    if (!activeFile) return;
    const blob = new Blob([editorText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = activeFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`✓ Mengeksekusi ekspor desktop untuk: "${activeFile.name}"`);
  };

  const handleLoadAsPrompt = () => {
    if (!activeFile) return;
    
    // Find active workspace tab to inject
    const activeTab = workspaceTabs.find(t => t.isActive);
    if (!activeTab) {
      triggerToast("⚠ Periksa kembali: Tidak ada tab Aliran Kerja AI aktif yang dapat diinjeksikan.");
      return;
    }

    updateTabPrompt(activeTab.id, editorText);
    setCurrentView("workspace");
    
    if (activeTab.autoSwitchLogs) {
      activeTab.autoSwitchLogs.push(`Memuat file skrip "${activeFile.name}" langsung ke lembar kerja prompt utama.`);
    }
  };

  // AI assistant integration inside the Code Editor workspace!
  const runAiCodeEnhancer = async () => {
    if (!activeFile || aiRunning) return;
    setAiRunning(true);
    setAiResultNotice(null);

    let instructionPr = "";
    if (aiAction === "explain") {
      instructionPr = "Jelaskan apa yang dilakukan blok kode ini dengan jelas. Paparkan potensi jebakan, tingkat kompleksitas, atau perangkap kinerja di dalamnya. Tulis output sebagai komentar kode markdown yang bersih.";
    } else if (aiAction === "optimize") {
      instructionPr = "Refaktorkan kode ini untuk mengoptimalkan kecepatan respons, tata letak cache, dan meminimalkan beban eksekusi. Pertahankan logika tetap utuh tetapi tulis logika setara yang lebih unggul dengan penjelasan singkat.";
    } else if (aiAction === "bugs") {
      instructionPr = "Audit kode ini untuk bug sintaksis standar, kesalahan keamanan tipe, atau kebocoran sumber daya. Sajikan logika yang diperbaiki disertai dengan penjelasan singkat tentang perbaikannya.";
    } else if (aiAction === "tests") {
      instructionPr = "Tulis blok pengujian unit yang komprehensif atau spesifikasi pengujian tiruan (mock) yang dirancang untuk logika modul ini. Cocokkan pola sintaksisnya secara sempurna.";
    }

    try {
      // Prompt construction proxying our API chat router
      const fullPrompt = `${instructionPr}\n\nCode module to analyze:\n\`\`\`${activeFile.language}\n${editorText}\n\`\`\``;
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "gemini",
          model: "gemini-3.5-flash",
          prompt: fullPrompt,
          history: []
        })
      });

      if (!res.ok) throw new Error("Koneksi habis waktu saat menunggu balasan dari model AI.");
      const responseData = await res.json();
      
      setAiResultNotice(responseData.text);
      triggerToast("⚡ Analisis kode diterima dari simpul kompiler Gemini AI.");
    } catch (err: any) {
      triggerToast(`✗ Kegagalan rute AI: ${err.message}`);
    } finally {
      setAiRunning(false);
    }
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let path = newFilePath.trim() || "";
    if (path && !path.endsWith("/")) {
      path += "/";
    }
    const fullPathStr = `${path}${newFileName}`;
    
    // Detect extension language
    const ext = newFileName.split('.').pop() || '';
    let lang = "javascript";
    if (ext === "ts" || ext === "tsx") lang = "typescript";
    else if (ext === "py") lang = "python";
    else if (ext === "json") lang = "json";
    else if (ext === "md") lang = "markdown";
    else if (ext === "go") lang = "go";
    else if (ext === "sh") lang = "shell";
    else if (ext === "html") lang = "html";
    else if (ext === "css") lang = "css";
    else if (ext === "yaml" || ext === "yml") lang = "yaml";

    const defaultContents = lang === "typescript" || lang === "javascript" 
      ? `// Generated Module: ${newFileName}\n\nexport function initComponent() {\n  console.log("Virtual node online.");\n}`
      : lang === "python"
      ? `# Dynamic Scripting file ${newFileName}\n\ndef run():\n    print("Executing virtual logic module")\n\nif __name__ == "__main__":\n    run()` 
      : lang === "json"
      ? `{\n  "name": "${newFileName.split(".")[0]}",\n  "status": "active",\n  "re-routing": true\n}`
      : `# Reference Module - ${newFileName}\n\nDocument details or guidelines...`;

    const newId = createVirtualFile(newFileName, defaultContents, lang, fullPathStr);
    
    setShowCreateModal(false);
    setNewFileName("");
    setNewFilePath("");
    triggerToast(`✓ Created new workspace file: "${fullPathStr}"`);
  };

  const triggerRenameInput = (id: string, name: string) => {
    setEditingFileId(id);
    setRenameInputValue(name);
  };

  const saveRename = (id: string) => {
    if (!renameInputValue.trim()) return;
    renameVirtualFile(id, renameInputValue.trim());
    setEditingFileId(null);
    triggerToast("✓ File successfully renamed.");
  };

  const renderFileIcon = (lang: string) => {
    switch(lang) {
      case "typescript": return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
      case "javascript": return <FileCode className="w-4 h-4 text-amber-300 shrink-0" />;
      case "python": return <FileCode className="w-4 h-4 text-green-400 shrink-0" />;
      case "json": return <Code className="w-4 h-4 text-cyan-400 shrink-0" />;
      case "markdown": return <FileText className="w-4 h-4 text-indigo-400 shrink-0" />;
      default: return <File className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  // Group files into nested pseudo-folders based on their pathway strings for rendering:
  const getGroupedFiles = () => {
    const folders: Record<string, VirtualFile[]> = { "root": [] };
    
    virtualFiles.forEach(file => {
      const parts = file.path.split('/');
      if (parts.length > 1) {
        const folderName = parts.slice(0, parts.length - 1).join('/');
        if (!folders[folderName]) {
          folders[folderName] = [];
        }
        folders[folderName].push(file);
      } else {
        folders["root"].push(file);
      }
    });

    return folders;
  };

  const grouped = getGroupedFiles();
  
  // Filter search matches
  const filteredFiles = virtualFiles.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate helper line numbers
  const totalLines = editorText.split("\n").length;
  const lineNumbers = Array.from({ length: totalLines }, (_, i) => i + 1);

  return (
    <div className="flex-1 flex overflow-hidden select-none bg-transparent h-full text-left font-sans" id="file-explorer-canvas">
      
      {/* LEFT COLUMN: FILE TREE EXPLORER */}
      {!explorerMinimized ? (
        <div className="w-64 border-r border-slate-800/60 bg-[#0A0A0B]/90 flex flex-col justify-between shrink-0 h-full transition-all duration-300" id="file-explorer-sidebar">
          <div className="flex-1 flex flex-col overflow-hidden">            {/* Header */}
            <div className="p-4 border-b border-slate-800/50 flex items-center justify-between" id="file-explorer-head">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest font-bold">Ruang Kerja Virtual</span>
                <h3 className="text-xs font-semibold text-slate-200">Terminal Kodebasis</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-1.5 rounded-md hover:bg-slate-850 border border-slate-800/40 hover:border-indigo-500/30 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                  title="Tambah File Baru"
                  id="new-file-trigger-btn"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setExplorerMinimized(true)}
                  className="p-1.5 rounded-md hover:bg-slate-850 hover:text-slate-200 text-slate-500 hover:text-slate-350 transition-all cursor-pointer border border-transparent hover:border-slate-800"
                  title="Sembunyikan Eksplorer"
                  id="btn-collapse-explorer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Search Filtering */}
            <div className="p-3" id="file-search-container">
              <div className="relative bg-[#0C0C0E]/60 border border-slate-800/50 rounded flex items-center px-2.5 py-1">
                <Search className="w-3 h-3 text-slate-500 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Cari file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-[11px] placeholder-slate-600 outline-none text-slate-350 font-sans"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-slate-500 hover:text-slate-300">
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            {/* File Tree List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-none" id="file-tree-viewer">
              {searchQuery ? (
                // Flat search view
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase block tracking-wider mb-1.5">Hasil Pencarian</span>
                  {filteredFiles.length > 0 ? (
                    filteredFiles.map(file => {
                      const isSelected = activeFileId === file.id;
                      return (
                        <div
                          key={file.id}
                          onClick={() => setActiveFileId(file.id)}
                          className={`group p-2 rounded flex items-center justify-between text-xs cursor-pointer border transition-all ${
                            isSelected
                              ? "bg-slate-800/30 border-slate-800/60 text-slate-100 font-medium"
                              : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {renderFileIcon(file.language)}
                            <div className="flex flex-col min-w-0">
                              <span className="truncate">{file.name}</span>
                              <span className="text-[8px] text-slate-500 font-mono truncate">{file.path}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-[10px] text-slate-600 italic text-center p-4">Tidak ada hasil pencarian file.</div>
                  )}
                </div>
              ) : (
                // Folder Structure view
                Object.keys(grouped).map(folderName => {
                  const isRoot = folderName === "root";
                  const folderFiles = grouped[folderName];
                  if (folderFiles.length === 0) return null;

                  return (
                    <div key={folderName} className="space-y-1" id={`folder-box-${folderName.replace("/", "-")}`}>
                      {/* Folder Title Segment */}
                      {!isRoot && (
                        <div className="flex items-center gap-1.5 px-1 py-1 text-slate-500 text-[10px] font-mono uppercase tracking-wider font-bold">
                          <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{folderName}</span>
                        </div>
                      )}

                      {/* Folder files */}
                      <div className={!isRoot ? "pl-3 space-y-1 border-l border-slate-905" : "space-y-1"}>
                        {folderFiles.map(file => {
                          const isSelected = activeFileId === file.id;
                          const isRenaming = editingFileId === file.id;

                          return (
                            <div
                              key={file.id}
                              onClick={() => !isRenaming && setActiveFileId(file.id)}
                              className={`group p-1.5 px-2 rounded flex items-center justify-between text-xs cursor-pointer border transition-all ${
                                isSelected
                                  ? "bg-slate-850 border-slate-800/60 text-indigo-300 font-semibold"
                                  : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                              }`}
                              id={`file-item-${file.id}`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {renderFileIcon(file.language)}
                                {isRenaming ? (
                                  <input
                                    type="text"
                                    value={renameInputValue}
                                    onChange={(e) => setRenameInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveRename(file.id);
                                      if (e.key === "Escape") setEditingFileId(null);
                                    }}
                                    onBlur={() => saveRename(file.id)}
                                    className="w-full bg-[#141416] border border-indigo-400 text-slate-200 text-xs px-1 rounded outline-none"
                                    autoFocus
                                  />
                                ) : (
                                  <span className="truncate" title={file.path}>{file.name}</span>
                                )}
                              </div>

                              {/* Actions on Hover */}
                              {!isRenaming && (
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 shrink-0 ml-1.5 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      triggerRenameInput(file.id, file.name);
                                    }}
                                    className="p-0.5 rounded text-slate-500 hover:text-indigo-400 hover:bg-slate-800"
                                    title="Ganti nama file"
                                  >
                                    <Edit className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteVirtualFile(file.id);
                                    }}
                                    className="p-0.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                    title="Hapus file"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer info inside sidebar */}
          <div className="p-4 bg-[#0C0C0E]/30 border-t border-slate-800/40 space-y-1.5" id="file-explorer-foot-panel">
            <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-mono tracking-widest">
              <span>Penggunaan Disk</span>
              <span className="text-indigo-400 font-bold">{virtualFiles.length}/20 file</span>
            </div>
            <div className="h-1 bg-slate-800/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all" 
                style={{ width: `${(virtualFiles.length / 20) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Left Explorer Sidebar Ribbon strip */
        <div 
          onClick={() => setExplorerMinimized(false)}
          className="w-12 border-r border-slate-800/60 bg-[#0A0A0B]/95 flex flex-col items-center py-4 shrink-0 transition-all duration-300 h-full select-none cursor-pointer hover:bg-[#0C0C0E]/75 justify-between"
          id="file-explorer-sidebar-collapsed"
          title="Klik untuk membuka Sidebar Eksplorer File"
        >
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExplorerMinimized(false);
              }}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-100 border border-slate-800 transition-all cursor-pointer outline-none"
              title="Tampilkan Eksplorer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <Folder className="w-4 h-4 text-indigo-400 animate-pulse" />
            
            <div className="select-none truncate whitespace-nowrap text-[9px] tracking-[0.25em] font-mono font-bold text-slate-500 [writing-mode:vertical-lr] rotate-180">
              EKSPLORER
            </div>
          </div>
          <div className="text-[10px] text-indigo-400 font-mono font-bold">
            {virtualFiles.length}F
          </div>
        </div>
      )}

      {/* RIGHT COLUMN: MAIN WORKSPACE INTERACTIVE CODE EDITOR */}
      <div className="flex-1 flex flex-col bg-transparent overflow-hidden h-full" id="file-code-editor-main">
        {activeFile ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Editor Top Toolbar Header */}
            <div className="bg-[#0A0A0B] border-b border-slate-800/50 p-3 px-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 select-none">
              
              {/* File Title and Stats */}
              <div className="flex items-center gap-3.5 min-w-0 text-left">
                {explorerMinimized && (
                  <button
                    onClick={() => setExplorerMinimized(false)}
                    className="p-1.5 rounded hover:bg-slate-850 bg-[#0C0C0E] border border-slate-800 text-indigo-455 hover:text-indigo-300 transition-all outline-none cursor-pointer flex items-center justify-center shrink-0"
                    title="Buka Sidebar Explorer"
                    id="btn-restore-explorer-toolbar"
                  >
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="w-9 h-9 rounded bg-[#0C0C0E]/60 border border-slate-800/50 flex items-center justify-center text-indigo-400 shrink-0">
                  {renderFileIcon(activeFile.language)}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-semibold text-slate-200 truncate">{activeFile.name}</h2>
                    {!isSaved && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-550 animate-pulse" title="Unsaved changes exists" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono tracking-tight truncate">
                    Path: {activeFile.path} • {activeFile.language.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                
                {/* Save file button */}
                <button
                  onClick={handleSaveFile}
                  disabled={isSaved}
                  className={`p-1.5 px-3 rounded text-[11px] font-sans font-medium hover:text-white flex items-center gap-1.5 transition-all outline-none border cursor-pointer ${
                    isSaved
                      ? "bg-slate-900 border-slate-800 text-slate-500"
                      : "bg-indigo-650 hover:bg-indigo-600 border-indigo-500 text-white font-semibold"
                  }`}
                  id="save-code-file-btn"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>

                {/* Import to active workspace tab */}
                <button
                  onClick={handleLoadAsPrompt}
                  className="p-1.5 px-3 rounded hover:bg-slate-850 bg-[#0C0C0E] border border-slate-800/80 hover:border-slate-700 text-[11px] font-sans font-medium text-slate-300 hover:text-slate-100 flex items-center gap-1.5 transition-all outline-none cursor-pointer"
                  title="Muat konten langsung sebagai input Lembar Kerja Prompt"
                  id="load-as-prompt-btn"
                >
                  <Play className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Muat sbg Prompt</span>
                </button>

                {/* Export file to disk as .txt / script downloads */}
                <button
                  onClick={handleDownloadFile}
                  className="p-1.5 px-3 rounded hover:bg-slate-850 bg-[#0C0C0E] border border-slate-800/80 hover:border-slate-700 text-[11px] font-mono text-slate-400 hover:text-slate-250 flex items-center justify-center transition-all outline-none cursor-pointer"
                  title="Unduh modul dinamis"
                  id="download-code-file-btn"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {/* AI Assistant Panel Toggle Button */}
                <button
                  onClick={() => setAiPanelMinimized(!aiPanelMinimized)}
                  className={`p-1.5 px-3 rounded hover:bg-slate-850 bg-[#0C0C0E] border text-[11px] font-sans font-medium flex items-center gap-1.5 transition-all outline-none cursor-pointer ${
                    !aiPanelMinimized 
                      ? "border-indigo-505/35 text-indigo-400 font-semibold" 
                      : "border-slate-800/55 text-slate-400 hover:text-slate-200"
                  }`}
                  title={aiPanelMinimized ? "Tampilkan Aksi Simpul (AI)" : "Sembunyikan Aksi Simpul (AI)"}
                  id="toggle-ai-panel-btn"
                >
                  {aiPanelMinimized ? <PanelRightOpen className="w-3.5 h-3.5" /> : <PanelRightClose className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>{aiPanelMinimized ? "Tampilkan Aksi" : "Sembunyikan Aksi"}</span>
                </button>
              </div>

            </div>

            {/* Layout Split: Code Editor Textarea (Left) and AI Compiler Enhancer Panel (Right) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden" id="editor-working-layout">
              
              {/* CODE EDITOR WORKSPACE */}
              <div className="flex-1 flex overflow-hidden bg-[#0A0A0B]/20 relative" id="code-editor-area">
                
                {/* Dynamic Line Counts */}
                <div 
                  ref={lineCounterRef}
                  className="pt-4 pb-4 px-2.5 w-11 bg-[#0A0A0B]/70 border-r border-slate-900 text-[11px] font-mono text-slate-600 text-right select-none overflow-hidden h-full scrollbar-none leading-5"
                >
                  {lineNumbers.map((n) => (
                    <div key={n} className="h-5">{n}</div>
                  ))}
                </div>

                {/* Code Text Canvas Input */}
                <textarea
                  ref={textareaRef}
                  value={editorText}
                  onChange={(e) => handleEditorChange(e.target.value)}
                  onScroll={handleScroll}
                  onKeyDown={(e) => {
                    // Support standard tab spacing inside textarea
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const start = e.currentTarget.selectionStart;
                      const end = e.currentTarget.selectionEnd;
                      const newVal = editorText.substring(0, start) + "  " + editorText.substring(end);
                      setEditorText(newVal);
                      setIsSaved(false);
                      setTimeout(() => {
                        if (textareaRef.current) {
                          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
                        }
                      }, 0);
                    }
                    // Support quick save shortcut
                    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                      e.preventDefault();
                      handleSaveFile();
                    }
                  }}
                  className="flex-1 font-mono text-xs text-indigo-200/90 leading-5 pt-4 pb-4 px-3.5 bg-transparent border-none outline-none resize-none overflow-y-auto selection:bg-indigo-500/30 selection:text-white select-text h-full"
                  spellCheck={false}
                  placeholder={`Tulis kode ${activeFile.language}, daftar perintah, atau dokumentasi pengembang di sini...`}
                  id="file-canvas-textarea"
                />

                {/* Status Indicator Bar inside the Canvas */}
                <div className="absolute bottom-3.5 right-3.5 bg-[#0C0C0E]/95 border border-slate-800/80 p-1 px-2.5 rounded text-[10px] font-mono text-slate-500 flex items-center gap-3 shadow-lg select-none">
                  <span>Baris: {totalLines}</span>
                  <span>Karakter: {editorText.length}</span>
                  <span>Brs: 1, Kol: 1</span>
                  <span>UTF-8</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    AKTIF
                  </span>
                </div>
              </div>

              {/* RIGHT AUXILIARY: INTELLIGENT COMPILER ACTION HUD */}
              {!aiPanelMinimized ? (
                <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800/50 bg-[#0C0C0E]/40 flex flex-col justify-between overflow-hidden shrink-0 h-full text-xs" id="ai-compiler-sidebar">
                  
                  <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest font-bold">Aksi Simpul</span>
                        <h3 className="text-slate-300 font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                          <span>Pakar Kode Gemini</span>
                        </h3>
                      </div>
                      <button
                        onClick={() => setAiPanelMinimized(true)}
                        className="p-1.5 rounded-md hover:bg-slate-800/60 text-slate-500 hover:text-slate-300 transition-all cursor-pointer border border-transparent hover:border-slate-800"
                        title="Sembunyikan Aksi Simpul"
                      >
                        <PanelRightClose className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                      Manfaatkan klaster prioritas API sisi server Anda untuk mengaudit sintaksis, menulis blok pengujian, atau mengoptimalkan loop performa.
                    </p>

                    {/* Options Selection Menu */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-505 font-mono uppercase tracking-wider block font-bold">Tindakan Refaktor</label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {[
                          { id: "optimize", label: "Performa: Optimalkan kecepatan" },
                          { id: "explain", label: "Analisis: Jelaskan jebakan kompleksitas" },
                          { id: "bugs", label: "Debugging: Audit & perbaiki potensi bug" },
                          { id: "tests", label: "Pengujian: Buat asersi spek unik" }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => setAiAction(opt.id)}
                            className={`p-2 rounded text-left font-sans transition-all border outline-none cursor-pointer ${
                              aiAction === opt.id
                                ? "bg-indigo-950/25 border-indigo-500/35 text-slate-100 font-semibold"
                                : "bg-[#0A0A0B]/60 border-slate-800/50 text-slate-400 hover:border-slate-800"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Execution trigger */}
                    <button
                      onClick={runAiCodeEnhancer}
                      disabled={aiRunning || !editorText.trim()}
                      className={`w-full py-2 rounded text-xs font-semibold font-sans tracking-wide flex items-center justify-center gap-1.5 shadow transition-all outline-none border ${
                        aiRunning || !editorText.trim()
                          ? "bg-slate-900 border-slate-900 text-slate-600 cursor-not-allowed"
                          : "bg-indigo-650 hover:bg-indigo-600 text-slate-50 border-indigo-500/30 cursor-pointer"
                      }`}
                      id="ai-enhancer-trigger-btn"
                    >
                      <Sparkles className={`w-3.5 h-3.5 text-indigo-300 ${aiRunning ? 'animate-spin' : ''}`} />
                      <span>{aiRunning ? "Mengompilasi Aksi Simpul..." : "Jalankan AI Enhancer"}</span>
                    </button>

                    {/* AI Results Output Container */}
                    <div className="flex-1 flex flex-col min-h-[140px] overflow-hidden">
                      <span className="text-[9px] text-slate-550 font-mono uppercase tracking-widest block font-bold pb-1.5">Log Output Kompilasi</span>
                      
                      <div className="flex-1 bg-[#101012] border border-slate-900 p-3 rounded-lg overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-400 scrollbar-none text-left select-text">
                        {aiRunning ? (
                          <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-600 text-xs text-center py-6">
                            <Code2 className="w-6 h-6 animate-spin text-indigo-400" />
                            <span className="italic animate-pulse">Menjalankan analisis klaster...<br />Mengevaluasi matriks logika</span>
                          </div>
                        ) : aiResultNotice ? (
                          <div className="space-y-2 whitespace-pre-wrap">
                            <div className="text-indigo-400 border-b border-slate-900 pb-1.5 font-bold mb-1.5 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Laporan Kompilasi yang Dioptimalkan:</span>
                            </div>
                            <p>{aiResultNotice}</p>
                            <div className="pt-2 border-t border-slate-900 flex justify-end mt-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(aiResultNotice);
                                  triggerToast("✓ Laporan optimasi berhasil disalin ke papan klip.");
                                }}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Salin Laporan</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-600 italic">
                            <span>Konsol output kompiler sedang menganggur.<br />Pilih tindakan dan jalankan analisis kode.</span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Bottom Tip segment */}
                  <div className="p-3 bg-[#0C0C0E]/80 border-t border-slate-800/40 text-[10px] text-slate-505 select-none leading-normal">
                    💡 <strong>Tips Pakar</strong>: Menyimpan perubahan akan merekam data sementara di dalam pohon konteks browser aktif Anda. Muat skrip ini ke dalam sesi lembar kerja prompt melalui tombol di atas.
                  </div>
                </div>

                </div>
              ) : (
                /* Collapsed Vertical Ribbon Icon-strip */
                <div 
                  onClick={() => setAiPanelMinimized(false)}
                  className="w-full md:w-12 border-t md:border-t-0 md:border-l border-slate-800/50 bg-[#0A0A0B]/80 flex flex-row md:flex-col items-center py-3 md:py-6 cursor-pointer hover:bg-[#0C0C0E]/70 transition-all select-none group h-auto md:h-full justify-between md:justify-start space-x-4 md:space-x-0 md:space-y-6 shrink-0 px-4 md:px-0"
                  id="ai-compiler-sidebar-collapsed"
                  title="Klik untuk membuka panel tindakan AI"
                >
                  <div className="p-1 px-1.5 rounded-md hover:bg-slate-800/50 text-indigo-400 group-hover:text-indigo-300 transition-all border border-slate-850">
                    <PanelRightOpen className="w-4 h-4" />
                  </div>
                  <Sparkles className="w-4 h-4 text-indigo-400/80 group-hover:animate-pulse shrink-0" />
                  <div className="hidden md:block select-none truncate whitespace-nowrap text-[9px] tracking-[0.25em] font-mono font-bold text-slate-500 group-hover:text-indigo-400/90 [writing-mode:vertical-lr] rotate-180">
                    GEMINI CODE ACTIONS
                  </div>
                  <div className="block md:hidden text-[10px] tracking-wide font-medium text-slate-400 font-sans">
                    Ketuk untuk membuka Panel AI Code Expert
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 select-none">
            <div className="w-12 h-12 rounded-full border border-dashed border-slate-705 flex items-center justify-center text-slate-700 animate-pulse">
              <Code className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-slate-300 font-semibold text-xs">No active file selected</h3>
              <p className="text-[10px] text-slate-600 max-w-xs italic">
                Select an existing TypeScript module or Python script from the left side explorer to audit or create a fresh file.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CREATE FILE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in select-none">
          <div className="bg-[#0C0C0E] border border-slate-800/80 rounded-lg p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide font-mono">
                <FilePlus className="w-4 h-4 text-indigo-400 font-semibold" />
                <span>Create New Module</span>
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFileSubmit} className="space-y-3 font-sans text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-505 font-mono uppercase tracking-widest font-bold">File Directory Destination (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. src/utils/ or leave blank for root"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-slate-800/80 p-2.5 rounded text-slate-250 placeholder-slate-655 outline-none focus:border-indigo-500/50"
                  id="modal-file-path-input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-505 font-mono uppercase tracking-widest font-bold">Filename (Including Extension)</label>
                <input
                  type="text"
                  placeholder="e.g. telemetry_logger.py, compiler.ts"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-slate-800/80 p-2.5 rounded text-slate-250 placeholder-slate-655 outline-none focus:border-indigo-500/50"
                  id="modal-file-name-input"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded border border-indigo-505/20 cursor-pointer shadow-md"
                  id="modal-create-file-submit"
                >
                  Create Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION MODULE */}
      {toastMessage && (
        <div 
          className="fixed bottom-4 right-[230px] bg-[#0A0A0B] border border-indigo-550/30 p-3 px-4.5 rounded shadow-2xl flex items-center gap-2.5 text-xs text-indigo-300 font-sans animate-fade-in z-50 selection:bg-transparent"
          id="editor-toast-notification"
        >
          <Check className="w-4 h-4 text-emerald-450 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
