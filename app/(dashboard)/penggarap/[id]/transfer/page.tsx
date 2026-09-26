import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export default async function TransferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ambil penggarap asal
  const { data: fromPenggarap } = await supabase
    .from("penggaraps")
    .select("id, nama")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!fromPenggarap) notFound();

  // Ambil lahan penggarap asal
  const { data: lands } = await supabase
    .from("lands")
    .select("id, nama, luas, lokasi_koordinat")
    .eq("penggarap_id", id)
    .eq("user_id", user.id)
    .order("nama");

  // Ambil hutang aktif penggarap asal
  const { data: hutangAktif } = await supabase
    .from("debts")
    .select("id, jumlah, sisa, keperluan")
    .eq("penggarap_id", id)
    .eq("user_id", user.id)
    .gt("sisa", 0);

  const totalHutangAktif = (hutangAktif || []).reduce(
    (s, h) => s + Number(h.sisa),
    0
  );

  // Ambil penggarap lain (untuk opsi tujuan)
  const { data: otherPenggaraps } = await supabase
    .from("penggaraps")
    .select("id, nama")
    .eq("user_id", user.id)
    .neq("id", id)
    .order("nama");

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/penggarap/${id}`}
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke {fromPenggarap.nama}
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          🔄 Transfer Lahan
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Pindahkan lahan dari <strong>{fromPenggarap.nama}</strong> ke
          penggarap lain
        </p>
      </div>

      {!lands || lands.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="font-bold text-gray-900 mb-2">
            Tidak ada lahan untuk ditransfer
          </h3>
          <p className="text-gray-600 text-sm mb-6">
            {fromPenggarap.nama} belum punya lahan. Tambahkan lahan dulu.
          </p>
          <Link
            href={`/penggarap/${id}/lahan/baru`}
            className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-800 transition"
          >
            + Tambah Lahan
          </Link>
        </div>
      ) : !otherPenggaraps || otherPenggaraps.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="font-bold text-gray-900 mb-2">
            Tidak ada penggarap lain
          </h3>
          <p className="text-gray-600 text-sm mb-6">
            Butuh minimal 2 penggarap untuk transfer. Tambahkan penggarap baru
            dulu.
          </p>
          <Link
            href="/penggarap/baru"
            className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-800 transition"
          >
            + Tambah Penggarap
          </Link>
        </div>
      ) : (
        <TransferForm
          fromPenggarap={fromPenggarap}
          lands={lands}
          otherPenggaraps={otherPenggaraps}
          totalHutangAktif={totalHutangAktif}
          jumlahHutangAktif={hutangAktif?.length || 0}
        />
      )}
    </div>
  );
}

// ============ CLIENT COMPONENT FORM ============
import { TransferForm } from "./form";
