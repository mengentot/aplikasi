/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  ApiProviderConfig, 
  WorkspaceTab, 
  PromptTemplate, 
  RequestMetric, 
  WorkspaceMode, 
  Message, 
  ApiProviderType,
  VirtualFile
} from "../types";
import { DEFAULT_API_CONFIGS, DEFAULT_PROMPT_TEMPLATES, MOCK_METRICS, DEFAULT_VIRTUAL_FILES } from "../data";

interface AppContextType {
  currentView: 'workspace' | 'history' | 'analytics' | 'api-manager' | 'settings' | 'file-explorer';
  setCurrentView: (view: 'workspace' | 'history' | 'analytics' | 'api-manager' | 'settings' | 'file-explorer') => void;
  apiConfigs: ApiProviderConfig[];
  setApiConfigs: React.Dispatch<React.SetStateAction<ApiProviderConfig[]>>;
  workspaceTabs: WorkspaceTab[];
  setWorkspaceTabs: React.Dispatch<React.SetStateAction<WorkspaceTab[]>>;
  promptTemplates: PromptTemplate[];
  setPromptTemplates: (templates: PromptTemplate[]) => void;
  metrics: RequestMetric[];
  addMetric: (metric: RequestMetric) => void;
  clearMetrics: () => void;
  
  // Virtual Codebase Files State & Actions
  virtualFiles: VirtualFile[];
  setVirtualFiles: React.Dispatch<React.SetStateAction<VirtualFile[]>>;
  activeFileId: string | null;
  setActiveFileId: (id: string | null) => void;
  createVirtualFile: (name: string, content: string, language: string, path: string) => string;
  updateVirtualFileContent: (id: string, content: string) => void;
  deleteVirtualFile: (id: string) => void;
  renameVirtualFile: (id: string, newName: string) => void;
  
  // App parameters
  autoSwitch: boolean;
  setAutoSwitch: (val: boolean) => void;
  retryCount: number;
  setRetryCount: (val: number) => void;
  timeoutSeconds: number;
  setTimeoutSeconds: (val: number) => void;
  theme: 'matte-dark' | 'slate-grey' | 'glass-purple';
  setTheme: (val: 'matte-dark' | 'slate-grey' | 'glass-purple') => void;
  tokenSaverMode: boolean;
  setTokenSaverMode: (val: boolean) => void;
  
  // Simulator configuration for failovers
  providerStatusSimulator: Record<string, 'healthy' | 'outage'>;
  toggleProviderSimulator: (provider: string) => void;
  
  // Core operational routines
  addNewTab: (mode: WorkspaceMode) => void;
  removeTab: (id: string) => void;
  selectTab: (id: string) => void;
  updateTabPrompt: (id: string, text: string) => void;
  updateTabModel: (id: string, model: string) => void;
  updateTabSelectionMode: (id: string, mode: 'manual' | 'fastest' | 'cheapest' | 'best' | 'smart') => void;
  updateTabMode: (id: string, mode: WorkspaceMode) => void;
  moveApiPriority: (id: string, direction: 'up' | 'down') => void;
  toggleApiProvider: (id: string) => void;
  updateApiConfig: (id: string, fields: Partial<ApiProviderConfig>) => void;
  clearTabHistory: (id: string) => void;
  
