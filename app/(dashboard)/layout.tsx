import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUnreadFeedbackCount } from "@/lib/supabase/queries/feedback-server";
import { NavLink } from "./nav-link";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

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
  { href: "/feedback", label: "Feedback", icon: "💬" },
  { href: "/pengaturan", label: "Setting", icon: "⚙️" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user?.email === ADMIN_EMAIL;
  const unreadCount = isAdmin ? await getUnreadFeedbackCount() : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP NAV — logo 1.2x */}
      <nav className="bg-white border-b border-gray-200 px-4 py-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Harvestan"
              className="h-24 md:h-28 w-auto"
            />
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
          <div className="bg-white rounded-xl border border-gray-200 p-3 sticky top-32">
            <nav className="space-y-1">
              {MENU_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                />
              ))}

              {/* ADMIN SECTION */}
              {isAdmin && (
                <>
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 mb-1">
                      Admin Only
                    </div>
                    <NavLink
                      href="/admin/feedback"
                      icon="🔐"
                      label="Feedback Admin"
                      badge={unreadCount}
                      variant="admin"
                    />
                  </div>
                </>
              )}
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
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              variant="mobile"
            />
          ))}
          {isAdmin && (
            <NavLink
              href="/admin/feedback"
              icon="🔐"
              label="Admin"
              badge={unreadCount}
              variant="mobile"
            />
          )}
        </div>
      </nav>

      <div className="h-20 md:h-0" />
    </div>
  );
}
