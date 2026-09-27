import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ImportKlien } from "./klien";

export default async function ImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📥 Import Data</h1>
        <p className="text-gray-600 text-sm mt-1">
          Upload file backup untuk mengembalikan / pindah data
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="text-sm text-blue-800">
            <strong>Cara pakai:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-0.5">
              <li>
                Dari akun lama, buka{" "}
                <a href="/export" className="underline font-bold">
                  Export
                </a>{" "}
                → klik <strong>Download Backup</strong>
              </li>
              <li>Login akun baru (yang mau diisi data)</li>
              <li>
                Buka <strong>Import</strong> ini, upload file backup tadi
              </li>
              <li>Pilih mode: Timpa atau Tambah</li>
              <li>Klik Import, tunggu selesai</li>
            </ol>
          </div>
        </div>
      </div>

      <ImportKlien />
    </div>
  );
}
