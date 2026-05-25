/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ApiProviderType = 'gemini' | 'openai' | 'claude' | 'openrouter' | 'custom';

export interface ApiProviderConfig {
  id: string;
  name: string;
  provider: ApiProviderType;
  apiKey: string;
  baseUrl?: string;
  priority: number; // 1 is highest
  enabled: boolean;
  status: 'active' | 'warning' | 'error' | 'disabled';
  lastError?: string;
  latency?: number; // in ms
  tokensAvailable?: number;
  tokensUsed?: number;
}

export type WorkspaceMode = 'chat' | 'prompt' | 'command';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
    cost: number;
  };
  providerUsed?: string;
  modelUsed?: string;
  latencyMs?: number;
}

export interface WorkspaceTab {
  id: string;
  title: string;
  mode: WorkspaceMode;
  prompt: string;
  response: string;
  chatHistory: Message[];
  modelSelection: string; // e.g. 'gemini-3.5-flash', 'gpt-4o', etc.
  selectionMode: 'manual' | 'fastest' | 'cheapest' | 'best' | 'smart';
  tokenStats?: {
    input: number;
    output: number;
    total: number;
    estimatedCost: number;
    latency: number;
  };
  isActive: boolean;
  isGenerating: boolean;
  autoSwitchLogs: string[];
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: 'creative' | 'balanced' | 'accurate' | 'coding' | 'research';
  text: string;
}

export interface RequestMetric {
  id: string;
  timestamp: string;
  provider: ApiProviderType;
  model: string;
  success: boolean;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  errorMessage?: string;
}

export interface VirtualFile {
  id: string;
  name: string;
  content: string;
  language: string; // e.g. 'typescript', 'python', 'json', 'markdown', 'html', 'yaml', 'shell', 'go'
  path: string;
  parentId?: string;
  type: 'file';
  updatedAt: string;
}

export interface VirtualFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  type: 'folder';
  childrenIds: string[];
}

export type FileSystemItem = VirtualFile | VirtualFolder;

export interface AppConfig {
  autoSwitch: boolean;
  retryCount: number;
  timeoutSeconds: number;
  theme: 'matte-dark' | 'slate-grey' | 'glass-purple';
  promptOptimizeMode: 'creative' | 'balanced' | 'accurate' | 'coding' | 'research';
  apiConfigs: ApiProviderConfig[];
  promptTemplates: PromptTemplate[];
  metrics: RequestMetric[];
}
