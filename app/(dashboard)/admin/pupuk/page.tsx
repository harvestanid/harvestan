import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PupukAdminKlien } from "./klien";

export const metadata = {
  title: "Kelola Pupuk",
};

const ADMIN_EMAIL = "harvestan.id@gmail.com";

export default async function AdminPupukPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const { data: pupuks } = await supabase
    .from("fertilizers")
    .select("*")
    .order("urutan")
    .order("nama");

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          🧪 Kelola Pupuk
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Tambah/edit pupuk + kandungan hara untuk kalkulator
        </p>
      </div>

      <PupukAdminKlien pupuks={pupuks || []} />
    </div>
  );
}
