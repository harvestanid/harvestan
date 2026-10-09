import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { HARVESTAN_CONTEXT } from "../context";

export async function marketingAgent(input: {
  perintah: string;
  konteks?: string;
}) {
  const prompt = `${HARVESTAN_CONTEXT}

# TUGAS: MARKETING STRATEGIST

Perintah dari user:
"${input.perintah}"

${input.konteks ? `Konteks tambahan:\n${input.konteks}` : ""}

Buat strategi marketing yang konkret & actionable. Sertakan:

1. **Analisis Situasi** — kondisi Harvestan saat ini, peluang, tantangan
2. **Target Audience** — siapa yang disasar (spesifik, bukan umum)
3. **Pesan Utama** — 1-3 pesan kunci yang mau disampaikan
4. **Channel & Aksi** — channel mana, aksi apa, urutan langkah
5. **Timeline** — minggu 1, minggu 2, minggu 3, minggu 4
6. **Metrik Sukses** — apa yang diukur, target angka
7. **Budget & Resource** — kalau modal 0, gimana caranya

Format output markdown rapi.

PENTING: Harvestan modal Rp 0. Fokus strategi ORGANIK (gratis).
Jangan saranin iklan berbayar dulu. Manfaatkan komunitas, TikTok, WhatsApp group, Poktan.`;

  try {
    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      prompt,
      temperature: 0.7,
    });

    return {
      ok: true,
      agent: "marketing-strategist",
      hasil: text,
    };
  } catch (err: any) {
    console.error("Marketing error:", err);
    return {
      ok: false,
      agent: "marketing-strategist",
      error: err.message || "Gagal generate strategi",
    };
  }
}
