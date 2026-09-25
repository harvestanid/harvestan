import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex flex-col">
      <nav className="p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <span className="text-3xl">🌾</span>
          <span className="text-xl font-bold text-green-800">Harvestan</span>
        </Link>
      </nav>
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        {children}
      </main>
      <footer className="text-center py-6 text-sm text-gray-500">
        © 2025 Harvestan — Platform Manajemen Pertanian Indonesia
      </footer>
    </div>
  );
}
