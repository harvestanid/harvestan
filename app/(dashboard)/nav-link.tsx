"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  icon: string;
  label: string;
  badge?: number;
  variant?: "sidebar" | "mobile" | "admin";
};

export function NavLink({
  href,
  icon,
  label,
  badge = 0,
  variant = "sidebar",
}: Props) {
  const pathname = usePathname();

  // Cek active: exact match untuk root, prefix match untuk lainnya
  const isActive =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href + "/")) ||
    (href !== "/dashboard" && pathname === href);

  // ===== MOBILE VARIANT =====
  if (variant === "mobile") {
    return (
      <Link
        href={href}
        className={`relative flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs transition flex-shrink-0 min-w-[60px] ${
          isActive
            ? "text-green-700 bg-green-50 font-semibold"
            : "text-gray-500 hover:text-green-700 hover:bg-green-50"
        }`}
      >
        <span className="text-xl relative">
          {icon}
          {badge > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-1">
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
      className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
        isActive
          ? isAdminVariant
            ? "bg-red-50 text-red-800 border-l-4 border-red-500 pl-3"
            : "bg-green-50 text-green-800 border-l-4 border-green-600 pl-3"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className="text-lg flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span
          className={`text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 ${
            isAdminVariant
              ? "bg-red-500 text-white"
              : "bg-red-500 text-white"
          } animate-pulse`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
