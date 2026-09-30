import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { BlogDetailKlien } from "./klien";

const SITE_URL = "https://harvestan.vercel.app";

const KATEGORI_INFO: Record<
  string,
  { label: string; emoji: string; warna: string }
> = {
  panduan: {
    label: "Panduan Tanam",
    emoji: "📗",
    warna: "bg-green-100 text-green-800 border-green-300",
  },
  harga: {
    label: "Harga & Pasar",
    emoji: "💰",
    warna: "bg-[#f0b429]/20 text-[#2c5e2e] border-[#f0b429]/50",
  },
  hama: {
    label: "Hama & Penyakit",
    emoji: "🐛",
    warna: "bg-red-100 text-red-800 border-red-300",
  },
  bisnis: {
    label: "Bisnis Tani",
    emoji: "📈",
    warna: "bg-blue-100 text-blue-800 border-blue-300",
  },
  teknologi: {
    label: "Teknologi",
    emoji: "💻",
    warna: "bg-purple-100 text-purple-800 border-purple-300",
  },
  kisah: {
    label: "Kisah Sukses",
    emoji: "📖",
    warna: "bg-orange-100 text-orange-800 border-orange-300",
  },
};

function formatTanggal(t: string) {
  try {
    return new Date(t).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: artikel } = await supabase
    .from("articles")
    .select("judul, ringkasan, cover_url, published_at, author_nama, tags")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!artikel) {
    return { title: "Artikel tidak ditemukan — Harvestan" };
  }

  const url = `${SITE_URL}/blog/${slug}`;

  return {
    title: `${artikel.judul} — Blog Harvestan`,
    description: artikel.ringkasan,
    keywords: Array.isArray(artikel.tags) ? artikel.tags : [],
    authors: [{ name: artikel.author_nama }],
    alternates: { canonical: url },
    openGraph: {
      title: artikel.judul,
      description: artikel.ringkasan,
      url,
      siteName: "Harvestan",
      type: "article",
      publishedTime: artikel.published_at || undefined,
      authors: [artikel.author_nama],
      images: artikel.cover_url
        ? [{ url: artikel.cover_url, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: artikel.judul,
      description: artikel.ringkasan,
      images: artikel.cover_url ? [artikel.cover_url] : undefined,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function DetailArtikelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: artikel } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!artikel) notFound();

  supabase
    .from("articles")
    .update({ views: (artikel.views || 0) + 1 })
    .eq("id", artikel.id)
    .then(() => {});

  const { data: terkait } = await supabase
    .from("articles")
    .select(
      "id, slug, judul, ringkasan, cover_url, kategori, reading_time, published_at"
    )
    .eq("status", "published")
    .eq("kategori", artikel.kategori)
    .neq("id", artikel.id)
    .order("published_at", { ascending: false })
    .limit(3);

  let relatedArticles = terkait || [];
  if (relatedArticles.length < 3) {
    const { data: fallback } = await supabase
      .from("articles")
      .select(
        "id, slug, judul, ringkasan, cover_url, kategori, reading_time, published_at"
      )
      .eq("status", "published")
      .neq("id", artikel.id)
      .order("published_at", { ascending: false })
      .limit(3);

    const ids = new Set(relatedArticles.map((a) => a.id));
    const uniqueFallback = (fallback || []).filter((a) => !ids.has(a.id));
    relatedArticles = [...relatedArticles, ...uniqueFallback].slice(0, 3);
  }

  const info = KATEGORI_INFO[artikel.kategori] || {
    label: artikel.kategori,
    emoji: "📄",
    warna: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: artikel.judul,
    description: artikel.ringkasan,
    image: artikel.cover_url || undefined,
    datePublished: artikel.published_at,
    dateModified: artikel.updated_at,
    author: {
      "@type": "Person",
      name: artikel.author_nama,
    },
    publisher: {
      "@type": "Organization",
      name: "Harvestan",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo-horizontal.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${artikel.slug}`,
    },
    keywords: Array.isArray(artikel.tags) ? artikel.tags.join(", ") : "",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#faf9f5]">
        <div className="max-w-3xl mx-auto px-6 md:px-10 pt-6 md:pt-8">
          <nav
            className="text-xs text-[#2c5e2e]/60 flex items-center gap-2 flex-wrap"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-[#2c5e2e] transition-colors">
              🏠 Beranda
            </Link>
            <span>›</span>
            <Link
              href="/blog"
              className="hover:text-[#2c5e2e] transition-colors"
            >
              📖 Blog
            </Link>
            <span>›</span>
            <span className="text-[#2c5e2e] font-semibold line-clamp-1">
              {artikel.judul}
            </span>
          </nav>
        </div>

        <header className="max-w-3xl mx-auto px-6 md:px-10 pt-6 md:pt-8 pb-8">
          <span
            className={`inline-block text-[10px] px-2.5 py-1 rounded-full font-bold border-2 uppercase tracking-widest mb-4 ${info.warna}`}
          >
            {info.emoji} {info.label}
          </span>

          <h1 className="text-3xl md:text-5xl font-bold text-[#2c5e2e] tracking-tighter leading-[1.15] mb-4">
            {artikel.judul}
          </h1>

          <p className="text-base md:text-lg text-[#2c5e2e]/70 leading-relaxed mb-6">
            {artikel.ringkasan}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#2c5e2e]/60 pb-6 border-b-2 border-[#2c5e2e]/10">
            <span className="font-semibold text-[#2c5e2e]">
              ✍️ {artikel.author_nama}
            </span>
            <span>·</span>
            <span>📅 {formatTanggal(artikel.published_at)}</span>
            <span>·</span>
            <span>⏱️ {artikel.reading_time} menit baca</span>
            <span>·</span>
            <span>👁️ {artikel.views || 0} views</span>
          </div>
        </header>

        {artikel.cover_url && (
          <div className="max-w-4xl mx-auto px-6 md:px-10 mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artikel.cover_url}
              alt={artikel.judul}
              className="w-full rounded-3xl shadow-2xl shadow-[#2c5e2e]/10 border-2 border-[#2c5e2e]/10"
            />
          </div>
        )}

        <article className="max-w-3xl mx-auto px-6 md:px-10 pb-12">
          <MarkdownRenderer konten={artikel.konten} />

          {Array.isArray(artikel.tags) && artikel.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t-2 border-[#2c5e2e]/10">
              <div className="text-[10px] font-bold text-[#2c5e2e]/60 uppercase tracking-widest mb-3">
                🏷️ Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {artikel.tags.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="bg-[#2c5e2e]/5 border border-[#2c5e2e]/20 text-[#2c5e2e] text-xs font-bold px-3 py-1.5 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <BlogDetailKlien
            url={`${SITE_URL}/blog/${artikel.slug}`}
            judul={artikel.judul}
          />
        </article>

        {relatedArticles.length > 0 && (
          <div className="max-w-5xl mx-auto px-6 md:px-10 pb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#f0b429]/15 flex items-center justify-center text-lg">
                📚
              </div>
              <div>
                <div className="font-bold text-[#2c5e2e] text-sm uppercase tracking-widest">
                  Artikel Terkait
                </div>
                <div className="text-[10px] text-[#2c5e2e]/60">
                  Baca juga yang ini
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedArticles.map((a: any) => {
                const ri = KATEGORI_INFO[a.kategori] || {
                  label: a.kategori,
                  emoji: "📄",
                  warna: "bg-gray-100 text-gray-800 border-gray-300",
                };
                return (
                  <Link
                    key={a.id}
                    href={`/blog/${a.slug}`}
                    className="group bg-white border-2 border-[#2c5e2e]/10 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-[#2c5e2e]/10 transition-all hover:-translate-y-1 flex flex-col"
                  >
                    <div className="relative aspect-[16/10] bg-gradient-to-br from-[#2c5e2e]/10 to-[#f0b429]/10 overflow-hidden">
                      {a.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.cover_url}
                          alt={a.judul}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">
                          {ri.emoji}
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <span
                        className={`inline-block self-start text-[10px] px-2.5 py-1 rounded-full font-bold border-2 uppercase tracking-widest mb-3 ${ri.warna}`}
                      >
                        {ri.emoji} {ri.label}
                      </span>
                      <h3 className="font-bold text-[#2c5e2e] text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[#f0b429] transition-colors">
                        {a.judul}
                      </h3>
                      <p className="text-[11px] text-[#2c5e2e]/60 leading-relaxed line-clamp-2 flex-1">
                        {a.ringkasan}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-[#2c5e2e]/50 pt-3 border-t border-[#2c5e2e]/10 mt-3">
                        <span>📅 {formatTanggal(a.published_at)}</span>
                        <span>⏱️ {a.reading_time}m</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-6 md:px-10 pb-16">
          <div className="relative overflow-hidden bg-[#2c5e2e] rounded-3xl p-8 md:p-12 text-center text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#f0b429]/20 rounded-full blur-3xl" />
            <div className="relative">
              <div className="text-4xl mb-3">🌾</div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-3">
                Kelola Pertanian Anda Lebih Cerdas
              </h2>
              <p className="text-white/80 text-sm mb-6 max-w-lg mx-auto">
                Catat penggarap, lahan, panen, dan hutang dengan Harvestan.
                Gratis untuk memulai.
              </p>
              <Link
                href="/register"
                className="inline-block bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] font-bold px-7 py-3 rounded-full transition-all hover:scale-105 shadow-lg"
              >
                Coba Gratis →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
