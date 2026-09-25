import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TombolAksiHutang } from "./tombol-aksi";

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export default async function DetailHutangPage({
  params,
}: {
  params: Promise<{ id: string; debtId: string }>;
}) {
  const { id, debtId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: hutang } = await supabase
    .from("debts")
    .select("*")
    .eq("id", debtId)
    .single();

  if (!hutang) redirect(`/penggarap/${id}`);

  const { data: penggarap } = await supabase
    .from("penggaraps")
    .select("id, nama")
    .eq("id", id)
    .single();

  const lunas = Number(hutang.sisa) <= 0;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/penggarap/${id}`}
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke {penggarap?.nama || "Penggarap"}
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          💰 Detail Hutang
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {penggarap?.nama}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {lunas && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm text-center font-medium">
            ✅ HUTANG LUNAS
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Tanggal</p>
            <p className="font-semibold mt-1">
              {new Date(hutang.tanggal).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Keperluan</p>
            <p className="font-semibold mt-1">
              {hutang.keperluan || "-"}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-gray-500 uppercase">Jumlah</p>
            <p className="font-bold text-lg mt-1">
              {formatRp(Number(hutang.jumlah))}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Dibayar</p>
            <p className="font-bold text-lg text-green-700 mt-1">
              {formatRp(Number(hutang.dibayar || 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Sisa</p>
            <p
              className={`font-bold text-lg mt-1 ${
                lunas ? "text-green-700" : "text-red-600"
              }`}
            >
              {formatRp(Number(hutang.sisa))}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <TombolAksiHutang
            debtId={hutang.id}
            penggarapId={id}
            jumlah={Number(hutang.jumlah)}
            dibayar={Number(hutang.dibayar || 0)}
            keperluan={hutang.keperluan || ""}
          />
        </div>
      </div>
    </div>
  );
}
