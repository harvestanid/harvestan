import Link from "next/link";

// ===================================================
// DATA
// ===================================================
const FITUR = [
  {
    icon: "👨‍🌾",
    title: "Manajemen Penggarap",
    desc: "Kelola data penggarap, kontak, alamat, dan riwayat kinerja dalam satu tempat.",
    color: "bg-green-50 border-green-200",
    badge: null,
  },
  {
    icon: "🗺️",
    title: "Peta Lahan + GPS",
    desc: "Catat lokasi setiap lahan dengan koordinat GPS. Ukur lahan pakai GPS walking.",
    color: "bg-blue-50 border-blue-200",
    badge: null,
  },
  {
    icon: "🌾",
    title: "Catat Panen Otomatis",
    desc: "Input hasil panen — profit owner & penggarap dihitung otomatis sesuai skema bagi hasil.",
    color: "bg-yellow-50 border-yellow-200",
    badge: null,
  },
  {
    icon: "💰",
    title: "Potong Hutang Otomatis",
    desc: "Hutang penggarap otomatis dipotong dari profit panen. Log lengkap tersimpan.",
    color: "bg-red-50 border-red-200",
    badge: null,
  },
  {
    icon: "⚖️",
    title: "Penimbangan Gabah",
    desc: "Multi sesi timbang dengan perhitungan otomatis. Gabah bawa pulang dialihkan ke profit.",
    color: "bg-orange-50 border-orange-200",
    badge: "BARU 🔥",
  },
  {
    icon: "📊",
    title: "Dashboard & Grafik",
    desc: "Ringkasan profit, produktivitas, dan kinerja penggarap. Visual interaktif dengan Recharts.",
    color: "bg-purple-50 border-purple-200",
    badge: "BARU 🔥",
  },
  {
    icon: "📄",
    title: "Export Excel & PDF",
    desc: "Download laporan lengkap ke Excel atau PDF. Backup data untuk pindah akun.",
    color: "bg-indigo-50 border-indigo-200",
    badge: null,
  },
  {
    icon: "🌶️",
    title: "Panen Bertahap Cabai",
    desc: "Catat panen cabai per musim tanam. Bandingkan performa antar musim.",
    color: "bg-pink-50 border-pink-200",
    badge: null,
  },
  {
    icon: "📱",
    title: "PWA Install",
    desc: "Install aplikasi di HP seperti aplikasi native. Bisa dibuka offline.",
    color: "bg-teal-50 border-teal-200",
    badge: "BARU 🔥",
  },
];

