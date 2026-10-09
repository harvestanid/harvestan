import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { HARVESTAN_CONTEXT } from "../context";

export async function socialMediaAgent(input: {
  perintah: string;
  platform?: "tiktok" | "instagram" | "facebook" | "x" | "all";
  durasiMinggu?: number;
}) {
  const platform = input.platform || "all";
  const durasiMinggu = input.durasiMinggu || 1;

  const platformList =
    platform === "all"
      ? "TikTok, Instagram, Facebook, X (Twitter)"
      : platform;

  const prompt = `${HARVESTAN_CONTEXT}

# TUGAS: SOCIAL MEDIA MANAGER

Perintah dari user:
"${input.perintah}"

Platform: ${platformList}
Durasi: ${durasiMinggu} minggu

Buat rencana konten social media. Sertakan:

## 1. Content Calendar
Tabel jadwal posting per hari (Senin-Minggu), berisi:
- Hari
- Platform
- Tipe konten (edukasi/demo/testimoni/tips/hiburan)
- Judul/Topik
- Hook (kalimat pembuka)

## 2. Konten Detail per Post
Untuk setiap post, sertakan:
- **Hook** (3 detik pertama)
- **Caption** lengkap
- **Hashtag** (5-8 tag)
- **CTA** (ajakan action)
- **Best time to post**

## 3. Strategi Engagement
- Cara balas komentar
- Cara handle pertanyaan umum petani
- Kapan harus soft-sell vs hard-sell

## 4. Konten Viral Opportunity
- 3 ide konten yang berpotensi viral (challenge, tips kontroversial, story)

Format output markdown rapi. Siap eksekusi.

PENTING:
- Konten harus sesuai brand Harvestan (profesional, empati, gak lebay)
- Fokus target: pemilik lahan, petani muda, gapoktan
- Jangan saranin iklan berbayar
- Waktu posting: 17:00-20:00 WIB (jam aktif petani)
- Bahasa Indonesia santai tapi sopan`;

  try {
    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      prompt,
      temperature: 0.8,
    });

    return {
      ok: true,
      agent: "social-media-manager",
      platform,
      durasiMinggu,
      hasil: text,
    };
  } catch (err: any) {
    console.error("Social media error:", err);
    return {
      ok: false,
      agent: "social-media-manager",
      error: err.message || "Gagal generate rencana sosmed",
    };
  }
}
