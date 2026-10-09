import { generateImage } from "ai";

export async function generateImageTool(input: {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
}) {
  const aspectRatio = input.aspectRatio || "1:1";

  try {
    const result = await generateImage({
      model: "bfl/flux-2-flex",
      prompt: input.prompt,
      aspectRatio,
    });

    return {
      ok: true,
      base64: result.image,
      prompt: input.prompt,
      aspectRatio,
    };
  } catch (err: any) {
    console.error("Image generation error:", err);
    return {
      ok: false,
      error: err.message || "Gagal generate gambar",
      prompt: input.prompt,
    };
  }
}
