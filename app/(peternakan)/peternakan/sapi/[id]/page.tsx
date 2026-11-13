import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { DetailSapiKlien } from "./klien";

export default async function DetailSapiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const { data: sapi } = await supabase
    .from("livestocks")
    .select("*")
    .eq("id", id)
    .eq("user_id", filter.user_id)
    .single();

  if (!sapi) notFound();

  const { data: measurements } = await supabase
    .from("livestock_measurements")
    .select("*")
    .eq("livestock_id", id)
    .order("tanggal", { ascending: true });

  const { data: logs } = await supabase
    .from("livestock_logs")
    .select("*")
    .eq("livestock_id", id)
    .order("tanggal", { ascending: false });

  return (
    <DetailSapiKlien
      sapi={sapi}
      measurements={measurements || []}
      logs={logs || []}
    />
  );
}
