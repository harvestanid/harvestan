"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  isActive: boolean;
  daysRemaining: number | null;
  expiresAt: string | null;
  canStart: boolean;
  canRestart: boolean;
  message?: string;
};

export function DemoKlien({
  isActive,
  daysRemaining,
  expiresAt,
  canStart,
  canRestart,
  message,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showConfirmStop, setShowConfirmStop] = useState(false);

  async function handleStart() {
    setLoading("start");
    try {
      const res = await fetch("/api/demo/start", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal memulai demo"));
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Gagal memulai demo"));
    } finally {
      setLoading(null);
    }
  }

  async function handleStop() {
    setLoading("stop");
    try {
      const res = await fetch("/api/demo/stop", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal menghentikan demo"));
        return;
      }

      setShowConfirmStop(false);
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Gagal menghentikan demo"));
    } finally {
      setLoading(null);
    }
  }

  async function handleRestart() {
    setLoading("restart");
    try {
      const res = await fetch("/api/demo/restart", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal restart demo"));
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Gagal restart demo"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      {/* ========== HERO ========== */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl">
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold mb-5 border border-white/30">
          🎬 MODE DEMO
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          Lihat Harvestan dalam Aksi
        </h1>
        <p className="text-base md:text-lg text-white/95 max-w-2xl mx-auto leading-relaxed">
          Data contoh dari <strong>petani sukses 10 tahun</strong>{" "}
          (2016-2025). Lihat data, grafik, laporan, dan export — tanpa perlu
          input apa pun.
        </p>
      </div>

      {/* ========== STATUS DEMO AKTIF ========== */}
      {isActive && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="text-5xl flex-shrink-0">🎬</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-green-900 text-lg mb-1">
                Demo Sedang Aktif
              </div>
              <p className="text-sm text-green-800 leading-relaxed mb-3">
                Anda sedang melihat data contoh. Data asli Anda tidak
                terpengaruh dan tetap aman.
              </p>

              {daysRemaining !== null && (
                <div className="inline-flex items-center gap-2 bg-white border border-green-300 rounded-full px-4 py-1.5 text-xs font-bold text-green-800 mb-4">
                  ⏱️ Demo berakhir dalam <strong>{daysRemaining} hari</strong>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/dashboard"
                  className="bg-green-700 hover:bg-green-800 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm shadow-md"
                >
                  🚀 Lanjut Lihat Demo
                </Link>
                <button
                  onClick={() => setShowConfirmStop(true)}
                  disabled={loading !== null}
                  className="bg-white hover:bg-gray-50 text-red-700 border-2 border-red-300 font-bold px-5 py-2.5 rounded-xl transition text-sm disabled:opacity-50"
                >
                  ✅ Selesai Demo
                </button>
                {canRestart && (
                  <button
                    onClick={handleRestart}
                    disabled={loading !== null}
                    className="bg-white hover:bg-gray-50 text-blue-700 border-2 border-blue-300 font-bold px-5 py-2.5 rounded-xl transition text-sm disabled:opacity-50"
                  >
                    {loading === "restart" ? "⏳..." : "🔄 Restart Demo"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== TENTANG MODE DEMO ========== */}
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl flex-shrink-0">💡</div>
          <div className="flex-1">
            <div className="font-bold text-yellow-900 text-base mb-2">
              Tentang Mode Demo
            </div>
            <ul className="text-sm text-yellow-800 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">✅</span>
                <span>
                  Data contoh <strong>realistis</strong> dari petani
                  Indonesia 10 tahun (2016-2025)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">✅</span>
                <span>
                  <strong>Lihat data, grafik, laporan</strong> — pengalaman
                  persis seperti akun berbayar
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">✅</span>
                <span>
                  <strong>Data asli Anda tetap aman</strong> — demo tidak
                  mencampuri data Anda
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">⚠️</span>
                <span>
                  <strong>Tidak bisa input baru</strong> saat demo aktif —
                  klik "Selesai Demo" dulu untuk kembali input data
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">⚠️</span>
                <span>
                  Fitur <strong>Gabah, Panen Multi, Ukur Lahan, dan
                  Kalkulator Pupuk</strong> tidak tersedia di demo
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">✅</span>
                <span>
                  Data demo <strong>dihapus otomatis</strong> setelah Anda
                  klik "Selesai Demo" atau setelah 7 hari
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ========== YANG BISA DILAKUKAN ========== */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="font-bold text-gray-900 text-base mb-4">
          🎯 Yang Bisa Anda Lakukan di Demo
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-bold text-blue-900 text-sm mb-1">
              Dashboard Lengkap
            </div>
            <p className="text-xs text-blue-800">
              Statistik 470+ panen, top 5 penggarap, komposisi komoditas
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="text-2xl mb-2">📈</div>
            <div className="font-bold text-purple-900 text-sm mb-1">
              Grafik 10 Tahun
            </div>
            <p className="text-xs text-purple-800">
              Produksi, produktivitas, & tren harga per komoditas
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="text-2xl mb-2">💰</div>
            <div className="font-bold text-green-900 text-sm mb-1">
              Keuangan Detail
            </div>
            <p className="text-xs text-green-800">
              Profit owner & penggarap, filter tahun & musim cabai
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="text-2xl mb-2">📄</div>
            <div className="font-bold text-orange-900 text-sm mb-1">
              Laporan PDF
            </div>
            <p className="text-xs text-orange-800">
              Laporan Tahunan & 5 Tahunan — export PDF dengan watermark DEMO
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="text-2xl mb-2">🏆</div>
            <div className="font-bold text-yellow-900 text-sm mb-1">
              Leaderboard
            </div>
            <p className="text-xs text-yellow-800">
              8 penggarap dengan performa berbeda, kategori produktivitas
            </p>
          </div>

          <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
            <div className="text-2xl mb-2">📥</div>
            <div className="font-bold text-cyan-900 text-sm mb-1">
              Export Excel & Backup
            </div>
            <p className="text-xs text-cyan-800">
              Download data demo dalam format Excel atau backup JSON
            </p>
          </div>

          <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
            <div className="text-2xl mb-2">📋</div>
            <div className="font-bold text-pink-900 text-sm mb-1">
              Log Tanam
            </div>
            <p className="text-xs text-pink-800">
              Riwayat kegiatan pertanian per lahan, per musim tanam
            </p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="text-2xl mb-2">🛒</div>
            <div className="font-bold text-indigo-900 text-sm mb-1">
              Toko Harvestan
            </div>
            <p className="text-xs text-indigo-800">
              Lihat katalog produk pertanian, alat & mesin, furniture
            </p>
          </div>
        </div>

        {/* INFO STRICT PREMIUM */}
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="font-bold text-red-900 text-xs mb-2">
            🔒 Fitur yang TIDAK tersedia di Demo:
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-white border border-red-200 text-red-800 px-3 py-1 rounded-full font-medium">
              ⚖️ Penimbangan Gabah
            </span>
            <span className="bg-white border border-red-200 text-red-800 px-3 py-1 rounded-full font-medium">
              🌾 Panen Multi
            </span>
            <span className="bg-white border border-red-200 text-red-800 px-3 py-1 rounded-full font-medium">
              📍 Ukur Lahan
            </span>
            <span className="bg-white border border-red-200 text-red-800 px-3 py-1 rounded-full font-medium">
              🧪 Kalkulator Pupuk
            </span>
          </div>
          <p className="text-[10px] text-red-700 mt-2 italic">
            Fitur-fitur ini butuh input data aktif & perhitungan khusus —
            hanya tersedia untuk pengguna Premium.
          </p>
        </div>
      </div>

      {/* ========== PREMIUM GRATIS ========== */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">🎁</div>
          <div className="font-bold text-xl md:text-2xl mb-2">
            Ingin Premium Gratis 1 Tahun?
          </div>
          <p className="text-sm text-white/95 max-w-lg mx-auto">
            Dapatkan akses Premium GRATIS dengan bantu promosikan Harvestan ke
            petani Indonesia!
          </p>
        </div>

        <div className="bg-white/15 backdrop-blur rounded-xl p-4 mb-4">
          <div className="font-bold text-sm mb-3">📋 Cara Mendapatkan:</div>
          <ol className="text-xs space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="bg-white text-purple-700 font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-[10px]">
                1
              </span>
              <span>
                Follow sosial media kami:{" "}
                <strong>IG @harvestan.id, TikTok @harvestan.id, FB Harvestan
                Id, X @harvestan_id</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-white text-purple-700 font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-[10px]">
                2
              </span>
              <span>
                Post foto/video tentang Harvestan di IG atau TikTok, tag{" "}
                <strong>@harvestan.id</strong> + hashtag{" "}
                <strong>#HarvestanIndonesia</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-white text-purple-700 font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-[10px]">
                3
              </span>
              <span>
                Kumpulkan minimal <strong>50 LIKE</strong> di postingan Anda
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-white text-purple-700 font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-[10px]">
                4
              </span>
              <span>
                Screenshot postingan (harus terlihat jumlah like) & upload di
                halaman ini
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-white text-purple-700 font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-[10px]">
                5
              </span>
              <span>
                Tim kami verifikasi dalam 1×24 jam → premium aktif otomatis
              </span>
            </li>
          </ol>
        </div>

        <Link
          href="/premium-gratis"
          className="block w-full bg-white text-purple-700 hover:bg-gray-50 font-bold text-center py-3 rounded-xl transition shadow-lg"
        >
          🎁 Ajukan Premium Gratis
        </Link>
        <p className="text-[10px] text-center text-white/80 mt-3 italic">
          💡 Sudah ikut syarat? Klik tombol di atas untuk upload bukti
        </p>
      </div>

      {/* ========== CTA START DEMO ========== */}
      {!isActive && canStart && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🎬</div>
          <div className="font-bold text-gray-900 text-xl md:text-2xl mb-3">
            Siap Lihat Demo?
          </div>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
            Mulai demo sekarang dan lihat data 470+ panen 10 tahun, grafik,
            laporan, dan export — gratis, tanpa perlu input.
          </p>
          <button
            onClick={handleStart}
            disabled={loading !== null}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold px-10 py-4 rounded-2xl transition shadow-xl hover:shadow-2xl text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "start" ? "⏳ Memulai Demo..." : "▶️ Mulai Demo Sekarang"}
          </button>
          <p className="text-[10px] text-gray-500 mt-4 italic">
            ⏱️ Demo aktif 7 hari · Bisa di-restart setelah 24 jam · Bisa
            dihentikan kapan saja
          </p>
        </div>
      )}

      {/* ========== MESSAGE ========== */}
      {message && !isActive && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 text-center">
          ℹ️ {message}
        </div>
      )}

      {/* ========== CONFIRM MODAL ========== */}
      {showConfirmStop && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowConfirmStop(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 text-center">
              <div className="text-5xl mb-3">🎬</div>
              <h2 className="text-xl font-bold mb-1">Selesai Demo?</h2>
              <p className="text-sm text-white/90">Data demo akan dihapus</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <strong>Yang akan terjadi:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                  <li>
                    Semua data demo <strong>dihapus permanen</strong>
                  </li>
                  <li>Anda kembali ke data real Anda</li>
                  <li>Fitur premium kembali terkunci</li>
                  <li>Bisa mulai demo lagi kapan saja</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmStop(false)}
                  disabled={loading !== null}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleStop}
                  disabled={loading !== null}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {loading === "stop" ? "⏳..." : "✅ Selesai Demo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
