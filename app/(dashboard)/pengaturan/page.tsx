import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AkunTab } from "./akun-tab";
import { KategoriTab } from "./kategori-tab";

export default async function PengaturanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // ===== DATA UNTUK TAB AKUN =====
  // Statistik user
  const { count: penggarapCount } = await supabase
    .from("penggaraps")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: lahanCount } = await supabase
    .from("lands")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: panenCount } = await supabase
    .from("harvests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: hutangData } = await supabase
    .from("debts")
    .select("sisa")
    .eq("user_id", user.id)
    .gt("sisa", 0);

  const totalHutangAktif = (hutangData || []).reduce(
    (s, h) => s + Number(h.sisa || 0),
    0
  );

  // ===== DATA UNTUK TAB KATEGORI =====
  const { data: kategoriList } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id);

  const { data: harvests } = await supabase
    .from("harvests")
    .select("komoditas")
    .eq("user_id", user.id);

  const KOMODITAS_LABEL: Record<string, string> = {
    padi: "🌾 Padi",
    jagung: "🌽 Jagung",
    kacang_tanah: "🥜 Kacang Tanah",
    bawang_merah: "🧅 Bawang Merah",
    cabai_rawit: "🌶️ Cabai Rawit",
  };

  const KOMODITAS_DEFAULT = [
    "padi",
    "jagung",
    "kacang_tanah",
    "bawang_merah",
    "cabai_rawit",
  ];

  const komoditasSet = new Set<string>();
  KOMODITAS_DEFAULT.forEach((k) => komoditasSet.add(k));
  (harvests || []).forEach((h) => {
    if (h.komoditas) komoditasSet.add(h.komoditas);
  });
  (kategoriList || []).forEach((k) => {
    if (k.komoditas) komoditasSet.add(k.komoditas);
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

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">⚙️ Pengaturan</h1>
        <p className="text-gray-600 text-sm mt-1">
          Kelola akun & preferensi aplikasi
        </p>
      </div>

      {/* Tab Navigation */}
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
            kategoriList={kategoriList || []}
            komoditasLabel={KOMODITAS_LABEL}
          />
        }
      />
    </div>
  );
}

// Client component untuk tab switching
import { TabContainer } from "./tab-container";
