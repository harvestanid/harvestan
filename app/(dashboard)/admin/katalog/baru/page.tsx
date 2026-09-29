import Link from "next/link";
import { FormProduk } from "./klien";

export const metadata = {
  title: "Tambah Produk",
};

export default function TambahProdukPage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/katalog"
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke Katalog
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          ➕ Tambah Produk
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Upload produk baru ke katalog Harvestan
        </p>
      </div>

      <FormProduk />
    </div>
  );
}
