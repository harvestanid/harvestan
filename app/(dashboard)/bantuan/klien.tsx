"use client";

import { useState } from "react";

// ===================================================
// KONTAK SUPPORT
// ===================================================
const KONTAK = {
  email: "harvestan.id@gmail.com",
  wa: "6285162661397",
  waDisplay: "+62 851-6266-1397",
  telegram: "harvestan_support",
  telegramDisplay: "@harvestan_support",
};

// ===================================================
// PANDUAN STEP-BY-STEP
// ===================================================
type Step = {
  no: number;
  icon: string;
  title: string;
  desc: string;
  tips?: string;
  link?: { label: string; href: string };
};

const PANDUAN: Step[] = [
  {
    no: 1,
    icon: "📝",
    title: "Daftar Akun",
    desc: "Buka halaman Daftar, isi nama, email, WhatsApp, dan password. Bisa juga daftar cepat dengan Google.",
    tips: "Password minimal 8 karakter. Anda akan langsung masuk ke dashboard.",
    link: { label: "Buka Daftar", href: "/register" },
  },
  {
    no: 2,
    icon: "👨‍🌾",
    title: "Tambah Penggarap",
    desc: "Buka menu Penggarap → klik tombol Tambah Penggarap. Isi nama, alamat, usia, dan kontak.",
    tips: "Bisa tambah berapa saja. Setiap penggarap punya daftar lahan sendiri.",
    link: { label: "Buka Penggarap", href: "/penggarap" },
  },
  {
    no: 3,
    icon: "🗺️",
    title: "Tambah Lahan",
    desc: "Buka detail penggarap → klik Lahan → tambah lahan. Isi nama, luas (Ha), dan koordinat GPS (opsional).",
    tips: "Nama lahan bebas. Kalau punya 2 lahan dengan nama sama, wajib isi GPS untuk membedakan.",
  },
  {
    no: 4,
    icon: "📍",
    title: "Ukur Lahan dengan GPS",
    desc: "Buka menu Ukur → pilih mode Baru atau Edit. Jalan mengelilingi lahan, aplikasi otomatis menghitung luas.",
    tips: "Bisa juga upload polygon yang sudah ada. Hasil akurat!",
    link: { label: "Buka Ukur Lahan", href: "/ukur-lahan" },
  },
  {
    no: 5,
    icon: "🌾",
    title: "Catat Panen",
    desc: "Buka lahan → Input Panen. Isi tanggal, komoditas, hasil (Kg), harga per Kg, dan biaya panen.",
    tips: "Bisa catat panen padi, jagung, kacang tanah, bawang merah, atau cabai rawit.",
    link: { label: "Buka Panen", href: "/panen-multi" },
  },
  {
    no: 6,
    icon: "💰",
    title: "Bagi Hasil Otomatis",
    desc: "Setiap panen dihitung otomatis. Pilih skema 50:50, 60:40, 70:30, atau custom sesuai kesepakatan.",
    tips: "Profit owner & penggarap dihitung langsung. Tidak perlu hitung manual!",
  },
  {
    no: 7,
    icon: "📋",
    title: "Catat Hutang",
    desc: "Buka detail penggarap → Hutang. Isi tanggal, jumlah, dan keperluan (contoh: 'bon bibit').",
    tips: "Hutang bisa dilunasi manual atau otomatis dipotong dari panen berikutnya.",
  },
  {
    no: 8,
    icon: "🔪",
    title: "Potong Hutang Otomatis",
    desc: "Saat input panen, centang opsi 'Potong Hutang'. Profit penggarap akan otomatis dipotong untuk bayar hutang.",
    tips: "Hutang dipotong dari yang TERLAMA dulu. Log lengkap tersimpan di detail panen.",
  },
  {
    no: 9,
    icon: "⚖️",
    title: "Penimbangan Gabah",
    desc: "Menu Gabah untuk input hasil timbang. Bisa multi sesi (Sak 1-5). Ada fitur gabah bawa pulang untuk pengalihan profit.",
    tips: "Gabah dibawa pulang penggarap → profit owner naik. Sebaliknya juga sama.",
    link: { label: "Buka Gabah", href: "/gabah" },
  },
  {
    no: 10,
    icon: "🌶️",
    title: "Panen Bertahap Cabai",
    desc: "Untuk cabai yang dipanen berkali-kali, buat Musim Tanam dulu. Setiap panen pilih musim yang sama.",
    tips: "Total produktivitas musim = total hasil ÷ luas lahan. Bisa lihat breakdown per musim.",
  },
  {
    no: 11,
    icon: "📈",
    title: "Visualisasi Grafik",
    desc: "Menu Grafik menampilkan produksi, produktivitas, dan kinerja penggarap dalam bentuk chart interaktif.",
    tips: "Grafik per musim cabai, filter penggarap, dan warna beda per penggarap.",
    link: { label: "Buka Grafik", href: "/grafik" },
  },
  {
    no: 12,
    icon: "📤",
    title: "Export & Backup Data",
    desc: "Menu Export untuk download Excel, PDF, atau Backup. Menu Import untuk restore backup ke akun lain.",
    tips: "Backup file bisa dipindah ke akun baru. Semua data lengkap & konsisten!",
    link: { label: "Buka Export", href: "/export" },
  },
];

