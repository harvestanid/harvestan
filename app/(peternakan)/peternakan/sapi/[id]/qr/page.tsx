import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
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

  // Deteksi domain (Vercel / Localhost / IP Lokal)
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") || host.includes("192.168.") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const publicUrl = `${baseUrl}/sapi-publik/${sapi.public_token}`;

  return <QrKlien sapi={sapi} publicUrl={publicUrl} />;
}
