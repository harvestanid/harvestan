import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BlogForm } from "@/components/blog-form";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

export const metadata = {
  title: "Tulis Artikel Baru",
};

export default async function AdminBlogBaruPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.email !== ADMIN_EMAIL) redirect("/dashboard");

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <Link
          href="/admin/blog"
          className="text-[#2c5e2e] hover:text-[#f0b429] text-sm font-medium transition-colors"
        >
          ← Kembali ke Blog Admin
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-[#2c5e2e] mt-2">
          ✍️ Tulis Artikel Baru
        </h1>
        <p className="text-[#2c5e2e]/60 text-sm mt-1">
          Tulis di kiri, lihat preview di kanan. Pakai Markdown untuk format.
        </p>
      </div>

      <BlogForm mode="create" />
    </div>
  );
}
