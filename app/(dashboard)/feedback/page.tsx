import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FeedbackKlien } from "./klien";

export const metadata = {
  title: "Beri Masukan",
  description: "Bantu kami tingkatkan layanan Harvestan",
};

export default async function FeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Cek apakah user sudah kirim feedback 7 hari terakhir
  const satuMingguLalu = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: recent } = await supabase
    .from("feedbacks")
    .select("created_at, rating")
    .eq("user_id", user.id)
    .gte("created_at", satuMingguLalu)
    .order("created_at", { ascending: false })
    .limit(1);

  // Paksa jadi boolean (bukan null)
  const sudahKirim: boolean = Boolean(recent && recent.length > 0);
  const tanggalKirim: string | null = sudahKirim
    ? recent![0].created_at
    : null;
  const ratingTerakhir: number | null = sudahKirim
    ? recent![0].rating
    : null;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">💬 Beri Masukan</h1>
        <p className="text-gray-600 text-sm mt-1">
          Bantu kami tingkatkan Harvestan — 100% anonymous
        </p>
      </div>

      <FeedbackKlien
        sudahKirim={sudahKirim}
        tanggalKirim={tanggalKirim}
        ratingTerakhir={ratingTerakhir}
      />
    </div>
  );
}
