import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUnreadFeedbackCount } from "@/lib/supabase/queries/feedback-server";
import {
  checkPremiumStatus,
  getInvoiceStats,
} from "@/lib/supabase/queries/subscription-server";
import { getDemoStatus } from "@/lib/demo/demo-mode";
import { NavLink } from "./nav-link";
import { DemoBanner } from "@/components/demo-banner";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

const MENU_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", premium: false },
  { href: "/penggarap", label: "Penggarap", icon: "👨‍🌾", premium: false },
  { href: "/toko", label: "Toko", icon: "🛒", premium: false },
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
  { href: "/log-tanam", label: "Log Tanam", icon: "📋", premium: false },
  { href: "/kalkulator", label: "Kalkulator", icon: "🧪", premium: true },
  { href: "/keuangan", label: "Keuangan", icon: "💰", premium: false },
  { href: "/grafik", label: "Grafik", icon: "📈", premium: false },
  { href: "/laporan", label: "Laporan", icon: "📄", premium: true },
  { href: "/export", label: "Export", icon: "📥", premium: true },
  { href: "/import", label: "Import", icon: "📤", premium: true },
  { href: "/pesanan-saya", label: "Pesanan", icon: "📦", premium: false },
  { href: "/feedback", label: "Feedback", icon: "💬", premium: false },
  { href: "/bantuan", label: "Bantuan", icon: "❓", premium: false },
  { href: "/pengaturan", label: "Setting", icon: "⚙️", premium: false },
];

