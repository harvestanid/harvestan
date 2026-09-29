import { createClient } from "@/lib/supabase/server";
export async function sendTelegram(
  pesan: string,
  options?: { chatId?: string }
): Promise<{ ok: boolean; message: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = options?.chatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram config missing");
    return { ok: false, message: "Config missing" };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: pesan,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    const data = await res.json();

    if (!data.ok) {
      console.error("Telegram error:", data);
      return { ok: false, message: data.description || "Gagal kirim" };
    }

    return { ok: true, message: "Terkirim" };
  } catch (err: any) {
    console.error("Telegram exception:", err);
    return { ok: false, message: err.message || "Error" };
  }
}

export async function logNotif(input: {
  userId?: string | null;
  tipe: string;
  target: string;
  pesan?: string;
  status?: string;
}): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notification_logs").insert({
    user_id: input.userId || null,
    tipe: input.tipe,
    target: input.target,
    pesan: input.pesan || null,
    status: input.status || "sent",
  });
}