// ===================================================
// FAQ
// ===================================================
type FAQItem = {
  q: string;
  a: string;
};

const FAQ: FAQItem[] = [
  {
    q: "Apakah Harvestan gratis?",
    a: "Ya, Harvestan bisa digunakan gratis dengan fitur dan akses terbatas. Anda bisa upgrade ke paket premium untuk membuka fitur tambahan seperti multi-user, notifikasi WhatsApp, dan penyimpanan data yang lebih besar.",
  },
  {
    q: "Bagaimana cara export data saya?",
    a: "Buka menu Export di sidebar. Ada 3 opsi: Download Backup (untuk import ulang), Download Laporan Excel (untuk dibaca di Excel), dan Download PDF per Penggarap (untuk cetak/kirim WhatsApp). Semua data 100% milik Anda.",
  },
  {
    q: "Apakah bisa dipakai di HP?",
    a: "Ya! Harvestan didesain responsif untuk HP, tablet, dan desktop. Bisa juga di-install sebagai aplikasi (PWA) — buka di Chrome, tunggu beberapa detik, akan muncul banner install.",
  },
  {
    q: "Bagaimana keamanan data saya?",
    a: "Data Anda dienkripsi dan disimpan dengan aman di Supabase (PostgreSQL). Setiap akun hanya bisa mengakses data miliknya sendiri (Row Level Security). Kami tidak pernah menjual atau membagikan data Anda.",
  },
  {
    q: "Bagaimana cara pindah akun?",
    a: "Buka menu Export → Download Backup. Lalu login akun baru → menu Import → upload file backup. Pilih mode 'Timpa' untuk ganti semua data, atau 'Tambah' untuk merge. Auto-remap ID dijamin tidak bentrok.",
  },
  {
    q: "Apakah bisa multi-user?",
    a: "Untuk saat ini 1 akun untuk 1 user. Fitur multi-user (kolaborasi) akan tersedia di paket premium ke depannya. Untuk sekarang, Anda bisa export backup & import ke akun lain.",
  },
  {
    q: "Bagaimana jika lupa password?",
    a: "Buka halaman Login → klik 'Lupa Password?'. Masukkan email yang terdaftar, kami akan kirim link reset password ke email Anda. Link berlaku 1 jam.",
  },
  {
    q: "Apakah data bisa hilang?",
    a: "Data tersimpan di cloud (Supabase) dan otomatis ter-backup. Namun untuk keamanan ekstra, kami sarankan Anda Download Backup secara rutin (misalnya 1x seminggu) dari menu Export.",
  },
  {
    q: "Bagaimana cara restore data?",
    a: "Buka menu Import → upload file backup (.xlsx) → pilih mode Timpa (ganti semua) atau Tambah (merge). Semua data lengkap akan kembali.",
  },
  {
    q: "Apakah ada batasan jumlah penggarap?",
    a: "Di paket gratis, tidak ada batasan jumlah penggarap atau lahan. Anda bisa input sebanyak yang dibutuhkan. Batasan lebih kepada fitur tambahan seperti multi-user dan storage.",
  },
];

