import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { HARVESTAN_CONTEXT } from "./context";
import { contentCreatorAgent } from "./agents/content-creator";
import { marketingAgent } from "./agents/marketing";
import { ideaInnovatorAgent } from "./agents/idea-innovator";
import { socialMediaAgent } from "./agents/social-media";
import { imageCreatorAgent } from "./agents/image-creator";

type AgentName =
  | "content-creator"
  | "marketing"
  | "idea-innovator"
  | "social-media"
  | "image-creator";

type AgentResult = {
  agent: string;
  ok: boolean;
  hasil?: string;
  error?: string;
  meta?: any;
  html?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  judul?: string;
  catatan?: string;
};

type OrchestratorResult = {
  ok: boolean;
  perintah: string;
  rencana: string;
  hasil: AgentResult[];
  error?: string;
};

// ============================================================
// Jalankan 1 agent dengan try-catch — JANGAN biarkan 1 agent gagal
// bikin seluruh orchestrator crash
// ============================================================
async function jalankanAgent(
  agentName: AgentName,
  perintah: string
): Promise<AgentResult> {
  try {
    if (agentName === "content-creator") {
      const r = await contentCreatorAgent({ perintah });
      return {
        agent: "content-creator",
        ok: r.ok,
        hasil: r.hasil,
        error: r.error,
        meta: { platform: (r as any).platform, jumlah: (r as any).jumlah },
      };
    }

    if (agentName === "marketing") {
      const r = await marketingAgent({ perintah });
      return {
        agent: "marketing-strategist",
        ok: r.ok,
        hasil: r.hasil,
        error: r.error,
      };
    }

    if (agentName === "idea-innovator") {
      const r = await ideaInnovatorAgent({ perintah });
      return {
        agent: "idea-innovator",
        ok: r.ok,
        hasil: r.hasil,
        error: r.error,
        meta: { jumlahIde: (r as any).jumlahIde },
      };
    }

    if (agentName === "social-media") {
      const r = await socialMediaAgent({ perintah });
      return {
        agent: "social-media-manager",
        ok: r.ok,
        hasil: r.hasil,
        error: r.error,
        meta: {
          platform: (r as any).platform,
          durasiMinggu: (r as any).durasiMinggu,
        },
      };
    }

    if (agentName === "image-creator") {
      const r = await imageCreatorAgent({ perintah });
      return {
        agent: "image-creator",
        ok: r.ok,
        hasil: r.hasil,
        error: r.error,
        html: (r as any).html,
        width: (r as any).width,
        height: (r as any).height,
        aspectRatio: (r as any).aspectRatio,
        judul: (r as any).judul,
        catatan: (r as any).catatan,
      };
    }

    return {
      agent: agentName,
      ok: false,
      error: "Agent tidak dikenal",
    };
  } catch (err: any) {
    console.error(`[ORCHESTRATOR] Agent ${agentName} crash:`, err?.message);
    return {
      agent: agentName,
      ok: false,
      error: err?.message || "Agent crash tanpa pesan error",
    };
  }
}

// ============================================================
// ORCHESTRATOR SINGLE
// ============================================================
async function tentukanAgent(perintah: string): Promise<{
  agents: AgentName[];
  alasan: string;
}> {
  const prompt = `${HARVESTAN_CONTEXT}

# TUGAS: ORCHESTRATOR

Perintah dari founder Harvestan:
"${perintah}"

Agent yang tersedia:
1. **content-creator** — bikin draft konten (caption, script, blog, post)
2. **marketing** — bikin strategi marketing (analisis, target, campaign)
3. **idea-innovator** — brainstorming ide fitur/innovation
4. **social-media** — bikin content calendar & jadwal posting sosmed
5. **image-creator** — bikin infografis HTML (siap download PNG)

Tugas kamu: tentukan agent mana yang HARUS jalan + urutan yang tepat.

ATURAN KERAS:
- **MAKSIMAL 2 AGENT** — jangan lebih! Karena alasan performa
- Pilih yang paling relevan aja
- Kalau perintah minta "konten + gambar/infografis", pilih: content-creator → image-creator
- Kalau perintah minta "strategi marketing", cukup marketing saja
- Kalau perintah minta "ide fitur baru", cukup idea-innovator
- Kalau perintah minta "infografis", cukup image-creator
- Kalau perintah minta "content calendar", cukup social-media

Output HARUS JSON valid, contoh:
{"agents": ["content-creator", "image-creator"], "alasan": "User minta konten + visual"}

Langsung output JSON, tanpa penjelasan tambahan.`;

  const { text } = await generateText({
    model: groq("openai/gpt-oss-120b"),
    prompt,
    temperature: 0.3,
  });

  try {
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON gak ketemu");

    const parsed = JSON.parse(jsonMatch[0]);

    const validAgents: AgentName[] = (parsed.agents || [])
      .filter((a: string) =>
        [
          "content-creator",
          "marketing",
          "idea-innovator",
          "social-media",
          "image-creator",
        ].includes(a)
      )
      .slice(0, 2); // MAKS 2

    return {
      agents: validAgents.length > 0 ? validAgents : ["content-creator"],
      alasan: parsed.alasan || "Default ke content-creator",
    };
  } catch (err) {
    console.error("Parse agent gagal:", err);
    return {
      agents: ["content-creator"],
      alasan: "Fallback ke content-creator",
    };
  }
}

