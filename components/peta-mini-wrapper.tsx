"use client";

import dynamic from "next/dynamic";

const PetaMini = dynamic(() => import("@/components/peta-mini"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-gray-400 text-sm">Memuat peta...</div>
    </div>
  ),
});

type Props = {
  polygon: {
    type: "Polygon";
    coordinates: number[][][];
  };
  luas?: number;
};

export default function PetaMiniWrapper({ polygon, luas }: Props) {
  return <PetaMini polygon={polygon} luas={luas} />;
}
