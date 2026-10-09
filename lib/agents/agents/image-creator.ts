import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { HARVESTAN_CONTEXT } from "../context";

export async function imageCreatorAgent(input: {
  perintah: string;
  jumlahGambar?: number;
}) {
  const jumlahGambar = input.jumlahGambar || 1;

  const prompt = `${HARVESTAN_CONTEXT}

# TUGAS: IMAGE CREATOR

Perintah dari user:
"${input.perintah}"

Kamu adalah spesialis prompt engineering untuk AI image generator (Flux).

Tugasmu: bikin ${jumlahGambar} prompt gambar berkualitas tinggi yang bisa
dipakai untuk generate image AI.

Untuk setiap prompt, sertakan:
1. **Deskripsi Visual** — apa yang digambar (detail: objek, latar, mood)
2. **Style** — fotorealistik / illustration / 3d render / flat design / dll
3. **Warna** — palet warna yang cocok (harus sesuai brand Harvestan: hijau #2c5e2e & kuning #f0b429)
4. **Prompt AI (English)** — prompt final untuk AI image generator (dalam bahasa Inggris)

Format output markdown rapi.

PENTING:
- Prompt HARUS dalam bahasa Inggris (AI image generator lebih paham English)
- Selalu sertakan warna brand Harvestan (hijau tua & kuning emas)
- Fokus tema: pertanian Indonesia, petani, sawah, pemilik lahan, teknologi pertanian
- Hindari wajah spesifik orang nyata
- Prompt harus detail & spesifik (jangan generic)`;

  try {
    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      prompt,
      temperature: 0.8,
    });

    return {
      ok: true,
      agent: "image-creator",
      jumlahGambar,
      hasil: text,
    };
  } catch (err: any) {
    console.error("Image creator error:", err);
    return {
      ok: false,
      agent: "image-creator",
      error: err.message || "Gagal generate prompt gambar",
    };
  }
}
