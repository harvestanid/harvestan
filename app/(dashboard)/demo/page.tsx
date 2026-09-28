import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDemoStatus } from "@/lib/demo/demo-mode";
import { DemoKlien } from "./klien";

export const metadata = {
  title: "Mode Demo",
  description:
    "Coba Harvestan Premium gratis dengan data contoh 10 tahun. Lihat semua fitur sebelum upgrade.",
};

export default async function DemoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const demoStatus = await getDemoStatus(user.id);

  return (
    <DemoKlien
      isActive={demoStatus.isActive}
      daysRemaining={demoStatus.daysRemaining}
      expiresAt={demoStatus.expiresAt}
      canStart={demoStatus.canStart}
      canRestart={demoStatus.canRestart}
      message={demoStatus.message}
    />
  );
}
