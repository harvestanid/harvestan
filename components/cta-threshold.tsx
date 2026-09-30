import Link from "next/link";

type Props = {
  judul?: string;
  deskripsi?: string;
  variant?: "inline" | "card";
};

export function CtaThreshold({
  judul = "Atur standar KPI produktivitas Anda",
  deskripsi = "Biar kategori produktivitas lebih bermakna",
  variant = "inline",
}: Props) {
  if (variant === "card") {
    return (
      <Link
        href="/pengaturan?tab=kategori"
        className="block relative overflow-hidden bg-gradient-to-r from-[#2c5e2e] via-[#1f4521] to-[#2c5e2e] border-2 border-[#f0b429]/40 rounded-3xl p-4 hover:border-[#f0b429] hover:shadow-xl hover:-translate-y-0.5 transition-all group"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#f0b429]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#f0b429]/25 flex items-center justify-center text-2xl flex-shrink-0 border border-[#f0b429]/40">
            ⚙️
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-sm leading-tight tracking-tight">
              {judul}
            </div>
            <div className="text-[10px] text-[#f0b429] mt-1 uppercase tracking-widest font-bold">
              {deskripsi}
            </div>
          </div>
          <div className="text-[#f0b429] text-lg flex-shrink-0 group-hover:translate-x-1 transition-transform">
            →
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/pengaturan?tab=kategori"
      className="inline-flex items-center gap-2 text-[11px] text-[#2c5e2e] hover:text-[#f0b429] bg-[#f0b429]/10 hover:bg-[#f0b429]/20 border-2 border-[#f0b429]/30 hover:border-[#f0b429]/60 rounded-full px-3.5 py-1.5 transition-all group font-bold"
    >
      <span>⚙️</span>
      <span>{judul}</span>
      <span className="group-hover:translate-x-0.5 transition">→</span>
    </Link>
  );
}
