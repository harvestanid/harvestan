import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BantuanKlien } from "./klien";

export const metadata = {
  title: "Pusat Bantuan",
  description: "Panduan, FAQ, dan kontak support Harvestan",
};

export default async function BantuanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📚 Pusat Bantuan</h1>
        <p className="text-gray-600 text-sm mt-1">
          Semua yang perlu Anda tahu tentang Harvestan
        </p>
      </div>

      <BantuanKlien />
    </div>
  );
}