// ===================================================
// TROUBLESHOOTING
// ===================================================
type Problem = {
  icon: string;
  title: string;
  solusi: string;
};

const TROUBLESHOOTING: Problem[] = [
  {
    icon: "🔐",
    title: "Tidak bisa login dengan Google",
    solusi:
      "Pastikan Anda sudah daftar akun dulu. Kalau sudah, cek koneksi internet. Kalau masih gagal, coba login pakai email + password (kalau sudah set). Kalau tetap tidak bisa, hubungi support.",
  },
  {
    icon: "📱",
    title: "PWA tidak bisa di-install",
    solusi:
      "Buka di Chrome (bukan browser lain). Tunggu 3-5 detik, akan muncul banner 'Install Harvestan di HP'. Klik 'Install Sekarang'. Kalau tidak muncul, buka menu Chrome ⋮ → cari 'Install app' atau 'Tambahkan ke Layar utama'.",
  },
  {
    icon: "🌐",
    title: "Halaman tidak bisa dibuka",
    solusi:
      "Coba refresh (F5 di desktop, pull-to-refresh di HP). Kalau masih tidak bisa, clear cache browser: Chrome → Settings → Privacy → Clear browsing data.",
  },
  {
    icon: "📊",
    title: "Data tidak muncul di laporan",
    solusi:
      "Pastikan Anda sudah input panen di menu Panen. Kalau baru input, data akan otomatis muncul di Dashboard, Keuangan, dan Laporan. Kalau masih tidak muncul, coba refresh halaman.",
  },
];

// ===================================================
// KOMPONEN UTAMA
// ===================================================
type Tab = "panduan" | "faq" | "kontak";

