import Link from "next/link";

export default function RegisterPage() {
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

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              placeholder="Contoh: Budi Santoso"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            />
          </div>

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
              Nomor WhatsApp
            </label>
            <input
              type="tel"
              placeholder="08123456789"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Minimal 8 karakter"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            />
          </div>

          <button
            type="button"
            className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition"
          >
            Daftar Sekarang
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

        <p className="mt-6 text-xs text-gray-500 text-center">
          Dengan mendaftar, Anda menyetujui{" "}
          <a href="/terms" className="text-green-700 hover:underline">
            Syarat & Ketentuan
          </a>{" "}
          dan{" "}
          <a href="/privacy" className="text-green-700 hover:underline">
            Kebijakan Privasi
          </a>{" "}
          Harvestan.
        </p>
      </div>
    </div>
  );
}