function getUsername(user: any): string {
  if (!user) return "User";
  const meta = user.user_metadata || {};
  if (meta.username) return meta.username;
  if (meta.nama) return meta.nama;
  if (meta.full_name) return meta.full_name;
  if (user.email) return user.email.split("@")[0];
  return "User";
}

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

  let unreadCount = 0;
  let pendingInvoiceCount = 0;

  if (isAdmin) {
    const [feedbackCount, invoiceStats] = await Promise.all([
      getUnreadFeedbackCount(),
      getInvoiceStats(),
    ]);
    unreadCount = feedbackCount;
    pendingInvoiceCount = invoiceStats.total_pending;
  }

  const premiumStatus = user
    ? await checkPremiumStatus(user.id)
    : {
        isPremium: false,
        isActive: false,
        isDemoActive: false,
        effectivePremium: false,
      };

  const demoStatus = user ? await getDemoStatus(user.id) : null;

  // Untuk NavLink: pakai effectivePremium (demo tetap dianggap "bisa akses" dari navbar)
  const isPremiumActive = premiumStatus.effectivePremium;
  const isDemoActive = premiumStatus.isDemoActive;

  const showDemoButton = !isPremiumActive && !isDemoActive;
  const showUpgradeButton = !isPremiumActive;

  const username = getUsername(user);

  return (
    <div className="min-h-screen bg-gray-50">
      {isDemoActive && demoStatus && (
        <DemoBanner
          expiresAt={demoStatus.expiresAt}
          daysRemaining={demoStatus.daysRemaining}
          canRestart={demoStatus.canRestart}
        />
      )}

      <nav className="bg-[#faf9f5]/80 backdrop-blur-2xl border-b border-[#2c5e2e]/10 px-3 md:px-6 py-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 md:h-20">
          <Link
            href="/dashboard"
            className="flex items-center flex-shrink-0 group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-horizontal.png"
              alt="Harvestan"
              className="h-12 md:h-16 w-auto transition-transform group-hover:scale-105"
            />
          </Link>

          <div className="flex items-center gap-1.5 md:gap-3">
            {user && (
              <span className="hidden md:inline-flex items-center gap-1.5 bg-[#2c5e2e]/5 border border-[#2c5e2e]/15 text-[#2c5e2e] text-xs font-semibold px-3 py-1.5 rounded-full">
                👤 @{username}
              </span>
            )}

            {showDemoButton && (
              <Link
                href="/demo"
                className="inline-flex items-center gap-1 bg-[#f0b429]/20 hover:bg-[#f0b429]/30 border border-[#f0b429]/40 text-[#2c5e2e] text-[10px] md:text-xs font-bold px-2.5 md:px-3 py-1.5 rounded-full transition-all hover:scale-105"
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
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#f0b429] to-[#e6a617] text-[#2c5e2e] text-[10px] md:text-xs font-bold px-2.5 md:px-3 py-1.5 rounded-full shadow-md">
                💎 <span className="hidden sm:inline">PREMIUM</span>
              </span>
            )}

            {showUpgradeButton && (
              <Link
                href="/premium"
                className="inline-flex items-center gap-1 bg-[#2c5e2e] hover:bg-[#1f4521] text-white text-[10px] md:text-xs font-bold px-2.5 md:px-3 py-1.5 rounded-full shadow-md shadow-[#2c5e2e]/20 hover:shadow-[#2c5e2e]/40 transition-all hover:scale-105"
              >
                💎 Upgrade
              </Link>
            )}

            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[10px] md:text-xs font-bold text-[#2c5e2e]/70 hover:text-[#2c5e2e] px-2.5 md:px-3 py-1.5 rounded-full hover:bg-[#2c5e2e]/5 transition-all border border-[#2c5e2e]/15 hover:border-[#2c5e2e]/30"
              title="Lihat Landing Page"
            >
              🌐 <span className="hidden sm:inline">Landing</span>
            </Link>

            <form action="/auth/logout" method="post">
              <button
                type="submit"
                className="text-xs md:text-sm text-[#2c5e2e]/70 hover:text-red-600 font-medium transition-colors"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto flex gap-6 px-3 md:px-6 py-4 md:py-6">
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-[#2c5e2e]/10 p-3 sticky top-24 shadow-sm">
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
                <div className="pt-3 mt-3 border-t border-[#2c5e2e]/10">
                  <div className="text-[10px] font-bold text-[#2c5e2e]/40 uppercase tracking-widest px-4 mb-1">
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
                    href="/admin/invoice"
                    icon="🧾"
                    label="Invoice"
                    badge={pendingInvoiceCount}
                    variant="admin"
                  />
                  <NavLink
                    href="/admin/subscriptions"
                    icon="💎"
                    label="Subscriptions"
                    variant="admin"
                  />
                  <NavLink
                    href="/admin/katalog"
                    icon="📦"
                    label="Katalog"
                    variant="admin"
                  />
                  <NavLink
                    href="/admin/pesanan"
                    icon="🚚"
                    label="Pesanan"
                    variant="admin"
                  />
                  <NavLink
                    href="/admin/pupuk"
                    icon="🧪"
                    label="Pupuk"
                    variant="admin"
                  />
                  <NavLink
                    href="/admin/blog"
                    icon="📝"
                    label="Blog"
                    variant="admin"
                  />
                </div>
              )}
            </nav>

            {!isPremiumActive && !isDemoActive && (
              <div className="mt-3 p-3 bg-gradient-to-br from-[#f0b429]/10 to-[#f0b429]/5 border-2 border-[#f0b429]/40 rounded-2xl">
                <div className="text-xs font-bold text-[#2c5e2e] mb-1">
                  💎 Premium — Rp 59.000
                </div>
                <div className="text-[10px] text-[#2c5e2e]/70 mb-2 leading-relaxed">
                  Akses semua fitur, sekali bayar, selamanya!
                </div>
                <Link
                  href="/premium"
                  className="block w-full bg-[#2c5e2e] hover:bg-[#1f4521] text-white text-xs font-bold text-center py-2 rounded-full transition-all hover:scale-[1.02]"
                >
                  Upgrade Sekarang
                </Link>
                <Link
                  href="/demo"
                  className="block w-full bg-white hover:bg-[#f0b429]/10 text-[#2c5e2e] text-xs font-bold text-center py-2 rounded-full transition-all hover:scale-[1.02] border border-[#f0b429]/40 mt-2"
                >
                  🎬 Coba Demo Dulu
                </Link>
              </div>
            )}

            {isDemoActive && (
              <div className="mt-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl">
                <div className="text-xs font-bold text-blue-900 mb-1">
                  🎬 Mode Demo Aktif
                </div>
                <div className="text-[10px] text-blue-700 mb-2 leading-relaxed">
                  Anda melihat data contoh. Data asli Anda aman.
                </div>
                <Link
                  href="/premium"
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold text-center py-2 rounded-full transition-all hover:scale-[1.02]"
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
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#2c5e2e]/10 z-40"
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
                href="/admin/invoice"
                icon="🧾"
                label="Invoice"
                badge={pendingInvoiceCount}
                variant="mobile"
              />
              <NavLink
                href="/admin/subscriptions"
                icon="💎"
                label="Premium"
                variant="mobile"
              />
              <NavLink
                href="/admin/katalog"
                icon="📦"
                label="Katalog"
                variant="mobile"
              />
              <NavLink
                href="/admin/pesanan"
                icon="🚚"
                label="Pesanan"
                variant="mobile"
              />
              <NavLink
                href="/admin/pupuk"
                icon="🧪"
                label="Pupuk"
                variant="mobile"
              />
              <NavLink
                href="/admin/blog"
                icon="📝"
                label="Blog"
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
