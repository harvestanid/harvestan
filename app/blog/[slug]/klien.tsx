"use client";

import { useState } from "react";

type Props = {
  url: string;
  judul: string;
};

export function BlogDetailKlien({ url, judul }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Gagal copy. Copy manual ya: " + url);
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: judul,
          text: judul,
          url,
        });
      } catch (e) {
        // user cancel, ignore
      }
    } else {
      handleCopy();
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedJudul = encodeURIComponent(judul);

  return (
    <div className="mt-12 pt-8 border-t-2 border-[#2c5e2e]/10">
      <div className="text-[10px] font-bold text-[#2c5e2e]/60 uppercase tracking-widest mb-3">
        🔗 Bagikan Artikel
      </div>
      <div className="flex flex-wrap gap-2">
        {/* Native share (mobile) */}
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center gap-2 bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold text-xs px-4 py-2.5 rounded-full transition-all hover:scale-105 shadow-md"
        >
          📤 Bagikan
        </button>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${encodedJudul}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold text-xs px-4 py-2.5 rounded-full transition-all hover:scale-105 shadow-md"
        >
          💬 WhatsApp
        </a>

        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-full transition-all hover:scale-105 shadow-md"
        >
          📘 Facebook
        </a>

        {/* X / Twitter */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedJudul}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white font-bold text-xs px-4 py-2.5 rounded-full transition-all hover:scale-105 shadow-md"
        >
          𝕏 Post
        </a>

        {/* Copy link */}
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] font-bold text-xs px-4 py-2.5 rounded-full transition-all hover:scale-105 shadow-md"
        >
          {copied ? "✅ Tersalin!" : "🔗 Copy Link"}
        </button>
      </div>
    </div>
  );
}
