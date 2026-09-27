import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex flex-col">
      <nav className="px-6 py-4">
        <Link href="/" className="flex items-center w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Harvestan"
            className="h-24 md:h-32 w-auto"
          />
        </Link>
      </nav>
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        {children}
      </main>
      <footer className="text-center py-6 text-sm text-gray-500">
        © 2026 Harvestan — Platform Manajemen Pertanian Indonesia
      </footer>
    </div>
  );
}
