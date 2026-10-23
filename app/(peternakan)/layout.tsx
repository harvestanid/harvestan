import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MenuBurger } from "@/components/menu-burger";

export default async function PeternakanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#faf9f5]/80 backdrop-blur-2xl border-b border-[#2c5e2e]/10 px-3 md:px-6 py-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-2 md:gap-4">
            <MenuBurger />
            <Link href="/peternakan" className="flex items-center flex-shrink-0 group">
              <img
                src="/logo-horizontal.png"
                alt="Harvestan"
                className="h-12 md:h-16 w-auto transition-transform group-hover:scale-105"
              />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <span className="hidden md:inline-flex items-center gap-1.5 bg-[#2c5e2e]/5 border border-[#2c5e2e]/15 text-[#2c5e2e] text-xs font-semibold px-3 py-1.5 rounded-full">
                👤 {user.user_metadata?.username || user.email?.split("@")[0]}
              </span>
            )}
            <span className="text-[10px] md:text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1.5 rounded-full border border-green-200">
              🐄 Peternakan
            </span>
            <form action="/auth/logout" method="post">
              <button type="submit" className="text-xs md:text-sm text-[#2c5e2e]/70 hover:text-red-600 font-medium transition-colors">
                Keluar
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto flex gap-6 px-3 md:px-6 py-4 md:py-6">
        {/* Sidebar Desktop */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-[#2c5e2e]/10 p-3 sticky top-24 shadow-sm space-y-1">
            <Link href="/peternakan" className="block px-4 py-2.5 rounded-xl hover:bg-[#f0b429]/10 text-[#2c5e2e] font-bold text-sm transition-all">📊 Dashboard</Link>
            <Link href="/peternakan/sapi" className="block px-4 py-2.5 rounded-xl hover:bg-[#f0b429]/10 text-[#2c5e2e] font-bold text-sm transition-all">🐄 Sapi</Link>
            <Link href="/peternakan/kambing" className="block px-4 py-2.5 rounded-xl hover:bg-[#f0b429]/10 text-[#2c5e2e] font-bold text-sm transition-all">🐐 Kambing</Link>
            <Link href="/peternakan/domba" className="block px-4 py-2.5 rounded-xl hover:bg-[#f0b429]/10 text-[#2c5e2e] font-bold text-sm transition-all">🐑 Domba</Link>
            <Link href="/peternakan/ayam" className="block px-4 py-2.5 rounded-xl hover:bg-[#f0b429]/10 text-[#2c5e2e] font-bold text-sm transition-all">🐔 Ayam</Link>
            <Link href="/peternakan/bebek" className="block px-4 py-2.5 rounded-xl hover:bg-[#f0b429]/10 text-[#2c5e2e] font-bold text-sm transition-all">🦆 Bebek</Link>
            
            <div className="pt-3 mt-3 border-t border-gray-100">
              <Link href="/dashboard" className="block px-4 py-2 text-xs text-gray-500 hover:text-gray-800 transition">← Balik ke Pertanian</Link>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Navbar Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#2c5e2e]/10 z-40" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex gap-1 overflow-x-auto py-2 px-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
          <Link href="/peternakan" className="flex flex-col items-center gap-1 px-4 py-1 min-w-[70px]">
            <span className="text-xl">📊</span><span className="text-[10px] font-bold text-gray-600">Dashboard</span>
          </Link>
          <Link href="/peternakan/sapi" className="flex flex-col items-center gap-1 px-4 py-1 min-w-[70px]">
            <span className="text-xl">🐄</span><span className="text-[10px] font-bold text-gray-600">Sapi</span>
          </Link>
          <Link href="/peternakan/kambing" className="flex flex-col items-center gap-1 px-4 py-1 min-w-[70px]">
            <span className="text-xl">🐐</span><span className="text-[10px] font-bold text-gray-600">Kambing</span>
          </Link>
          <Link href="/peternakan/domba" className="flex flex-col items-center gap-1 px-4 py-1 min-w-[70px]">
            <span className="text-xl">🐑</span><span className="text-[10px] font-bold text-gray-600">Domba</span>
          </Link>
          <Link href="/peternakan/ayam" className="flex flex-col items-center gap-1 px-4 py-1 min-w-[70px]">
            <span className="text-xl">🐔</span><span className="text-[10px] font-bold text-gray-600">Ayam</span>
          </Link>
          <Link href="/peternakan/bebek" className="flex flex-col items-center gap-1 px-4 py-1 min-w-[70px]">
            <span className="text-xl">🦆</span><span className="text-[10px] font-bold text-gray-600">Bebek</span>
          </Link>
        </div>
      </nav>
      <div className="h-20 md:h-0" />
    </div>
  );
}
