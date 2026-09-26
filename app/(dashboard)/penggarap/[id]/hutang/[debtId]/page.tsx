import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TombolAksiHutang } from "./tombol-aksi";

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

const AKSI_LABEL: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  potong_panen: {
    label: "Dipotong dari Panen",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: "💸",
  },
  potong_edit_panen: {
    label: "Dipotong (Edit Panen)",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: "💸",
  },
  revert_edit_panen: {
    label: "Dikembalikan (Revert Edit)",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    icon: "↩️",
  },
};

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

  // Ambil log perubahan
  const log = Array.isArray(hutang.log_perubahan) ? hutang.log_perubahan : [];

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
        <p className="text-gray-600 text-sm mt-1">{penggarap?.nama}</p>
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
            <p className="font-semibold mt-1">{hutang.keperluan || "-"}</p>
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

        {/* Log Perubahan */}
        {log.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 uppercase mb-3">
              📜 Log Perubahan ({log.length})
            </p>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {log
                .slice()
                .reverse()
                .map((entry: any, i: number) => {
                  const info = AKSI_LABEL[entry.aksi] || {
                    label: entry.aksi,
                    color: "text-gray-700",
                    bg: "bg-gray-50 border-gray-200",
                    icon: "•",
                  };
                  return (
                    <div
                      key={i}
                      className={`rounded-lg p-3 text-xs border ${info.bg}`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className={`font-bold ${info.color}`}>
                          {info.icon} {info.label}
                        </div>
                        <div className="text-gray-500">
                          {new Date(entry.waktu).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <div className="mt-2 text-gray-700">
                        Jumlah:{" "}
                        <strong className="text-gray-900">
                          {formatRp(Number(entry.jumlah))}
                        </strong>
                      </div>
                      <div className="mt-0.5 text-gray-600">
                        Sisa:{" "}
                        <span className="font-mono">
                          {formatRp(Number(entry.sisa_sebelum))}
                        </span>{" "}
                        →{" "}
                        <strong className="font-mono text-gray-900">
                          {formatRp(Number(entry.sisa_sesudah))}
                        </strong>
                      </div>
                      {entry.keterangan && (
                        <div className="text-gray-500 italic mt-1">
                          {entry.keterangan}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {log.length === 0 && (
          <div className="pt-4 border-t">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 text-center">
              📜 Belum ada log perubahan. Log akan muncul jika ada potong
              hutang dari panen.
            </div>
          </div>
        )}

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
