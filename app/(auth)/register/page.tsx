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

  // ===== VALIDASI USERNAME =====
  const usernameRegex = /^[a-z0-9_]{3,20}$/;
  const usernameValid = username.length === 0 || usernameRegex.test(username);
  const usernameTooShort = username.length > 0 && username.length < 3;
  const usernameTooLong = username.length > 20;
  const usernameHasInvalidChar =
    username.length > 0 && !usernameRegex.test(username);

  // ===== VALIDASI PASSWORD =====
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

  // Auto-format username: lowercase, hapus spasi & karakter aneh
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

    const { data, error } = await supabase.auth.signUp({
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
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Daftar Akun Harvestan
          </h1>
          <p className="text-gray-600 text-sm">
            Gratis selamanya untuk 1 lahan pertama
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            ❌ {error}
          </div>
        )}

        {/* ===== TOMBOL GOOGLE ===== */}
        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={loadingGoogle || loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
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
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-gray-500">atau</span>
          </div>
        </div>

        {/* ===== FORM REGISTER ===== */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* ===== USERNAME ===== */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="budisantoso"
                required
                maxLength={20}
                className={`w-full pl-9 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  usernameTooShort || usernameHasInvalidChar || usernameTooLong
                    ? "border-red-300 focus:ring-red-500"
                    : username.length >= 3 && usernameValid
                    ? "border-green-300 focus:ring-green-500"
                    : "border-gray-300 focus:ring-green-500"
                }`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
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
              <p className="text-xs text-green-600 mt-1">
                ✅ Username <strong>@{username}</strong> siap digunakan
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  passwordTooShort
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-green-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
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

          {/* Konfirmasi Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                type={showKonfirmasi ? "text" : "password"}
                value={konfirmasi}
                onChange={(e) => setKonfirmasi(e.target.value)}
                placeholder="Ulangi password"
                required
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  passwordMismatch
                    ? "border-red-300 focus:ring-red-500"
                    : konfirmasi && password === konfirmasi
                    ? "border-green-300 focus:ring-green-500"
                    : "border-gray-300 focus:ring-green-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowKonfirmasi(!showKonfirmasi)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
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
              <p className="text-xs text-green-600 mt-1">
                ✅ Password cocok
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!bisaSubmit}
            className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Mendaftar..." : "Daftar Sekarang"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Sudah punya akun? </span>
          <Link
            href="/login"
            className="text-green-700 font-semibold hover:underline"
          >
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
