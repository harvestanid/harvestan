import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { FormEditLahan } from "./form-client";

export const metadata = {
  title: "Edit Lahan",
};

export default async function EditLahanPage({
  params,
}: {
  params: Promise<{ id: string; landId: string }>;
}) {
  const { id, landId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const { data: lahan } = await supabase
    .from("lands")
    .select("*")
    .eq("id", landId)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .single();

  if (!lahan) redirect(`/penggarap/${id}`);

  const { data: penggarap } = await supabase
    .from("penggaraps")
    .select("id, nama, is_self")
    .eq("id", id)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .single();

  if (!penggarap) redirect("/penggarap");

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/penggarap/${id}/lahan/${landId}`}
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke {lahan.nama}
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          ✏️ Edit Lahan
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Penggarap: <strong>{penggarap.nama}</strong>
        </p>
      </div>

      <FormEditLahan
        landId={lahan.id}
        penggarapId={id}
        isSelf={penggarap.is_self || false}
        initial={{
          nama: lahan.nama,
          luas: Number(lahan.luas),
          lokasi_koordinat: lahan.lokasi_koordinat || "",
          tipe_garap: (lahan as any).tipe_garap || "bagi_hasil_owner",
          nama_owner_external: (lahan as any).nama_owner_external || "",
          persen_owner_default: Number(
            (lahan as any).persen_owner_default || 50
          ),
          persen_penggarap_default: Number(
            (lahan as any).persen_penggarap_default || 50
          ),
        }}
      />
    </div>
  );
}
