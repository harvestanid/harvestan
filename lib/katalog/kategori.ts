export type KategoriProduk = {
  id: "input_pertanian" | "output_pertanian" | "alat_mesin_pertanian" | "furniture_mebel";
  label: string;
  icon: string;
  slug: string;
  deskripsi: string;
};

export const KATEGORI_PRODUK: KategoriProduk[] = [
  {
    id: "input_pertanian",
    label: "Input Pertanian",
    icon: "🌱",
    slug: "input-pertanian",
    deskripsi: "Pupuk, bibit, pestisida, mulsa",
  },
  {
    id: "output_pertanian",
    label: "Output Pertanian",
    icon: "🌾",
    slug: "output-pertanian",
    deskripsi: "Cabai, bawang merah, jagung, beras",
  },
  {
    id: "alat_mesin_pertanian",
    label: "Alat & Mesin Pertanian",
    icon: "🔧",
    slug: "alat-mesin-pertanian",
    deskripsi: "Alat polybag, mesin ayak kompos, rak semai otomatis",
  },
  {
    id: "furniture_mebel",
    label: "Furniture & Mebel",
    icon: "🪑",
    slug: "furniture-mebel",
    deskripsi: "Meja kursi, kusen, pintu, lemari, dipan",
  },
];

export function getKategoriLabel(kategori: string): string {
  const found = KATEGORI_PRODUK.find((k) => k.id === kategori);
  return found?.label || kategori;
}

export function getKategoriIcon(kategori: string): string {
  const found = KATEGORI_PRODUK.find((k) => k.id === kategori);
  return found?.icon || "📦";
}

export function getKategoriSlug(kategori: string): string {
  const found = KATEGORI_PRODUK.find((k) => k.id === kategori);
  return found?.slug || kategori;
}
