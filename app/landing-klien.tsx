"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type LandingUser = {
  email?: string | null;
  id?: string | null;
} | null;

type Produk = {
  id: string;
  nama: string;
  harga: number;
  satuan: string;
  stok: number;
  unggulan: boolean;
  foto_urls?: string[];
  total_review?: number;
  rating_rata?: number;
  kategori?: string;
};

const FITUR = [
  {
    icon: "👨‍🌾",
    title: "Manajemen Penggarap",
    desc: "Kelola data penggarap, kontak, alamat, dan riwayat kinerja dalam satu tempat.",
  },
  {
    icon: "🗺️",
    title: "Ukur Lahan 2 Cara",
    desc: "Ukur lahan pakai GPS walking (jalan keliling) atau pilih titik langsung di peta satelit. Luas otomatis terhitung.",
    badge: "Baru",
  },
  {
    icon: "📋",
    title: "Log Tanam Harian",
    desc: "Catat semua kegiatan pertanian — olah tanah, tanam, pupuk, penyiangan, panen. Riwayat lengkap per musim.",
    badge: "Baru",
  },
  {
    icon: "🧪",
    title: "Kalkulator Pupuk Standar & Presisi",
    desc: "Hitung dosis pupuk sesuai komoditas & luas lahan. Mode presisi pakai hasil analisis tanah — dosis disesuaikan status hara (N/P/K).",
    badge: "Baru",
  },
  {
    icon: "🌾",
    title: "Catat Panen Otomatis",
    desc: "Input hasil panen — profit owner & penggarap dihitung otomatis sesuai skema bagi hasil.",
  },
  {
    icon: "📸",
    title: "Postcard Hasil Panen",
    desc: "Ubah hasil panen jadi postcard cantik dengan berbagai style. Siap di-share ke Instagram, WhatsApp, atau Facebook.",
    badge: "Baru",
  },
  {
    icon: "💰",
    title: "Potong Hutang Otomatis",
    desc: "Hutang penggarap otomatis dipotong dari profit panen. Log lengkap tersimpan.",
  },
  {
    icon: "⚖️",
    title: "Penimbangan Gabah",
    desc: "Multi sesi timbang dengan perhitungan otomatis. Gabah bawa pulang dialihkan ke profit.",
    badge: "Baru",
  },
  {
    icon: "📈",
    title: "Grafik Harga & Grafik Panen",
    desc: "Pantau tren harga & hasil panen tiap komoditas — padi, jagung, cabai, bawang merah. Visual interaktif dengan Recharts.",
    badge: "Baru",
  },
  {
    icon: "📊",
    title: "Dashboard & Laporan",
    desc: "Ringkasan profit, produktivitas, dan kinerja penggarap. Export ke Excel atau PDF 1 klik.",
  },
  {
    icon: "🌶️",
    title: "Panen Bertahap Cabai",
    desc: "Catat panen cabai per musim tanam. Bandingkan performa antar musim.",
  },
  {
    icon: "🛒",
    title: "Toko Harvestan",
    desc: "Jual hasil panen & beli kebutuhan tani. Input, output, alat & mesin, furniture.",
    badge: "Baru",
  },
];

const CARA_KERJA = [
  {
    no: "01",
    icon: "📝",
    title: "Daftar Akun",
    desc: "Buat akun dalam 30 detik. Tanpa kartu kredit.",
  },
  {
    no: "02",
    icon: "👨‍🌾",
    title: "Tambah Penggarap & Lahan",
    desc: "Input data penggarap, lahan, dan lokasi GPS.",
  },
  {
    no: "03",
    icon: "🌾",
    title: "Catat Panen & Hutang",
    desc: "Setiap panen dihitung otomatis. Hutang dipotong otomatis.",
  },
  {
    no: "04",
    icon: "📊",
    title: "Laporan Siap Kapan Saja",
    desc: "Dashboard, keuangan, dan laporan siap kapan saja.",
  },
];

const PEMBANDING = [
  { lama: "Buku tulis & kalkulator", baru: "100% digital di cloud" },
  { lama: "Hitung bagi hasil manual", baru: "Otomatis akurat" },
  { lama: "Data bisa hilang", baru: "Backup & restore aman" },
  { lama: "Susah cari data lama", baru: "Pencarian cepat" },
  { lama: "Terbatas di 1 tempat", baru: "Akses dari mana saja" },
  { lama: "Laporan pakai tulis tangan", baru: "Export PDF/Excel 1 klik" },
];

