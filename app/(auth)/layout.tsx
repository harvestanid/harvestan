import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7f3] via-white to-[#f5f7f3]">
      <div className="min-h-screen flex flex-col">
        {/* HEADER */}
        <header className="py-6 px-4">
          <div className="max-w-md mx-auto flex justify-center">
            <Link href="/" className="flex items-center group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-horizontal.png"
                alt="Harvestan"
                className="h-14 w-auto transition-transform group-hover:scale-105"
              />
            </Link>
          </div>
        </header>

        {/* KONTEN */}
        <main className="flex-1 px-4 pb-8">{children}</main>

        {/* FOOTER */}
        <footer className="py-6 px-4 text-center text-xs text-[#2c5e2e]/50">
          <p>
            © {new Date().getFullYear()} Harvestan · Sistem Manajemen Pertanian
          </p>
        </footer>
      </div>
    </div>
  );
}
