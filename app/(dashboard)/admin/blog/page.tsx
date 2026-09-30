import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BlogAdminKlien } from "./klien";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

export const metadata = {
  title: "Blog Admin",
};

export default async function AdminBlogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const { data: articles } = await supabase
    .from("articles")
    .select(
      "id, slug, judul, ringkasan, cover_url, kategori, tags, status, is_featured, views, reading_time, author_nama, published_at, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  const stats = {
    total: articles?.length || 0,
    published:
      articles?.filter((a) => a.status === "published").length || 0,
    draft: articles?.filter((a) => a.status === "draft").length || 0,
    totalViews:
      articles?.reduce((s, a) => s + Number(a.views || 0), 0) || 0,
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            📝 Blog Admin
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Kelola artikel blog Harvestan
          </p>
        </div>
        <Link
          href="/admin/blog/baru"
          className="bg-[#2c5e2e] hover:bg-[#1f4521] text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-[1.02] shadow-md"
        >
          + Tulis Artikel
        </Link>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-2xl p-4">
          <div className="text-2xl mb-1">📚</div>
          <div className="text-[10px] font-bold text-[#2c5e2e]/60 uppercase tracking-widest">
            Total Artikel
          </div>
          <div className="text-2xl font-bold text-[#2c5e2e] mt-1">
            {stats.total}
          </div>
        </div>
        <div className="bg-white border-2 border-green-200 rounded-2xl p-4">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-[10px] font-bold text-green-700 uppercase tracking-widest">
            Published
          </div>
          <div className="text-2xl font-bold text-green-800 mt-1">
            {stats.published}
          </div>
        </div>
        <div className="bg-white border-2 border-yellow-200 rounded-2xl p-4">
          <div className="text-2xl mb-1">📄</div>
          <div className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest">
            Draft
          </div>
          <div className="text-2xl font-bold text-yellow-800 mt-1">
            {stats.draft}
          </div>
        </div>
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-4">
          <div className="text-2xl mb-1">👁️</div>
          <div className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">
            Total Views
          </div>
          <div className="text-2xl font-bold text-blue-800 mt-1">
            {stats.totalViews.toLocaleString("id-ID")}
          </div>
        </div>
      </div>

      <BlogAdminKlien articles={articles || []} />
    </div>
  );
}
