/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiProviderConfig, PromptTemplate, RequestMetric } from "./types";

export const DEFAULT_API_CONFIGS: ApiProviderConfig[] = [
  {
    id: "gemini-api",
    name: "Google Gemini Core",
    provider: "gemini",
    apiKey: "", // Bersih dan kosong untuk diinput oleh pengguna
    priority: 1,
    enabled: true,
    status: "active",
    tokensAvailable: 1500000,
    tokensUsed: 0,
  },
  {
    id: "openrouter-api",
    name: "OpenRouter Hub",
    provider: "openrouter",
    apiKey: "", // Bersih dan kosong
    priority: 2,
    enabled: false,
    status: "disabled",
    tokensAvailable: 1000000,
    tokensUsed: 0,
  },
  {
    id: "openai-api",
    name: "OpenAI GPT Platform",
    provider: "openai",
    apiKey: "", // Bersih dan kosong
    priority: 3,
    enabled: false,
    status: "disabled",
    tokensAvailable: 1000000,
    tokensUsed: 0,
  },
  {
    id: "claude-api",
    name: "Anthropic Claude Network",
    provider: "claude",
    apiKey: "", // Bersih dan kosong
    priority: 4,
    enabled: false,
    status: "disabled",
    tokensAvailable: 1000000,
    tokensUsed: 0,
  },
  {
    id: "custom-api",
    name: "Endpoint Kustom Lokal",
    provider: "custom",
    apiKey: "",
    baseUrl: "http://localhost:11434/v1",
    priority: 5,
    enabled: false,
    status: "disabled",
    tokensAvailable: 2000000,
    tokensUsed: 0,
  }
];

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "tpl-1",
    title: "Arsitek Sistem Kode",
    description: "Memformulasikan permintaan menjadi cetak biru desain perangkat lunak yang komprehensif tingkat enterprise.",
    category: "coding",
    text: "Ubah permintaan sistem berikut menjadi cetak biru arsitektur. Tentukan struktur model, urutan aliran data, komponen modular, penanganan kasus sudut (edge case) yang spesifik, dan aturan penulisan komentar:\n\n[USER_REQUEST_HERE]"
  },
  {
    id: "tpl-2",
    title: "Penilai Logika Sokratik",
    description: "Mengevaluasi alur penalaran, memeriksa konsistensi, dan mengungkap kesesatan berpikir.",
    category: "research",
    text: "Analisis usulan model atau teks berikut. Pertama, nyatakan argumen secara eksplisit. Kedua, daftar bias kognitif atau asumsi yang tidak diutarakan secara terbuka. Ketiga, sarankan argumen tandingan dengan bukti yang dapat diverifikasi dan ringkas nilai kognitif akhir dari sintesis ini:\n\n[PROPOSAL_HERE]"
  },
  {
    id: "tpl-3",
    title: "Pengembang Cerita Kreatif",
    description: "Memperkuat imajinasi deskriptif, detail sensorik, dan tempo penceritaan.",
    category: "creative",
    text: "Tulis ulang garis besar plot sederhana ini untuk membangkitkan suasana atmosfer yang mendalam, motivasi karakter yang kuat, detail sensorik lingkungan yang kaya, dan tempo dramatis yang dinamis. Pastikan menggunakan kedalaman metafora secara natural:\n\n[OUTLINE_HERE]"
  },
  {
    id: "tpl-4",
    title: "Penyusun JSON Presisi Tinggi",
    description: "Menyusun ulang konten percakapan menjadi format JSON standar yang siap divalidasi.",
    category: "accurate",
    text: "Analisis input dan petakan secara ketat ke dalam spesifikasi JSON berikut: { success: boolean, category: string, criticalMetadata: Array<{ name: string, rank: number }> }.\nPastikan kepatuhan struktur yang sempurna tanpa memunculkan komentar penjelasan format lain, dan keluarkan HANYA valid JSON saja:\n\n[INPUT_TEXT_HERE]"
  }
];

export const MOCK_METRICS: RequestMetric[] = [];

