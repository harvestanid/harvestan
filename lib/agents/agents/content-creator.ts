import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { HARVESTAN_CONTEXT } from "../context";

export async function contentCreatorAgent(input: {
  perintah: string;
  platform?: "tiktok" | "instagram" | "facebook" | "blog" | "youtube";
  jumlah?: number;
}) {
  const platform = input.platform || "tiktok";
  const jumlah = input.jumlah || 3;

  const platformGuide = {
    tiktok: "Format TikTok: hook 3 detik pertama, durasi 30-60 detik, bahasa santai, CTA ajakan follow/comment.",
    instagram: "Format IG Reels/Carousel: caption + hook + hashtag relevan, tone visual, aesthetic.",
    facebook: "Format Facebook: caption storytelling, ajakan share, tone komunitas.",
    blog: "Format Blog SEO: judul menarik, 500-800 kata, subheading, meta description, keyword alami.",
    youtube: "Format YouTube: judul clickable, script 3-5 menit, intro hook, struktur jelas.",
  }[platform];

  const prompt = `${HARVESTAN_CONTEXT}

# TUGAS: CONTENT CREATOR

Platform: ${platform}
${platformGuide}

Perintah dari user:
"${input.perintah}"

Buat ${jumlah} draft konten. Untuk setiap draft, sertakan:
1. **Hook** — kalimat pembuka yang menarik
2. **Isi/script** — konten utama (singkat, padat)
3. **CTA** — ajakan action
4. **Caption** — caption untuk posting
5. **Hashtag** — 5-8 hashtag relevan

Format output markdown, rapi, siap copy-paste.

PENTING: Gunakan data & fitur Harvestan yang sesuai. Jangan ngarang fitur yang gak ada. Fokus manfaat ke pemilik lahan.`;

  try {
    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      prompt,
      temperature: 0.8,
    });

    return {
      ok: true,
      agent: "content-creator",
      platform,
      jumlah,
      hasil: text,
    };
  } catch (err: any) {
    console.error("Content creator error:", err);
    return {
      ok: false,
      agent: "content-creator",
      error: err.message || "Gagal generate konten",
    };
  }
}
