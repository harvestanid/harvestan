"use client";

import { useState, ReactNode } from "react";

type Props = {
  akunContent: ReactNode;
  kategoriContent: ReactNode;
};

export function TabContainer({ akunContent, kategoriContent }: Props) {
  const [activeTab, setActiveTab] = useState<"akun" | "kategori">("akun");

  return (
    <div>
      {/* Tab Buttons */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("akun")}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition ${
            activeTab === "akun"
              ? "bg-green-50 text-green-800 border-b-2 border-green-700"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          👤 Akun
        </button>
        <button
          onClick={() => setActiveTab("kategori")}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition ${
            activeTab === "kategori"
              ? "bg-green-50 text-green-800 border-b-2 border-green-700"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          🏷️ Kategori Produktivitas
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "akun" ? akunContent : kategoriContent}
      </div>
    </div>
  );
}
