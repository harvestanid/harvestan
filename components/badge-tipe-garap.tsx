import type { TipeGarap } from "./tipe-garap-picker";

type Props = {
  tipe: TipeGarap | string | null | undefined;
  size?: "sm" | "md";
  withLabel?: boolean;
};

const CONFIG: Record<
  string,
  {
    icon: string;
    label: string;
    bg: string;
    text: string;
    border: string;
  }
> = {
  mandiri: {
    icon: "🌱",
    label: "Garap Sendiri",
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-300",
  },
  bagi_hasil_owner: {
    icon: "👤",
    label: "Saya Owner",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-300",
  },
  bagi_hasil_penggarap: {
    icon: "👨‍🌾",
    label: "Saya Penggarap",
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-300",
  },
};

export function BadgeTipeGarap({
  tipe,
  size = "md",
  withLabel = true,
}: Props) {
  const key = String(tipe || "mandiri");
  const c = CONFIG[key] || CONFIG.mandiri;

  const sizeClass =
    size === "sm"
      ? "text-[9px] px-2 py-0.5 gap-1"
      : "text-[10px] px-2.5 py-1 gap-1.5";

  const iconSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-widest rounded-full border-2 ${c.bg} ${c.text} ${c.border} ${sizeClass}`}
      title={c.label}
    >
      <span className={iconSize}>{c.icon}</span>
      {withLabel && <span>{c.label}</span>}
    </span>
  );
}

export function getTipeGarapLabel(tipe: string | null | undefined): string {
  const key = String(tipe || "mandiri");
  return CONFIG[key]?.label || "Garap Sendiri";
}
