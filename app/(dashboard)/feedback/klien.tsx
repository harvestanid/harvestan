"use client";

import { useState } from "react";

type Props = {
  sudahKirim: boolean;
  tanggalKirim: string | null;
  ratingTerakhir: number | null;
};

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

function hitungSisaHari(tanggalKirim: string): number {
  const kirim = new Date(tanggalKirim).getTime();
  const batas = kirim + 7 * 24 * 60 * 60 * 1000;
  const sisa = Math.ceil((batas - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, sisa);
}

export function FeedbackKlien({
  sudahKirim,
  tanggalKirim,
  ratingTerakhir,
}: Props) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [saranFitur, setSaranFitur] = useState("");
  const [masukan, setMasukan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState(false);

  if (sudahKirim && tanggalKirim && !sukses) {
    const sisaHari = hitungSisaHari(tanggalKirim);
    return (
      <div className="space-y-5">
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 text-center">
          <div className="text-5xl mb-3">✅</div>
          <h2 className="text-xl font-bold text-green-900 mb-2">
            Terima Kasih!
          </h2>
          <p className="text-sm text-green-800 mb-4">
            Masukan Anda sangat berharga untuk pengembangan Harvestan.
          </p>

          <div className="bg-white rounded-xl p-4 border border-green-200 inline-block">
            <div className="text-2xl mb-1">
              {"⭐".repeat(ratingTerakhir || 0)}
              {"☆".repeat(5 - (ratingTerakhir || 0))}
            </div>
            <p className="text-xs text-gray-600">
              Rating terakhir: {ratingTerakhir}/5
            </p>
            <p className="text-[10px] text-gray-500 mt-1">
              Dikirim: {formatTanggal(tanggalKirim)}
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <div className="font-bold mb-1">⏰ Feedback Berikutnya</div>
          <p className="text-xs leading-relaxed">
            Anda bisa mengirim feedback lagi dalam <strong>{sisaHari} hari</strong>.
            Kami batasi 1x per minggu agar feedback yang masuk lebih berkualitas.
          </p>
        </div>
      </div>
    );
  }

  if (sukses) {
    return (
      <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-green-900 mb-3">
          Masukan Terkirim!
        </h2>
        <p className="text-sm text-green-800 mb-6 leading-relaxed">
          Terima kasih sudah meluangkan waktu.
          <br />
          Masukan Anda akan sangat membantu kami meningkatkan Harvestan. 🌾
        </p>
        <div className="inline-block bg-white rounded-xl px-6 py-3 border border-green-200">
          <div className="text-xl">
            {"⭐".repeat(rating)}
            {"☆".repeat(5 - rating)}
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (rating < 1) {
      setError("Silakan beri rating bintang terlebih dahulu");
      return;
    }
    if (!saranFitur.trim() && !masukan.trim()) {
      setError("Isi minimal salah satu: saran fitur atau masukan");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          saran_fitur: saranFitur.trim() || null,
          masukan: masukan.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Gagal kirim feedback");
        setLoading(false);
        return;
      }

      setSukses(true);
    } catch (err: any) {
      setError("Gagal kirim: " + (err.message || "Unknown"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
          ❌ {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          ⭐ Rating Layanan <span className="text-red-500">*</span>
        </label>
        <div className="flex justify-center gap-2 mb-3">
          {[1, 2, 3, 4, 5].map((bintang) => {
            const aktif = (hoverRating || rating) >= bintang;
            return (
              <button
                key={bintang}
                type="button"
                onClick={() => setRating(bintang)}
                onMouseEnter={() => setHoverRating(bintang)}
                onMouseLeave={() => setHoverRating(0)}
                className={`text-4xl md:text-5xl transition-transform hover:scale-125 ${
                  aktif ? "text-yellow-400" : "text-gray-300"
                }`}
                aria-label={`${bintang} bintang`}
              >
                ★
              </button>
            );
          })}
        </div>
        <p className="text-center text-sm text-gray-600">
          {rating === 0 && "Klik bintang untuk menilai"}
          {rating === 1 && "😞 Sangat Kurang"}
          {rating === 2 && "😐 Kurang"}
          {rating === 3 && "🙂 Cukup"}
          {rating === 4 && "😊 Bagus"}
          {rating === 5 && "🤩 Sangat Bagus"}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <label className="block text-sm font-bold text-gray-900 mb-2">
          💡 Saran Fitur
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Fitur apa yang Anda inginkan di Harvestan?
        </p>
        <textarea
          value={saranFitur}
          onChange={(e) => setSaranFitur(e.target.value)}
          placeholder="Contoh: Fitur notifikasi WhatsApp saat hutang jatuh tempo..."
          maxLength={500}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm resize-none"
        />
        <p className="text-[10px] text-gray-400 mt-1 text-right">
          {saranFitur.length}/500
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <label className="block text-sm font-bold text-gray-900 mb-2">
          💬 Masukan / Kritik
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Ada keluhan, bug, atau saran perbaikan?
        </p>
        <textarea
          value={masukan}
          onChange={(e) => setMasukan(e.target.value)}
          placeholder="Contoh: Tombol export kadang error kalau data banyak..."
          maxLength={500}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm resize-none"
        />
        <p className="text-[10px] text-gray-400 mt-1 text-right">
          {masukan.length}/500
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🔒</span>
          <div className="text-xs text-blue-800 leading-relaxed">
            <strong>100% Anonymous.</strong> Feedback dikirim tanpa nama,
            email, atau identitas Anda. Kami hanya menyimpan rating & isi
            masukan untuk keperluan pengembangan.
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-base"
      >
        {loading ? "⏳ Mengirim..." : "📤 Kirim Masukan"}
      </button>
    </form>
  );
}
