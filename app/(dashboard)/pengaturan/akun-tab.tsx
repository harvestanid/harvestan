"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type UserInfo = {
  id: string;
  email: string;
  nama: string;
  createdAt: string;
};

type Stats = {
  penggarapCount: number;
  lahanCount: number;
  panenCount: number;
  totalHutangAktif: number;
};

type Props = {
  user: UserInfo;
  stats: Stats;
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function AkunTab({ user, stats }: Props) {
  const router = useRouter();
  const supabase = createClient();

  // ===== STATE PROFIL =====
  const [nama, setNama] = useState(user.nama);
  const [savingProfil, setSavingProfil] = useState(false);
  const [msgProfil, setMsgProfil] = useState("");

  // ===== STATE PASSWORD =====
  const [pwLama, setPwLama] = useState("");
  const [pwBaru, setPwBaru] = useState("");
  const [pwKonfirmasi, setPwKonfirmasi] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [msgPassword, setMsgPassword] = useState("");

  // ===== STATE HAPUS AKUN =====
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAkun, setDeletingAkun] = useState(false);

  // ===== HANDLE UPDATE PROFIL =====
  async function handleUpdateProfil(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfil(true);
    setMsgProfil("");

    const { error } = await supabase.auth.updateUser({
      data: { nama },
    });

    setSavingProfil(false);

    if (error) {
      setMsgProfil("❌ Gagal: " + error.message);
      return;
    }

    setMsgProfil("✅ Profil berhasil disimpan!");
    setTimeout(() => setMsgProfil(""), 3000);
    router.refresh();
  }

  // ===== HANDLE GANTI PASSWORD =====
  async function handleGantiPassword(e: React.FormEvent) {
    e.preventDefault();

    if (pwBaru.length < 8) {
      setMsgPassword("❌ Password baru minimal 8 karakter");
      return;
    }

    if (pwBaru !== pwKonfirmasi) {
      setMsgPassword("❌ Konfirmasi password tidak cocok");
      return;
    }

    if (pwBaru === pwLama) {
      setMsgPassword("❌ Password baru harus berbeda dari yang lama");
      return;
    }

    setSavingPassword(true);
    setMsgPassword("");

    // Verifikasi password lama dengan login ulang
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: pwLama,
    });

    if (signInError) {
      setSavingPassword(false);
      setMsgPassword("❌ Password lama salah");
      return;
    }

    // Update password baru
    const { error } = await supabase.auth.updateUser({
      password: pwBaru,
    });

    setSavingPassword(false);

    if (error) {
      setMsgPassword("❌ Gagal: " + error.message);
      return;
    }

    setMsgPassword("✅ Password berhasil diubah!");
    setPwLama("");
    setPwBaru("");
    setPwKonfirmasi("");
    setTimeout(() => setMsgPassword(""), 5000);
  }

  // ===== HANDLE HAPUS AKUN =====
  async function handleHapusAkun(e: React.FormEvent) {
    e.preventDefault();

    if (deleteConfirmText !== "HAPUS AKUN") {
      alert('Ketik "HAPUS AKUN" untuk konfirmasi');
      return;
    }

    setDeletingAkun(true);

    const res = await fetch("/api/akun/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: deleteConfirmText }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setDeletingAkun(false);
      alert("❌ Gagal hapus akun: " + (json.error || "Unknown error"));
      return;
    }

    // Sign out & redirect
    await supabase.auth.signOut();
    alert("Akun berhasil dihapus. Terima kasih sudah menggunakan Harvestan.");
    router.push("/");
  }

  return (
    <div className="space-y-6">
      {/* ===== PROFIL ===== */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
          👤 Profil
        </h2>
        <form onSubmit={handleUpdateProfil} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              📧 Email tidak bisa diubah. Hubungi support kalau perlu ganti.
            </p>
          </div>

          {msgProfil && (
            <div className="text-sm text-green-700">{msgProfil}</div>
          )}

          <button
            type="submit"
            disabled={savingProfil}
            className="bg-green-700 hover:bg-green-800 text-white font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
          >
            {savingProfil ? "⏳ Menyimpan..." : "💾 Simpan Profil"}
          </button>
        </form>
      </div>

      {/* ===== GANTI PASSWORD ===== */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
          🔒 Ganti Password
        </h2>
        <form onSubmit={handleGantiPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password Lama
            </label>
            <input
              type="password"
              value={pwLama}
              onChange={(e) => setPwLama(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password Baru (min 8 karakter)
            </label>
            <input
              type="password"
              value={pwBaru}
              onChange={(e) => setPwBaru(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              value={pwKonfirmasi}
              onChange={(e) => setPwKonfirmasi(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {msgPassword && (
            <div
              className={`text-sm ${
                msgPassword.startsWith("✅")
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {msgPassword}
            </div>
          )}

          <button
            type="submit"
            disabled={savingPassword}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
          >
            {savingPassword ? "⏳ Mengganti..." : "🔒 Ganti Password"}
          </button>
        </form>
      </div>

      {/* ===== INFO AKUN ===== */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
          📊 Info Akun
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium text-gray-900">{user.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">User ID:</span>
            <span className="font-mono text-xs text-gray-700">
              {user.id.substring(0, 8)}...
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Terdaftar sejak:</span>
            <span className="font-medium text-gray-900">
              {new Date(user.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="pt-3 mt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-xs text-green-700 font-medium">
                PENGGARAP
              </div>
              <div className="text-xl font-bold text-green-900 mt-1">
                {stats.penggarapCount}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="text-xs text-blue-700 font-medium">LAHAN</div>
              <div className="text-xl font-bold text-blue-900 mt-1">
                {stats.lahanCount}
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <div className="text-xs text-yellow-700 font-medium">PANEN</div>
              <div className="text-xl font-bold text-yellow-900 mt-1">
                {stats.panenCount}
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <div className="text-xs text-red-700 font-medium">
                HUTANG AKTIF
              </div>
              <div className="text-sm font-bold text-red-900 mt-1">
                {formatRp(stats.totalHutangAktif)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ZONA BERBAHAYA ===== */}
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <h2 className="font-bold text-red-900 mb-2 text-sm uppercase tracking-wide">
          ⚠️ Zona Berbahaya
        </h2>
        <p className="text-sm text-red-800 mb-4">
          Hapus akun Anda beserta SEMUA data (penggarap, lahan, panen, hutang).
          Tindakan ini <strong>tidak bisa dibatalkan</strong>.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2 rounded-lg transition"
          >
            🗑️ Hapus Akun Saya
          </button>
        ) : (
          <form onSubmit={handleHapusAkun} className="space-y-3">
            <div className="bg-white border border-red-300 rounded-lg p-3">
              <label className="block text-xs font-medium text-red-800 mb-1">
                Ketik <strong>"HAPUS AKUN"</strong> untuk konfirmasi:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="HAPUS AKUN"
                className="w-full border border-red-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={
                  deletingAkun || deleteConfirmText !== "HAPUS AKUN"
                }
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingAkun ? "⏳ Menghapus..." : "🗑️ Hapus Permanen"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-5 py-2 rounded-lg transition"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
