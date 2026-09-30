"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import PostcardPanen, {
  type PostcardData,
  type PostcardStyle,
  LANDING_URL,
} from "./postcard-panen";

type Props = {
  open: boolean;
  onClose: () => void;
  data: {
    komoditas: string;
    komoditasLabel: string;
    hasilKg: number;
    luasHa: number;
    produktivitas: number;
    hargaJual: number;
    tanggal: string;
    namaPenggarap?: string | null;
    namaLahan?: string | null;
    profitOwner?: number | null;
    profitPenggarap?: number | null;
    polygon?: { type: "Polygon"; coordinates: number[][][] } | null;
    koordinat?: string | null;
  };
};

const STYLES: {
  id: PostcardStyle;
  label: string;
  emoji: string;
  desc: string;
}[] = [
  { id: "harvestanPro", label: "Harvestan Pro", emoji: "🌿", desc: "Bold hijau" },
  { id: "editorialCream", label: "Editorial", emoji: "📜", desc: "Serif kertas" },
  { id: "boldPop", label: "Bold Pop", emoji: "🎨", desc: "Poster warna" },
  { id: "polaroid", label: "Polaroid", emoji: "📷", desc: "Foto + frame" },
  { id: "fullPhoto", label: "Full Photo", emoji: "🖼️", desc: "Foto jadi BG" },
  { id: "satelitCard", label: "Satelit", emoji: "🛰️", desc: "Peta + card" },
  { id: "neonModern", label: "Neon", emoji: "⚡", desc: "Gen Z dark" },
  { id: "earthTone", label: "Earth", emoji: "🌱", desc: "Alami cokelat" },
];

