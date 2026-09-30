import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { BlogForm } from "@/components/blog-form";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

export const metadata = {
  title: "Edit Artikel",
};

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  if (!article) notFound();

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <Link
          href="/admin/blog"
          className="text-[#2c5e2e] hover:text-[#f0b429] text-sm font-medium transition-colors"
        >
          ← Kembali ke Blog Admin
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3 mt-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2c5e2e]">
              ✏️ Edit Artikel
            </h1>
            <p className="text-[#2c5e2e]/60 text-sm mt-1 line-clamp-1">
              {article.judul}
            </p>
          </div>
          {article.status === "published" && (
            <a
              href={`/blog/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] px-4 py-2 rounded-full font-bold text-xs transition-all hover:scale-[1.02] shadow-md"
            >
              👁️ Lihat Artikel
            </a>
          )}
        </div>
      </div>

      <BlogForm
        mode="edit"
        articleId={article.id}
        initial={{
          slug: article.slug,
          judul: article.judul,
          ringkasan: article.ringkasan,
          konten: article.konten,
          cover_url: article.cover_url,
          kategori: article.kategori as any,
          tags: Array.isArray(article.tags) ? article.tags : [],
          status: article.status,
        }}
      />
    </div>
  );
}