const CARA_KERJA = [
  {
    no: "1",
    icon: "📝",
    title: "Daftar Gratis",
    desc: "Buat akun dalam 30 detik. Tanpa kartu kredit.",
  },
  {
    no: "2",
    icon: "👨‍🌾",
    title: "Tambah Penggarap & Lahan",
    desc: "Input data penggarap, lahan, dan lokasi GPS.",
  },
  {
    no: "3",
    icon: "🌾",
    title: "Catat Panen & Hutang",
    desc: "Setiap panen dihitung otomatis. Hutang dipotong otomatis.",
  },
  {
    no: "4",
    icon: "📊",
    title: "Dapat Laporan Otomatis",
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

// ===================================================
// COCOK UNTUK (TARGET USER)
// ===================================================
const COCOK_UNTUK = [
  {
    icon: "🏞️",
    title: "Pemilik Lahan",
    desc: "Pantau bagi hasil dari sawah/kebun Anda yang digarap orang lain dengan transparan.",
    color: "bg-green-50 border-green-200 text-green-800",
  },
  {
    icon: "👨‍🌾",
    title: "Petani",
    desc: "Catat semua aktivitas pertanian dari tanam sampai panen, tanpa buku tulis.",
    color: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  {
    icon: "🛒",
    title: "Buyer / Pembeli",
    desc: "Lacak asal-usul hasil panen, kualitas, dan volume dari pemasok Anda.",
    color: "bg-blue-50 border-blue-200 text-blue-800",
  },
  {
    icon: "👥",
    title: "Kelompok Tani",
    desc: "Kelola data anggota, lahan, dan hasil panen bersama dalam satu platform.",
    color: "bg-cyan-50 border-cyan-200 text-cyan-800",
  },
  {
    icon: "🏢",
    title: "Gapoktan",
    desc: "Monitoring gabungan kelompok tani, laporan agregat, dan distribusi bantuan.",
    color: "bg-teal-50 border-teal-200 text-teal-800",
  },
  {
    icon: "🏛️",
    title: "Dinas Pertanian",
    desc: "Data statistik pertanian daerah yang akurat untuk kebijakan & program.",
    color: "bg-indigo-50 border-indigo-200 text-indigo-800",
  },
  {
    icon: "🇮🇩",
    title: "Kementan / Pemerintah",
    desc: "Visualisasi data pertanian nasional, laporan real-time, & monitoring program.",
    color: "bg-red-50 border-red-200 text-red-800",
  },
  {
    icon: "🏭",
    title: "Pemilik Gudang",
    desc: "Kelola stok gabah/komoditas masuk-keluar, lacak asal & kualitas.",
    color: "bg-orange-50 border-orange-200 text-orange-800",
  },
  {
    icon: "🚚",
    title: "Distributor Pertanian",
    desc: "Catat distribusi pupuk, benih, & hasil panen ke berbagai tujuan.",
    color: "bg-purple-50 border-purple-200 text-purple-800",
  },
  {
    icon: "📊",
    title: "Koperasi Tani",
    desc: "Kelola simpan pinjam, penjualan, dan data anggota secara digital.",
    color: "bg-yellow-50 border-yellow-200 text-yellow-800",
  },
  {
    icon: "🎓",
    title: "Penyuluh Pertanian",
    desc: "Pendampingan petani dengan data akurat & riwayat panen terukur.",
    color: "bg-lime-50 border-lime-200 text-lime-800",
  },
  {
    icon: "📈",
    title: "Investor / Stakeholder",
    desc: "Pantau performa sektor pertanian untuk keputusan investasi.",
    color: "bg-sky-50 border-sky-200 text-sky-800",
  },
];

const FAQ = [
  {
    q: "Apakah Harvestan gratis?",
    a: "Ya, Harvestan bisa digunakan gratis dengan fitur dan akses terbatas. Anda bisa upgrade ke paket premium untuk membuka fitur tambahan seperti multi-user, notifikasi WhatsApp, dan penyimpanan data yang lebih besar.",
  },
  {
    q: "Bagaimana cara export data saya?",
    a: "Buka menu Export di sidebar. Ada 3 opsi: Download Backup (untuk import ulang), Download Laporan Excel (untuk dibaca di Excel), dan Download PDF per Penggarap. Semua data 100% milik Anda.",
  },
  {
    q: "Apakah bisa dipakai di HP?",
    a: "Ya! Harvestan didesain responsif untuk HP, tablet, dan desktop. Bisa juga di-install sebagai aplikasi (PWA) — buka di Chrome, tunggu 3 detik, akan muncul banner install.",
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
  {
    q: "Apakah Harvestan bisa dipakai untuk komoditas selain padi?",
    a: "Bisa! Harvestan mendukung multi-komoditas: padi, jagung, kacang tanah, bawang merah, dan cabai rawit. Setiap komoditas dihitung produktivitasnya terpisah.",
  },
  {
    q: "Ada komunitas untuk diskusi?",
    a: "Ada! Kami punya Discord community untuk diskusi, tanya jawab, share tips pertanian, kelas edukasi gratis, marketplace, webinar, dan info harga komoditas. Join gratis lewat tombol di bawah.",
  },
];

const SOSIAL_MEDIA = [
  {
    name: "Instagram",
    handle: "@harvestan.id",
    url: "https://instagram.com/harvestan.id",
    color: "from-pink-500 to-purple-500",
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
    color: "from-gray-900 to-black",
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
    color: "from-blue-600 to-blue-800",
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
    color: "from-gray-800 to-black",
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
  { icon: "🌶️", text: "Pembahasan Berbagai Komoditas" },
  { icon: "📚", text: "Kelas Edukasi Gratis" },
  { icon: "🛒", text: "Marketplace Jual-Beli P2P" },
  { icon: "🎥", text: "Webinar & Gathering" },
  { icon: "💰", text: "Info Harga Komoditas Daerah" },
  { icon: "🔗", text: "Terintegrasi dengan Web Harvestan" },
];

// ===================================================
// KOMPONEN
// ===================================================
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-0 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Harvestan"
              className="h-20 md:h-24 w-auto"
            />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm text-gray-700 hover:text-green-800 font-medium px-3 py-2 transition"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="bg-gradient-to-b from-green-50 via-white to-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-1.5 rounded-full text-xs font-medium mb-6">
            🇮🇩 Dibuat untuk petani Indonesia
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto">
            Kelola Lahan Pertanian Anda{" "}
            <span className="text-green-700">dengan Lebih Cerdas</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mt-6 max-w-2xl mx-auto leading-relaxed">
            Catat penggarap, lahan, panen, hutang, dan bagi hasil dalam satu
            aplikasi. Tidak perlu Excel atau buku tulis lagi.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mt-10">
            <Link
              href="/register"
              className="bg-green-700 hover:bg-green-800 text-white font-bold px-8 py-4 rounded-xl transition text-base shadow-lg hover:shadow-xl"
            >
              🚀 Mulai Gratis Sekarang
            </Link>
            <a
              href="#fitur"
              className="bg-white hover:bg-gray-50 text-gray-800 font-medium px-8 py-4 rounded-xl transition border border-gray-300"
            >
              📖 Lihat Fitur
            </a>
          </div>

          <div className="flex flex-wrap gap-6 justify-center mt-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Tanpa kartu kredit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Gratis selamanya</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Data milik Anda</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATISTIK COUNTER ===== */}
      <section className="py-16 bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Dipercaya oleh Petani Indonesia
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-400">
                100%
              </div>
              <div className="text-sm opacity-90 mt-2">Data Aman</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-400">
                Gratis
              </div>
              <div className="text-sm opacity-90 mt-2">Selamanya</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-400">
                24/7
              </div>
              <div className="text-sm opacity-90 mt-2">Akses Kapan Saja</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-400">
                🇮🇩
              </div>
              <div className="text-sm opacity-90 mt-2">Buatan Lokal</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FITUR ===== */}
      <section id="fitur" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ✨ Semua yang Anda Butuhkan
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Dari penggarap sampai laporan PDF — semuanya ada di satu
              aplikasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FITUR.map((f, i) => (
              <div
                key={i}
                className={`${f.color} border-2 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition relative`}
              >
                {f.badge && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full shadow-md">
                    {f.badge}
                  </span>
                )}
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COCOK UNTUK ===== */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              👥 Cocok Untuk
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Harvestan dirancang untuk siapa saja yang bergerak di sektor
              pertanian Indonesia — dari petani individu sampai instansi
              pemerintah.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COCOK_UNTUK.map((item, i) => (
              <div
                key={i}
                className={`${item.color} border-2 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl flex-shrink-0">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base mb-1">{item.title}</h3>
                    <p className="text-xs opacity-90 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <div className="inline-block bg-green-50 border-2 border-green-200 rounded-2xl px-6 py-4 text-sm text-green-800">
              💡 <strong>Punya profesi lain?</strong> Harvestan bisa
              dikustomisasi sesuai kebutuhan Anda. Sampaikan di{" "}
              <a
                href="https://discord.gg/v8RZbADBM"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold"
              >
                Discord
              </a>{" "}
              atau{" "}
              <a href="/feedback" className="underline font-bold">
                kirim feedback
              </a>
              .
            </div>
          </div>
        </div>
      </section>

      {/* ===== KENAPA HARVESTAN (PEMBANDING) ===== */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🆚 Kenapa Pilih Harvestan?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Bandingkan cara lama vs cara baru dengan Harvestan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARA LAMA */}
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-red-200 rounded-xl flex items-center justify-center text-2xl">
                  ❌
                </div>
                <div>
                  <div className="font-bold text-red-900 text-lg">Cara Lama</div>
                  <div className="text-xs text-red-700">
                    Buku tulis & Excel manual
                  </div>
                </div>
              </div>
              <ul className="space-y-3">
                {PEMBANDING.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                    <span className="text-red-500 mt-0.5 flex-shrink-0">✗</span>
                    <span>{p.lama}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CARA BARU */}
            <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center text-2xl">
                  ✅
                </div>
                <div>
                  <div className="font-bold text-green-900 text-lg">
                    Dengan Harvestan
                  </div>
                  <div className="text-xs text-green-700">
                    Digital, otomatis, cloud
                  </div>
                </div>
              </div>
              <ul className="space-y-3">
                {PEMBANDING.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-green-800"
                  >
                    <span className="text-green-600 mt-0.5 flex-shrink-0">
                      ✓
                    </span>
                    <span className="font-medium">{p.baru}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CARA KERJA ===== */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🚀 Cara Kerja
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Mulai dalam 4 langkah mudah
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CARA_KERJA.map((step) => (
              <div key={step.no} className="text-center relative">
                <div className="w-16 h-16 mx-auto bg-green-700 text-white rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg mb-4">
                  {step.icon}
                </div>
                <div className="absolute top-2 left-1/2 ml-8 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                  {step.no}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KOMUNITAS DISCORD (warna Discord resmi) ===== */}
      <section className="py-16 md:py-24 bg-[#5865F2] text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur px-5 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Komunitas Resmi Harvestan
            </div>

            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              🎉 Bergabung dengan Komunitas Harvestan
            </h2>
            <p className="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
              Tempat berkumpulnya petani Indonesia untuk belajar, berbagi
              pengalaman, dan tumbuh bersama. <strong>100% Gratis!</strong>
            </p>
          </div>

          {/* Fitur Discord */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {DISCORD_FITUR.map((f, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur rounded-xl p-3 text-center border border-white/20 hover:bg-white/20 transition"
              >
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="text-xs font-medium">{f.text}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <a
              href="https://discord.gg/v8RZbADBM"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white hover:bg-gray-100 text-[#5865F2] font-bold px-10 py-4 rounded-xl transition text-lg shadow-2xl hover:shadow-3xl"
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
              </svg>
              🎮 Join Discord Server
            </a>
            <p className="text-xs text-white/70 mt-4">
              Gratis selamanya • Tidak butuh undangan
            </p>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ❓ Pertanyaan Umum
            </h2>
            <p className="text-gray-600">
              Jawaban untuk pertanyaan yang sering ditanyakan
            </p>
          </div>

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <details
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-5 group cursor-pointer hover:border-green-300 transition"
              >
                <summary className="font-bold text-gray-900 flex items-center justify-between list-none gap-3">
                  <span>{item.q}</span>
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
        </div>
      </section>

      {/* ===== SOSIAL MEDIA ===== */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              📱 Ikuti Kami
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Dapatkan update fitur terbaru, tips pertanian, dan info menarik
              lainnya
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SOSIAL_MEDIA.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white border-2 border-gray-200 hover:border-green-400 rounded-2xl p-5 text-center transition hover:shadow-lg hover:-translate-y-1"
              >
                <div
                  className={`w-14 h-14 mx-auto bg-gradient-to-br ${s.color} rounded-2xl flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition`}
                >
                  {s.icon}
                </div>
                <div className="font-bold text-gray-900 text-sm mb-1">
                  {s.name}
                </div>
                <div className="text-xs text-gray-500">{s.handle}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA AKHIR ===== */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-3xl p-10 md:p-16">
            <div className="flex justify-center mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon.png"
                alt="Harvestan"
                className="w-32 h-32 md:w-40 md:h-40 object-contain"
              />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Siap Kelola Lahan Pertanian Lebih Baik?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Bergabung dengan petani Indonesia yang sudah beralih dari buku
              tulis ke digital. Gratis, cepat, dan mudah.
            </p>
            <Link
              href="/register"
              className="inline-block bg-green-700 hover:bg-green-800 text-white font-bold px-10 py-4 rounded-xl transition text-lg shadow-lg hover:shadow-xl"
            >
              🚀 Daftar Sekarang — Gratis
            </Link>
            <p className="text-xs text-gray-500 mt-4">
              Tidak perlu kartu kredit • Setup 30 detik
            </p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Harvestan"
                className="h-16 md:h-20 w-auto brightness-0 invert opacity-90"
              />
            </div>

            {/* Sosial Media di Footer */}
            <div className="flex items-center gap-3">
              {SOSIAL_MEDIA.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition"
                  title={s.name}
                >
                  <div className="scale-75">{s.icon}</div>
                </a>
              ))}
              <a
                href="https://discord.gg/v8RZbADBM"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-[#5865F2] flex items-center justify-center text-gray-400 hover:text-white transition"
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

          <div className="mt-8 pt-6 border-t border-gray-800 text-xs text-center md:text-left md:flex md:justify-between md:items-center gap-4">
            <p>© 2026 Harvestan. Dibuat dengan ❤️ di Indonesia 🇮🇩</p>
            <p className="mt-2 md:mt-0 text-gray-500">
              Sistem Manajemen Pertanian Modern
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
