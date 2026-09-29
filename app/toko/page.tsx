import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProductsList } from "@/lib/supabase/queries/product-server";
import { TokoKlien } from "./klien";

export const metadata = {
  title: "Toko Harvestan",
  description:
    "Katalog produk Harvestan — input pertanian, output pertanian, alat mesin pertanian, furniture & mebel",
};

export default async function TokoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const products = await getProductsList({ status: "aktif" });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header publik */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Harvestan"
              className="h-14 md:h-16 w-auto"
            />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/katalog"
              className="hidden md:inline text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Katalog
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="bg-green-700 hover:bg-green-800 text-white text-xs md:text-sm font-bold px-4 py-2 rounded-full transition"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-gray-700 hover:text-green-700 font-medium px-3 py-2 transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="bg-green-700 hover:bg-green-800 text-white text-xs md:text-sm font-bold px-4 py-2 rounded-full transition"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-700 via-green-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
          <h1 className="text-3xl md:text-5xl font-bold mb-2">
            🛒 Toko Harvestan
          </h1>
          <p className="text-white/90 text-sm md:text-base max-w-2xl leading-relaxed">
            Belanja kebutuhan pertanian & hasil panen langsung dari Harvestan.
            Input pertanian, output pertanian, alat & mesin pertanian,
            furniture & mebel.
          </p>
        </div>
      </div>

      {/* Katalog */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <TokoKlien products={products} />
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="opacity-70">
            © {new Date().getFullYear()} Harvestan — Sistem Manajemen
            Pertanian
          </p>
        </div>
      </footer>
    </div>
  );
}
