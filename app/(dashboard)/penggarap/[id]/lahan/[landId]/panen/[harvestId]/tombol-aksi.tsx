"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  harvestId: string;
  penggarapId: string;
  landId: string;
  potonganHutang?: number;
};

export function TombolAksiPanen({
  harvestId,
  penggarapId,
  landId,
  potonganHutang = 0,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const punyaPotongan = potonganHutang > 0;
    let pesan = "Hapus data panen ini? Tidak bisa dibatalkan.";
    if (punyaPotongan) {
      pesan =
        `Hapus data panen ini?\n\n` +
        `⚠️ Panen ini punya potongan hutang Rp ${Math.round(potonganHutang).toLocaleString("id-ID")}.\n` +
        `Hutang akan OTOMATIS DIKEMBALIKAN (revert) ke penggarap.\n\n` +
        `Lanjutkan?`;
    }

    if (!confirm(pesan)) return;

    setLoading(true);
    const res = await fetch(`/api/panen/${harvestId}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert("❌ Gagal hapus: " + (json.error || "Unknown error"));
      return;
    }

    const json = await res.json().catch(() => ({}));
    if (json.reverted && json.reverted > 0) {
      alert(
        `✅ Panen berhasil dihapus!\n\n` +
          `💸 Hutang Rp ${Math.round(json.reverted).toLocaleString("id-ID")} ` +
          `otomatis dikembalikan ke penggarap.`
      );
    } else {
      alert("✅ Panen berhasil dihapus!");
    }

    router.push(`/penggarap/${penggarapId}/lahan/${landId}`);
  }

  return (
    <div className="flex gap-3 flex-wrap">
      <Link
        href={`/penggarap/${penggarapId}/lahan/${landId}/panen/${harvestId}/edit`}
        className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-5 py-2 rounded-lg transition"
      >
        ✏️ Edit Panen
      </Link>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
      >
        {loading ? "Menghapus..." : "🗑️ Hapus Panen"}
      </button>
    </div>
  );
}
