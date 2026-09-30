"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SubscriptionWithUser = {
  id: string;
  user_id: string;
  is_premium: boolean;
  premium_until: string | null;
  premium_type: string | null;
  premium_source: string | null;
  payment_id: string | null;
  payment_amount: number | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_email: string | null;
  user_nama: string | null;
};

type Props = {
  subscriptions: SubscriptionWithUser[];
};

function formatTanggal(t: string | null) {
  if (!t) return "-";
  try {
    return new Date(t).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

export function SubscriptionKlien({ subscriptions }: Props) {
  const router = useRouter();

  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      if (filterStatus === "premium" && !s.is_premium) return false;
      if (filterStatus === "free" && s.is_premium) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !(s.user_email || "").toLowerCase().includes(q) &&
          !(s.user_nama || "").toLowerCase().includes(q) &&
          !s.user_id.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [subscriptions, filterStatus, search]);

  async function handleRevoke(s: SubscriptionWithUser) {
    const nama = s.user_nama || s.user_email || s.user_id.slice(0, 8);

    if (
      !confirm(
        `Cabut premium dari ${nama}?\n\n` +
          `User akan kembali ke paket Free.\n` +
          `Invoice tetap tercatat (approved).\n\n` +
          `Lanjut?`
      )
    )
      return;

    const alasan = prompt(
      `Alasan cabut premium (opsional, boleh kosong):\n\nContoh: testing akun`
    );

    // kalau user klik Cancel di prompt → batalkan
    if (alasan === null) return;

    setLoadingId(s.id);

    try {
      const res = await fetch("/api/admin/subscription/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: s.user_id,
          alasan: alasan.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal cabut premium"));
        return;
      }

      alert("✅ " + (json.message || "Premium dicabut"));
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Error"));
    } finally {
      setLoadingId(null);
    }
  }

  const adaFilterAktif = filterStatus || search;

  return (
    <div className="space-y-4">
      {/* FILTER BAR */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Cari nama / email / user_id..."
            className="flex-1 min-w-[200px] border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border-2 border-[#2c5e2e]/20 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
          >
            <option value="">Semua Status</option>
            <option value="premium">💎 Premium</option>
            <option value="free">🆓 Free</option>
          </select>

          {adaFilterAktif && (
            <button
              onClick={() => {
                setSearch("");
                setFilterStatus("");
              }}
              className="bg-[#2c5e2e]/10 hover:bg-[#2c5e2e]/20 text-[#2c5e2e] text-xs font-bold px-4 py-2 rounded-full transition-all"
            >
              🔄 Reset
            </button>
          )}

          <div className="text-xs text-[#2c5e2e]/60 italic ml-auto">
            {filtered.length} dari {subscriptions.length}
          </div>
        </div>
      </div>

      {/* LIST */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#2c5e2e]/20 rounded-3xl p-8 text-center">
          <div className="text-4xl mb-2 opacity-40">🔍</div>
          <p className="text-[#2c5e2e]/60 text-sm">
            Gak ada user yang cocok dengan filter
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const nama = s.user_nama || "(tanpa nama)";
            const email = s.user_email || "(tanpa email)";
            const isPremium = s.is_premium;

            return (
              <div
                key={s.id}
                className={`bg-white border-2 rounded-3xl p-4 transition-all ${
                  isPremium
                    ? "border-[#f0b429]/40 shadow-lg shadow-[#f0b429]/10"
                    : "border-[#2c5e2e]/10"
                }`}
              >
                <div className="flex items-start gap-3 flex-wrap md:flex-nowrap">
                  {/* Avatar */}
                  <div
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                      isPremium
                        ? "bg-gradient-to-br from-[#f0b429] to-[#e6a617]"
                        : "bg-[#2c5e2e]/5"
                    }`}
                  >
                    {isPremium ? "💎" : "🆓"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-[#2c5e2e] text-base line-clamp-1">
                        {nama}
                      </span>
                      {isPremium ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest bg-[#f0b429] text-[#2c5e2e]">
                          💎 Premium
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest bg-gray-200 text-gray-700">
                          🆓 Free
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#2c5e2e]/70 truncate">
                      📧 {email}
                    </div>

                    <div className="text-[10px] text-[#2c5e2e]/50 mt-0.5 font-mono truncate">
                      {s.user_id}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-[10px]">
                      <div>
                        <div className="text-[#2c5e2e]/50 font-bold uppercase tracking-wider">
                          Tipe
                        </div>
                        <div className="font-bold text-[#2c5e2e] mt-0.5">
                          {s.premium_type || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#2c5e2e]/50 font-bold uppercase tracking-wider">
                          Sumber
                        </div>
                        <div className="font-bold text-[#2c5e2e] mt-0.5 truncate">
                          {s.premium_source || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#2c5e2e]/50 font-bold uppercase tracking-wider">
                          Payment
                        </div>
                        <div className="font-bold text-[#2c5e2e] mt-0.5 truncate">
                          {s.payment_id || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#2c5e2e]/50 font-bold uppercase tracking-wider">
                          Diperbarui
                        </div>
                        <div className="font-bold text-[#2c5e2e] mt-0.5 truncate">
                          {formatTanggal(s.updated_at)}
                        </div>
                      </div>
                    </div>

                    {s.notes && (
                      <div className="mt-2 bg-[#2c5e2e]/5 rounded-xl px-3 py-2">
                        <div className="text-[10px] text-[#2c5e2e]/60 leading-relaxed break-words">
                          📝 {s.notes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0 w-full md:w-auto md:min-w-[140px]">
                    {isPremium && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(s)}
                        disabled={loadingId === s.id}
                        className="text-[11px] bg-red-50 hover:bg-red-100 border-2 border-red-300 text-red-700 font-bold py-2 px-3 rounded-full transition-all disabled:opacity-50"
                      >
                        {loadingId === s.id
                          ? "⏳ Memproses..."
                          : "❌ Cabut Premium"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
