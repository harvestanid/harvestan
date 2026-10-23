import Link from "next/link";

export const metadata = { title: "Dashboard Peternakan" };

export default function PeternakanDashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">🐄 Manajemen Peternakan</h1>
        <p className="text-gray-600 text-sm mt-1">Pilih hewan ternak yang ingin dikelola.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { href: "/peternakan/sapi", icon: "🐄", label: "Sapi", desc: "Data sapi & pertumbuhan" },
          { href: "/peternakan/kambing", icon: "🐐", label: "Kambing", desc: "Data kambing" },
          { href: "/peternakan/domba", icon: "🐑", label: "Domba", desc: "Data domba" },
          { href: "/peternakan/ayam", icon: "🐔", label: "Ayam", desc: "Data ayam" },
          { href: "/peternakan/bebek", icon: "🦆", label: "Bebek", desc: "Data bebek" },
        ].map((h) => (
          <Link
            key={h.href}
            href={h.href}
            className="bg-white border-2 border-[#2c5e2e]/10 hover:border-[#f0b429] rounded-3xl p-5 transition-all hover:shadow-lg shadow-sm flex flex-col items-center text-center gap-3"
          >
            <div className="text-5xl">{h.icon}</div>
            <div className="font-bold text-lg text-[#2c5e2e]">{h.label}</div>
            <div className="text-xs text-gray-500">{h.desc}</div>
            <div className="mt-2 text-[10px] bg-orange-100 text-orange-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Coming Soon
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