export function BantuanKlien() {
  const [tab, setTab] = useState<Tab>("panduan");

  return (
    <div className="space-y-6">
      {/* ===== TAB NAVIGATION ===== */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 flex gap-1 overflow-x-auto">
        {[
          { val: "panduan" as const, label: "🚀 Panduan", icon: "" },
          { val: "faq" as const, label: "❓ FAQ", icon: "" },
          { val: "kontak" as const, label: "💬 Kontak", icon: "" },
        ].map((t) => (
          <button
            key={t.val}
            onClick={() => setTab(t.val)}
            className={`flex-1 min-w-[100px] text-sm font-semibold px-4 py-3 rounded-xl transition ${
              tab === t.val
                ? "bg-green-700 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== TAB: PANDUAN ===== */}
      {tab === "panduan" && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
            <strong>💡 Tips:</strong> Ikuti panduan dari atas ke bawah.
            Setiap step ada tombol pintas ke halaman terkait.
          </div>

          {PANDUAN.map((step) => (
            <div
              key={step.no}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-green-300 hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                {/* Nomor + Icon */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-700 text-white rounded-xl flex items-center justify-center text-xl shadow-md">
                    {step.icon}
                  </div>
                  <div className="text-[10px] font-bold text-green-700 mt-1">
                    STEP {step.no}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-base mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-2">
                    {step.desc}
                  </p>

                  {step.tips && (
                    <div className="bg-yellow-50 border-l-3 border-yellow-400 pl-3 py-2 rounded-r-lg text-xs text-yellow-800 mb-3">
                      💡 {step.tips}
                    </div>
                  )}

                  {step.link && (
                    <a
                      href={step.link.href}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-900 transition"
                    >
                      → {step.link.label}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* ===== TROUBLESHOOTING ===== */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🔧 Mengatasi Masalah Umum
            </h2>

            <div className="space-y-2">
              {TROUBLESHOOTING.map((p, i) => (
                <details
                  key={i}
                  className="bg-white border border-gray-200 rounded-xl p-4 group cursor-pointer hover:border-green-300 transition"
                >
                  <summary className="font-bold text-gray-900 flex items-center justify-between list-none gap-2">
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{p.icon}</span>
                      <span className="text-sm">{p.title}</span>
                    </span>
                    <span className="text-green-700 text-xl group-open:rotate-45 transition-transform flex-shrink-0">
                      +
                    </span>
                  </summary>
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed pl-8">
                    {p.solusi}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB: FAQ ===== */}
      {tab === "faq" && (
        <div className="space-y-2">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 mb-4">
            ❓ <strong>Pertanyaan Umum.</strong> Klik pertanyaan untuk lihat
            jawabannya.
          </div>

          {FAQ.map((item, i) => (
            <details
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-5 group cursor-pointer hover:border-green-300 transition"
            >
              <summary className="font-bold text-gray-900 flex items-center justify-between list-none gap-3">
                <span className="text-sm md:text-base">{item.q}</span>
                <span className="text-green-700 text-xl group-open:rotate-45 transition-transform flex-shrink-0">
                  +
                </span>
              </summary>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed whitespace-pre-wrap">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      )}

      {/* ===== TAB: KONTAK ===== */}
      {tab === "kontak" && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-3">💬</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Butuh Bantuan Lebih Lanjut?
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Tim support kami siap membantu Anda
            </p>
          </div>

          {/* Kontak Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/${KONTAK.wa}?text=${encodeURIComponent(
                "Halo Harvestan, saya butuh bantuan."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border-2 border-green-200 hover:border-green-400 rounded-2xl p-5 transition hover:shadow-lg group"
            >
              <div className="text-4xl mb-3">📱</div>
              <h3 className="font-bold text-gray-900 mb-1">WhatsApp</h3>
              <p className="text-xs text-gray-600 mb-2">
                Respon cepat, jam kerja 08:00-20:00 WIB
              </p>
              <p className="text-xs font-mono text-green-700 group-hover:text-green-900">
                {KONTAK.waDisplay}
              </p>
            </a>

            {/* Email */}
            <a
              href={`mailto:${KONTAK.email}?subject=${encodeURIComponent(
                "Bantuan Harvestan"
              )}`}
              className="bg-white border-2 border-blue-200 hover:border-blue-400 rounded-2xl p-5 transition hover:shadow-lg group"
            >
              <div className="text-4xl mb-3">📧</div>
              <h3 className="font-bold text-gray-900 mb-1">Email</h3>
              <p className="text-xs text-gray-600 mb-2">
                Untuk pertanyaan detail / kerjasama
              </p>
              <p className="text-xs font-mono text-blue-700 group-hover:text-blue-900 break-all">
                {KONTAK.email}
              </p>
            </a>

            {/* Telegram */}
            <a
              href={`https://t.me/${KONTAK.telegram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border-2 border-sky-200 hover:border-sky-400 rounded-2xl p-5 transition hover:shadow-lg group"
            >
              <div className="text-4xl mb-3">✈️</div>
              <h3 className="font-bold text-gray-900 mb-1">Telegram</h3>
              <p className="text-xs text-gray-600 mb-2">
                Channel update & support
              </p>
              <p className="text-xs font-mono text-sky-700 group-hover:text-sky-900">
                {KONTAK.telegramDisplay}
              </p>
            </a>
          </div>

          {/* Info tambahan */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-xs text-yellow-800">
            <strong>⏱️ Waktu Respon:</strong> Kami berusaha membalas
            dalam 24 jam. Untuk laporan bug atau fitur request, sertakan
            screenshot & penjelasan singkat agar lebih cepat diproses.
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800">
            <strong>💡 Fitur Baru:</strong> Anda juga bisa kirim{" "}
            <a href="/feedback" className="underline font-bold">
              feedback
            </a>{" "}
            lewat menu Feedback. Setiap masukan membantu kami tingkatkan
            Harvestan!
          </div>
        </div>
      )}
    </div>
  );
}
