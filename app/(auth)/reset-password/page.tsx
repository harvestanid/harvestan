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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/update`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSukses(true);
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Lupa Password?
          </h1>
          <p className="text-gray-600 text-sm">
            Masukkan email yang terdaftar. Kami akan kirim link untuk membuat
            password baru.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            ❌ {error}
          </div>
        )}

        {sukses ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              <div className="font-bold mb-1">✅ Email terkirim!</div>
              <p className="text-xs">
                Kami sudah mengirim link reset password ke{" "}
                <strong>{email}</strong>. Cek inbox atau folder spam Anda.
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
              <strong>💡 Tips:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Link berlaku selama 1 jam</li>
                <li>Cek folder Spam/Promotions kalau tidak ketemu</li>
                <li>Pastikan email diketik dengan benar</li>
              </ul>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setSukses(false);
                  setEmail("");
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition"
              >
                Kirim Ulang ke Email Lain
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>⏳ Mengirim...</>
              ) : (
                <>📧 Kirim Link Reset</>
              )}
            </button>
          </form>
        )}

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