const COCOK_UNTUK = [
  {
    icon: "🏞️",
    title: "Pemilik Lahan",
    desc: "Pantau bagi hasil dari sawah/kebun Anda yang digarap orang lain dengan transparan.",
  },
  {
    icon: "👨‍🌾",
    title: "Petani",
    desc: "Catat semua aktivitas pertanian dari tanam sampai panen, tanpa buku tulis.",
  },
  {
    icon: "🛒",
    title: "Buyer / Pembeli",
    desc: "Lacak asal-usul hasil panen, kualitas, dan volume dari pemasok Anda.",
  },
  {
    icon: "👥",
    title: "Kelompok Tani",
    desc: "Kelola data anggota, lahan, dan hasil panen bersama dalam satu platform.",
  },
  {
    icon: "🏢",
    title: "Gapoktan",
    desc: "Monitoring gabungan kelompok tani, laporan agregat, dan distribusi bantuan.",
  },
  {
    icon: "🏛️",
    title: "Dinas Pertanian",
    desc: "Data statistik pertanian daerah yang akurat untuk kebijakan & program.",
  },
  {
    icon: "🇮🇩",
    title: "Kementan / Pemerintah",
    desc: "Visualisasi data pertanian nasional, laporan real-time, & monitoring program.",
  },
  {
    icon: "🏭",
    title: "Pemilik Gudang",
    desc: "Kelola stok gabah/komoditas masuk-keluar, lacak asal & kualitas.",
  },
  {
    icon: "🚚",
    title: "Distributor Pertanian",
    desc: "Catat distribusi pupuk, benih, & hasil panen ke berbagai tujuan.",
  },
  {
    icon: "📊",
    title: "Koperasi Tani",
    desc: "Kelola simpan pinjam, penjualan, dan data anggota secara digital.",
  },
  {
    icon: "🎓",
    title: "Penyuluh Pertanian",
    desc: "Pendampingan petani dengan data akurat & riwayat panen terukur.",
  },
  {
    icon: "📈",
    title: "Investor / Stakeholder",
    desc: "Pantau performa sektor pertanian untuk keputusan investasi.",
  },
];

const FAQ = [
  {
    q: "Apakah Harvestan gratis?",
    a: "Anda bisa coba Harvestan tanpa biaya dengan fitur dasar (2 penggarap, 2 lahan, 2 panen). Kalau butuh fitur lengkap tanpa batas, upgrade ke Premium Rp 59.000 sekali bayar — akses selamanya.",
  },
  {
    q: "Bagaimana cara export data saya?",
    a: "Buka menu Export di sidebar. Ada 3 opsi: Download Backup, Download Laporan Excel, dan Download PDF per Penggarap. Semua data 100% milik Anda.",
  },
  {
    q: "Apakah bisa dipakai di HP?",
    a: "Ya! Harvestan didesain responsif untuk HP, tablet, dan desktop. Bisa juga di-install sebagai aplikasi (PWA) — buka di Chrome, tunggu 3 detik, akan muncul banner install.",
  },
  {
    q: "Bagaimana keamanan data saya?",
    a: "Data Anda dienkripsi dan disimpan dengan aman di Supabase (PostgreSQL). Setiap akun hanya bisa mengakses data miliknya sendiri (Row Level Security).",
  },
  {
    q: "Bagaimana cara pindah akun?",
    a: "Buka menu Export → Download Backup. Lalu login akun baru → menu Import → upload file backup. Pilih mode 'Timpa' atau 'Tambah'. Auto-remap ID dijamin tidak bentrok.",
  },
  {
    q: "Apakah bisa multi-user?",
    a: "Untuk saat ini 1 akun untuk 1 user. Fitur multi-user akan tersedia di paket premium ke depannya.",
  },
  {
    q: "Bagaimana jika lupa password?",
    a: "Buka halaman Login → klik 'Lupa Password?'. Masukkan email yang terdaftar, kami akan kirim link reset password. Link berlaku 1 jam.",
  },
  {
    q: "Apakah data bisa hilang?",
    a: "Data tersimpan di cloud (Supabase) dan otomatis ter-backup. Kami sarankan Download Backup rutin (1x seminggu) dari menu Export.",
  },
  {
    q: "Bagaimana cara restore data?",
    a: "Buka menu Import → upload file backup (.xlsx) → pilih mode Timpa (ganti semua) atau Tambah (merge).",
  },
  {
    q: "Apakah ada batasan jumlah penggarap?",
    a: "Di paket dasar, max 2 penggarap, 2 lahan, dan 2 panen. Upgrade ke Premium Rp 59.000 untuk unlimited.",
  },
  {
    q: "Apakah Harvestan bisa dipakai untuk komoditas selain padi?",
    a: "Bisa! Harvestan mendukung multi-komoditas: padi, jagung, kacang tanah, bawang merah, dan cabai rawit.",
  },
  {
    q: "Bagaimana cara ukur lahan?",
    a: "Ada 2 cara: (1) GPS Walking — jalan keliling batas lahan, titik otomatis tercatat. (2) Pilih di Peta — tap titik di peta satelit untuk tandai sudut lahan. Keduanya otomatis hitung luas.",
  },
  {
    q: "Apa itu Log Tanam?",
    a: "Log Tanam adalah catatan kegiatan pertanian harian — mulai dari olah tanah, tanam, pupuk, penyiangan, sampai panen. Setiap lahan punya riwayat lengkap per musim tanam.",
  },
  {
    q: "Bagaimana cara hitung kebutuhan pupuk?",
    a: "Buka menu Kalkulator. Ada 2 mode: (1) Standar — pakai dosis anjuran Kementan/Balitbangtan sesuai komoditas & luas lahan. (2) Presisi — masukkan hasil analisis tanah (N, P, K, pH), sistem otomatis koreksi dosis sesuai status hara. Bisa juga hitung jadwal pemupukan (split 2-3x) + cara mencampur pupuk.",
  },
  {
    q: "Apa itu Postcard Hasil Panen?",
    a: "Fitur untuk mengubah data hasil panen jadi postcard cantik dengan berbagai style (klasik, modern, minimalis, dll). Hasilnya bisa langsung di-share ke Instagram, WhatsApp, atau Facebook — cocok untuk dokumentasi & promosi hasil tani.",
  },
  {
    q: "Apa itu Toko Harvestan?",
    a: "Toko online resmi Harvestan — jual input pertanian (pupuk, bibit), output pertanian (beras, cabai), alat & mesin, dan furniture. Bisa diakses di halaman /toko.",
  },
  {
    q: "Ada komunitas untuk diskusi?",
    a: "Ada! Kami punya Discord community untuk diskusi, tanya jawab, share tips pertanian, kelas edukasi, marketplace, webinar, dan info harga komoditas.",
  },
];

