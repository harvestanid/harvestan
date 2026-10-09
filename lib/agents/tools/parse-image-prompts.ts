export type ParsedPrompt = {
  title: string;
  deskripsi: string;
  style: string;
  warna: string;
  promptAI: string;
};

export function parseImagePrompts(hasil: string): ParsedPrompt[] {
  if (!hasil) return [];

  const prompts: ParsedPrompt[] = [];

  const sections = hasil.split(/^##\s+(?:#|Prompt\s*#?)?\d+/gim).slice(1);

  for (const section of sections) {
    const lines = section
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    let deskripsi = "";
    let style = "";
    let warna = "";
    let promptAI = "";

    const promptAiRegex =
      /\*\*Prompt AI[^*]*\*\*[:\s]*\n?([\s\S]*?)(?=\n\*\*|\n##|$)/i;
    const promptAiMatch = section.match(promptAiRegex);
    if (promptAiMatch) {
      promptAI = promptAiMatch[1]
        .replace(/^[`\s]+|[`\s]+$/g, "")
        .replace(/\n+/g, " ")
        .trim();
    }

    if (!promptAI) {
      const englishLines = lines.filter(
        (l) =>
          /^[a-zA-Z0-9\s,.'"()-]{40,}/.test(l) &&
          !l.startsWith("*") &&
          !l.startsWith("-")
      );
      if (englishLines.length > 0) {
        promptAI = englishLines.sort((a, b) => b.length - a.length)[0];
      }
    }

    const deskMatch = section.match(
      /\*\*Deskripsi Visual[^*]*\*\*[:\s]*([\s\S]*?)(?=\n\*\*|$)/i
    );
    if (deskMatch) {
      deskripsi = deskMatch[1].replace(/\n+/g, " ").trim();
    }

    const styleMatch = section.match(
      /\*\*Style[^*]*\*\*[:\s]*([\s\S]*?)(?=\n\*\*|$)/i
    );
    if (styleMatch) {
      style = styleMatch[1].replace(/\n+/g, " ").trim();
    }

    const warnaMatch = section.match(
      /\*\*Warna[^*]*\*\*[:\s]*([\s\S]*?)(?=\n\*\*|$)/i
    );
    if (warnaMatch) {
      warna = warnaMatch[1].replace(/\n+/g, " ").trim();
    }

    if (promptAI) {
      prompts.push({
        title: deskripsi.slice(0, 60) || `Prompt #${prompts.length + 1}`,
        deskripsi,
        style,
        warna,
        promptAI,
      });
    }
  }

  return prompts;
}

/**
 * Fallback: ekstrak 1 prompt dari hasil apapun.
 * Prioritas:
 * 1. Baris yang mengandung "Prompt AI" (ambil isi setelahnya)
 * 2. Baris bahasa Inggris panjang (> 60 char, banyak kata)
 * 3. Baris apapun yang panjang (> 60 char)
 */
export function extractFallbackPrompt(hasil: string): string | null {
  if (!hasil) return null;

  const lines = hasil
    .split("\n")
    .map((l) =>
      l
        .replace(/^[#*\->\s]+/, "")
        .replace(/\*\*/g, "")
        .trim()
    )
    .filter((l) => l.length > 0);

  // 1. Cari baris dengan "Prompt AI"
  const afterPromptAi = hasil.match(
    /Prompt AI[^\n]*[\n\s]+([^\n]{40,})/i
  );
  if (afterPromptAi) {
    return afterPromptAi[1].trim();
  }

  // 2. Baris bahasa Inggris panjang
  const englishLong = lines.filter(
    (l) =>
      l.length > 60 &&
      /^[a-zA-Z]/.test(l) &&
      /[a-zA-Z]{3,}/.test(l) &&
      (l.match(/[a-zA-Z]/g) || []).length > l.length * 0.7
  );
  if (englishLong.length > 0) {
    return englishLong.sort((a, b) => b.length - a.length)[0];
  }

  // 3. Baris apapun yang panjang
  const longLines = lines.filter((l) => l.length > 60);
  if (longLines.length > 0) {
    return longLines.sort((a, b) => b.length - a.length)[0];
  }

  return null;
}
