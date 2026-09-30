"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  icon: string;
  label: string;
  badge?: number;
  premium?: boolean;
  strictPremium?: boolean;
  isPremiumActive?: boolean;
  isDemoActive?: boolean;
  variant?: "sidebar" | "mobile" | "admin";
};

export function NavLink({
  href,
  icon,
  label,
  badge = 0,
  premium = false,
  strictPremium = false,
  isPremiumActive = false,
  isDemoActive = false,
  variant = "sidebar",
}: Props) {
  const pathname = usePathname();

  const isActive =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href + "/")) ||
    (href !== "/dashboard" && pathname === href);

  let isLocked = false;
  if (strictPremium) {
    isLocked = !isPremiumActive;
  } else if (premium) {
    isLocked = !isPremiumActive && !isDemoActive;
  }

  // ===== MOBILE VARIANT =====
  if (variant === "mobile") {
    return (
      <Link
        href={href}
        className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-xs transition flex-shrink-0 min-w-[64px] ${
          isActive
            ? "text-[#2c5e2e] bg-[#f0b429]/15 font-semibold"
            : "text-[#2c5e2e]/60 hover:text-[#2c5e2e] hover:bg-[#f0b429]/10"
        }`}
      >
        <span className="text-xl relative">
          {icon}
          {isLocked && (
            <span className="absolute -bottom-1 -right-1 bg-[#f0b429] text-[#2c5e2e] text-[8px] rounded-full w-4 h-4 flex items-center justify-center border-2 border-[#faf9f5] font-bold">
              🔒
            </span>
          )}
          {badge > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-1 border-2 border-[#faf9f5]">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </span>
        <span className="text-[10px] whitespace-nowrap">{label}</span>
      </Link>
    );
  }

  // ===== SIDEBAR & ADMIN VARIANT =====
  const isAdminVariant = variant === "admin";

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive
          ? isAdminVariant
            ? "bg-red-50 text-red-800 border border-red-200 shadow-sm"
            : "bg-[#2c5e2e]/8 text-[#2c5e2e] border border-[#2c5e2e]/20 shadow-sm"
          : "text-[#2c5e2e]/70 hover:bg-[#f0b429]/10 hover:text-[#2c5e2e] border border-transparent"
      }`}
    >
      <span className="text-lg flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>

      {isLocked && (
        <span className="text-[10px] bg-[#f0b429]/30 text-[#2c5e2e] border border-[#f0b429]/50 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
          🔒
        </span>
      )}

      {badge > 0 && (
        <span className="text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 bg-red-500 text-white animate-pulse flex-shrink-0">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