// ============================================================
// MULTI-ORCHESTRATOR: 3 model paralel
// ============================================================
export type MultiOrchestratorModel = {
  id: string;
  label: string;
  provider: "groq" | "openrouter";
  modelId: string;
};

export const MULTI_ORCHESTRATOR_MODELS: MultiOrchestratorModel[] = [
  {
    id: "A",
    label: "Groq gpt-oss-120b",
    provider: "groq",
    modelId: "openai/gpt-oss-120b",
  },
  {
    id: "B",
    label: "Nemotron 3 Ultra",
    provider: "openrouter",
    modelId: "nvidia/nemotron-3-ultra-550b-a55b:free",
  },
  {
    id: "C",
    label: "OpenRouter Auto Free",
    provider: "openrouter",
    modelId: "openrouter/free",
  },
];

async function tentukanAgentDenganModel(
  perintah: string,
  model: MultiOrchestratorModel
): Promise<{
  agents: AgentName[];
  alasan: string;
  error?: string;
}> {
  const prompt = `${HARVESTAN_CONTEXT}

# TUGAS: ORCHESTRATOR

Perintah dari founder Harvestan:
"${perintah}"

Agent yang tersedia:
1. **content-creator** — bikin draft konten
2. **marketing** — bikin strategi marketing
3. **idea-innovator** — brainstorming ide fitur
4. **social-media** — content calendar & jadwal posting
5. **image-creator** — bikin infografis HTML

Tugas: tentukan agent + urutan.

ATURAN KERAS:
- **MAKSIMAL 2 AGENT** — jangan lebih
- Pilih yang paling relevan aja

Output JSON: {"agents": ["..."], "alasan": "..."}`;

  try {
    let text: string;

    if (model.provider === "groq") {
      const r = await generateText({
        model: groq(model.modelId),
        prompt,
        temperature: 0.3,
      });
      text = r.text;
    } else {
      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      });
      const r = await generateText({
        model: openrouter(model.modelId),
        prompt,
        temperature: 0.3,
      });
      text = r.text;
    }

    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        agents: ["content-creator"],
        alasan: "Fallback (JSON gak ketemu)",
        error: "LLM gak output JSON",
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validAgents: AgentName[] = (parsed.agents || [])
      .filter((a: string) =>
        [
          "content-creator",
          "marketing",
          "idea-innovator",
          "social-media",
          "image-creator",
        ].includes(a)
      )
      .slice(0, 2); // MAKS 2

    return {
      agents: validAgents.length > 0 ? validAgents : ["content-creator"],
      alasan: parsed.alasan || "Default",
    };
  } catch (err: any) {
    console.error(`Orchestrator ${model.id} gagal:`, err?.message);
    return {
      agents: ["content-creator"],
      alasan: `Error: ${err.message || "unknown"}`,
      error: err.message || "Gagal panggil model",
    };
  }
}

export type MultiOrchestratorPanel = {
  id: string;
  label: string;
  ok: boolean;
  agents: AgentName[];
  alasan: string;
  rencana: string;
  error?: string;
  latencyMs: number;
};

async function jalanSatuOrchestrator(
  perintah: string,
  model: MultiOrchestratorModel
): Promise<MultiOrchestratorPanel> {
  const t0 = Date.now();
  const r = await tentukanAgentDenganModel(perintah, model);
  const latencyMs = Date.now() - t0;

  const rencana = `🎯 Perintah: "${perintah}"

📋 Rencana:
${r.agents.map((a, i) => `  ${i + 1}. Agent: ${a}`).join("\n")}

💡 Alasan: ${r.alasan}`;

  return {
    id: model.id,
    label: model.label,
    ok: !r.error,
    agents: r.agents,
    alasan: r.alasan,
    rencana,
    error: r.error,
    latencyMs,
  };
}

export async function runMultiOrchestrator(perintah: string): Promise<{
  ok: boolean;
  panels: MultiOrchestratorPanel[];
  error?: string;
}> {
  try {
    const panels = await Promise.all(
      MULTI_ORCHESTRATOR_MODELS.map((m) => jalanSatuOrchestrator(perintah, m))
    );

    return { ok: true, panels };
  } catch (err: any) {
    console.error("Multi-orchestrator error:", err);
    return {
      ok: false,
      panels: [],
      error: err.message || "Gagal jalankan multi-orchestrator",
    };
  }
}

// ============================================================
// JUDGE
// ============================================================
export type JudgeResult = {
  ok: boolean;
  pilihan: string;
  alasan: string;
  rencanaFinal: string;
  error?: string;
};

