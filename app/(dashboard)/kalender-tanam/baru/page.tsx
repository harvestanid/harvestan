import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { KalenderForm } from "./form-client";

export const metadata = {
  title: "Buat Kalender Tanam",
};

export default async function KalenderBaruPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const { data: lands } = await supabase
    .from("lands")
    .select("id, nama")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .order("nama");

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📅 Buat Kalender Tanam</h1>
        <p className="text-gray-600 text-sm mt-1">
          Tentukan jadwal kegiatan dari tanam hingga panen
        </p>
      </div>

      <KalenderForm lands={lands || []} />
    </div>
  );
}
