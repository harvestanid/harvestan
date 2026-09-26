import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <span className="font-bold text-green-800">Harvestan</span>
          </Link>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-red-600 transition"
            >
              Keluar
            </button>
          </form>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto flex gap-6 px-4 py-6">
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-3 sticky top-20">
            <nav className="space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <span className="text-lg">📊</span>
                <span>Dashboard</span>
              </Link>
              <Link
                href="/penggarap"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <span className="text-lg">👨‍🌾</span>
                <span>Penggarap</span>
              </Link>
              <Link
                href="/gabah"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <span className="text-lg">⚖️</span>
                <span>Penimbangan Gabah</span>
              </Link>
              <Link
                href="/panen-multi"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <span className="text-lg">🌾</span>
                <span>Panen Multi</span>
              </Link>
              <Link
                href="/ukur-lahan"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <span className="text-lg">📍</span>
                <span>Ukur Lahan GPS</span>
              </Link>
              <Link
                href="/keuangan"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <span className="text-lg">💰</span>
                <span>Keuangan</span>
              </Link>
              <Link
                href="/grafik"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <span className="text-lg">📈</span>
                <span>Grafik</span>
              </Link>
              <Link
                href="/export"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <span className="text-lg">📥</span>
                <span>Export Data</span>
              </Link>
              <Link
                href="/bantuan"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <span className="text-lg">❓</span>
                <span>Bantuan</span>
              </Link>
              <Link
                href="/pengaturan"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <span className="text-lg">⚙️</span>
                <span>Pengaturan</span>
              </Link>
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-40">
        <div className="flex justify-around overflow-x-auto">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 transition flex-shrink-0"
          >
            <span className="text-xl">📊</span>
            <span className="text-[10px] whitespace-nowrap">Dashboard</span>
          </Link>
          <Link
            href="/penggarap"
            className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 transition flex-shrink-0"
          >
            <span className="text-xl">👨‍🌾</span>
            <span className="text-[10px] whitespace-nowrap">Penggarap</span>
          </Link>
          <Link
            href="/gabah"
            className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 transition flex-shrink-0"
          >
            <span className="text-xl">⚖️</span>
            <span className="text-[10px] whitespace-nowrap">Gabah</span>
          </Link>
          <Link
            href="/panen-multi"
            className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 transition flex-shrink-0"
          >
            <span className="text-xl">🌾</span>
            <span className="text-[10px] whitespace-nowrap">Panen</span>
          </Link>
          <Link
            href="/ukur-lahan"
            className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 transition flex-shrink-0"
          >
            <span className="text-xl">📍</span>
            <span className="text-[10px] whitespace-nowrap">Ukur</span>
          </Link>
          <Link
            href="/keuangan"
            className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 transition flex-shrink-0"
          >
            <span className="text-xl">💰</span>
            <span className="text-[10px] whitespace-nowrap">Keuangan</span>
          </Link>
          <Link
            href="/grafik"
            className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 transition flex-shrink-0"
          >
            <span className="text-xl">📈</span>
            <span className="text-[10px] whitespace-nowrap">Grafik</span>
          </Link>
          <Link
            href="/export"
            className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 transition flex-shrink-0"
          >
            <span className="text-xl">📥</span>
            <span className="text-[10px] whitespace-nowrap">Export</span>
          </Link>
        </div>
      </nav>

      <div className="h-20 md:h-0" />
    </div>
  );
}
