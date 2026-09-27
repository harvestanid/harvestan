import Link from "next/link";

const MENU_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/penggarap", label: "Penggarap", icon: "👨‍🌾" },
  { href: "/gabah", label: "Gabah", icon: "⚖️" },
  { href: "/panen-multi", label: "Panen", icon: "🌾" },
  { href: "/ukur-lahan", label: "Ukur", icon: "📍" },
  { href: "/keuangan", label: "Keuangan", icon: "💰" },
  { href: "/grafik", label: "Grafik", icon: "📈" },
  { href: "/laporan", label: "Laporan", icon: "📄" },
  { href: "/export", label: "Export", icon: "📥" },
  { href: "/import", label: "Import", icon: "📤" },
  { href: "/bantuan", label: "Bantuan", icon: "❓" },
  { href: "/pengaturan", label: "Setting", icon: "⚙️" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP NAV */}
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
        {/* SIDEBAR (DESKTOP) */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-3 sticky top-20">
            <nav className="space-y-1">
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* BOTTOM NAV (MOBILE) — SCROLLABLE */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className="flex gap-1 overflow-x-auto overflow-y-hidden py-2 px-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs text-gray-500 hover:text-green-700 hover:bg-green-50 transition flex-shrink-0 min-w-[60px]"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="h-20 md:h-0" />
    </div>
  );
}