  // Execution engine
  submitWorkspacePrompt: (tabId: string) => Promise<void>;
  optimizePromptText: (tabId: string, optimizeMode: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Navigation
  const [currentView, setCurrentView] = useState<'workspace' | 'history' | 'analytics' | 'api-manager' | 'settings'>('workspace');
  
  // Configurations & Backups
  const [apiConfigs, setApiConfigs] = useState<ApiProviderConfig[]>(() => {
    const saved = localStorage.getItem("ai_cmd_api_configs");
    let configs;
    try {
      configs = saved ? JSON.parse(saved) : DEFAULT_API_CONFIGS;
    } catch (e) {
      configs = DEFAULT_API_CONFIGS;
    }
    if (!Array.isArray(configs)) {
      configs = DEFAULT_API_CONFIGS;
    }
    return configs.map((c: any) => ({
      ...c,
      tokensAvailable: typeof c.tokensAvailable === "number" ? c.tokensAvailable : 1000000,
      tokensUsed: typeof c.tokensUsed === "number" ? c.tokensUsed : 0
    }));
  });
  
  const [workspaceTabs, setWorkspaceTabs] = useState<WorkspaceTab[]>(() => {
    const saved = localStorage.getItem("ai_cmd_workspace_tabs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse saved tabs, resetting", e);
      }
    }
    // Launch default tab
    return [
      {
        id: "tab-default-1",
        title: "Lembar Kerja Alpha",
        mode: "chat",
        prompt: "",
        response: "",
        chatHistory: [
          {
            id: "msg-welcome",
            role: "assistant",
            content: "Selamat datang di **AI Command Studio**! Silakan tulis perintah (prompt) Anda di bawah, konfigurasikan API key Anda, atau gunakan Simulator Gangguan untuk menguji perutean failover prioritas tinggi secara otomatis.",
            timestamp: new Date().toLocaleTimeString(),
            providerUsed: "gemini",
            modelUsed: "gemini-3.5-flash",
            latencyMs: 120,
            tokens: {
              prompt: 15,
              completion: 35,
              total: 50,
              cost: 0.00001
            }
          }
        ],
        modelSelection: "gemini-3.5-flash",
        selectionMode: "manual",
        isActive: true,
        isGenerating: false,
        autoSwitchLogs: []
      }
    ];
  });

  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>(DEFAULT_PROMPT_TEMPLATES);
  
  const [metrics, setMetrics] = useState<RequestMetric[]>(() => {
    const saved = localStorage.getItem("ai_cmd_metrics");
    return saved ? JSON.parse(saved) : MOCK_METRICS;
  });

  // Settings configs
  const [autoSwitch, setAutoSwitch] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(2);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(10);
  const [theme, setTheme] = useState<'matte-dark' | 'slate-grey' | 'glass-purple'>('matte-dark');
  const [tokenSaverMode, setTokenSaverMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("ai_cmd_token_saver_mode");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("ai_cmd_token_saver_mode", String(tokenSaverMode));
  }, [tokenSaverMode]);
  
  // Virtual Filesystem State
  const [virtualFiles, setVirtualFiles] = useState<VirtualFile[]>(() => {
    const saved = localStorage.getItem("ai_cmd_virtual_files");
    return saved ? JSON.parse(saved) : DEFAULT_VIRTUAL_FILES;
  });

  const [activeFileId, setActiveFileId] = useState<string | null>(() => {
    const saved = localStorage.getItem("ai_cmd_active_file_id");
    if (saved) return saved;
    return DEFAULT_VIRTUAL_FILES[0]?.id || null;
  });

  // Sync virtual files to local storage
  useEffect(() => {
    localStorage.setItem("ai_cmd_virtual_files", JSON.stringify(virtualFiles));
  }, [virtualFiles]);

  useEffect(() => {
    if (activeFileId) {
      localStorage.setItem("ai_cmd_active_file_id", activeFileId);
    } else {
      localStorage.removeItem("ai_cmd_active_file_id");
    }
  }, [activeFileId]);

  const createVirtualFile = (name: string, content: string, language: string, path: string) => {
    const newId = `file-${Date.now()}`;
    const newFile: VirtualFile = {
      id: newId,
      name,
      content,
      language,
      path,
      type: "file",
      updatedAt: new Date().toISOString()
    };
    setVirtualFiles(prev => [...prev, newFile]);
    setActiveFileId(newId);
    return newId;
  };

  const updateVirtualFileContent = (id: string, content: string) => {
    setVirtualFiles(prev => prev.map(f => f.id === id ? { ...f, content, updatedAt: new Date().toISOString() } : f));
  };

  const deleteVirtualFile = (id: string) => {
    setVirtualFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      return filtered;
    });
    // If active was deleted, find another active file
    if (activeFileId === id) {
      setVirtualFiles(prev => {
        const remaining = prev.filter(f => f.id !== id);
        setActiveFileId(remaining[0]?.id || null);
        return remaining;
      });
    }
  };

  const renameVirtualFile = (id: string, newName: string) => {
    setVirtualFiles(prev => prev.map(f => {
      if (f.id === id) {
        // Compute new path if paths are structural
        const pathParts = f.path.split('/');
        pathParts[pathParts.length - 1] = newName;
        const newPath = pathParts.join('/');
        
        // Detect language extension by newName
        const ext = newName.split('.').pop() || '';
        let lang = f.language;
        if (ext === 'js' || ext === 'jsx') lang = 'javascript';
        else if (ext === 'ts' || ext === 'tsx') lang = 'typescript';
        else if (ext === 'py') lang = 'python';
        else if (ext === 'json') lang = 'json';
        else if (ext === 'md') lang = 'markdown';
        else if (ext === 'go') lang = 'go';
        else if (ext === 'sh') lang = 'shell';
        else if (ext === 'html') lang = 'html';
        else if (ext === 'css') lang = 'css';
        else if (ext === 'yaml' || ext === 'yml') lang = 'yaml';

        return {
          ...f,
          name: newName,
          path: newPath,
          language: lang,
          updatedAt: new Date().toISOString()
        };
      }
      return f;
    }));
  };
  
  // Outage simulator to demonstrate automatic recovery easily
  const [providerStatusSimulator, setProviderStatusSimulator] = useState<Record<string, 'healthy' | 'outage'>>({
    gemini: 'healthy',
    openai: 'healthy',
    claude: 'healthy',
    openrouter: 'healthy',
    custom: 'healthy'
  });

  const toggleProviderSimulator = (provider: string) => {
    setProviderStatusSimulator(prev => ({
      ...prev,
      [provider]: prev[provider] === 'healthy' ? 'outage' : 'healthy'
    }));
  };

  // Sync back to localStorage
  useEffect(() => {
    localStorage.setItem("ai_cmd_api_configs", JSON.stringify(apiConfigs));
  }, [apiConfigs]);

  useEffect(() => {
    localStorage.setItem("ai_cmd_workspace_tabs", JSON.stringify(workspaceTabs));
  }, [workspaceTabs]);

  useEffect(() => {
    localStorage.setItem("ai_cmd_metrics", JSON.stringify(metrics));
  }, [metrics]);

  // Operational Routines
  const addNewTab = (mode: WorkspaceMode) => {
    setWorkspaceTabs(prev => {
      const reset = prev.map(t => ({ ...t, isActive: false }));
      const newId = `tab-${Date.now()}`;
      const count = prev.length + 1;
      return [
        ...reset,
        {
          id: newId,
          title: `Session ${count} (${mode.toUpperCase()})`,
          mode,
          prompt: "",
          response: "",
          chatHistory: [
            {
              id: `msg-sys-${Date.now()}`,
              role: "assistant",
              content: `A new **${mode} workspace** session initialized successfully. Try writing your commands.`,
              timestamp: new Date().toLocaleTimeString(),
            }
          ],
          modelSelection: mode === 'chat' ? 'gemini-3.5-flash' : 'gemini-3.1-pro-preview',
          selectionMode: "manual",
          isActive: true,
          isGenerating: false,
          autoSwitchLogs: []
        }
      ];
    });
  };

  const removeTab = (id: string) => {
    setWorkspaceTabs(prev => {
      if (prev.length <= 1) return prev; // Keep at least one
      const targetIndex = prev.findIndex(t => t.id === id);
      const filtered = prev.filter(t => t.id !== id);
      if (prev[targetIndex]?.isActive) {
        // Activate someone else
        const neighbor = filtered[Math.max(0, targetIndex - 1)];
        neighbor.isActive = true;
      }
      return filtered;
    });
  };

  const selectTab = (id: string) => {
    setWorkspaceTabs(prev => prev.map(t => ({
      ...t,
      isActive: t.id === id
    })));
  };

  const updateTabPrompt = (id: string, text: string) => {
    setWorkspaceTabs(prev => prev.map(t => t.id === id ? { ...t, prompt: text } : t));
  };

  const updateTabModel = (id: string, model: string) => {
    setWorkspaceTabs(prev => prev.map(t => t.id === id ? { ...t, modelSelection: model } : t));
  };

  const updateTabSelectionMode = (id: string, mode: 'manual' | 'fastest' | 'cheapest' | 'best' | 'smart') => {
    setWorkspaceTabs(prev => prev.map(t => t.id === id ? { ...t, selectionMode: mode } : t));
  };

  const updateTabMode = (id: string, mode: WorkspaceMode) => {
    setWorkspaceTabs(prev => prev.map(t => t.id === id ? { ...t, mode } : t));
  };

  const clearTabHistory = (id: string) => {
    setWorkspaceTabs(prev => prev.map(t => t.id === id ? {
      ...t,
      prompt: "",
      response: "",
      chatHistory: [
        {
          id: `msg-sys-${Date.now()}`,
          role: "assistant",
          content: "Workspace session history cleared.",
          timestamp: new Date().toLocaleTimeString(),
        }
      ],
      autoSwitchLogs: []
    } : t));
  };

  const addMetric = (metric: RequestMetric) => {
    setMetrics(prev => [metric, ...prev].slice(0, 50)); // Keep latest 50 logs for low memory
  };

  const clearMetrics = () => {
    setMetrics([]);
  };

  // API List Reordering for High-Priority Automatics
  const moveApiPriority = (id: string, direction: 'up' | 'down') => {
    setApiConfigs(prev => {
      const sorted = [...prev].sort((a,b) => a.priority - b.priority);
      const index = sorted.findIndex(c => c.id === id);
      if (index === -1) return prev;
      
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return prev;
      
      // Swap elements
      const temp = sorted[index];
      sorted[index] = sorted[targetIndex];
      sorted[targetIndex] = temp;
      
      // Recalculate priority ranks simple
      return sorted.map((c, i) => ({ ...c, priority: i + 1 }));
    });
  };

  const toggleApiProvider = (id: string) => {
    setApiConfigs(prev => prev.map(c => c.id === id ? {
      ...c,
      enabled: !c.enabled,
      status: !c.enabled ? 'active' : 'disabled'
    } : c));
  };

  const updateApiConfig = (id: string, fields: Partial<ApiProviderConfig>) => {
    setApiConfigs(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c));
  };

  // --------------------------------------------------------------------------
  // Core Smart Failover Execution Engine
  // --------------------------------------------------------------------------
  const submitWorkspacePrompt = async (tabId: string) => {
    const tab = workspaceTabs.find(t => t.id === tabId);
    if (!tab || tab.isGenerating || !tab.prompt.trim()) return;

    // Start UI generating status loader
    setWorkspaceTabs(prev => prev.map(t => t.id === tabId ? { 
      ...t, 
      isGenerating: true,
      autoSwitchLogs: [`Initializing workspace request on "${tab.modelSelection}"...`]
    } : t));

    const userMessage: Message = {
      id: `m-usr-${Date.now()}`,
      role: 'user',
      content: tab.prompt,
      timestamp: new Date().toLocaleTimeString(),
    };

    // Update history locally with user message and reset input editor
    setWorkspaceTabs(prev => prev.map(t => t.id === tabId ? {
      ...t,
      prompt: "", // Clear input editor
      chatHistory: [...t.chatHistory, userMessage]
    } : t));

    // Resolve priority list of active, enabled providers
    const orderedProviders = [...apiConfigs]
      .filter(c => c.enabled)
      .sort((a, b) => a.priority - b.priority);

    if (orderedProviders.length === 0) {
      setWorkspaceTabs(prev => prev.map(t => t.id === tabId ? {
        ...t,
        isGenerating: false,
        autoSwitchLogs: [...t.autoSwitchLogs, "ERROR: No active or enabled API providers found inside settings."],
        chatHistory: [...t.chatHistory, {
          id: `m-err-${Date.now()}`,
          role: 'assistant',
          content: "❌ **Failed to run request**: No key providers are enabled. Please go to **API Manager** in the sidebar to enable at least one provider (e.g. Gemini, OpenAI, Claude).",
          timestamp: new Date().toLocaleTimeString()
        }]
      } : t));
      return;
    }

    let success = false;
    let providerIndex = 0;
    
    // We execute try blocks. If switch is off, we only try the first provider.
    const maxFallbackChain = autoSwitch ? orderedProviders.length : 1;

    while (providerIndex < maxFallbackChain && !success) {
      const activeProvider = orderedProviders[providerIndex];
      const providerType = activeProvider.provider;
      
      // Select model label to submit
      let modelToSubmit = tab.modelSelection;
      
      // If of a different provider, map to appropriate defaults to look seamless
      if (providerType === 'openai') modelToSubmit = 'gpt-4o';
      else if (providerType === 'claude') modelToSubmit = 'claude-3-5-sonnet';
      else if (providerType === 'openrouter') modelToSubmit = 'deepseek-v3';
      else if (providerType === 'custom') modelToSubmit = 'local-llama-3';

      setWorkspaceTabs(prev => prev.map(t => t.id === tabId ? {
        ...t,
        autoSwitchLogs: [...t.autoSwitchLogs, `[Chain Rank #${providerIndex + 1}] Testing provider "${activeProvider.name}" via model "${modelToSubmit}"...`]
      } : t));

      let retriesAttempted = 0;
      const localRetryLimit = retryCount;

      while (retriesAttempted <= localRetryLimit && !success) {
        if (retriesAttempted > 0) {
          // Randomized backoff delay 1-3 seconds as natural feel
          const delaySec = Math.floor(Math.random() * 2) + 1.2;
          setWorkspaceTabs(prev => prev.map(t => t.id === tabId ? {
            ...t,
            autoSwitchLogs: [...t.autoSwitchLogs, `   ↳ Outage query match. Backing off ${delaySec.toFixed(1)}s before retry ${retriesAttempted}/${localRetryLimit}...`]
          } : t));
          await new Promise(resolve => setTimeout(resolve, delaySec * 1000));
        }

        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: providerType,
              model: modelToSubmit,
              prompt: userMessage.content,
              history: tab.chatHistory.slice(tokenSaverMode ? -2 : -5), // Hanya kirim 2 pesan terakhir jika hemat token aktif
              providerStatusSimulator, // Simulates simulated outage status toggled on ApiManager
              tokenSaverMode: tokenSaverMode
            })
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error ${res.status}`);
          }

          const responseData = await res.json();
          success = true;

          // Process success layout updates!
          const botResponse: Message = {
            id: `m-bot-${Date.now()}`,
            role: 'assistant',
            content: responseData.text,
            timestamp: new Date().toLocaleTimeString(),
            providerUsed: responseData.providerUsed,
            modelUsed: responseData.modelUsed,
            latencyMs: responseData.latencyMs,
            tokens: responseData.tokens
          };

          // Update tab metrics and responses
          setWorkspaceTabs(prev => prev.map(t => t.id === tabId ? {
            ...t,
            isGenerating: false,
            response: responseData.text,
            chatHistory: [...t.chatHistory, botResponse],
            autoSwitchLogs: [...t.autoSwitchLogs, `✓ Success! Connected with "${activeProvider.name}" in ${responseData.latencyMs}ms. Tokens allocated: ${responseData.tokens.total}.`],
            tokenStats: {
              input: responseData.tokens.input,
              output: responseData.tokens.output,
              total: responseData.tokens.total,
              estimatedCost: responseData.tokens.cost,
              latency: responseData.latencyMs,
            }
          } : t));

          // Log execution into Global Metrics dashboard
          addMetric({
            id: `metric-${Date.now()}`,
            timestamp: new Date().toISOString(),
            provider: providerType,
            model: modelToSubmit,
            success: true,
            latencyMs: responseData.latencyMs,
            inputTokens: responseData.tokens.input,
            outputTokens: responseData.tokens.output,
            totalTokens: responseData.tokens.total,
            estimatedCost: responseData.tokens.cost
          });

          // Update activeConfig latency, status green, and token counters
          const matchedTotalTokens = responseData.tokens?.total || 150;
          setApiConfigs(prev => prev.map(c => c.id === activeProvider.id ? {
            ...c,
            status: 'active',
            latency: responseData.latencyMs,
            lastError: undefined,
            tokensAvailable: Math.max(0, (c.tokensAvailable || 1000000) - matchedTotalTokens),
            tokensUsed: (c.tokensUsed || 0) + matchedTotalTokens
          } : c));

        } catch (err: any) {
          retriesAttempted++;
          const errMsg = err.message || "Failed request network connection.";
          console.warn(`Attempt failed on provider ${activeProvider.name}: ${errMsg}`);

          // Update provider error visually in the list
          setApiConfigs(prev => prev.map(c => c.id === activeProvider.id ? {
            ...c,
            status: retriesAttempted > localRetryLimit ? 'error' : 'warning',
            lastError: errMsg
          } : c));

          if (retriesAttempted > localRetryLimit) {
            setWorkspaceTabs(prev => prev.map(t => t.id === tabId ? {
              ...t,
              autoSwitchLogs: [...t.autoSwitchLogs, `✗ Provider "${activeProvider.name}" failed: ${errMsg}`]
            } : t));

            // Log failed request on this provider in metrics
            addMetric({
              id: `metric-${Date.now()}`,
              timestamp: new Date().toISOString(),
              provider: providerType,
              model: modelToSubmit,
              success: false,
              latencyMs: 150,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
              estimatedCost: 0,
              errorMessage: `[${activeProvider.name}] ${errMsg}`
            });
          }
        }
      }

      if (!success) {
        providerIndex++;
        if (providerIndex < maxFallbackChain) {
          setWorkspaceTabs(prev => prev.map(t => t.id === tabId ? {
            ...t,
            autoSwitchLogs: [...t.autoSwitchLogs, `⚠️ TRIGGERING FAILOVER: Switching auto fallback to next available stream...`]
          } : t));
        }
      }
    }

    // Catastrophic failure if absolutely no provider was successful
    if (!success) {
      const failureNotice: Message = {
        id: `m-fail-${Date.now()}`,
        role: 'assistant',
        content: `❌ **Failed to resolve execution cluster block.** 

All available providers in your fallback queue failed to execute. 

* Checked providers list: ${orderedProviders.map(p => `\`${p.name}\``).join(', ')}
* Reason: API downtime, simulated Outage, or keys missing.

*Action steps*: Go to **API Manager** to verify priorities or reset the toggle on the **Simulated Outage Controllers**.`,
        timestamp: new Date().toLocaleTimeString(),
      };

      setWorkspaceTabs(prev => prev.map(t => t.id === tabId ? {
        ...t,
        isGenerating: false,
        chatHistory: [...t.chatHistory, failureNotice],
        autoSwitchLogs: [...t.autoSwitchLogs, "❌ CATASTROPHIC ERROR: No responses solved in chain hierarchy! Session halted."]
      } : t));
    }
  };

  // Rewrite / Optimize Prompt using real backend Gemini API call!
  const optimizePromptText = async (tabId: string, optimizeMode: string) => {
    const tab = workspaceTabs.find(t => t.id === tabId);
    if (!tab || !tab.prompt.trim() || tab.isGenerating) return;

    setWorkspaceTabs(prev => prev.map(t => t.id === tabId ? {
      ...t,
      isGenerating: true,
      autoSwitchLogs: ["Contacting Gemini Expert optimization engine..."]
    } : t));

    try {
      const res = await fetch("/api/optimize-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: tab.prompt,
          mode: optimizeMode
        })
      });

      if (!res.ok) throw new Error("Optimization query returned error status on server.");

      const data = await res.json();
      
      // Update prompt in workspace with the beautiful optimized string!
      setWorkspaceTabs(prev => prev.map(t => t.id === tabId ? {
        ...t,
        prompt: data.optimizedPrompt,
        isGenerating: false,
        autoSwitchLogs: [...t.autoSwitchLogs, `✓ Prompt refactored successfully [Latency: ${data.latencyMs}ms]. Explanation: ${data.explanation}`],
        chatHistory: [...t.chatHistory, {
          id: `opt-notif-${Date.now()}`,
          role: 'system',
          content: `⚡ **Prompt Optimized (${optimizeMode.toUpperCase()})**:
${data.explanation}
*(The editor input text has been updated)*`,
          timestamp: new Date().toLocaleTimeString()
        }]
      } : t));

    } catch (err: any) {
      console.error(err);
      setWorkspaceTabs(prev => prev.map(t => t.id === tabId ? {
        ...t,
        isGenerating: false,
        autoSwitchLogs: [...t.autoSwitchLogs, `✗ Prompt optimization failed: ${err.message}`]
      } : t));
    }
  };


  return (
    <AppContext.Provider value={{
      currentView,
      setCurrentView,
      apiConfigs,
      setApiConfigs,
      workspaceTabs,
      setWorkspaceTabs,
      promptTemplates,
      setPromptTemplates,
      metrics,
      addMetric,
      clearMetrics,
      
      autoSwitch,
      setAutoSwitch,
      retryCount,
      setRetryCount,
      timeoutSeconds,
      setTimeoutSeconds,
      theme,
      setTheme,
      tokenSaverMode,
      setTokenSaverMode,
      
      virtualFiles,
      setVirtualFiles,
      activeFileId,
      setActiveFileId,
      createVirtualFile,
      updateVirtualFileContent,
      deleteVirtualFile,
      renameVirtualFile,
      
      providerStatusSimulator,
      toggleProviderSimulator,
      
      addNewTab,
      removeTab,
      selectTab,
      updateTabPrompt,
      updateTabModel,
      updateTabSelectionMode,
      updateTabMode,
      moveApiPriority,
      toggleApiProvider,
      updateApiConfig,
      clearTabHistory,
      
      submitWorkspacePrompt,
      optimizePromptText
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside an AppProvider");
  return context;
}
