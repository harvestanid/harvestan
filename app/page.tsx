import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-3xl">🌾</span>
              <span className="text-xl font-bold text-green-800">Harvestan</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-600 hover:text-green-700 transition">
                Fitur
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-green-700 transition">
                Harga
              </Link>
              <Link href="/news" className="text-gray-600 hover:text-green-700 transition">
                Berita
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-green-700 transition">
                Masuk
              </Link>
              <Link
                href="/register"
                className="bg-green-700 text-white px-5 py-2 rounded-full hover:bg-green-800 transition font-medium"
              >
                Daftar Gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-medium mb-6">
            🌱 Platform Manajemen Pertanian #1 di Indonesia
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Kelola Lahan & Bagi Hasil
            <br />
            <span className="text-green-700">Tanpa Ribet, Tanpa Buku</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Harvestan membantu pemilik lahan, penggarap, dan kelompok tani mengelola
            panen, hutang, dan bagi hasil secara digital. Cocok untuk padi, jagung,
            kacang tanah, bawang merah, dan cabai rawit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-green-700 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-800 transition shadow-lg shadow-green-200"
            >
              Mulai Gratis Sekarang →
            </Link>
            <Link
              href="#features"
              className="bg-white text-green-700 border-2 border-green-700 px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-50 transition"
            >
              Lihat Fitur
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            ✅ Tanpa kartu kredit &nbsp; ✅ Setup 2 menit &nbsp; ✅ Bahasa Indonesia
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Semua yang Anda Butuhkan untuk Kelola Lahan
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Dari catat panen, hitung bagi hasil, sampai laporan otomatis — semua dalam satu aplikasi.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🌾",
                title: "Multi-Komoditas",
                desc: "Padi, jagung, kacang tanah, bawang merah, cabai rawit — semua didukung.",
              },
              {
                icon: "💰",
                title: "Bagi Hasil Otomatis",
                desc: "Skema 50:50, 60:40, custom — hitung profit owner & penggarap otomatis.",
              },
              {
                icon: "📊",
                title: "Laporan PDF & Excel",
                desc: "Generate invoice, laporan tahunan, dan export Excel dalam 1 klik.",
              },
              {
                icon: "👥",
                title: "Multi-Penggarap",
                desc: "Kelola banyak penggarap & lahan sekaligus. Data terpisah per pengguna.",
              },
              {
                icon: "📉",
                title: "Manajemen Hutang",
                desc: "Catat hutang penggarap & potong otomatis dari hasil panen.",
              },
              {
                icon: "📱",
                title: "Akses dari HP",
                desc: "Bisa diakses dari mana saja, install seperti aplikasi (PWA).",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-8 bg-green-50 rounded-2xl border border-green-100 hover:shadow-lg transition"
              >
                <div className="text-5xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Harga Sederhana, Transparan
            </h2>
            <p className="text-gray-600">Mulai gratis, upgrade kapan saja.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Gratis",
                price: "Rp 0",
                period: "/selamanya",
                features: ["1 lahan", "10x input panen", "Dashboard dasar"],
                cta: "Mulai Gratis",
                highlight: false,
              },
              {
                name: "Petani",
                price: "Rp 29rb",
                period: "/bulan",
                features: [
                  "5 lahan",
                  "Unlimited panen",
                  "Export Excel & PDF",
                  "Laporan keuangan",
                ],
                cta: "Coba 14 Hari",
                highlight: true,
              },
              {
                name: "Kelompok",
                price: "Rp 149rb",
                period: "/bulan",
                features: [
                  "50 lahan",
                  "Multi-user",
                  "GPS ukur lahan",
                  "Support prioritas",
                ],
                cta: "Hubungi Kami",
                highlight: false,
              },
            ].map((p, i) => (
              <div
                key={i}
                className={`p-8 rounded-2xl ${
                  p.highlight
                    ? "bg-green-700 text-white shadow-2xl md:scale-105"
                    : "bg-white border border-gray-200"
                }`}
              >
                {p.highlight && (
                  <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                    PALING POPULER
                  </span>
                )}
                <h3
                  className={`text-2xl font-bold mt-4 ${
                    p.highlight ? "text-white" : "text-gray-900"
                  }`}
                >
                  {p.name}
                </h3>
                <div className="my-6">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span
                    className={p.highlight ? "text-green-100" : "text-gray-500"}
                  >
                    {p.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <span
                        className={
                          p.highlight ? "text-yellow-400" : "text-green-600"
                        }
                      >
                        ✓
                      </span>
                      <span
                        className={p.highlight ? "text-green-50" : "text-gray-600"}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-full font-semibold transition ${
                    p.highlight
                      ? "bg-white text-green-700 hover:bg-gray-100"
                      : "bg-green-700 text-white hover:bg-green-800"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-green-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Siap Digitalkan Pertanian Anda?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Bergabung dengan petani Indonesia yang sudah beralih ke Harvestan.
          </p>
          <Link
            href="/register"
            className="inline-block bg-yellow-400 text-gray-900 px-10 py-4 rounded-full text-lg font-bold hover:bg-yellow-300 transition shadow-lg"
          >
            Daftar Gratis Sekarang →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🌾</span>
              <span className="text-xl font-bold text-white">Harvestan</span>
            </div>
            <p className="text-sm">© 2025 Harvestan. Dibuat dengan ❤️ di Indonesia.</p>
            <div className="flex gap-6 text-sm">
              <Link href="/about" className="hover:text-white transition">
                Tentang
              </Link>
              <Link href="/news" className="hover:text-white transition">
                Berita
              </Link>
              <Link href="/privacy" className="hover:text-white transition">
                Privasi
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