export function SharePanenModal({ open, onClose, data }: Props) {
  const postcardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [style, setStyle] = useState<PostcardStyle>("harvestanPro");
  const [tampilkanProfit, setTampilkanProfit] = useState(false);
  const [fotoCustomDataUrl, setFotoCustomDataUrl] = useState<string | null>(
    null
  );
  const [satelitDataUrl, setSatelitDataUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loadingSatelit, setLoadingSatelit] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate QR
  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(LANDING_URL, {
      width: 260,
      margin: 1,
      color: { dark: "#2c5e2e", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch((e) => console.error("QR error:", e));
  }, [open]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Fetch satelit
  useEffect(() => {
    if (!open || style !== "satelitCard") return;
    if (satelitDataUrl) return;

    let cancelled = false;

    async function fetchSatelit() {
      setLoadingSatelit(true);
      setError(null);
      try {
        const url = await generateSatelitImage(data);
        if (cancelled) return;
        if (!url) {
          setError(
            "⚠️ Gagal ambil gambar satelit. Cek koneksi internet lalu coba lagi."
          );
          return;
        }
        setSatelitDataUrl(url);
      } catch (e: any) {
        if (!cancelled) {
          setError("⚠️ " + (e.message || "Gagal ambil satelit"));
        }
      } finally {
        if (!cancelled) setLoadingSatelit(false);
      }
    }

    fetchSatelit();
    return () => {
      cancelled = true;
    };
  }, [open, style, satelitDataUrl, data]);

  function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFotoCustomDataUrl(String(reader.result));
    };
    reader.readAsDataURL(f);
  }

  async function generateImage(): Promise<string | null> {
    if (!postcardRef.current) return null;

    // Beri waktu render + font loading
    await new Promise((r) => setTimeout(r, 200));

    const dataUrl = await toPng(postcardRef.current, {
      width: 1080,
      height: 1920,
      pixelRatio: 1,
      cacheBust: true,
      backgroundColor: "#ffffff",
      style: {
        transform: "none",
        transformOrigin: "top left",
      },
    });

    return dataUrl;
  }

  async function handleDownload() {
    setGenerating(true);
    setError(null);
    try {
      const dataUrl = await generateImage();
      if (!dataUrl) {
        setError("⚠️ Gagal generate gambar (postcard belum siap)");
        return;
      }
      const link = document.createElement("a");
      link.download = `Postcard_${data.komoditas}_${data.tanggal}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e: any) {
      console.error("Download error:", e);
      setError("⚠️ Gagal generate gambar: " + (e.message || "Unknown"));
    } finally {
      setGenerating(false);
    }
  }

  async function handleShareIG() {
    setGenerating(true);
    setError(null);

    try {
      const dataUrl = await generateImage();
      if (!dataUrl) {
        setError("⚠️ Gagal generate gambar (postcard belum siap)");
        return;
      }

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `harvestan-panen-${Date.now()}.png`, {
        type: "image/png",
      });

      const nav: any = navigator;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: "Hasil Panen Harvestan",
          text: `🌾 Hasil panen ${data.komoditasLabel} — ${Math.round(
            data.hasilKg
          ).toLocaleString("id-ID")} Kg!\n\nDibuat dengan Harvestan 🌱`,
        });
      } else {
        const link = document.createElement("a");
        link.download = `Postcard_Harvestan.png`;
        link.href = dataUrl;
        link.click();
        setError(
          "ℹ️ HP ini belum support share otomatis. Gambar sudah didownload — buka Instagram → Story → upload dari galeri."
        );
      }
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setGenerating(false);
        return;
      }
      console.error("Share error:", e);
      setError("⚠️ Gagal share: " + (e.message || "Unknown"));
    } finally {
      setGenerating(false);
    }
  }

  if (!open) return null;

  const postcardData: PostcardData = {
    komoditas: data.komoditas,
    komoditasLabel: data.komoditasLabel,
    hasilKg: data.hasilKg,
    luasHa: data.luasHa,
    produktivitas: data.produktivitas,
    hargaJual: data.hargaJual,
    tanggal: data.tanggal,
    namaPenggarap: data.namaPenggarap,
    namaLahan: data.namaLahan,
    profitOwner: data.profitOwner,
    profitPenggarap: data.profitPenggarap,
    tampilkanProfit,
    fotoCustomDataUrl,
    satelitDataUrl,
    polygon: data.polygon,
    koordinat: data.koordinat,
    qrDataUrl,
    style,
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-start md:items-center justify-center overflow-y-auto">
      <div className="bg-white w-full max-w-4xl min-h-full md:min-h-0 md:rounded-3xl md:my-6 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#2c5e2e] via-[#1f4521] to-[#2c5e2e] px-4 md:px-6 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[#f0b429] flex items-center justify-center text-lg">
              📸
            </span>
            <div>
              <div className="text-xs md:text-sm font-bold text-white tracking-tight">
                Share Postcard Panen
              </div>
              <div className="text-[10px] text-[#f0b429] font-bold uppercase tracking-widest">
                Pilih style → download / share IG
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 p-4 md:p-6">
          {/* PREVIEW */}
          <div>
            <div className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
              Preview
            </div>

            <div
              className="bg-[#e8ebe5] rounded-2xl overflow-hidden relative"
              style={{ aspectRatio: "9 / 16", width: "100%" }}
            >
              {qrDataUrl ? (
                <div
                  style={{
                    width: "1080px",
                    height: "1920px",
                    transform: "scale(0.3)",
                    transformOrigin: "top left",
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                >
                  <PostcardPanen ref={postcardRef} data={postcardData} />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-[#2c5e2e]/60">
                  Menyiapkan...
                </div>
              )}
            </div>

            <p className="text-[10px] text-[#2c5e2e]/50 mt-2 text-center">
              Preview (rasio 9:16 sama seperti IG Story)
            </p>
          </div>

          {/* KONTROL */}
          <div className="space-y-4">
            {/* Style picker */}
            <div>
              <div className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
                🎨 Pilih Style
              </div>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={`p-3 rounded-2xl border-2 text-left transition ${
                      style === s.id
                        ? "border-[#f0b429] bg-[#f0b429]/10"
                        : "border-[#2c5e2e]/10 bg-white hover:border-[#f0b429]/40"
                    }`}
                  >
                    <div className="text-lg">{s.emoji}</div>
                    <div className="text-xs font-bold text-[#2c5e2e] mt-1">
                      {s.label}
                    </div>
                    <div className="text-[10px] text-[#2c5e2e]/60">
                      {s.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload foto — untuk style yang butuh foto */}
            {(style === "polaroid" || style === "fullPhoto") && (
              <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-2xl p-3">
                <div className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
                  📸 Upload Foto {style === "polaroid" ? "(untuk frame)" : "(jadi background)"}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadFoto}
                  className="w-full text-xs file:mr-2 file:py-2 file:px-3 file:rounded-full file:border-0 file:bg-[#2c5e2e] file:text-white file:font-bold file:text-xs hover:file:bg-[#1f4521]"
                />
                {fotoCustomDataUrl && (
                  <button
                    type="button"
                    onClick={() => setFotoCustomDataUrl(null)}
                    className="mt-2 text-[10px] text-red-600 underline font-bold"
                  >
                    ✕ Hapus foto
                  </button>
                )}
              </div>
            )}

            {/* Loading satelit */}
            {style === "satelitCard" && loadingSatelit && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-3 text-xs text-blue-800 font-bold">
                🛰️ Mengambil gambar satelit...
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3">
                <p className="text-xs text-red-700 font-semibold leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            {/* Checkbox profit */}
            {(data.profitOwner != null || data.profitPenggarap != null) && (
              <label className="flex items-start gap-3 bg-white border-2 border-[#2c5e2e]/10 rounded-2xl p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tampilkanProfit}
                  onChange={(e) => setTampilkanProfit(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#2c5e2e]"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#2c5e2e]">
                    💵 Tampilkan Profit
                  </div>
                  <div className="text-[10px] text-[#2c5e2e]/60 mt-0.5 leading-relaxed">
                    Centang kalau mau pamer keuntungan. Biarkan kosong kalau
                    cuma mau pamer hasil panen.
                  </div>
                </div>
              </label>
            )}

            {/* Tombol aksi */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleShareIG}
                disabled={generating || loadingSatelit || !qrDataUrl}
                className="w-full bg-gradient-to-r from-[#2c5e2e] to-[#1f4521] hover:from-[#1f4521] hover:to-[#154018] text-white font-bold py-4 rounded-full transition-all hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>⏳ Menyiapkan...</>
                ) : (
                  <>
                    <span className="text-lg">📤</span>
                    Share ke IG Story
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={generating || loadingSatelit || !qrDataUrl}
                className="w-full bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] font-bold py-3 rounded-full transition-all hover:scale-[1.02] shadow-md disabled:opacity-50 disabled:hover:scale-100"
              >
                💾 Download PNG
              </button>

              <p className="text-[10px] text-[#2c5e2e]/60 text-center leading-relaxed pt-1">
                💡 Tombol share akan buka menu HP → pilih{" "}
                <strong>Instagram</strong> → <strong>Story</strong> → tinggal
                edit & post.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Helper: generate gambar satelit ============
async function generateSatelitImage(data: {
  polygon?: { type: "Polygon"; coordinates: number[][][] } | null;
  koordinat?: string | null;
}): Promise<string | null> {
  let centerLat = -6.2;
  let centerLng = 106.8;
  let zoom = 17;

  const polygon = data.polygon;
  const koordinat = data.koordinat;

  if (
    polygon &&
    polygon.coordinates &&
    polygon.coordinates[0] &&
    polygon.coordinates[0].length >= 3
  ) {
    const ring = polygon.coordinates[0];
    const lats = ring.map((c) => c[1]);
    const lngs = ring.map((c) => c[0]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    centerLat = (minLat + maxLat) / 2;
    centerLng = (minLng + maxLng) / 2;

    const spanLat = maxLat - minLat;
    const spanLng = maxLng - minLng;
    const spanM = Math.max(spanLat, spanLng) * 111320;
    if (spanM > 0) {
      zoom = Math.floor(
        Math.log2(
          (156543.03 * Math.cos((centerLat * Math.PI) / 180) * 512) / spanM
        )
      );
      zoom = Math.min(19, Math.max(14, zoom));
    }
  } else if (koordinat) {
    const parts = koordinat.split(",").map((s) => s.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        centerLat = lat;
        centerLng = lng;
      }
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = 512 * 3;
  canvas.height = 512 * 3;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const n = Math.pow(2, zoom);
  const latRad = (centerLat * Math.PI) / 180;
  const centerXTile = ((centerLng + 180) / 360) * n;
  const centerYTile =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    n;

  const baseX = Math.floor(centerXTile);
  const baseY = Math.floor(centerYTile);

  const loadTile = (x: number, y: number, px: number, py: number) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const timeout = setTimeout(() => resolve(), 5000);
      img.onload = () => {
        clearTimeout(timeout);
        try {
          ctx.drawImage(img, px, py, 512, 512);
        } catch (e) {
          console.error("drawImage error:", e);
        }
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve();
      };
      img.src = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
    });

  const promises: Promise<void>[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      promises.push(
        loadTile(baseX + dx, baseY + dy, (dx + 1) * 512, (dy + 1) * 512)
      );
    }
  }
  await Promise.all(promises);

  try {
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch (e) {
    console.error("toDataURL error:", e);
    return null;
  }
}
