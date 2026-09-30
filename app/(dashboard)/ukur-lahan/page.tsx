import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UkurContent from "./ukur-content";

export const dynamic = "force-dynamic";

export default async function UkurLahanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f7f3] via-white to-[#f5f7f3]">
      <div className="max-w-3xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <UkurContent />
      </div>
    </div>
  );
}
