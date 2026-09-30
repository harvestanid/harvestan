"use client";

import { useState } from "react";
import Link from "next/link";

const PANDUAN = [
  {
    icon: "👨‍🌾",
    judul: "Tambah Penggarap",
    deskripsi: "Mulai dari sini — catat data penggarap Anda",
    langkah: [
      "Buka menu Penggarap di sidebar",
      "Klik tombol + Tambah Penggarap",
      "Isi nama, kontak, alamat, usia",
      "Klik Simpan",
    ],
  },
  {
    icon: "🗺️",
    judul: "Tambah Lahan",
    deskripsi: "Setelah punya penggarap, tambah lahan garapannya",
    langkah: [
      "Di list penggarap, klik tombol Lahan",
      "Klik + Tambah Lahan",
      "Isi nama lahan & luas (Ha)",
      "Opsional: isi koordinat GPS",
    ],
  },
  {
    icon: "🌾",
    judul: "Input Panen",
    deskripsi: "Catat hasil panen & bagi hasil otomatis",
    langkah: [
      "Buka detail lahan penggarap",
      "Klik + Input Panen",
      "Isi hasil (Kg), harga, biaya",
      "Pilih skema bagi hasil (50:50, 40:60, dll)",
      "Klik Tambah Panen",
    ],
  },
  {
    icon: "💰",
    judul: "Kelola Hutang",
    deskripsi: "Catat hutang, potong otomatis dari panen",
    langkah: [
      "Di detail penggarap, klik tombol Hutang",
      "Klik + Tambah Hutang",
      "Isi tanggal, jumlah, keperluan",
      "Hutang akan dipotong otomatis dari panen",
    ],
  },
  {
    icon: "⚖️",
    judul: "Timbang Gabah",
    deskripsi: "Multi sesi timbang dengan perhitungan otomatis",
    langkah: [
      "Buka menu Gabah di sidebar",
      "Pilih penggarap & lahan",
      "Isi harga jual & biaya vendor",
      "Tambah sesi timbang (5 sak per sesi)",
      "Klik Hitung Total → Kirim ke Database",
    ],
  },
  {
    icon: "📊",
    judul: "Lihat Grafik & Laporan",
    deskripsi: "Visualisasi kinerja & export PDF",
    langkah: [
      "Buka menu Grafik untuk lihat visual",
      "Buka menu Keuangan untuk detail profit",
      "Buka menu Laporan untuk PDF tahunan",
      "Semua export ada di menu Export",
    ],
  },
];

const FAQ = [
  {
    q: "Kenapa data saya kosong?",
    a: "Kalau Anda baru daftar, data memang kosong. Mulai dari tambah penggarap dulu. Kalau tiba-tiba kosong padahal udah ada, coba refresh halaman atau logout-login ulang.",
  },
  {
    q: "Apakah data saya aman?",
    a: "Sangat aman. Data disimpan di cloud (Supabase) dengan enkripsi. Cuma Anda yang bisa akses data Anda (Row Level Security). Kami tidak pernah jual data Anda.",
  },
  {
    q: "Bagaimana cara pindah ke akun baru?",
    a: "Buka Export → Download Backup. Login akun baru → Import → upload file backup → pilih Timpa. Semua data pindah lengkap.",
  },
  {
    q: "Apa bedanya Gratis vs Premium?",
    a: "Gratis: max 2 penggarap, 2 lahan, 2 panen. Premium Rp 59.000 sekali bayar: unlimited + export PDF/Excel + GPS walking + gabah multi-sesi + backup/import.",
  },
  {
    q: "Bagaimana cara upgrade Premium?",
    a: "Buka menu Premium (badge 💎). Klik Buat Invoice → transfer ke BCA → kirim bukti via WhatsApp → tunggu admin approve (max 1x24 jam).",
  },
  {
    q: "Lupa password, gimana?",
    a: "Di halaman Login, klik 'Lupa password?'. Masukkan email terdaftar, kami kirim link reset ke email Anda. Link berlaku 1 jam.",
  },
  {
    q: "Apakah bisa dipakai offline?",
    a: "Bisa! Harvestan adalah PWA. Install ke HP seperti aplikasi biasa (buka di Chrome → menu → Install app). Tetap bisa dibuka saat offline.",
  },
  {
    q: "Bisa input panen cabai bertahap?",
    a: "Bisa. Setiap panen cabai wajib pilih musim tanam. Satu musim bisa 10-20x panen. Total produktivitas dihitung per musim.",
  },
  {
    q: "Bagaimana kalau ada bug / error?",
    a: "Langsung screenshot errornya dan kirim via Feedback. Kami baca semua masukan dan benerin secepat mungkin.",
  },
  {
    q: "Bagaimana cara hapus akun?",
    a: "Buka Pengaturan → tab Akun → scroll bawah → Zona Bahaya → Hapus Akun. Data akan hilang permanen (tidak bisa di-undo).",
  },
];

