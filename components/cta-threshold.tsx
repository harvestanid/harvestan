import Link from "next/link";

type Props = {
  /** Judul compact — default "Atur standar KPI produktivitas Anda" */
  judul?: string;
  /** Deskripsi kecil — default penjelasan singkat */
  deskripsi?: string;
  /** Variant tampilan */
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
        className="block bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3 hover:from-emerald-100 hover:to-teal-100 transition group"
      >
        <div className="flex items-center gap-3">
          <div className="text-xl flex-shrink-0">⚙️</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-emerald-900 text-xs leading-tight">
              {judul}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">
              {deskripsi}
            </div>
          </div>
          <div className="text-emerald-600 text-sm flex-shrink-0 group-hover:translate-x-0.5 transition">
            →
          </div>
        </div>
      </Link>
    );
  }

  // variant inline — super compact, 1 baris
  return (
    <Link
      href="/pengaturan?tab=kategori"
      className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full px-2.5 py-1 transition group"
    >
      <span>⚙️</span>
      <span className="font-medium">{judul}</span>
      <span className="group-hover:translate-x-0.5 transition">→</span>
    </Link>
  );
}
