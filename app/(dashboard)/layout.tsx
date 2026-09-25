"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/penggarap", label: "Penggarap", icon: "👨‍🌾" },
  { href: "/gabah", label: "Penimbangan Gabah", icon: "⚖️" },
  { href: "/keuangan", label: "Keuangan", icon: "💰" },
  { href: "/export", label: "Export Data", icon: "📥" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar */}
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
        {/* Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-3 sticky top-20">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? "bg-green-50 text-green-800"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-40">
        <div className="flex justify-around">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs transition ${
                  isActive ? "text-green-700" : "text-gray-500"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px]">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Padding bottom untuk mobile nav */}
      <div className="h-20 md:h-0" />
    </div>
  );
}
