import Link from "next/link";
import { getPenggarapList } from "@/lib/supabase/queries/penggarap-server";

export default async function PenggarapPage() {
  const penggaraps = await getPenggarapList();

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">👨‍🌾 Penggarap</h1>
          <p className="text-gray-600 mt-1 text-sm">
            {penggaraps.length === 0
              ? "Belum ada penggarap. Tambahkan yang pertama!"
              : `${penggaraps.length} penggarap terdaftar`}
          </p>
        </div>
        <Link
          href="/penggarap/baru"
          className="bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-800 transition text-sm"
        >
          + Tambah Penggarap
        </Link>
      </div>

      {/* Empty state */}
      {penggaraps.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="font-bold text-gray-900 mb-2">
            Belum ada penggarap
          </h3>
          <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
            Mulai kelola lahan dan bagi hasil dengan menambahkan penggarap
            pertama Anda.
          </p>
          <Link
            href="/penggarap/baru"
            className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-800 transition"
          >
            + Tambah Penggarap Pertama
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Nama
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">
                    Kontak
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">
                    Usia
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">
                    Alamat
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {penggaraps.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{p.nama}</div>
                      <div className="text-xs text-gray-500 sm:hidden">
                        {p.kontak || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                      {p.kontak || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      {p.usia ? `${p.usia} th` : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                      {p.alamat || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/penggarap/${p.id}`}
                        className="text-green-700 hover:text-green-800 font-medium text-xs"
                      >
                        Detail →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
