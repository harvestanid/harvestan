import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AgentsKlien } from "./klien";

export const metadata = {
  title: "AI Agents — Admin",
};

const ADMIN_EMAIL = "harvestan.id@gmail.com";

export default async function AdminAgentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.email !== ADMIN_EMAIL) redirect("/dashboard");

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          🤖 AI Agents
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Virtual office — orchestrator yang ngatur 4 agent: Content Creator,
          Marketing, Idea Innovator, Social Media
        </p>
      </div>

      <AgentsKlien />
    </div>
  );
}
