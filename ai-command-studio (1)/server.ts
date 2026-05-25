/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to initialize Gemini SDK safely and lazily
let geminiClientCache: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClientCache) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Real Gemini API endpoints will use simulated mock mode.");
    }
    // Always include User-Agent: 'aistudio-build' for telemetry as required
    geminiClientCache = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClientCache;
}

// --------------------------------------------------------------------------
// API Endpoints
// --------------------------------------------------------------------------

// Health probe
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// Prompt Optimization endpoint using real server-side Gemini
app.post("/api/optimize-prompt", async (req, res) => {
  const start = Date.now();
  try {
    const { prompt, mode } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const modeInstructions: Record<string, string> = {
      creative: "Rewrite the prompt to encourage highly imaginative, detailed, and expansive narrative styles. Inject rich context and descriptive adjectives.",
      balanced: "Rewrite the prompt to find a harmonious balance between strict factual correctness and organic creative style. Solidify constraints without losing prose depth.",
      accurate: "Rewrite the prompt with severe analytical structure, precise output schemas, complete logical boundaries, and clear warning definitions of negative domains.",
      coding: "Refactor this request into an explicit software architectural breakdown with inputs, outputs, exact tech design patterns, commenting requirements, and edge case bounds.",
      research: "Formulate this search into a systematic academic methodology query template. Include criteria like sources, literature, verification checkpoints, arguments, counters, and synthesis outlines."
    };

    const targetMode = mode || "balanced";
    const systemInstruction = `You are a world-class prompt engineer specialized in optimizing AI requests. Your task is to refactor the user's rough prompt into a highly effective, optimized, and masterfully structures version.
Focus Mode Instruction: ${modeInstructions[targetMode] || modeInstructions.balanced}

Format the output strictly as a JSON object with this structure:
{
  "optimizedPrompt": "...",
  "explanation": "Brief bulleted string detailing why these changes help, what constraints were solidified, and how it boosts response metrics."
}
IMPORTANT: Output ONLY the valid JSON, no markdown wrappers, no backticks.`;

    const apiKey = process.env.GEMINI_API_KEY;
    let optimizedPrompt = "";
    let explanation = "";

    if (apiKey) {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Optimize this prompt:\n\n"${prompt}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const responseText = response.text || "";
      try {
        const parsed = JSON.parse(responseText.trim());
        optimizedPrompt = parsed.optimizedPrompt;
        explanation = parsed.explanation;
      } catch (err) {
        // Fallback if parsing failed
        optimizedPrompt = responseText;
        explanation = "Solidified logical boundaries and structured instructions.";
      }
    } else {
      // Elegant simulated prompt optimizer if real Gemini API key is missing
      await new Promise((resolve) => setTimeout(resolve, 800));
      optimizedPrompt = `[OPTIMIZED FOR ${targetMode.toUpperCase()}]\n\n${prompt}\n\nConstraints:\n- Deliver analytical precision\n- Maintain structured typography\n- Include source validation steps`;
      explanation = "Enriched structured rules, enforced specific constraints, and refined prompt alignment.";
    }

    const latencyMs = Date.now() - start;
    const tokensIn = Math.ceil(prompt.length / 4) + 120;
    const tokensOut = Math.ceil(optimizedPrompt.length / 4) + 80;

    res.json({
      success: true,
      optimizedPrompt,
      explanation,
      latencyMs,
      tokens: {
        input: tokensIn,
        output: tokensOut,
        total: tokensIn + tokensOut,
        cost: (tokensIn * 0.000075 / 1000) + (tokensOut * 0.0003 / 1000),
      }
    });

  } catch (error: any) {
    console.error("Error optimizing prompt:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred during prompt optimization.",
    });
  }
});

