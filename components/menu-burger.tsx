"use client";

import { useState } from "react";
import Link from "next/link";

export function MenuBurger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-[#2c5e2e] hover:bg-[#2c5e2e]/10 rounded-lg transition-colors"
        aria-label="Menu Aplikasi"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-2 space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Workspace
              </div>
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2.5 rounded-lg hover:bg-[#f0b429]/10 transition-colors"
              >
                <div className="font-bold text-[#2c5e2e] text-sm">
                  🌾 Manajemen Pertanian
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Lahan, panen, keuangan
                </div>
              </Link>

              <Link
                href="/peternakan"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2.5 rounded-lg hover:bg-[#f0b429]/10 transition-colors"
              >
                <div className="font-bold text-[#2c5e2e] text-sm">
                  🐄 Manajemen Peternakan
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Data sapi & pakan
                </div>
              </Link>

              <div className="border-t border-gray-100 my-1"></div>
              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Lainnya
              </div>

              <Link
                href="/demo"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg hover:bg-[#f0b429]/10 transition-colors text-sm font-bold text-[#2c5e2e]"
              >
                🎬 Coba Mode Demo
              </Link>

              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg hover:bg-[#f0b429]/10 transition-colors text-sm font-bold text-[#2c5e2e]"
              >
                🌐 Landing Page
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
