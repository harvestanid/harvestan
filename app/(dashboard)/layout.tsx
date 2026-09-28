import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUnreadFeedbackCount } from "@/lib/supabase/queries/feedback-server";
import { checkPremiumStatus } from "@/lib/supabase/queries/subscription-server";
import { getDemoStatus } from "@/lib/demo/demo-mode";
import { NavLink } from "./nav-link";
import { DemoBanner } from "@/components/demo-banner";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

// strictPremium: TRUE = hanya unlock kalau premium asli (demo TIDAK unlock)
// premium: TRUE = unlock kalau premium ATAU demo aktif
const MENU_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", premium: false },
  { href: "/penggarap", label: "Penggarap", icon: "👨‍🌾", premium: false },
  {
    href: "/gabah",
    label: "Gabah",
    icon: "⚖️",
    premium: false,
    strictPremium: true,
  },
  {
    href: "/panen-multi",
    label: "Panen",
    icon: "🌾",
    premium: false,
    strictPremium: true,
  },
  { href: "/ukur-lahan", label: "Ukur", icon: "📍", premium: true },
  { href: "/keuangan", label: "Keuangan", icon: "💰", premium: false },
  { href: "/grafik", label: "Grafik", icon: "📈", premium: false },
  { href: "/laporan", label: "Laporan", icon: "📄", premium: true },
  { href: "/export", label: "Export", icon: "📥", premium: true },
  { href: "/import", label: "Import", icon: "📤", premium: true },
  { href: "/feedback", label: "Feedback", icon: "💬", premium: false },
  { href: "/bantuan", label: "Bantuan", icon: "❓", premium: false },
  { href: "/pengaturan", label: "Setting", icon: "⚙️", premium: false },
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

  const premiumStatus = user
    ? await checkPremiumStatus(user.id)
    : {
        isPremium: false,
        isActive: false,
        isDemoActive: false,
        effectivePremium: false,
      };

  const demoStatus = user ? await getDemoStatus(user.id) : null;

  const isPremiumActive = premiumStatus.effectivePremium;
  const isDemoActive = premiumStatus.isDemoActive;

  const showDemoButton = !isPremiumActive && !isDemoActive;

  return (
    <div className="min-h-screen bg-gray-50">
      {isDemoActive && demoStatus && (
        <DemoBanner
          expiresAt={demoStatus.expiresAt}
          daysRemaining={demoStatus.daysRemaining}
          canRestart={demoStatus.canRestart}
        />
      )}

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
          <div className="flex items-center gap-2 md:gap-3">
            {showDemoButton && (
              <Link
                href="/demo"
                className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-[10px] md:text-xs font-bold px-2.5 md:px-3 py-1.5 rounded-full shadow-md transition"
              >
                🎬 <span className="hidden sm:inline">Coba Demo</span>
                <span className="sm:hidden">Demo</span>
              </Link>
            )}

            {isDemoActive && (
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] md:text-xs font-bold px-2.5 md:px-3 py-1.5 rounded-full shadow-md">
                🎬 <span className="hidden sm:inline">DEMO</span>
              </span>
            )}

            {isPremiumActive && !isDemoActive && (
              <span className="hidden md:inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                💎 PREMIUM
              </span>
            )}

            {showDemoButton && (
              <Link
                href="/premium"
                className="hidden md:inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md transition"
              >
                💎 Upgrade
              </Link>
            )}

            <form action="/auth/logout" method="post">
              <button
                type="submit"
                className="text-xs md:text-sm text-gray-600 hover:text-red-600 transition"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto flex gap-6 px-4 py-6">
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-3 sticky top-32">
            <nav className="space-y-1">
              {MENU_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  premium={item.premium}
                  strictPremium={item.strictPremium}
                  isPremiumActive={isPremiumActive}
                  isDemoActive={isDemoActive}
                />
              ))}

              {isAdmin && (
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
                  <NavLink
                    href="/admin/premium"
                    icon="🎁"
                    label="Premium Requests"
                    variant="admin"
                  />
                </div>
              )}
            </nav>

            {!isPremiumActive && !isDemoActive && (
              <div className="mt-3 p-3 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl">
                <div className="text-xs font-bold text-orange-900 mb-1">
                  💎 Premium — Rp 59.000
                </div>
                <div className="text-[10px] text-orange-700 mb-2 leading-relaxed">
                  Akses semua fitur, sekali bayar, selamanya!
                </div>
                <Link
                  href="/premium"
                  className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold text-center py-2 rounded-lg transition"
                >
                  Upgrade Sekarang
                </Link>
                <Link
                  href="/demo"
                  className="block w-full bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold text-center py-2 rounded-lg transition border border-blue-200 mt-2"
                >
                  🎬 Coba Demo Dulu
                </Link>
              </div>
            )}

            {isDemoActive && (
              <div className="mt-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                <div className="text-xs font-bold text-blue-900 mb-1">
                  🎬 Mode Demo Aktif
                </div>
                <div className="text-[10px] text-blue-700 mb-2 leading-relaxed">
                  Anda melihat data contoh. Data asli Anda aman.
                </div>
                <Link
                  href="/premium"
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold text-center py-2 rounded-lg transition"
                >
                  💎 Upgrade ke Premium
                </Link>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

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
              premium={item.premium}
              strictPremium={item.strictPremium}
              isPremiumActive={isPremiumActive}
              isDemoActive={isDemoActive}
              variant="mobile"
            />
          ))}
          {isAdmin && (
            <>
              <NavLink
                href="/admin/feedback"
                icon="🔐"
                label="Admin"
                badge={unreadCount}
                variant="mobile"
              />
              <NavLink
                href="/admin/premium"
                icon="🎁"
                label="Premium"
                variant="mobile"
              />
            </>
          )}
        </div>
      </nav>

      <div className="h-20 md:h-0" />
    </div>
  );
}
