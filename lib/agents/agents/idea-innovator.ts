import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { HARVESTAN_CONTEXT } from "../context";

export async function ideaInnovatorAgent(input: {
  perintah: string;
  jumlahIde?: number;
}) {
  const jumlahIde = input.jumlahIde || 5;

  const prompt = `${HARVESTAN_CONTEXT}

# TUGAS: IDEA & INNOVATION

Perintah dari user:
"${input.perintah}"

Buat ${jumlahIde} ide inovatif. Untuk setiap ide, sertakan:

1. **Nama Ide** — judul singkat, catchy
2. **Deskripsi** — 2-3 kalimat tentang apa & kenapa
3. **Target User** — siapa yang diuntungkan
4. **Value** — manfaat konkret (bukan fitur teknis)
5. **Effort** — perkiraan effort (Low/Medium/High)
6. **Impact** — perkiraan impact (Low/Medium/High)
7. **Prioritas** — urutan rekomendasi (1 = paling prioritas)

Setelah daftar ide, tambahkan bagian:
**Top 3 Rekomendasi** — mana 3 ide terbaik menurut kamu, dan alasannya.

Format output markdown rapi.

PENTING:
- Ide harus REALISTIS & sesuai kapasitas 1 orang + AI
- Modal Rp 0 — jangan saranin solusi yang butuh biaya besar
- Fokus ke pertanian Indonesia & target pemilik lahan
- Jangan ngarang fitur yang butuh teknologi gak realistis`;

  try {
    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      prompt,
      temperature: 0.9,
    });

    return {
      ok: true,
      agent: "idea-innovator",
      jumlahIde,
      hasil: text,
    };
  } catch (err: any) {
    console.error("Idea innovator error:", err);
    return {
      ok: false,
      agent: "idea-innovator",
      error: err.message || "Gagal generate ide",
    };
  }
}
