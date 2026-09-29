import { createClient } from "@/lib/supabase/server";
import { getProductsList } from "@/lib/supabase/queries/product-server";
import LandingKlien from "./landing-klien";

export const metadata = {
  title: "Harvestan - Sistem Manajemen Pertanian Indonesia",
  description:
    "Kelola penggarap, lahan, panen, hutang, dan jual hasil tani. SaaS pertanian multi-komoditas untuk petani Indonesia.",
};

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const produkUnggulan = await getProductsList({
    status: "aktif",
    unggulan_only: true,
    limit: 4,
  });

  const produkTerbaru = await getProductsList({
    status: "aktif",
    limit: 8,
  });

  const produkTampil = Array.isArray(produkUnggulan) && produkUnggulan.length > 0
    ? produkUnggulan
    : Array.isArray(produkTerbaru)
    ? produkTerbaru
    : [];

  return (
    <LandingKlien
      user={user ? { email: user.email, id: user.id } : null}
      produkTampil={produkTampil}
    />
  );
}
