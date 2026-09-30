import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#faf9f5] relative overflow-hidden flex flex-col">
      {/* Blob animasi background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-150px] left-[-150px] w-[600px] h-[600px] bg-gradient-to-br from-[#2c5e2e]/25 via-[#4a8f3f]/15 to-transparent animate-blob" />
        <div
          className="absolute bottom-[-200px] right-[-150px] w-[500px] h-[500px] bg-gradient-to-br from-[#f0b429]/20 via-[#e6a617]/10 to-transparent animate-blob"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-[#7c9e3c]/15 to-transparent animate-blob"
          style={{ animationDelay: "6s" }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#2c5e2e 1px, transparent 1px), linear-gradient(90deg, #2c5e2e 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />

      {/* Navbar */}
      <nav className="relative px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Harvestan"
            className="h-16 md:h-20 w-auto transition-transform group-hover:scale-105"
          />
        </Link>
        <Link
          href="/"
          className="text-xs md:text-sm text-[#2c5e2e]/70 hover:text-[#2c5e2e] font-medium transition-colors"
        >
          ← Kembali ke Beranda
        </Link>
      </nav>

      {/* Konten */}
      <main className="relative flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="relative text-center py-6 text-xs text-[#2c5e2e]/50">
        © {new Date().getFullYear()} Harvestan — Platform Manajemen Pertanian
        Indonesia 🇮🇩
      </footer>
    </div>
  );
}
