"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import QRCode from "qrcode";

type Sapi = {
  id: string;
  nama_sapi: string | null;
  jenis: string;
  jenis_kelamin: string;
  tanggal_masuk: string;
  foto_url: string | null;
};

export function QrKlien({ sapi, publicUrl }: { sapi: Sapi; publicUrl: string }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    QRCode.toDataURL(publicUrl, {
      width: 500,
      margin: 1,
      color: { dark: "#1f4521", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [publicUrl]);

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPNG() {
    if (!cardRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `Cardholder-Sapi-${sapi.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert("Gagal download gambar. Coba lagi.");
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between no-print flex-wrap gap-2">
        <Link href={`/peternakan/sapi/${sapi.id}`} className="text-[#2c5e2e] hover:text-[#f0b429] text-sm font-medium">
          ← Kembali ke Detail Sapi
        </Link>
        <div className="flex gap-2">
          <button onClick={handleDownloadPNG} className="bg-[#2c5e2e] hover:bg-[#1f4521] text-white text-xs font-bold px-4 py-2 rounded-full shadow-md transition">
            📥 Download PNG
          </button>
          <button onClick={handlePrint} className="bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] text-xs font-bold px-4 py-2 rounded-full shadow-md transition">
            🖨️ Print Cardholder
          </button>
        </div>
      </div>

      <div className="text-center no-print">
        <h1 className="text-xl font-bold text-gray-900">📲 Cardholder QR Sapi</h1>
        <p className="text-gray-500 text-sm">Cetak dan gantungkan di kandang sapi.</p>
      </div>

      <div className="flex justify-center">
        <div
          ref={cardRef}
          className="relative bg-gradient-to-br from-[#f0fdf4] via-white to-[#fef3c7] border-[6px] border-[#2c5e2e] rounded-[24px] overflow-hidden shadow-2xl"
          style={{
            width: "500px",
            height: "700px",
            padding: "30px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            textAlign: "center",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
            backgroundImage: "radial-gradient(#2c5e2e 2px, transparent 2px)",
            backgroundSize: "30px 30px",
          }} />

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-horizontal.png" alt="Harvestan" style={{ height: "40px" }} />
            </div>
            <div className="inline-block bg-[#f0b429] text-[#2c5e2e] px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-sm">
              🐄 SAPI PREMIUM
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-3">
            {sapi.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sapi.foto_url}
                alt="Foto Sapi"
                style={{ width: "200px", height: "200px", objectFit: "cover", borderRadius: "50%", border: "6px solid #2c5e2e", boxShadow: "0 8px 20px rgba(44,94,46,0.3)" }}
              />
            ) : (
              <div style={{ width: "200px", height: "200px", borderRadius: "50%", border: "6px solid #2c5e2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "80px", background: "#fff" }}>
                🐄
              </div>
            )}

            <div className="text-2xl font-black text-[#2c5e2e] leading-tight">
              {sapi.nama_sapi ? sapi.nama_sapi : `Sapi ${sapi.jenis}`} <br/>
              <span className="text-lg font-bold text-gray-600">
                {sapi.nama_sapi ? `Sapi ${sapi.jenis} (${sapi.jenis_kelamin})` : `(${sapi.jenis_kelamin})`}
              </span>
            </div>

            <div className="bg-white p-2 rounded-2xl shadow-md border-2 border-[#2c5e2e]/20 mt-1">
              {qrDataUrl && <img src={qrDataUrl} alt="QR Code" style={{ width: "160px", height: "160px" }} />}
            </div>
          </div>

          <div className="relative z-10">
            <h2 className="text-xl font-black text-[#2c5e2e] tracking-tight leading-tight mb-1">
              Lihat Perkembanganku! ✨
            </h2>
            <p className="text-xs text-gray-600 font-medium">
              Scan QR Code di atas untuk melihat <br/>
              pertumbuhan bobot & foto terbaruku.
            </p>
            <div className="mt-3 text-[10px] font-bold text-[#2c5e2e]/60 uppercase tracking-widest">
              Powered by Harvestan.id
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          div[style*="width: 500px"] {
            visibility: visible !important;
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
          }
          div[style*="width: 500px"] * {
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
