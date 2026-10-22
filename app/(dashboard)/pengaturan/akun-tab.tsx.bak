"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  user: {
    email: string;
    nama: string;
    username: string;
  };
};

export function AkunTab({ user }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [nama, setNama] = useState(user.nama);
  const [username, setUsername] = useState(user.username);
  const [loadingProfil, setLoadingProfil] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingHapus, setLoadingHapus] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState("");

  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiBaru, setKonfirmasiBaru] = useState("");

  const usernameRegex = /^[a-z0-9_]{3,20}$/;
  const usernameValid = usernameRegex.test(username);

  async function simpanProfil(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSukses("");

    if (!nama.trim()) {
      setError("Nama tidak boleh kosong");
      return;
    }
    if (!usernameValid) {
      setError(
        "Username: huruf kecil, angka, underscore (_), 3-20 karakter"
      );
      return;
    }

    setLoadingProfil(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          nama: nama.trim(),
          username: username.trim().toLowerCase(),
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSukses("✅ Profil berhasil diperbarui");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setLoadingProfil(false);
    }
  }

  async function gantiPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSukses("");

    if (passwordBaru.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }
    if (passwordBaru !== konfirmasiBaru) {
      setError("Password tidak sama");
      return;
    }

    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordBaru,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSukses("✅ Password berhasil diubah");
      setPasswordBaru("");
      setKonfirmasiBaru("");
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setLoadingPassword(false);
    }
  }

  async function hapusAkun() {
    const konfirmasi = prompt(
      "Ketik HAPUS untuk konfirmasi hapus akun. Semua data akan hilang permanen!"
    );
    if (konfirmasi !== "HAPUS") return;

    setLoadingHapus(true);
    setError("");
    try {
      const res = await fetch("/api/akun", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Gagal hapus akun");
        return;
      }
      alert("Akun Anda telah dihapus.");
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setLoadingHapus(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-sm text-red-700">
          ❌ {error}
        </div>
      )}
      {sukses && (
        <div className="p-4 bg-[#2c5e2e]/5 border-2 border-[#2c5e2e]/20 rounded-2xl text-sm text-[#2c5e2e] font-bold">
          {sukses}
        </div>
      )}

      {/* ===== PROFIL ===== */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 md:p-6 shadow-lg shadow-[#2c5e2e]/5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#f0b429]/15 flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <h2 className="font-bold text-[#2c5e2e] tracking-tight">
              Profil Anda
            </h2>
            <p className="text-[10px] text-[#2c5e2e]/60 uppercase tracking-widest">
              Informasi akun
            </p>
          </div>
        </div>

        <form onSubmit={simpanProfil} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest block mb-2">
              Email (tidak bisa diubah)
            </label>
            <input
              type="email"
              value={user.email}
              readOnly
              className="w-full border-2 border-[#2c5e2e]/10 rounded-2xl px-4 py-3 text-sm bg-[#faf9f5]/50 text-[#2c5e2e]/50 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest block mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama lengkap"
              className="w-full border-2 border-[#2c5e2e]/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5e2e] focus:border-transparent bg-[#faf9f5]/50 text-[#2c5e2e]"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest block mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2c5e2e]/40 font-bold">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "_")
                      .replace(/[^a-z0-9_]/g, "")
                  )
                }
                placeholder="username"
                maxLength={20}
                className={`w-full pl-9 pr-4 py-3 border-2 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition bg-[#faf9f5]/50 text-[#2c5e2e] ${
                  usernameValid || username.length === 0
                    ? "border-[#2c5e2e]/15 focus:ring-[#2c5e2e]"
                    : "border-red-300 focus:ring-red-500"
                }`}
                required
              />
            </div>
            <p className="text-[10px] text-[#2c5e2e]/50 mt-1.5">
              Huruf kecil, angka, underscore (_). 3-20 karakter.
            </p>
          </div>

          <button
            type="submit"
            disabled={loadingProfil}
            className="w-full bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-3.5 rounded-full transition-all shadow-lg shadow-[#2c5e2e]/20 hover:scale-[1.02] disabled:opacity-50 text-sm uppercase tracking-widest"
          >
            {loadingProfil ? "⏳ Menyimpan..." : "💾 Simpan Profil"}
          </button>
        </form>
      </div>

      {/* ===== GANTI PASSWORD ===== */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 md:p-6 shadow-lg shadow-[#2c5e2e]/5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#2c5e2e]/10 flex items-center justify-center text-2xl">
            🔒
          </div>
          <div>
            <h2 className="font-bold text-[#2c5e2e] tracking-tight">
              Ganti Password
            </h2>
            <p className="text-[10px] text-[#2c5e2e]/60 uppercase tracking-widest">
              Keamanan akun
            </p>
          </div>
        </div>

        <form onSubmit={gantiPassword} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest block mb-2">
              Password Baru
            </label>
            <input
              type="password"
              value={passwordBaru}
              onChange={(e) => setPasswordBaru(e.target.value)}
              placeholder="Minimal 8 karakter"
              minLength={8}
              className="w-full border-2 border-[#2c5e2e]/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5e2e] focus:border-transparent bg-[#faf9f5]/50 text-[#2c5e2e]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest block mb-2">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              value={konfirmasiBaru}
              onChange={(e) => setKonfirmasiBaru(e.target.value)}
              placeholder="Ulangi password"
              className="w-full border-2 border-[#2c5e2e]/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5e2e] focus:border-transparent bg-[#faf9f5]/50 text-[#2c5e2e]"
            />
          </div>

          <button
            type="submit"
            disabled={loadingPassword}
            className="w-full bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] font-bold py-3.5 rounded-full transition-all shadow-lg shadow-[#f0b429]/20 hover:scale-[1.02] disabled:opacity-50 text-sm uppercase tracking-widest"
          >
            {loadingPassword ? "⏳ Menyimpan..." : "🔐 Ganti Password"}
          </button>
        </form>
      </div>

      {/* ===== ZONA BAHAYA ===== */}
      <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-5 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <div>
            <h2 className="font-bold text-red-900 tracking-tight">
              Zona Bahaya
            </h2>
            <p className="text-[10px] text-red-700/70 uppercase tracking-widest">
              Tidak bisa di-undo
            </p>
          </div>
        </div>

        <p className="text-xs text-red-700 mb-4 leading-relaxed">
          Hapus akun akan <strong>menghapus semua data</strong> Anda:
          penggarap, lahan, panen, hutang, dan seterusnya. Tindakan ini
          permanen dan tidak bisa dibatalkan.
        </p>

        <button
          type="button"
          onClick={hapusAkun}
          disabled={loadingHapus}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-full transition-all shadow-lg shadow-red-600/20 hover:scale-[1.02] disabled:opacity-50 text-sm uppercase tracking-widest"
        >
          {loadingHapus ? "⏳ Menghapus..." : "🗑️ Hapus Akun Saya"}
        </button>
      </div>
    </div>
  );
}
