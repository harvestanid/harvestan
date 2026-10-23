import Link from "next/link";

export const metadata = { title: "Manajemen Bebek" };

export default function BebekPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-7xl mb-4">🦆</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Bebek</h1>
      <p className="text-gray-500 mb-6 max-w-sm">Fitur ini sedang dalam pengembangan. Nantikan segera!</p>
      <Link href="/peternakan" className="bg-[#2c5e2e] text-white font-bold px-6 py-3 rounded-full">← Kembali</Link>
    </div>
  );
}
