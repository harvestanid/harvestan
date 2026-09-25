import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Masuk ke Harvestan
          </h1>
          <p className="text-gray-600 text-sm">
            Selamat datang kembali! 👋
          </p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="nama@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Masukkan password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-green-700 hover:underline"
            >
              Lupa password?
            </Link>
          </div>

          <button
            type="button"
            className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition"
          >
            Masuk
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Belum punya akun? </span>
          <Link
            href="/register"
            className="text-green-700 font-semibold hover:underline"
          >
            Daftar gratis
          </Link>
        </div>
      </div>
    </div>
  );
}
