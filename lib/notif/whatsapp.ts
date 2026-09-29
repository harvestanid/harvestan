export function generateWhatsAppLink(
  nomor: string,
  pesan: string
): string {
  let clean = nomor.replace(/[^0-9]/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1);
  } else if (clean.startsWith("8")) {
    clean = "62" + clean;
  }
  return `https://wa.me/${clean}?text=${encodeURIComponent(pesan)}`;
}

export function templateApproved(
  nama: string,
  invoiceCode: string,
  siteUrl = "https://harvestan.vercel.app"
): string {
  return `Halo ${nama}! 🎉

✅ Pembayaran kamu sudah kami terima
🧾 Invoice: ${invoiceCode}
💎 Status: PREMIUM AKTIF

Semua fitur Harvestan udah kebuka:
♾️ Unlimited penggarap, lahan & panen
📄 Export PDF invoice & laporan
📊 Export Excel lengkap + backup
🗺️ GPS walking ukur lahan
⚖️ Penimbangan gabah multi-sesi
📈 Grafik & laporan multi-komoditas

Login ulang di ${siteUrl} untuk akses fitur premium.

Terima kasih sudah upgrade! 🌾`;
}

export function templateRejected(
  nama: string,
  invoiceCode: string,
  alasan: string,
  siteUrl = "https://harvestan.vercel.app"
): string {
  return `Halo ${nama},

❌ Mohon maaf, invoice kamu belum bisa kami setujui.

🧾 Invoice: ${invoiceCode}
📝 Alasan: ${alasan}

Silakan buat invoice baru di ${siteUrl}/premium dan kirim bukti transfer ulang.

Kalau ada pertanyaan, balas chat ini ya. 🙏`;
}
