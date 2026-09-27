import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-900 mb-2">
            Akses Ditolak
          </h1>
          <p className="text-sm text-red-800 mb-2">
            Halaman ini hanya untuk administrator.
          </p>
          <p className="text-xs text-red-600">
            Login sebagai: <strong>{user.email}</strong>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
