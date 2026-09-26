import Link from "next/link";

const FITUR = [
  {
    icon: "👨‍🌾",
    title: "Manajemen Penggarap",
    desc: "Kelola data penggarap, kontak, alamat, dan riwayat kinerja dalam satu tempat.",
    color: "bg-green-50 border-green-200",
  },
  {
    icon: "🗺️",
    title: "Peta Lahan + GPS",
    desc: "Catat lokasi setiap lahan dengan koordinat GPS. Klik langsung ke Google Maps.",
    color: "bg-blue-50 border-blue-200",
  },
  {
    icon: "🌾",
    title: "Catat Panen Otomatis",
    desc: "Input hasil panen — profit owner & penggarap dihitung otomatis sesuai skema bagi hasil.",
    color: "bg-yellow-50 border-yellow-200",
  },
  {
    icon: "💰",
    title: "Potong Hutang Otomatis",
    desc: "Hutang penggarap otomatis dipotong dari profit panen. Tidak perlu hitung manual.",
    color: "bg-red-50 border-red-200",
  },
  {
    icon: "📊",
    title: "Dashboard & Keuangan",
    desc: "Lihat ringkasan profit, produksi bulanan, dan top penggarap dalam sekejap.",
    color: "bg-purple-50 border-purple-200",
  },
  {
    icon: "📄",
    title: "Export Excel & PDF",
    desc: "Download laporan lengkap ke Excel atau PDF. Siap cetak & kirim WhatsApp.",
    color: "bg-orange-50 border-orange-200",
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

const FAQ = [
  {
    q: "Apakah Harvestan gratis?",
    a: "Ya! Harvestan bisa digunakan gratis. Anda bisa upgrade ke paket premium untuk fitur tambahan seperti multi-user dan notifikasi WhatsApp.",
  },
  {
    q: "Bisakah saya export data saya?",
    a: "Tentu! Semua data Anda bisa di-export ke Excel (4 sheet) dan PDF (laporan per penggarap). Data 100% milik Anda.",
  },
  {
    q: "Apakah bisa dipakai di HP?",
    a: "Ya! Harvestan didesain responsif untuk HP, tablet, dan desktop. Bisa juga di-install sebagai aplikasi (PWA).",
  },
  {
    q: "Bagaimana dengan keamanan data saya?",
    a: "Data Anda dienkripsi dan disimpan dengan aman di Supabase (PostgreSQL). Setiap akun hanya bisa mengakses data miliknya sendiri.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <span className="font-bold text-green-800 text-lg">Harvestan</span>
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
            Kelola Kebun Anda{" "}
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
                className={`${f.color} border-2 rounded-2xl p-6 hover:shadow-lg transition`}
              >
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

      {/* ===== STATISTIK (PLACEHOLDER) ===== */}
      <section className="py-16 bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Dipercaya oleh Petani Indonesia
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-4xl font-bold text-yellow-400">100%</div>
              <div className="text-sm opacity-90 mt-1">Data Aman</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400">Gratis</div>
              <div className="text-sm opacity-90 mt-1">Selamanya</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400">24/7</div>
              <div className="text-sm opacity-90 mt-1">Akses Kapan Saja</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400">🇮🇩</div>
              <div className="text-sm opacity-90 mt-1">Buatan Lokal</div>
            </div>
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
          </div>

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <details
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-5 group cursor-pointer"
              >
                <summary className="font-bold text-gray-900 flex items-center justify-between list-none">
                  <span>{item.q}</span>
                  <span className="text-green-700 text-xl group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA AKHIR ===== */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-3xl p-10 md:p-16">
            <div className="text-6xl mb-6">🌾</div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Siap Kelola Kebun Lebih Baik?
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌾</span>
              <span className="font-bold text-white text-lg">Harvestan</span>
            </div>
            <div className="text-xs text-center md:text-right">
              <p>© 2026 Harvestan. Dibuat dengan ❤️ di Indonesia 🇮🇩</p>
              <p className="mt-1 opacity-75">
                Sistem Manajemen Pertanian Modern
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
