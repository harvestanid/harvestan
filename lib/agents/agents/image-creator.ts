import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { HARVESTAN_CONTEXT } from "../context";

/**
 * Image Creator Agent — HTML Infographic Generator
 *
 * Output: HTML + CSS inline, siap render jadi infografis berkualitas.
 * Pakai delimiter marker (bukan JSON) biar gak error parsing.
 * ANTI-KOSONG: layout wajib ngisi penuh canvas.
 */
export async function imageCreatorAgent(input: {
  perintah: string;
  jumlahGambar?: number;
  aspectRatio?: string;
}) {
  const aspectRatio = input.aspectRatio || "9:16";

  const dimMap: Record<string, { w: number; h: number; label: string }> = {
    "1:1": { w: 1080, h: 1080, label: "square" },
    "16:9": { w: 1200, h: 675, label: "landscape" },
    "9:16": { w: 1080, h: 1920, label: "portrait" },
    "4:3": { w: 1200, h: 900, label: "landscape" },
    "3:4": { w: 1080, h: 1440, label: "portrait" },
  };
  const dim = dimMap[aspectRatio] || dimMap["9:16"];

  const prompt = `${HARVESTAN_CONTEXT}

# TUGAS: HTML INFOGRAPHIC DESIGNER

Perintah dari user:
"${input.perintah}"

Kamu adalah **desainer infografis profesional**. Bikin HTML + CSS inline
untuk infografis berkualitas tinggi yang siap di-screenshot jadi PNG.

## SPESIFIKASI CANVAS:

- Width: **${dim.w}px**
- Height: **${dim.h}px**
- Aspect ratio: ${aspectRatio} (${dim.label})
- Background: solid atau gradient (JANGAN gambar eksternal)

## ATURAN HTML/CSS:

1. **Semua CSS HARUS inline** di atribut \`style=""\` — JANGAN pakai \`<style>\` tag
2. **JANGAN pakai JavaScript** sama sekali
3. **JANGAN pakai gambar dari URL** (http/https) — gak akan ke-load
4. **BOLEH pakai emoji** sebagai ikon: 🌾 💰 📊 📱 🚀 ✅ ❌ ⚡ 🎯 💡 📈 🏆 🌱
5. **BOLEH pakai CSS shapes**: border-radius, clip-path, box-shadow, linear-gradient
6. Root element HARUS \`<div>\` dengan \`width: ${dim.w}px; height: ${dim.h}px\`
7. Font: **system font** — \`font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif\`
8. JANGAN pakai \`<html>\`, \`<head>\`, \`<body>\` — cuma fragment \`<div>\`

## BRAND HARVESTAN (WAJIB):

- **Hijau tua:** \`#2c5e2e\`
- **Hijau muda:** \`#4a8b4d\`
- **Kuning emas:** \`#f0b429\`
- **Cream:** \`#faf6ee\`
- **Text gelap:** \`#1a2b1b\`

## ⚠️ ANTI-KOSONG (SANGAT PENTING — WAJIB):

Canvas ${dim.w}×${dim.h}px itu **LUAS**. Layout harus **MENGISI PENUH** —
JANGAN ada ruang kosong besar di tengah/bawah. Cara:

1. **Root pakai flex column**:
   \`style="width: ${dim.w}px; height: ${dim.h}px; display: flex; flex-direction: column; ..."\`

2. **Body area pakai flex-grow** biar ngisi ruang tersisa:
   \`<div style="flex: 1; display: flex; flex-direction: column; justify-content: space-evenly; ...">\`

3. **Setiap blok konten** dikasih padding cukup + gap antar blok
   (gap 32-56px antar blok, biar merata dari atas ke bawah)

4. **Footer nempel di bawah** — karena body pakai flex-grow, footer
   otomatis nempel bottom

5. **Kalau konten cuma 3 blok**: tambah spacing jadi besar (padding 40-60px),
   ATAU tambah 1 blok ke-4 (testimoni / tips / FAQ mini / statistik tambahan)

6. **Kalau konten cuma 2 blok**: WAJIB tambah blok ke-3 atau ke-4 biar
   canvas gak kosong

**Template struktur WAJIB (contoh):**

\`\`\`
<div style="width: ${dim.w}px; height: ${dim.h}px; display: flex; flex-direction: column; background: #faf6ee; font-family: -apple-system, sans-serif; overflow: hidden;">

  <!-- HEADER (fixed tinggi ~20%) -->
  <div style="background: #2c5e2e; padding: 60px 48px; ...">
    <h1>Judul Infografis</h1>
  </div>

  <!-- BODY (flex: 1 → ngisi sisa ruang) -->
  <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-evenly; padding: 48px; gap: 40px;">
    <!-- blok 1 -->
    <!-- blok 2 -->
    <!-- blok 3 -->
    <!-- blok 4 (kalau perlu) -->
  </div>

  <!-- FOOTER (fixed tinggi ~10%) -->
  <div style="background: #f0b429; padding: 40px 48px; ...">
    CTA / tagline
  </div>

</div>
\`\`\`

## STRUKTUR INFOINFOGRAFIS (WAJIB):

1. **Header** — background hijau tua \`#2c5e2e\`, judul besar putih + emoji
2. **Body** — 3-4 blok konten (flex-grow biar ngisi), tiap blok:
   - Emoji ikon besar (64-96px)
   - Judul blok (bold, hijau tua)
   - Deskripsi singkat (maks 30 kata)
3. **Highlight angka** (kalau relevan) — lingkaran/kotak border kuning emas
4. **Footer** — tagline / CTA di background kuning emas / hijau muda
5. **Watermark "Harvestan"** kecil di pojok (text hijau tua opacity 0.5)

## GAYA VISUAL:

- **Flat design modern** — clean, profesional
- **Rounded corners**: border-radius 16-32px
- **Shadow halus**: \`box-shadow: 0 8px 32px rgba(0,0,0,0.08)\`
- **Spacing lega**: padding minimal 32px
- **Hierarki tipografi**:
  - Judul utama: 56-80px bold
  - Judul blok: 28-36px bold
  - Body: 18-22px regular
- **Kontras tinggi** untuk keterbacaan

## ATURAN KONTEN:

- Teks dalam **Bahasa Indonesia** (kecuali brand "Harvestan")
- Maksimal **30 kata per blok** — ringkas!
- JANGAN typo, JANGAN placeholder "Lorem ipsum"
- Data/angka **masuk akal**
- Minimal **3 blok konten**, ideal **4 blok**

## ⚠️ FORMAT OUTPUT (WAJIB DIIKUTI PERSIS):

Kembalikan dengan format PERSIS seperti ini (tanpa tambahan apapun):

JUDUL: <judul singkat 5-8 kata>
CATATAN: <1-2 kalimat penjelasan desain>
---HTML---
<div style="width: ${dim.w}px; height: ${dim.h}px; ...">
  ... (HTML lengkap di sini, boleh multi-baris)
</div>
---END---

PENTING:
- Baris pertama HARUS dimulai dengan \`JUDUL:\`
- Baris kedua HARUS dimulai dengan \`CATATAN:\`
- Baris ketiga HARUS persis \`---HTML---\`
- Setelah itu HTML lengkap
- Baris terakhir HARUS persis \`---END---\`
- JANGAN pakai markdown fence (\`\`\`) di dalam output
- JANGAN ada teks apapun sebelum JUDUL atau setelah ---END---
- Output LANGSUNG, jangan ada penjelasan tambahan`;

  try {
    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      prompt,
      temperature: 0.5,
    });

    // Parse delimiter format
    const judulMatch = text.match(/^JUDUL:\s*(.+)$/m);
    const catatanMatch = text.match(/^CATATAN:\s*(.+)$/m);
    const htmlMatch = text.match(/---HTML---\s*([\s\S]*?)\s*---END---/);

    if (!htmlMatch || !htmlMatch[1]) {
      return {
        ok: false,
        agent: "image-creator",
        error: "LLM tidak menghasilkan HTML valid (marker ---HTML--- / ---END--- tidak ditemukan)",
        raw: text.slice(0, 500),
      };
    }

    const judul = judulMatch?.[1]?.trim() || "Infografis Harvestan";
    const catatan = catatanMatch?.[1]?.trim() || "";
    const html = htmlMatch[1].trim();

    return {
      ok: true,
      agent: "image-creator",
      judul,
      catatan,
      html,
      width: dim.w,
      height: dim.h,
      aspectRatio,
      hasil: `## 🎨 ${judul}\n\n${catatan}\n\n_Infografis sudah dirender di bawah. Klik **Download PNG** untuk simpan._`,
    };
  } catch (err: any) {
    console.error("Image creator error:", err);
    return {
      ok: false,
      agent: "image-creator",
      error: err.message || "Gagal generate HTML infografis",
    };
  }
}