export async function runJudge(
  perintah: string,
  panels: MultiOrchestratorPanel[]
): Promise<JudgeResult> {
  const panelsText = panels
    .map(
      (p) =>
        `## Panel ${p.id} (${p.label})\n${
          p.ok ? p.rencana : `ERROR: ${p.error}`
        }`
    )
    .join("\n\n---\n\n");

  const prompt = `${HARVESTAN_CONTEXT}

# TUGAS: JUDGE ORCHESTRATOR

Kamu hakim netral. Ada 3 rencana dari 3 orchestrator untuk perintah yang sama.

**Perintah user:**
"${perintah}"

**Rencana tiap orchestrator:**

${panelsText}

# TUGASMU:

1. Bandingkan 3 rencana
2. Pilih **1 terbaik** ATAU **gabungkan** kalau ada kombinasi lebih baik
3. Kasih alasan singkat (2-3 kalimat)
4. **MAKSIMAL 2 AGENT** di rencana final

# FORMAT OUTPUT (WAJIB):

PILIHAN: <A / B / C / GABUNGAN>
ALASAN: <2-3 kalimat>
---RENCANA---
Agent 1: <nama-agent>
Agent 2: <nama-agent>
---END---

PENTING:
- PILIHAN: A, B, C, atau GABUNGAN
- Maks 2 agent di rencana final
- Agent name HARUS salah satu dari: content-creator, marketing, idea-innovator, social-media, image-creator`;

  try {
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const { text } = await generateText({
      model: openrouter("openrouter/free"),
      prompt,
      temperature: 0.3,
    });

    const pilihanMatch = text.match(/^PILIHAN:\s*(.+)$/m);
    const alasanMatch = text.match(/^ALASAN:\s*(.+)$/m);
    const rencanaMatch = text.match(/---RENCANA---\s*([\s\S]*?)\s*---END---/);

    return {
      ok: true,
      pilihan: pilihanMatch?.[1]?.trim() || "GABUNGAN",
      alasan: alasanMatch?.[1]?.trim() || "",
      rencanaFinal: rencanaMatch?.[1]?.trim() || text.trim(),
    };
  } catch (err: any) {
    console.error("Judge error:", err?.message);
    return {
      ok: false,
      pilihan: "-",
      alasan: "",
      rencanaFinal: "",
      error: err.message || "Gagal jalanin judge",
    };
  }
}

// ============================================================
// ORCHESTRATOR SINGLE (public)
// ============================================================
export async function runOrchestrator(
  perintah: string,
  options?: {
    mode?: "normal" | "refine";
    feedback?: string;
    hasilSebelumnya?: string;
    agentsFilter?: AgentName[];
  }
): Promise<OrchestratorResult> {
  try {
    let agents: AgentName[];
    let alasan: string;

    if (options?.agentsFilter && options.agentsFilter.length > 0) {
      agents = options.agentsFilter.slice(0, 2); // MAKS 2
      alasan = "Filter dari user (regenerate/refine)";
    } else {
      const result = await tentukanAgent(perintah);
      agents = result.agents;
      alasan = result.alasan;
    }

    const mode = options?.mode || "normal";
    const prefix =
      mode === "refine" && options?.feedback
        ? `\n\n[REFINEMENT MODE]\nHasil sebelumnya:\n${options.hasilSebelumnya || "(tidak ada)"}\n\nFeedback user:\n${options.feedback}\n\nRevisi hasil sebelumnya sesuai feedback.`
        : "";

    const rencana = `🎯 Perintah: "${perintah}"

📋 Rencana:
${agents.map((a, i) => `  ${i + 1}. Agent: ${a}`).join("\n")}

💡 Alasan: ${alasan}${mode === "refine" ? "\n\n🔄 Mode: Refine (revisi hasil)" : ""}`;

    const hasil: AgentResult[] = [];
    let konteksSebelumnya = "";
    const perintahEfektif = prefix ? `${perintah}${prefix}` : perintah;

    for (const agentName of agents) {
      const perintahUntukAgent = konteksSebelumnya
        ? `${perintahEfektif}\n\n[KONTEKS DARI AGENT SEBELUMNYA]\n${konteksSebelumnya}`
        : perintahEfektif;

      console.log(`[ORCHESTRATOR] Menjalankan agent: ${agentName}`);
      const t0 = Date.now();

      const result = await jalankanAgent(agentName, perintahUntukAgent);

      console.log(
        `[ORCHESTRATOR] Agent ${agentName} selesai dalam ${Date.now() - t0}ms — ok: ${result.ok}`
      );

      hasil.push(result);

      if (result.ok && result.hasil) {
        konteksSebelumnya += `\n\n## Hasil dari ${result.agent}:\n${result.hasil}`;
      }
    }

    return {
      ok: true,
      perintah,
      rencana,
      hasil,
    };
  } catch (err: any) {
    console.error("[ORCHESTRATOR] Fatal error:", err);
    return {
      ok: false,
      perintah,
      rencana: "",
      hasil: [],
      error: err.message || "Terjadi kesalahan",
    };
  }
}
