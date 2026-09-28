import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { AkunTab } from "./akun-tab";
import { KategoriTab } from "./kategori-tab";

export default async function PengaturanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  // ===== DATA UNTUK TAB AKUN =====
  const { count: penggarapCount } = await supabase
    .from("penggaraps")
    .select("*", { count: "exact", head: true })
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const { count: lahanCount } = await supabase
    .from("lands")
    .select("*", { count: "exact", head: true })
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const { count: panenCount } = await supabase
    .from("harvests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const { data: hutangData } = await supabase
    .from("debts")
    .select("sisa")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .gt("sisa", 0);

  const totalHutangAktif = (hutangData || []).reduce(
    (s, h) => s + Number(h.sisa || 0),
    0
  );

  // ===== DATA UNTUK TAB KATEGORI =====
  const { data: kategoriList } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const { data: harvests } = await supabase
    .from("harvests")
    .select("komoditas")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const KOMODITAS_LABEL: Record<string, string> = {
    padi: "🌾 Padi",
    jagung: "🌽 Jagung",
    kacang_tanah: "🥜 Kacang Tanah",
    bawang_merah: "🧅 Bawang Merah",
    cabai_rawit: "🌶️ Cabai Rawit",
    cabai: "🌶️ Cabai",
  };

  const KOMODITAS_DEFAULT = [
    "padi",
    "jagung",
    "kacang_tanah",
    "bawang_merah",
    "cabai_rawit",
  ];

  // Normalisasi: cabai → cabai_rawit
  function normalisasiKomoditas(kom: string): string {
    if (kom === "cabai") return "cabai_rawit";
    return kom;
  }

  const komoditasSet = new Set<string>();
  KOMODITAS_DEFAULT.forEach((k) => komoditasSet.add(k));
  (harvests || []).forEach((h) => {
    if (h.komoditas) komoditasSet.add(normalisasiKomoditas(h.komoditas));
  });
  (kategoriList || []).forEach((k) => {
    if (k.komoditas) komoditasSet.add(normalisasiKomoditas(k.komoditas));
  });

  const order = KOMODITAS_DEFAULT;
  const komoditasList = Array.from(komoditasSet).sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  // Normalisasi kategoriList biar komoditas "cabai" jadi "cabai_rawit"
  const kategoriListNormal = (kategoriList || []).map((k) => ({
    ...k,
    komoditas: normalisasiKomoditas(k.komoditas),
  }));

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">⚙️ Pengaturan</h1>
        <p className="text-gray-600 text-sm mt-1">
          Kelola akun & preferensi aplikasi
        </p>
      </div>

      <TabContainer
        akunContent={
          <AkunTab
            user={{
              id: user.id,
              email: user.email || "",
              nama:
                (user.user_metadata?.nama as string) ||
                user.email?.split("@")[0] ||
                "Petani",
              createdAt: user.created_at,
            }}
            stats={{
              penggarapCount: penggarapCount || 0,
              lahanCount: lahanCount || 0,
              panenCount: panenCount || 0,
              totalHutangAktif,
            }}
          />
        }
        kategoriContent={
          <KategoriTab
            komoditasList={komoditasList}
            kategoriList={kategoriListNormal}
            komoditasLabel={KOMODITAS_LABEL}
          />
        }
      />
    </div>
  );
}

import { TabContainer } from "./tab-container";
