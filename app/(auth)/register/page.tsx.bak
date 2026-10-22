"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState("");

  const usernameRegex = /^[a-z0-9_]{3,20}$/;
  const usernameValid = username.length === 0 || usernameRegex.test(username);
  const usernameTooShort = username.length > 0 && username.length < 3;
  const usernameTooLong = username.length > 20;
  const usernameHasInvalidChar =
    username.length > 0 && !usernameRegex.test(username);

  const passwordMismatch = konfirmasi.length > 0 && password !== konfirmasi;
  const passwordTooShort = password.length > 0 && password.length < 8;

  const bisaSubmit =
    nama.trim() &&
    username.trim() &&
    usernameValid &&
    email.trim() &&
    password.length >= 8 &&
    password === konfirmasi &&
    !loading &&
    !loadingGoogle;

  function handleUsernameChange(val: string) {
    const clean = val
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    setUsername(clean);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!usernameRegex.test(username)) {
      setError(
        "Username hanya boleh huruf kecil, angka, dan underscore (_). 3-20 karakter."
      );
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }
    if (password !== konfirmasi) {
      setError("Password dan konfirmasi tidak sama");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nama: nama.trim(),
          username: username.trim().toLowerCase(),
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleRegister() {
    setError("");
    setLoadingGoogle(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoadingGoogle(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl shadow-[#2c5e2e]/10 border border-[#2c5e2e]/8 p-8 md:p-10 backdrop-blur-xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#2c5e2e] tracking-tighter mb-2">
          Mulai Kelola Lahan Anda
        </h1>
        <p className="text-[#2c5e2e]/60 text-sm">
          Daftar dalam 30 detik · Tanpa kartu kredit
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      {/* TOMBOL GOOGLE */}
      <button
        type="button"
        onClick={handleGoogleRegister}
        disabled={loadingGoogle || loading}
        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#2c5e2e]/15 text-[#2c5e2e] font-semibold py-3 rounded-full hover:border-[#f0b429]/60 hover:bg-[#f0b429]/5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span>
          {loadingGoogle ? "Menghubungkan..." : "Daftar dengan Google"}
        </span>
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#2c5e2e]/10"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-white text-[#2c5e2e]/40 font-medium uppercase tracking-widest">
            atau
          </span>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#2c5e2e] mb-1.5">
            Nama Lengkap
          </label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Budi Santoso"
            required
            className="w-full px-4 py-3 border border-[#2c5e2e]/15 rounded-2xl focus:ring-2 focus:ring-[#2c5e2e] focus:border-transparent outline-none transition bg-[#faf9f5]/50 text-[#2c5e2e]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#2c5e2e] mb-1.5">
            Username <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2c5e2e]/40 font-bold">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="budisantoso"
              required
              maxLength={20}
              className={`w-full pl-9 pr-4 py-3 border rounded-2xl focus:ring-2 focus:border-transparent outline-none transition bg-[#faf9f5]/50 text-[#2c5e2e] ${
                usernameTooShort || usernameHasInvalidChar || usernameTooLong
                  ? "border-red-300 focus:ring-red-500"
                  : username.length >= 3 && usernameValid
                  ? "border-[#2c5e2e]/40 focus:ring-[#2c5e2e]"
                  : "border-[#2c5e2e]/15 focus:ring-[#2c5e2e]"
              }`}
            />
          </div>
          <p className="text-[10px] text-[#2c5e2e]/50 mt-1.5">
            Huruf kecil, angka, dan underscore (_). 3-20 karakter.
          </p>
          {usernameTooShort && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ Username minimal 3 karakter
            </p>
          )}
          {usernameHasInvalidChar && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ Hanya huruf kecil, angka, dan underscore (_)
            </p>
          )}
          {username.length >= 3 && usernameValid && (
            <p className="text-xs text-[#2c5e2e] mt-1 font-medium">
              ✅ Username <strong>@{username}</strong> siap
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#2c5e2e] mb-1.5">
            Email
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

        <div>
          <label className="block text-sm font-semibold text-[#2c5e2e] mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              required
              minLength={8}
              className={`w-full px-4 py-3 pr-12 border rounded-2xl focus:ring-2 focus:border-transparent outline-none transition bg-[#faf9f5]/50 text-[#2c5e2e] ${
                passwordTooShort
                  ? "border-red-300 focus:ring-red-500"
                  : "border-[#2c5e2e]/15 focus:ring-[#2c5e2e]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2c5e2e]/50 hover:text-[#2c5e2e] text-sm transition"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          {passwordTooShort && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ Password minimal 8 karakter
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#2c5e2e] mb-1.5">
            Konfirmasi Password
          </label>
          <div className="relative">
            <input
              type={showKonfirmasi ? "text" : "password"}
              value={konfirmasi}
              onChange={(e) => setKonfirmasi(e.target.value)}
              placeholder="Ulangi password"
              required
              className={`w-full px-4 py-3 pr-12 border rounded-2xl focus:ring-2 focus:border-transparent outline-none transition bg-[#faf9f5]/50 text-[#2c5e2e] ${
                passwordMismatch
                  ? "border-red-300 focus:ring-red-500"
                  : konfirmasi && password === konfirmasi
                  ? "border-[#2c5e2e]/40 focus:ring-[#2c5e2e]"
                  : "border-[#2c5e2e]/15 focus:ring-[#2c5e2e]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowKonfirmasi(!showKonfirmasi)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2c5e2e]/50 hover:text-[#2c5e2e] text-sm transition"
            >
              {showKonfirmasi ? "🙈" : "👁️"}
            </button>
          </div>
          {passwordMismatch && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ Password tidak sama
            </p>
          )}
          {konfirmasi && password === konfirmasi && (
            <p className="text-xs text-[#2c5e2e] mt-1 font-medium">
              ✅ Password cocok
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!bisaSubmit}
          className="w-full bg-[#2c5e2e] hover:bg-[#1f4521] text-white py-3.5 rounded-full font-bold transition-all shadow-lg shadow-[#2c5e2e]/20 hover:shadow-[#2c5e2e]/40 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? "Mendaftar..." : "Daftar Sekarang"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-[#2c5e2e]/60">Sudah punya akun? </span>
        <Link
          href="/login"
          className="text-[#2c5e2e] font-bold hover:text-[#f0b429] transition"
        >
          Masuk di sini
        </Link>
      </div>
    </div>
  );
}
