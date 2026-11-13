import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { QrKlien } from "./klien";

export default async function QrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sapi } = await supabase
    .from("livestocks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!sapi) notFound();

  // URL Publik (sesuaikan dengan domain vercel Anda nanti)
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://harvestan.vercel.app"}/sapi-publik/${sapi.public_token}`;

  return <QrKlien sapi={sapi} publicUrl={publicUrl} />;
}
