// ===================================================
// TELEGRAM NOTIFIKASI
// Kirim pesan ke grup admin via Telegram Bot API
// ===================================================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

type FeedbackNotif = {
  rating: number;
  saran_fitur?: string | null;
  masukan?: string | null;
  created_at: string;
};

// Format bintang jadi unicode
function formatBintang(rating: number): string {
  const full = "⭐".repeat(rating);
  const empty = "☆".repeat(5 - rating);
  return full + empty;
}

// Format tanggal ke Indonesia
function formatTanggal(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Escape karakter khusus Markdown Telegram
function escapeMarkdown(text: string): string {
  return text
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/~/g, "\\~")
    .replace(/`/g, "\\`")
    .replace(/>/g, "\\>")
    .replace(/#/g, "\\#")
    .replace(/\+/g, "\\+")
    .replace(/-/g, "\\-")
    .replace(/=/g, "\\=")
    .replace(/\|/g, "\\|")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\./g, "\\.")
    .replace(/!/g, "\\!");
}

// ===================================================
// KIRIM NOTIFIKASI FEEDBACK BARU
// ===================================================
export async function sendFeedbackNotif(
  feedback: FeedbackNotif
): Promise<boolean> {
  // Skip kalau env tidak di-set (fallback aman)
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn(
      "[Telegram] Bot token atau chat ID belum di-set. Skip notifikasi."
    );
    return false;
  }

  try {
    const bintang = formatBintang(feedback.rating);
    const tanggal = formatTanggal(feedback.created_at);

    let pesan = `🔔 *FEEDBACK BARU*\n\n`;
    pesan += `${bintang} (${feedback.rating}/5)\n`;
    pesan += `📅 ${tanggal}\n\n`;

    if (feedback.saran_fitur && feedback.saran_fitur.trim()) {
      pesan += `💡 *Saran Fitur:*\n`;
      pesan += `${escapeMarkdown(feedback.saran_fitur.trim())}\n\n`;
    }

    if (feedback.masukan && feedback.masukan.trim()) {
      pesan += `💬 *Masukan/Kritik:*\n`;
      pesan += `${escapeMarkdown(feedback.masukan.trim())}\n\n`;
    }

    pesan += `\n🌾 _Harvestan Notification System_`;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: pesan,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Telegram] Gagal kirim:", res.status, errText);
      return false;
    }

    const json = await res.json();
    if (!json.ok) {
      console.error("[Telegram] API error:", json.description);
      return false;
    }

    console.log("[Telegram] Notifikasi berhasil dikirim");
    return true;
  } catch (err) {
    console.error("[Telegram] Exception:", err);
    return false;
  }
}

// ===================================================
// CEK APAKAH TELEGRAM SUDAH DI-SETUP
// ===================================================
export function isTelegramConfigured(): boolean {
  return Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID);
}