export function BantuanKlien() {
  const [activeTab, setActiveTab] = useState<"panduan" | "faq">("panduan");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2c5e2e] via-[#1f4521] to-[#2c5e2e] rounded-3xl p-6 md:p-8 text-white shadow-2xl shadow-[#2c5e2e]/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f0b429]/20 rounded-full blur-3xl" />
        <div className="relative">
          <div className="inline-block bg-[#f0b429]/20 border border-[#f0b429]/40 rounded-full px-3 py-1.5 text-[10px] font-bold mb-3 uppercase tracking-[0.25em] text-[#f0b429]">
            ❓ Bantuan
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tighter mb-2">
            Pusat Bantuan Harvestan
          </h1>
          <p className="text-white/70 text-sm max-w-2xl leading-relaxed">
            Panduan step-by-step + pertanyaan umum. Kalau masih bingung, kirim
            feedback ke kami.
          </p>
        </div>
      </div>

      {/* ===== TAB ===== */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("panduan")}
          className={`flex-1 md:flex-none px-6 py-3 rounded-full text-sm font-bold transition-all ${
            activeTab === "panduan"
              ? "bg-[#2c5e2e] text-white shadow-lg shadow-[#2c5e2e]/30 scale-105"
              : "bg-white hover:bg-[#f0b429]/10 text-[#2c5e2e] border-2 border-[#2c5e2e]/10 hover:border-[#f0b429]/40"
          }`}
        >
          📖 Panduan
        </button>
        <button
          onClick={() => setActiveTab("faq")}
          className={`flex-1 md:flex-none px-6 py-3 rounded-full text-sm font-bold transition-all ${
            activeTab === "faq"
              ? "bg-[#2c5e2e] text-white shadow-lg shadow-[#2c5e2e]/30 scale-105"
              : "bg-white hover:bg-[#f0b429]/10 text-[#2c5e2e] border-2 border-[#2c5e2e]/10 hover:border-[#f0b429]/40"
          }`}
        >
          💬 FAQ
        </button>
      </div>

      {/* ===== KONTEN PANDUAN ===== */}
      {activeTab === "panduan" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PANDUAN.map((p, i) => (
            <div
              key={i}
              className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 md:p-6 shadow-lg shadow-[#2c5e2e]/5 hover:border-[#f0b429]/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f0b429]/20 to-[#f0b429]/5 flex items-center justify-center text-3xl flex-shrink-0">
                  {p.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[#2c5e2e] text-base tracking-tight">
                    {p.judul}
                  </div>
                  <div className="text-[10px] text-[#2c5e2e]/60 mt-0.5 uppercase tracking-widest">
                    {p.deskripsi}
                  </div>
                </div>
              </div>

              <ol className="space-y-2">
                {p.langkah.map((l, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-[#2c5e2e]/80 leading-relaxed"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#2c5e2e]/10 flex items-center justify-center text-[10px] font-bold text-[#2c5e2e]">
                      {idx + 1}
                    </span>
                    <span>{l}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {/* ===== KONTEN FAQ ===== */}
      {activeTab === "faq" && (
        <div className="space-y-2">
          {FAQ.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className={`border-2 rounded-2xl overflow-hidden transition-all ${
                  isOpen
                    ? "border-[#f0b429] bg-[#f0b429]/5 shadow-lg shadow-[#f0b429]/10"
                    : "border-[#2c5e2e]/10 bg-white hover:border-[#2c5e2e]/30"
                }`}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full text-left p-4 md:p-5 flex items-center justify-between gap-3"
                >
                  <span className="font-bold text-[#2c5e2e] text-sm leading-snug tracking-tight">
                    {item.q}
                  </span>
                  <span
                    className={`text-2xl text-[#f0b429] transition-transform flex-shrink-0 font-light leading-none ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 md:px-5 pb-4 md:pb-5 pt-0">
                    <div className="text-xs text-[#2c5e2e]/70 leading-relaxed whitespace-pre-line border-t border-[#f0b429]/20 pt-3">
                      {item.a}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== MASIH BINGUNG ===== */}
      <div className="bg-gradient-to-br from-[#2c5e2e] via-[#1f4521] to-[#2c5e2e] rounded-3xl p-6 md:p-8 text-white text-center shadow-2xl shadow-[#2c5e2e]/30">
        <div className="text-4xl mb-3">💬</div>
        <div className="font-bold text-lg tracking-tight mb-2">
          Masih Bingung?
        </div>
        <p className="text-white/70 text-xs mb-5 max-w-md mx-auto leading-relaxed">
          Kirim pertanyaan atau masalah Anda. Kami akan bantu secepat mungkin.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/feedback"
            className="bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] font-bold px-6 py-3 rounded-full transition-all hover:scale-105 shadow-lg text-sm uppercase tracking-widest"
          >
            💌 Kirim Feedback
          </Link>
          <a
            href="https://discord.gg/v8RZbADBM"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 hover:bg-white/20 border-2 border-white/30 text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-105 text-sm uppercase tracking-widest"
          >
            🎮 Join Discord
          </a>
        </div>
      </div>
    </div>
  );
}