const SOSIAL_MEDIA = [
  {
    name: "Instagram",
    handle: "@harvestan.id",
    url: "https://instagram.com/harvestan.id",
    gradient: "from-pink-500 via-red-500 to-yellow-500",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    handle: "@harvestan.id",
    url: "https://tiktok.com/@harvestan.id",
    gradient: "from-gray-900 to-gray-700",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    handle: "Harvestan Id",
    url: "https://www.facebook.com/share/18BUxcdZL2/",
    gradient: "from-blue-600 to-blue-800",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "X",
    handle: "@harvestan_id",
    url: "https://x.com/harvestan_id",
    gradient: "from-gray-800 to-black",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

const DISCORD_FITUR = [
  { icon: "💬", text: "Diskusi & Tanya Jawab" },
  { icon: "🌾", text: "Share Tips Pertanian" },
  { icon: "🌶️", text: "Pembahasan Komoditas" },
  { icon: "📚", text: "Kelas Edukasi" },
  { icon: "🛒", text: "Marketplace P2P" },
  { icon: "🎥", text: "Webinar & Gathering" },
  { icon: "💰", text: "Info Harga Daerah" },
  { icon: "🔗", text: "Terintegrasi Web" },
];

const MARQUEE_ITEMS = [
  "🌾 Padi",
  "🌽 Jagung",
  "🌶️ Cabai Rawit",
  "🧅 Bawang Merah",
  "🥜 Kacang Tanah",
  "⚖️ Gabah",
  "🧪 Kalkulator Pupuk",
  "📸 Postcard Panen",
  "🚜 Alat Tani",
  "🛒 Toko Harvestan",
  "💰 Bagi Hasil Otomatis",
  "📊 Laporan PDF",
  "📍 GPS Lahan",
  "📋 Log Tanam",
  "🌱 Pupuk & Bibit",
];

type Props = {
  user: LandingUser;
  produkTampil: Produk[];
};

export default function LandingKlien({ user, produkTampil }: Props) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [counters, setCounters] = useState({ a: 0, b: 0, c: 0, d: 0 });
  const [menuMobile, setMenuMobile] = useState(false);
  const countersRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const safeProduk: Produk[] = Array.isArray(produkTampil) ? produkTampil : [];

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress((scrollTop / docHeight) * 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const scrollY = window.scrollY;
      if (scrollY < 800) {
        heroRef.current.style.transform = `translateY(${scrollY * 0.3}px)`;
        heroRef.current.style.opacity = `${1 - scrollY / 800}`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (menuMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuMobile]);

  useEffect(() => {
    if (!countersRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animateCounter(0, 100, 1500, (v) =>
            setCounters((c) => ({ ...c, a: v }))
          );
          animateCounter(0, 5, 1200, (v) =>
            setCounters((c) => ({ ...c, b: v }))
          );
          animateCounter(0, 24, 1400, (v) =>
            setCounters((c) => ({ ...c, c: v }))
          );
          animateCounter(0, 100, 1800, (v) =>
            setCounters((c) => ({ ...c, d: v }))
          );
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(countersRef.current);
    return () => observer.disconnect();
  }, []);

  function animateCounter(
    start: number,
    end: number,
    duration: number,
    cb: (v: number) => void
  ) {
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      cb(Math.floor(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] overflow-x-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-20px); }
            }
            @keyframes blob-morph {
              0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
              50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
            }
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            @keyframes gradient-shift {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            @keyframes fade-up {
              from { opacity: 0; transform: translateY(30px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes slide-down {
              from { opacity: 0; transform: translateY(-20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-float { animation: float 6s ease-in-out infinite; }
            .animate-blob { animation: blob-morph 12s ease-in-out infinite; }
            .animate-marquee { animation: marquee 40s linear infinite; }
            .animate-shimmer {
              background-size: 200% 100%;
              animation: shimmer 3s linear infinite;
            }
            .animate-gradient {
              background-size: 200% 200%;
              animation: gradient-shift 8s ease infinite;
            }
            .animate-fade-up { animation: fade-up 1s ease-out forwards; }
            .animate-slide-down { animation: slide-down 0.3s ease-out; }
            .delay-1 { animation-delay: 0.15s; }
            .delay-2 { animation-delay: 0.3s; }
            .delay-3 { animation-delay: 0.45s; }
            .delay-4 { animation-delay: 0.6s; }
            .noise-overlay::before {
              content: '';
              position: absolute;
              inset: 0;
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
              opacity: 0.03;
              pointer-events: none;
              mix-blend-mode: overlay;
            }
            .text-shadow-glow { text-shadow: 0 0 40px rgba(240, 180, 41, 0.3); }
          `,
        }}
      />

      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#2c5e2e] via-[#f0b429] to-[#2c5e2e] z-[100] transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#faf9f5]/70 backdrop-blur-2xl border-b border-[#2c5e2e]/10">
        <div className="max-w-7xl mx-auto px-4 md:px-10 flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center group flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-horizontal.png"
              alt="Harvestan"
              className="h-10 md:h-14 w-auto transition-transform group-hover:scale-105"
            />
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#2c5e2e]/80">
            {[
              { label: "Blog", href: "/blog" },
              { label: "Toko", href: "/toko" },
              { label: "Fitur", href: "#fitur" },
              { label: "Cocok Untuk", href: "#cocokuntuk" },
              { label: "FAQ", href: "#faq" },
            ].map((item, i) => (
              <Link key={i} href={item.href} className="relative group py-2">
                <span className="relative z-10 transition-colors group-hover:text-[#2c5e2e]">
                  {item.label}
                </span>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-[#2c5e2e] to-[#f0b429] group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="relative bg-[#2c5e2e] hover:bg-[#1f4521] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all shadow-lg shadow-[#2c5e2e]/20 hover:shadow-[#2c5e2e]/40 hover:scale-105 group overflow-hidden"
              >
                <span className="relative z-10">Dashboard</span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0b429]/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-[#2c5e2e]/80 hover:text-[#2c5e2e] font-medium px-4 py-2 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="relative bg-[#2c5e2e] hover:bg-[#1f4521] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all shadow-lg shadow-[#2c5e2e]/20 hover:shadow-[#2c5e2e]/40 hover:scale-105 group overflow-hidden"
                >
                  <span className="relative z-10">Daftar</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0b429]/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuMobile(!menuMobile)}
            className="md:hidden w-10 h-10 rounded-xl bg-[#2c5e2e]/5 border border-[#2c5e2e]/15 flex items-center justify-center text-[#2c5e2e] active:scale-95 transition-transform flex-shrink-0"
            aria-label="Menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              {menuMobile ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {menuMobile && (
          <div className="md:hidden border-t border-[#2c5e2e]/10 bg-[#faf9f5]/95 backdrop-blur-2xl animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              <Link
                href="/blog"
                onClick={() => setMenuMobile(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-[#2c5e2e]/5 transition-colors text-[#2c5e2e] font-medium"
              >
                <span className="text-xl">📖</span>
                <span>Blog</span>
              </Link>
              <Link
                href="/toko"
                onClick={() => setMenuMobile(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-[#2c5e2e]/5 transition-colors text-[#2c5e2e] font-medium"
              >
                <span className="text-xl">🛒</span>
                <span>Toko</span>
              </Link>
              <a
                href="#fitur"
                onClick={() => setMenuMobile(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-[#2c5e2e]/5 transition-colors text-[#2c5e2e] font-medium"
              >
                <span className="text-xl">✨</span>
                <span>Fitur</span>
              </a>
              <a
                href="#cocokuntuk"
                onClick={() => setMenuMobile(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-[#2c5e2e]/5 transition-colors text-[#2c5e2e] font-medium"
              >
                <span className="text-xl">🎯</span>
                <span>Cocok Untuk</span>
              </a>
              <a
                href="#faq"
                onClick={() => setMenuMobile(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-[#2c5e2e]/5 transition-colors text-[#2c5e2e] font-medium"
              >
                <span className="text-xl">❓</span>
                <span>FAQ</span>
              </a>

              <div className="pt-2 mt-2 border-t border-[#2c5e2e]/10">
                {user ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuMobile(false)}
                    className="flex items-center justify-center gap-2 bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-3.5 rounded-2xl transition-all"
                  >
                    📊 Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuMobile(false)}
                      className="flex items-center justify-center gap-2 bg-white border-2 border-[#2c5e2e]/20 hover:border-[#2c5e2e]/40 text-[#2c5e2e] font-bold py-3.5 rounded-2xl transition-all mb-2"
                    >
                      👤 Masuk
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMenuMobile(false)}
                      className="flex items-center justify-center gap-2 bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-3.5 rounded-2xl transition-all"
                    >
                      📝 Daftar Gratis
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden noise-overlay">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-gradient-to-br from-[#2c5e2e]/30 via-[#4a8f3f]/20 to-transparent animate-blob" />
          <div
            className="absolute top-[100px] right-[-150px] w-[600px] h-[600px] bg-gradient-to-br from-[#f0b429]/25 via-[#e6a617]/15 to-transparent animate-blob"
            style={{ animationDelay: "3s" }}
          />
          <div
            className="absolute bottom-[-200px] left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-[#7c9e3c]/20 to-transparent animate-blob"
            style={{ animationDelay: "6s" }}
          />
        </div>

        <div
          className="absolute inset-0 -z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#2c5e2e 1px, transparent 1px), linear-gradient(90deg, #2c5e2e 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          }}
        />

        <div
          ref={heroRef}
          className="relative max-w-7xl mx-auto px-6 md:px-10 py-24 md:py-40"
        >
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-xl border border-[#2c5e2e]/15 text-[#2c5e2e] px-5 py-2.5 rounded-full text-xs font-semibold mb-10 shadow-xl shadow-[#2c5e2e]/5 animate-fade-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f0b429] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f0b429]" />
              </span>
              <span className="uppercase tracking-[0.15em]">
                Untuk Petani Indonesia
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#2c5e2e] leading-[0.95] tracking-tighter animate-fade-up delay-1">
              Kelola Lahan Pertanian Anda
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-[#2c5e2e] via-[#4a8f3f] to-[#2c5e2e] bg-clip-text text-transparent animate-gradient italic font-serif">
                  Lebih Cerdas
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3"
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 6 Q 75 12, 150 6 T 300 6"
                    stroke="#f0b429"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-base md:text-xl text-[#2c5e2e]/70 mt-12 max-w-2xl mx-auto leading-relaxed animate-fade-up delay-2">
              Catat penggarap, lahan, panen, hutang, dan bagi hasil dalam satu
              aplikasi. Plus{" "}
              <span className="text-[#2c5e2e] font-semibold">
                Toko Harvestan
              </span>{" "}
              untuk jual hasil panen & beli kebutuhan tani.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mt-14 animate-fade-up delay-3">
              <Link
                href="/register"
                className="group relative bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-semibold px-9 py-4 rounded-full transition-all shadow-2xl shadow-[#2c5e2e]/30 hover:shadow-[#2c5e2e]/50 hover:scale-[1.03] inline-flex items-center gap-2 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0b429]/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative z-10">Mulai Sekarang</span>
                <span className="relative z-10 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
              <Link
                href="/toko"
                className="bg-white/70 backdrop-blur-xl hover:bg-white text-[#2c5e2e] font-semibold px-9 py-4 rounded-full transition-all border-2 border-[#2c5e2e]/15 hover:border-[#f0b429]/60 shadow-lg hover:shadow-xl hover:scale-[1.03]"
              >
                Kunjungi Toko
              </Link>
            </div>

            <div className="flex flex-wrap gap-8 justify-center mt-14 text-xs text-[#2c5e2e]/70 animate-fade-up delay-4">
              {["Tanpa kartu kredit", "Coba tanpa biaya", "Data milik Anda"].map(
                (item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#f0b429]/20 flex items-center justify-center text-[#2c5e2e] text-[10px] font-bold">
                      ✓
                    </span>
                    <span className="uppercase tracking-wider font-medium">
                      {item}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#faf9f5] pointer-events-none" />
      </section>

      {/* MARQUEE */}
      <section className="relative py-8 border-y border-[#2c5e2e]/10 bg-white/40 backdrop-blur overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-3 mx-6 text-sm font-semibold text-[#2c5e2e]/60"
            >
              <span>{item}</span>
              <span className="text-[#f0b429]">•</span>
            </div>
          ))}
        </div>
      </section>

      {/* STATISTIK */}
      <section
        ref={countersRef}
        className="relative py-24 md:py-32 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[#2c5e2e]" />
        <div className="absolute inset-0 noise-overlay" />

        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#f0b429]/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#4a8f3f]/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />

        <div className="relative max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center mb-20">
            <div className="text-xs uppercase tracking-[0.25em] text-[#f0b429] font-bold mb-5">
              Dipercaya Petani
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Angka yang Bicara
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: counters.a, suffix: "%", label: "Data Aman" },
              { value: counters.b, suffix: "+", label: "Komoditas" },
              { value: counters.c, suffix: "/7", label: "Akses Kapan Saja" },
              { value: counters.d, suffix: "%", label: "Buatan Lokal" },
            ].map((s, i) => (
              <div key={i} className="text-center group">
                <div className="text-5xl md:text-7xl font-bold text-[#f0b429] tracking-tighter text-shadow-glow">
                  {s.value}
                  <span className="text-3xl md:text-4xl">{s.suffix}</span>
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/60 mt-4 font-semibold">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FITUR */}
      <section id="fitur" className="relative py-24 md:py-36">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center mb-20">
            <div className="inline-block text-xs uppercase tracking-[0.25em] text-[#2c5e2e] font-bold mb-5 px-4 py-1.5 bg-[#f0b429]/15 rounded-full">
              Fitur Lengkap
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-[#2c5e2e] tracking-tighter">
              Semua yang Anda Butuhkan
            </h2>
            <p className="text-[#2c5e2e]/70 mt-6 max-w-2xl mx-auto leading-relaxed text-lg">
              Dari penggarap sampai laporan PDF — semuanya ada di satu
              aplikasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FITUR.map((f, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#2c5e2e]/10"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#2c5e2e] via-[#4a8f3f] to-[#f0b429] opacity-0 group-hover:opacity-100 transition-opacity -z-10 p-[2px]">
                  <div className="w-full h-full rounded-3xl bg-white" />
                </div>
                <div className="absolute inset-0 rounded-3xl border-2 border-[#2c5e2e]/8 group-hover:border-transparent transition-colors" />

                <div className="relative">
                  {f.badge && (
                    <span className="absolute -top-2 right-0 text-[10px] font-bold bg-[#f0b429] text-[#2c5e2e] px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                      {f.badge}
                    </span>
                  )}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2c5e2e]/10 to-[#f0b429]/10 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-[#2c5e2e] text-lg mb-3">
                    {f.title}
                  </h3>
                  <p className="text-sm text-[#2c5e2e]/60 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOKO HARVESTAN */}
      {safeProduk.length > 0 && (
        <section className="relative py-24 md:py-36 bg-white overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#f0b429]/10 rounded-full blur-3xl animate-float" />
            <div
              className="absolute bottom-1/4 left-0 w-96 h-96 bg-[#2c5e2e]/10 rounded-full blur-3xl animate-float"
              style={{ animationDelay: "3s" }}
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 md:px-10">
            <div className="flex items-end justify-between flex-wrap gap-6 mb-16">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-[#2c5e2e] font-bold mb-4">
                  Toko Harvestan
                </div>
                <h2 className="text-4xl md:text-6xl font-bold text-[#2c5e2e] tracking-tighter">
                  Belanja Kebutuhan Tani
                </h2>
                <p className="text-[#2c5e2e]/70 text-base mt-5 max-w-xl leading-relaxed">
                  Input pertanian, output pertanian, alat & mesin, dan
                  furniture. Langsung dari Harvestan.
                </p>
              </div>
              <Link
                href="/toko"
                className="group relative inline-flex items-center gap-2 bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-semibold px-7 py-3.5 rounded-full transition-all shadow-xl shadow-[#2c5e2e]/30 hover:shadow-[#2c5e2e]/50 hover:scale-105 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0b429]/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative z-10">Lihat Semua Produk</span>
                <span className="relative z-10 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {safeProduk.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/toko/${p.id}`}
                  className="group bg-[#faf9f5] rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-[#2c5e2e]/10 transition-all duration-500 hover:-translate-y-2 border border-[#2c5e2e]/8"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-[#2c5e2e]/5 to-[#f0b429]/10 overflow-hidden">
                    {p.foto_urls && p.foto_urls[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.foto_urls[0]}
                        alt={p.nama}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl text-[#2c5e2e]/40">
                        📦
                      </div>
                    )}
                    {p.unggulan && (
                      <div className="absolute top-3 left-3 bg-[#f0b429] text-[#2c5e2e] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                        Unggulan
                      </div>
                    )}
                    {p.stok <= 0 && (
                      <div className="absolute inset-0 bg-[#2c5e2e]/70 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white font-bold text-xs uppercase tracking-wider">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-[#2c5e2e] text-sm line-clamp-2 mb-3 leading-snug min-h-[2.6em]">
                      {p.nama}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-[#2c5e2e] text-lg tracking-tight">
                        Rp {Math.round(p.harga).toLocaleString("id-ID")}
                      </span>
                      <span className="text-xs text-[#2c5e2e]/50">
                        /{p.satuan}
                      </span>
                    </div>
                    {p.total_review && p.total_review > 0 && (
                      <div className="text-[10px] text-[#2c5e2e]/60 mt-2 flex items-center gap-1">
                        <span className="text-[#f0b429]">★</span>
                        {p.rating_rata ? p.rating_rata.toFixed(1) : "0"} (
                        {p.total_review})
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* COCOK UNTUK */}
      <section id="cocokuntuk" className="relative py-24 md:py-36">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center mb-20">
            <div className="inline-block text-xs uppercase tracking-[0.25em] text-[#2c5e2e] font-bold mb-5 px-4 py-1.5 bg-[#f0b429]/15 rounded-full">
              Target Pengguna
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-[#2c5e2e] tracking-tighter">
              Cocok Untuk
            </h2>
            <p className="text-[#2c5e2e]/70 mt-6 max-w-3xl mx-auto leading-relaxed text-lg">
              Dirancang untuk siapa saja yang bergerak di sektor pertanian
              Indonesia — dari petani individu sampai instansi pemerintah.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COCOK_UNTUK.map((item, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#2c5e2e]/5 to-[#f0b429]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 rounded-2xl border border-[#2c5e2e]/8 group-hover:border-[#f0b429]/40 transition-colors" />
                <div className="relative flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0 group-hover:scale-125 group-hover:rotate-6 transition-transform duration-500">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#2c5e2e] text-base mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#2c5e2e]/60 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <div className="inline-block bg-[#f0b429]/10 border-2 border-[#f0b429]/30 rounded-2xl px-7 py-5 text-sm text-[#2c5e2e] shadow-lg shadow-[#f0b429]/10">
              💡 <strong>Punya profesi lain?</strong> Harvestan bisa
              dikustomisasi sesuai kebutuhan Anda. Sampaikan di{" "}
              <a
                href="https://discord.gg/v8RZbADBM"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                Discord
              </a>{" "}
              atau{" "}
              <a href="/feedback" className="underline font-semibold">
                kirim feedback
              </a>
              .
            </div>
          </div>
        </div>
      </section>

            {/* KENAPA HARVESTAN */}
            <section className="relative py-24 md:py-36 bg-white">
              <div className="max-w-5xl mx-auto px-6 md:px-10">
                <div className="text-center mb-20">
                  <div className="inline-block text-xs uppercase tracking-[0.25em] text-[#2c5e2e] font-bold mb-5 px-4 py-1.5 bg-[#f0b429]/15 rounded-full">
                    Perbandingan
                  </div>
                  <h2 className="text-4xl md:text-6xl font-bold text-[#2c5e2e] tracking-tighter">
                    Kenapa Pilih Harvestan?
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#faf9f5] border-2 border-[#2c5e2e]/8 rounded-3xl p-8">
                    <div className="flex items-center gap-4 mb-7">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl">
                        ✕
                      </div>
                      <div>
                        <div className="font-bold text-[#2c5e2e] text-lg">
                          Cara Lama
                        </div>
                        <div className="text-xs text-[#2c5e2e]/60">
                          Buku tulis & Excel manual
                        </div>
                      </div>
                    </div>
                    <ul className="space-y-4">
                      {PEMBANDING.map((p, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-[#2c5e2e]/70"
                        >
                          <span className="text-[#2c5e2e]/40 mt-0.5 flex-shrink-0">
                            ✕
                          </span>
                          <span>{p.lama}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="relative bg-[#2c5e2e] text-white rounded-3xl p-8 shadow-2xl shadow-[#2c5e2e]/30 overflow-hidden noise-overlay">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#f0b429]/20 rounded-full blur-3xl animate-float" />
                    <div className="relative">
                      <div className="flex items-center gap-4 mb-7">
                        <div className="w-14 h-14 bg-[#f0b429]/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl">
                          ✓
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg">
                            Dengan Harvestan
                          </div>
                          <div className="text-xs text-[#f0b429]">
                            Digital, otomatis, cloud
                          </div>
                        </div>
                      </div>
                      <ul className="space-y-4">
                        {PEMBANDING.map((p, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-sm text-white/90"
                          >
                            <span className="text-[#f0b429] mt-0.5 flex-shrink-0">
                              ✓
                            </span>
                            <span className="font-medium">{p.baru}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CARA KERJA */}
            <section className="relative py-24 md:py-36 overflow-hidden">
              <div className="absolute inset-0 -z-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2c5e2e]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#f0b429]/10 rounded-full blur-3xl" />
              </div>

              <div className="max-w-6xl mx-auto px-6 md:px-10">
                <div className="text-center mb-20">
                  <div className="inline-block text-xs uppercase tracking-[0.25em] text-[#2c5e2e] font-bold mb-5 px-4 py-1.5 bg-[#f0b429]/15 rounded-full">
                    Cara Kerja
                  </div>
                  <h2 className="text-4xl md:text-6xl font-bold text-[#2c5e2e] tracking-tighter">
                    Mulai dalam 4 Langkah
                  </h2>
                  <p className="text-[#2c5e2e]/70 mt-6 max-w-2xl mx-auto leading-relaxed text-lg">
                    Prosesnya simpel. Dari daftar sampai punya laporan lengkap, cuma
                    butuh beberapa menit.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {CARA_KERJA.map((step, i) => (
                    <div
                      key={step.no}
                      className="group relative bg-white rounded-3xl border-2 border-[#2c5e2e]/8 p-6 md:p-7 text-center transition-all duration-500 hover:border-[#f0b429]/50 hover:shadow-2xl hover:shadow-[#2c5e2e]/10 hover:-translate-y-2"
                    >
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-[#2c5e2e] to-[#1f4521] text-[#f0b429] flex items-center justify-center text-sm font-bold shadow-lg shadow-[#2c5e2e]/30 group-hover:scale-110 transition-transform">
                        {step.no}
                      </div>

                      <div className="w-20 h-20 mx-auto mt-6 mb-5 rounded-2xl bg-gradient-to-br from-[#2c5e2e]/8 to-[#f0b429]/15 flex items-center justify-center text-4xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                        {step.icon}
                      </div>

                      <h3 className="font-bold text-[#2c5e2e] mb-3 text-lg leading-tight">
                        {step.title}
                      </h3>

                      <p className="text-sm text-[#2c5e2e]/60 leading-relaxed">
                        {step.desc}
                      </p>

                      {i < CARA_KERJA.length - 1 && (
                        <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 text-[#f0b429] text-2xl font-bold z-10">
                          →
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* DISCORD */}
            <section className="relative py-24 md:py-36 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2] via-[#4752c4] to-[#404EED]" />
              <div className="absolute inset-0 noise-overlay" />
              <div className="absolute inset-0 opacity-40">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400 rounded-full blur-3xl animate-float" />
                <div
                  className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl animate-float"
                  style={{ animationDelay: "3s" }}
                />
              </div>

              <div className="relative max-w-6xl mx-auto px-6 md:px-10 text-white">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center gap-3 bg-white/15 backdrop-blur-xl px-6 py-2.5 rounded-full text-sm font-semibold mb-8 border border-white/20">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    Komunitas Resmi
                  </div>

                  <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter">
                    Bergabung dengan
                    <br />
                    Komunitas Harvestan
                  </h2>
                  <p className="text-lg text-white/85 max-w-3xl mx-auto leading-relaxed">
                    Tempat berkumpulnya petani Indonesia untuk belajar, berbagi
                    pengalaman, dan tumbuh bersama.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14">
                  {DISCORD_FITUR.map((f, i) => (
                    <div
                      key={i}
                      className="group bg-white/10 backdrop-blur-xl rounded-2xl p-4 text-center border border-white/20 hover:bg-white/20 hover:-translate-y-1 transition-all"
                    >
                      <div className="text-2xl mb-2 group-hover:scale-125 transition-transform duration-300">
                        {f.icon}
                      </div>
                      <div className="text-xs font-medium text-white/95">
                        {f.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <a
                    href="https://discord.gg/v8RZbADBM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center gap-3 bg-white hover:bg-gray-50 text-[#5865F2] font-bold px-12 py-5 rounded-full transition-all text-lg shadow-2xl hover:scale-105 overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-200/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <svg
                      className="w-6 h-6 relative z-10"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
                    </svg>
                    <span className="relative z-10">Join Discord Server</span>
                  </a>
                  <p className="text-xs text-white/70 mt-5">
                    Tanpa undangan • Langsung gabung
                  </p>
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="relative py-24 md:py-36">
              <div className="max-w-3xl mx-auto px-6 md:px-10">
                <div className="text-center mb-20">
                  <div className="inline-block text-xs uppercase tracking-[0.25em] text-[#2c5e2e] font-bold mb-5 px-4 py-1.5 bg-[#f0b429]/15 rounded-full">
                    FAQ
                  </div>
                  <h2 className="text-4xl md:text-6xl font-bold text-[#2c5e2e] tracking-tighter">
                    Pertanyaan Umum
                  </h2>
                </div>

                <div className="space-y-3">
                  {FAQ.map((item, i) => (
                    <details
                      key={i}
                      className="group bg-white border-2 border-[#2c5e2e]/8 rounded-2xl p-6 cursor-pointer hover:border-[#f0b429]/40 hover:shadow-lg hover:shadow-[#f0b429]/5 transition-all"
                    >
                      <summary className="font-semibold text-[#2c5e2e] flex items-center justify-between list-none gap-4">
                        <span className="text-base">{item.q}</span>
                        <span className="text-[#f0b429] text-2xl group-open:rotate-45 transition-transform flex-shrink-0 font-light leading-none">
                          +
                        </span>
                      </summary>
                      <p className="text-sm text-[#2c5e2e]/70 mt-4 leading-relaxed whitespace-pre-wrap">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </section>

            {/* SOSIAL MEDIA */}
            <section className="relative py-24 md:py-36 bg-white">
              <div className="max-w-6xl mx-auto px-6 md:px-10">
                <div className="text-center mb-20">
                  <div className="inline-block text-xs uppercase tracking-[0.25em] text-[#2c5e2e] font-bold mb-5 px-4 py-1.5 bg-[#f0b429]/15 rounded-full">
                    Sosial Media
                  </div>
                  <h2 className="text-4xl md:text-6xl font-bold text-[#2c5e2e] tracking-tighter">
                    Ikuti Kami
                  </h2>
                  <p className="text-[#2c5e2e]/70 mt-6 max-w-2xl mx-auto text-lg">
                    Update fitur terbaru, tips pertanian, dan info menarik lainnya
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {SOSIAL_MEDIA.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-[#faf9f5] border-2 border-[#2c5e2e]/8 hover:border-transparent rounded-3xl p-6 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-[#2c5e2e]/10 hover:-translate-y-2 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#2c5e2e]/5 to-[#f0b429]/5 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                      <div
                        className={`w-16 h-16 mx-auto bg-gradient-to-br ${s.gradient} rounded-3xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}
                      >
                        {s.icon}
                      </div>
                      <div className="font-bold text-[#2c5e2e] text-sm mb-1">
                        {s.name}
                      </div>
                      <div className="text-xs text-[#2c5e2e]/60">{s.handle}</div>
                    </a>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA AKHIR */}
            <section className="relative py-16 md:py-24">
              <div className="max-w-5xl mx-auto px-6 md:px-10">
                <div className="relative overflow-hidden bg-[#2c5e2e] rounded-[2.5rem] p-12 md:p-20 text-center text-white shadow-2xl shadow-[#2c5e2e]/40 noise-overlay">
                  <div className="absolute inset-0 opacity-50">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#f0b429]/20 rounded-full blur-3xl animate-float" />
                    <div
                      className="absolute bottom-0 left-0 w-96 h-96 bg-[#4a8f3f]/30 rounded-full blur-3xl animate-float"
                      style={{ animationDelay: "4s" }}
                    />
                  </div>

                  <div className="relative">
                    <div className="flex justify-center mb-8">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/icon.png"
                        alt="Harvestan"
                        className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-2xl animate-float"
                      />
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter">
                      Siap Kelola Lahan
                      <br />
                      Pertanian Anda?
                    </h2>
                    <p className="text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed text-lg">
                      Bergabung dengan petani Indonesia yang sudah beralih dari
                      buku tulis ke digital. Coba dulu, tanpa biaya.
                    </p>
                    <Link
                      href="/register"
                      className="group relative inline-flex items-center gap-3 bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] font-bold px-12 py-5 rounded-full transition-all text-lg shadow-2xl hover:scale-105 overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      <span className="relative z-10">Daftar Sekarang</span>
                      <span className="relative z-10 group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </Link>
                    <p className="text-xs text-white/60 mt-6">
                      Tanpa kartu kredit • Setup 30 detik
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="relative bg-[#1f4521] text-white/60 py-16 overflow-hidden noise-overlay">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#f0b429] rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4a8f3f] rounded-full blur-3xl" />
              </div>

              <div className="relative max-w-7xl mx-auto px-6 md:px-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logo-horizontal.png"
                      alt="Harvestan"
                      className="h-14 md:h-16 w-auto brightness-0 invert opacity-90"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    {SOSIAL_MEDIA.map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#f0b429] flex items-center justify-center text-white/60 hover:text-[#2c5e2e] transition-all hover:scale-110"
                        title={s.name}
                      >
                        <div className="scale-75">{s.icon}</div>
                      </a>
                    ))}
                    <a
                      href="https://discord.gg/v8RZbADBM"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#5865F2] flex items-center justify-center text-white/60 hover:text-white transition-all hover:scale-110"
                      title="Discord"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
                      </svg>
                    </a>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/10 text-xs flex flex-col md:flex-row justify-between items-center gap-3">
                  <p>© 2026 Harvestan. Dibuat dengan ❤️ di Indonesia 🇮🇩</p>
                  <p className="text-white/40">Sistem Manajemen Pertanian Modern</p>
                </div>
              </div>
            </footer>
          </div>
        );
      }
