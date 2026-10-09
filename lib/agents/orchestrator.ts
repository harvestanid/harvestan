import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
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
};

type OrchestratorResult = {
  ok: boolean;
  perintah: string;
  rencana: string;
  hasil: AgentResult[];
  error?: string;
};

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
5. **image-creator** — bikin prompt gambar AI (untuk visual konten)

Tugas kamu: tentukan agent mana yang HARUS jalan + urutan yang tepat.

ATURAN:
- Pilih 1-5 agent. Jangan semua kalau gak perlu.
- Kalau perintah minta "konten + gambar", pilih: content-creator → image-creator
- Kalau perintah minta "kampanye lengkap", pilih: marketing → content-creator → social-media → image-creator
- Urutan PENTING: kalau ada chain, agent berikutnya nerima hasil agent sebelumnya
- Kalau perintah minta "strategi marketing", cukup marketing saja
- Kalau perintah minta "ide fitur baru", cukup idea-innovator

Output HARUS JSON valid, contoh:
{"agents": ["content-creator", "image-creator"], "alasan": "User minta konten + visual"}

Langsung output JSON, tanpa penjelasan tambahan.`;

  const { text } = await generateText({
    model: groq("openai/gpt-oss-120b"),
    prompt,
    temperature: 0.3,
  });

  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    const validAgents = (parsed.agents || []).filter((a: string) =>
      [
        "content-creator",
        "marketing",
        "idea-innovator",
        "social-media",
        "image-creator",
      ].includes(a)
    );

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
      agents = options.agentsFilter;
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
      // Multi-chain: agent berikutnya terima konteks hasil sebelumnya
      const perintahUntukAgent = konteksSebelumnya
        ? `${perintahEfektif}\n\n[KONTEKS DARI AGENT SEBELUMNYA]\n${konteksSebelumnya}`
        : perintahEfektif;

      let result: AgentResult;

      if (agentName === "content-creator") {
        const r = await contentCreatorAgent({ perintah: perintahUntukAgent });
        result = {
          agent: "content-creator",
          ok: r.ok,
          hasil: r.hasil,
          error: r.error,
          meta: { platform: r.platform, jumlah: r.jumlah },
        };
      } else if (agentName === "marketing") {
        const r = await marketingAgent({ perintah: perintahUntukAgent });
        result = {
          agent: "marketing-strategist",
          ok: r.ok,
          hasil: r.hasil,
          error: r.error,
        };
      } else if (agentName === "idea-innovator") {
        const r = await ideaInnovatorAgent({ perintah: perintahUntukAgent });
        result = {
          agent: "idea-innovator",
          ok: r.ok,
          hasil: r.hasil,
          error: r.error,
          meta: { jumlahIde: r.jumlahIde },
        };
      } else if (agentName === "social-media") {
        const r = await socialMediaAgent({ perintah: perintahUntukAgent });
        result = {
          agent: "social-media-manager",
          ok: r.ok,
          hasil: r.hasil,
          error: r.error,
          meta: { platform: r.platform, durasiMinggu: r.durasiMinggu },
        };
      } else if (agentName === "image-creator") {
        const r = await imageCreatorAgent({ perintah: perintahUntukAgent });
        result = {
          agent: "image-creator",
          ok: r.ok,
          hasil: r.hasil,
          error: r.error,
          meta: { jumlahGambar: r.jumlahGambar },
        };
      } else {
        result = {
          agent: agentName,
          ok: false,
          error: "Agent tidak dikenal",
        };
      }

      hasil.push(result);

      // Simpan hasil untuk agent berikutnya (multi-chain)
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
    console.error("Orchestrator error:", err);
    return {
      ok: false,
      perintah,
      rencana: "",
      hasil: [],
      error: err.message || "Terjadi kesalahan",
    };
  }
}
