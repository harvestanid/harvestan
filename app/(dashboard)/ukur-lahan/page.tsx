import { createClient } from "@/lib/supabase/server";
import UkurLahanContent from "./ukur-content";

export default async function UkurLahanPage({
  searchParams,
}: {
  searchParams: Promise<{
    penggarap_id?: string;
    mode?: string;
    landId?: string;
  }>;
}) {
  const { penggarap_id, mode, landId } = await searchParams;

  const isEditMode = mode === "edit" && landId;

  // Kalau mode edit, ambil nama lahan lama
  let namaLama: string | null = null;
  if (isEditMode && landId) {
    const supabase = await createClient();
    const { data: lahan } = await supabase
      .from("lands")
      .select("nama")
      .eq("id", landId)
      .single();
    namaLama = lahan?.nama || null;
  }

  return (
    <UkurLahanContent
      penggarapIdFromURL={penggarap_id || null}
      mode={isEditMode ? "edit" : "new"}
      landId={landId || null}
      namaLama={namaLama}
    />
  );
}
