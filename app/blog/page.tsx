import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BlogKlien } from "./klien";

export const metadata = {
  title: "Blog Harvestan — Tips & Panduan Pertanian Indonesia",
  description:
    "Artikel seputar pertanian Indonesia: panduan tanam, harga komoditas, hama & penyakit, bisnis tani, dan teknologi pertanian.",
  keywords: [
    "blog pertanian",
    "tips pertanian",
    "panduan tanam",
    "harga komoditas",
    "hama padi",
    "pertanian Indonesia",
  ],
  openGraph: {
    title: "Blog Harvestan",
    description:
      "Artikel seputar pertanian Indonesia: panduan tanam, harga komoditas, hama & penyakit, bisnis tani, dan teknologi.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const supabase = await createClient();

  const { data: articles } = await supabase
    .from("articles")
    .select(
      "id, slug, judul, ringkasan, cover_url, kategori, tags, author_nama, reading_time, views, published_at"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#faf9f5]">
      {/* ===== HEADER ===== */}
      <div className="relative overflow-hidden bg-[#2c5e2e] py-16 md:py-24">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#f0b429] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4a8f3f] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 md:px-10 text-center text-white">
          <div className="inline-block text-[10px] uppercase tracking-[0.25em] text-[#f0b429] font-bold mb-5 px-4 py-1.5 bg-white/10 backdrop-blur rounded-full border border-white/20">
            📖 Blog
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
            Belajar Pertanian
            <br />
            <span className="italic font-serif text-[#f0b429]">
              Lebih Cerdas
            </span>
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Panduan tanam, harga komoditas, hama & penyakit, bisnis tani, dan
            teknologi pertanian — semua di satu tempat.
          </p>
        </div>
      </div>

      {/* ===== KONTEN ===== */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <BlogKlien articles={articles || []} />
      </div>

      {/* ===== FOOTER CTA ===== */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 pb-16">
        <div className="relative overflow-hidden bg-[#2c5e2e] rounded-3xl p-8 md:p-12 text-center text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f0b429]/20 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Siap Kelola Lahan Anda?
            </h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Mulai catat penggarap, lahan, panen, dan hutang di Harvestan.
              Gratis untuk memulai.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/register"
                className="bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] font-bold px-7 py-3 rounded-full transition-all hover:scale-105 shadow-lg"
              >
                Daftar Gratis →
              </Link>
              <Link
                href="/"
                className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white font-bold px-7 py-3 rounded-full transition-all hover:scale-105"
              >
                ← Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
