"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sukses, setSukses] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSukses(true);
    setLoading(false);
  }

  if (sukses) {
    return (
      <div className="bg-white rounded-3xl shadow-2xl shadow-[#2c5e2e]/10 border border-[#2c5e2e]/8 p-8 md:p-10 backdrop-blur-xl text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#f0b429]/20 flex items-center justify-center text-4xl">
          ✉️
        </div>
        <h1 className="text-2xl font-bold text-[#2c5e2e] tracking-tighter mb-3">
          Cek Email Anda
        </h1>
        <p className="text-sm text-[#2c5e2e]/70 leading-relaxed mb-6">
          Kami sudah kirim link reset password ke{" "}
          <strong className="text-[#2c5e2e]">{email}</strong>. Klik link di
          email untuk buat password baru.
        </p>
        <p className="text-xs text-[#2c5e2e]/50 italic mb-6">
          Tidak dapat email? Cek folder spam atau coba lagi 1 menit.
        </p>
        <Link
          href="/login"
          className="inline-block bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold px-8 py-3 rounded-full transition-all shadow-lg shadow-[#2c5e2e]/20 hover:scale-105"
        >
          ← Kembali ke Login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl shadow-[#2c5e2e]/10 border border-[#2c5e2e]/8 p-8 md:p-10 backdrop-blur-xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f0b429]/20 flex items-center justify-center text-3xl">
          🔐
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#2c5e2e] tracking-tighter mb-2">
          Lupa Password?
        </h1>
        <p className="text-[#2c5e2e]/60 text-sm leading-relaxed">
          Masukkan email terdaftar. Kami akan kirim link untuk reset password.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#2c5e2e] mb-1.5">
            Email Terdaftar
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            required
            className="w-full px-4 py-3 border border-[#2c5e2e]/15 rounded-2xl focus:ring-2 focus:ring-[#2c5e2e] focus:border-transparent outline-none transition bg-[#faf9f5]/50 text-[#2c5e2e]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#2c5e2e] hover:bg-[#1f4521] text-white py-3.5 rounded-full font-bold transition-all shadow-lg shadow-[#2c5e2e]/20 hover:shadow-[#2c5e2e]/40 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? "Mengirim..." : "Kirim Link Reset"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link
          href="/login"
          className="text-[#2c5e2e]/60 hover:text-[#2c5e2e] font-medium transition"
        >
          ← Kembali ke Login
        </Link>
      </div>
    </div>
  );
}