export const DEFAULT_VIRTUAL_FILES = [
  {
    id: "file-failover-ts",
    name: "failover.ts",
    content: `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AI Command Studio - Redundant Endpoint Failover Mechanics
 */

export interface FailoverResponse {
  success: boolean;
  activeProvider: string;
  responseBody: string;
  latencyMs: number;
}

export class FailoverClusterHandler {
  private providers: any[];
  
  constructor(providers: any[]) {
    this.providers = providers.slice().sort((a, b) => a.priority - b.priority);
  }

  /**
   * Dispatches network queries with automated priority fallback sequences.
   */
  public async executeQuery(prompt: string): Promise<FailoverResponse> {
    const startTime = Date.now();
    const activeProviders = this.providers.filter(p => p.enabled && p.status === 'active');

    for (const provider of activeProviders) {
      try {
        console.log("[Failover Node] Testing root rank priority: " + provider.name + "...");
        const result = await this.pingEndpoint(provider, prompt);
        return {
          success: true,
          activeProvider: provider.name,
          responseBody: result,
          latencyMs: Date.now() - startTime
        };
      } catch (err) {
        console.warn("[Failover Alert] Node " + provider.name + " outage bypass triggered.");
      }
    }

    throw new Error("Catastrophic status: All redundant providers failed to reply within deadline limit.");
  }

  private async pingEndpoint(provider: any, prompt: string): Promise<string> {
    // Simulate query connection delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    return "[SUCCESS] Replied from " + provider.provider + " routing gateway for: " + prompt.slice(0, 20) + "...";
  }
}`,
    language: "typescript",
    path: "src/utils/failover.ts",
    type: "file",
    updatedAt: new Date().toISOString()
  },
  {
    id: "file-harness-py",
    name: "test_harness.py",
    content: `import sys
import time
import random

def run_red_alert_simulation(nodes):
    """
    Simulates random server dropouts to test automatic endpoint bypasses.
    """
    print("=" * 60)
    print("         AI COMMAND REDUNDANT CLUSTER TELEMETRY")
    print("=" * 60)
    time.sleep(0.5)

    for i, node in enumerate(nodes):
        print(f"[*] Testing connection block #{i+1:02d} on {node.upper()}... ", end="", flush=True)
        time.sleep(random.uniform(0.3, 0.9))
        
        # Simulate simulated outage check
        is_healthy = random.choice([True, True, False])
        if is_healthy:
            print("[HEALTHY] - Active Node Online (200 OK)")
        else:
            print("[BYPASS]  - Outage status match! Triggering failover queue.")
            time.sleep(0.2)
            print("  ↳ Router redirected query streams to next highest rank...")

if __name__ == "__main__":
    cluster_nodes = ["gemini-3.5", "deepseek-v3", "gpt-4o", "claude-3-5"]
    run_red_alert_simulation(cluster_nodes)
`,
    language: "python",
    path: "scripts/test_harness.py",
    type: "file",
    updatedAt: new Date().toISOString()
  },
  {
    id: "file-nodes-json",
    name: "endpoints_map.json",
    content: `{
  "clusterName": "Redundant Matrix Route Panel",
  "version": "1.0.4",
  "nodes": [
    {
      "id": "gemini-api",
      "name": "Google Gemini 3.5 Core",
      "provider": "gemini",
      "priority": 1,
      "enabled": true,
      "timeout": 10
    },
    {
      "id": "openrouter-api",
      "name": "OpenRouter Unified Interface",
      "provider": "openrouter",
      "priority": 2,
      "enabled": true,
      "timeout": 15
    },
    {
      "id": "openai-api",
      "name": "OpenAI GPT Platform",
      "provider": "openai",
      "priority": 3,
      "enabled": true,
      "timeout": 12
    }
  ],
  "failoverConfig": {
    "autoSwitch": true,
    "maxAttempts": 3,
    "backoffBaseMs": 1000
  }
}`,
    language: "json",
    path: "config/endpoints_map.json",
    type: "file",
    updatedAt: new Date().toISOString()
  },
  {
    id: "file-audit-md",
    name: "audit_sistem.md",
    content: `# Log Panduan Pengembang: Kluster Operasional

Lingkungan kerja virtual ini mengelola protokol perutean perintah (query) secara otomatis di seluruh gerbang API redundan.

## Prinsip Operasional

1. **Kecocokan Prioritas**: Saat menyalurkan perintah, permintaan akan diarahkan ke simpul (node) Prioritas #1 terlebih dahulu.
2. **Deteksi Gangguan**: Setiap keterlambatan koneksi yang melebihi 'timeoutSeconds' atau menghasilkan respons non-200 akan ditangkap secara berurutan.
3. **Penyembuhan Dinamis (Fallback)**: Kluster akan beralih aliran data ke simpul Prioritas #2 secara instan untuk menjamin nol degradasi uptime.

> **Tips**: Masuk ke menu **API Manager** dan klik sakelar simulasi gangguan; ini akan menguji mekanisme failover secara langsung tanpa menghabiskan kuota token API yang sebenarnya.
`,
    language: "markdown",
    path: "audit_sistem.md",
    type: "file",
    updatedAt: new Date().toISOString()
  }
];

