"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState(false);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  // Cek apakah ada session valid (dari link reset email)
  useEffect(() => {
    async function cek() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSessionValid(false);
        return;
      }
      setSessionValid(true);
    }
    cek();
  }, [supabase.auth]);

  const passwordMismatch =
    konfirmasi.length > 0 && password !== konfirmasi;
  const passwordTooShort = password.length > 0 && password.length < 8;
  const bisaSubmit =
    password.length >= 8 &&
    password === konfirmasi &&
    !loading &&
    !sukses;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }
    if (password !== konfirmasi) {
      setError("Password dan konfirmasi tidak sama");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSukses(true);

    // Redirect ke dashboard setelah 2 detik
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2000);
  }

  // Loading state saat cek session
  if (sessionValid === null) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-gray-600 text-sm">Memverifikasi link...</p>
        </div>
      </div>
    );
  }

  // Kalau session tidak valid (link expired / salah)
  if (sessionValid === false) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Link Tidak Valid
            </h1>
            <p className="text-gray-600 text-sm">
              Link reset password sudah kadaluarsa atau tidak valid.
            </p>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 mb-4">
            <strong>💡 Kemungkinan penyebab:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Link sudah lebih dari 1 jam</li>
              <li>Link sudah pernah digunakan</li>
              <li>Link disalin tidak lengkap</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Link
              href="/reset-password"
              className="block w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-lg text-center transition"
            >
              🔄 Minta Link Baru
            </Link>
            <Link
              href="/login"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg text-center transition"
            >
              ← Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Sukses
  if (sukses) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Password Berhasil Diubah!
          </h1>
          <p className="text-gray-600 text-sm mb-4">
            Anda akan diarahkan ke dashboard dalam beberapa detik...
          </p>
          <div className="inline-block w-6 h-6 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Form input password baru
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Buat Password Baru
          </h1>
          <p className="text-gray-600 text-sm">
            Masukkan password baru untuk akun Anda
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                required
                minLength={8}
                autoFocus
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <input
                type={showKonfirmasi ? "text" : "password"}
                value={konfirmasi}
                onChange={(e) => setKonfirmasi(e.target.value)}
                placeholder="Ulangi password baru"
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
            {loading ? "Menyimpan..." : "✅ Simpan Password Baru"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link
            href="/login"
            className="text-green-700 font-semibold hover:underline"
          >
            ← Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
