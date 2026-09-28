"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

type Props = {
  akunContent: React.ReactNode;
  kategoriContent: React.ReactNode;
  defaultTab?: "akun" | "kategori";
};

export function TabContainer({
  akunContent,
  kategoriContent,
  defaultTab = "akun",
}: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const initialTab: "akun" | "kategori" =
    tabParam === "kategori" || tabParam === "akun" ? tabParam : defaultTab;

  const [activeTab, setActiveTab] = useState<"akun" | "kategori">(initialTab);

  // Sinkron kalau query param berubah (user klik CTA dari halaman lain)
  useEffect(() => {
    if (tabParam === "kategori" || tabParam === "akun") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div>
      {/* Tab Buttons */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("akun")}
          className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
            activeTab === "akun"
              ? "border-green-700 text-green-800"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          👤 Akun
        </button>
        <button
          onClick={() => setActiveTab("kategori")}
          className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
            activeTab === "kategori"
              ? "border-green-700 text-green-800"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          ⚙️ Kategori Produktivitas
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "akun" ? akunContent : kategoriContent}
      </div>
    </div>
  );
}