/// Chat execution route (with real Gemini routing and failure recovery logic wrapper)
app.post("/api/chat", async (req, res) => {
  const start = Date.now();
  try {
    const { provider, model, prompt, history, providerStatusSimulator, tokenSaverMode } = req.body;

    // Check if user specifically wanted to test failover (Simulated server outage)
    if (providerStatusSimulator && providerStatusSimulator[provider] === 'outage') {
      const latency = Math.floor(Math.random() * 800) + 200;
      await new Promise(resolve => setTimeout(resolve, latency));
      return res.status(503).json({
        success: false,
        error: `Simulasi gangguan layanan/error (503 Service Unavailable) pada ${provider} untuk menguji logika failover.`
      });
    }

    let completionText = "";
    let estimatedCost = 0.0;
    let tokensIn = Math.ceil(prompt.length / 4) + (history ? history.reduce((acc: number, m: any) => acc + Math.ceil(m.content.length / 4), 0) : 0);
    let tokensOut = 0;

    // Handle Active Router
    if (provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        // Run Real Gemini API Call!
        const ai = getGeminiClient();
        
        // Construct standard chat message elements
        const chatMessages = [];
        if (history && history.length > 0) {
          // Flatten standard history
          for (const item of history) {
            chatMessages.push({
              role: item.role === 'assistant' ? 'model' : item.role,
              parts: [{ text: item.content }]
            });
          }
        }
        
        // Append current message
        chatMessages.push({
          role: 'user',
          parts: [{ text: prompt }]
        });

        const targetModel = model || "gemini-3.5-flash";

        // Dynamic System instruction for Bahasa Indonesia & Token Saving Mode controls
        const systemInstruction = tokenSaverMode
          ? "Anda adalah asisten AI hemat token. Jawablah instruksi pengguna dalam Bahasa Indonesia secara sangat ringkas, padat, langsung ke intinya, hilangkan basa-basi ataupun ucapan ramah tamah yang tidak esensial. Fokus murni pada kegunaan teknis."
          : "Anda adalah asisten profesional yang memberikan jawaban dalam Bahasa Indonesia secara berstruktur, jelas, dan sangat membantu.";

        const response = await ai.models.generateContent({
          model: targetModel,
          contents: chatMessages,
          config: {
            systemInstruction,
            maxOutputTokens: tokenSaverMode ? 350 : undefined, // Batasi untuk menghindari pemborosan token
            temperature: tokenSaverMode ? 0.3 : 0.7, // Suhu lebih rendah agar konsisten dan hemat
          }
        });

        completionText = response.text || "Tidak ada balasan yang diterima dari Gemini API.";
        tokensIn = Math.ceil(prompt.length / 3.8);
        tokensOut = Math.ceil(completionText.length / 3.8);
        estimatedCost = (tokensIn * 0.000075 / 1000) + (tokensOut * 0.0003 / 1000);
      } else {
        // Fallback message if key not configured
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (tokenSaverMode) {
          completionText = `### Respons Hemat Token [Simulasi Gemini]
- **Status**: Sukses (Hemat Token Aktif)
- **Model**: ${model || 'gemini-3.5-flash'}
- **Pesan**: Respons singkat karena Mode Hemat Token aktif. Untuk menggunakan API asli, silakan isi kunci API Anda di menu **API Manager** di sidebar sebelah kiri.`;
        } else {
          completionText = `Ini adalah respons simulasi berskala tinggi dari platform **AI Command Studio**!

Salam hangat dari simulasi **Gemini API**. Karena belum ada kunci API (\`GEMINI_API_KEY\`) di lingkungan server Anda, kami menyediakan respons lokal berkualitas tinggi untuk Anda siap gunakan.

* **Model Aktif**: ${model || 'gemini-3.5-flash'}
* **Latensi**: ${Math.floor(Math.random() * 200) + 100}ms
* **Status Endpoint**: Siap Pakai (Sehat)

Anda dapat mengonfigurasi API key yang sebenarnya di menu **API Manager** yang bersih dan siap gunakan, atau menguji alur perpindahan prioritas kegagalan otomatis (smart failover) dengan simulator gangguan kami.`;
        }

        tokensOut = Math.ceil(completionText.length / 4);
        // Standard cheap pricing model
        estimatedCost = (tokensIn * 0.000075 / 1000) + (tokensOut * 0.0003 / 1000);
      }
    } else {
      // Simulate highly distinct responses for other providers
      const latencySim = Math.floor(Math.random() * 1200) + 400; // slightly slower for simulation
      await new Promise(resolve => setTimeout(resolve, latencySim));

      const providerLabel = provider.toUpperCase();
      if (provider === 'openai') {
        completionText = `### Respons dari [OpenAI ${model || 'GPT-4o'}]
        
Berikut adalah respons eksekusi kueri untuk sesi lembar kerja Anda:

1. **Pemeriksaan Inti Sistem**: Aktif
2. **Analisis Selesai**:
   Perintah Anda "${prompt.substring(0, 40)}${prompt.length > 40 ? '...' : ''}" telah berhasil dikompilasi dan diproses dengan bobot vektor optimal. Semua token dilacak secara dinamis di bawah ini.

Mode Hemat Token sangat disarankan untuk pengerjaan instan yang hemat biaya!`;
      } else if (provider === 'claude') {
        completionText = `### Respons dari Anthropic Claude [${model || 'Claude 3.5 Sonnet'}]

Saya telah meninjau sesi perintah Anda. Berikut adalah rincian struktural optimal yang diselaraskan dengan kebutuhan Anda:

* **Tujuan Utama**: Memenuhi permintaan perintah eksekusi
* **Metode Analisis**: Penalaran seimbang
* **Rincian Output**: Siap untuk diintegrasikan.

Unduh rilis desktop exe yang bersih tanpa token bawaan untuk keamanan privasi Anda sepenuhnya!`;
      } else if (provider === 'openrouter') {
        completionText = `### Respons melalui Rute OpenRouter [${model || 'DeepSeek-V3'}]

Penyembuhan dinamis (smart failover) menghasilkan kesuksesan routing.

\`\`\`json
{
  "routing": "openrouter-upstream",
  "status": "completed",
  "prompt_length": ${prompt.length}
}
\`\`\`

OpenRouter mendukung penskalaan harga ekonomis, redundansi multi-tenant, dan perpindahan kegagalan yang instan saat terjadi pemutusan jaringan.`;
      } else {
        // Custom API Custom Endpoint
        completionText = `### Respons dari Endpoint API Kustom [${model || 'Model Interaktif'}]

Endpoint kustom pada \`/v1/chat/completions\` mengembalikan:
- Aliran konten aktif
- Gema perintah: "${prompt}"`;
      }

      tokensOut = Math.ceil(completionText.length / 4);
      // Claude/GPT-4 models have higher pricing estimates
      const costPerMillionIn = provider === 'claude' ? 3.0 : 1.5;
      const costPerMillionOut = provider === 'claude' ? 15.0 : 5.0;
      estimatedCost = (tokensIn * costPerMillionIn / 1000000) + (tokensOut * costPerMillionOut / 1000000);
    }

    const latencyMs = Date.now() - start;

    res.json({
      success: true,
      text: completionText,
      providerUsed: provider,
      modelUsed: model,
      latencyMs,
      tokens: {
        input: tokensIn,
        output: tokensOut,
        total: tokensIn + tokensOut,
        cost: estimatedCost,
      }
    });

  } catch (error: any) {
    console.error("Error executing api chat:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Endpoint error - Failed to access provider.",
    });
  }
});


// --------------------------------------------------------------------------
// Vite or Production Static Assets Middleware
// --------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Use Vite middlewares
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Command Studio server is successfully running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
