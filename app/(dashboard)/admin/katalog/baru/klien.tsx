"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KATEGORI_PRODUK } from "@/lib/katalog/kategori";
import type { Product } from "@/lib/supabase/queries/product-server";

type Props = {
  productId?: string;
  initialData?: Product;
};

export function FormProduk({ productId, initialData }: Props) {
  const router = useRouter();
  const isEditMode = !!productId && !!initialData;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    nama: "",
    kategori: "input_pertanian" as any,
    sub_kategori: "",
    harga: "",
    satuan: "pcs",
    stok: "",
    berat_gram: "1000",
    deskripsi: "",
    foto_urls: [] as string[],
    status: "aktif" as "aktif" | "nonaktif" | "sold_out",
    unggulan: false,
  });

  // Load initial data waktu edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      setForm({
        nama: initialData.nama || "",
        kategori: initialData.kategori || "input_pertanian",
        sub_kategori: initialData.sub_kategori || "",
        harga: String(initialData.harga || ""),
        satuan: initialData.satuan || "pcs",
        stok: String(initialData.stok || ""),
        berat_gram: String(initialData.berat_gram || 1000),
        deskripsi: initialData.deskripsi || "",
        foto_urls: initialData.foto_urls || [],
        status: initialData.status || "aktif",
        unggulan: initialData.unggulan || false,
      });
    }
  }, [isEditMode, initialData]);

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (form.foto_urls.length + files.length > 5) {
      alert("Maksimal 5 foto per produk");
      return;
    }

    setUploading(true);
    setError("");

    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} terlalu besar. Maks 5MB.`);
          continue;
        }

        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch("/api/products/upload", {
          method: "POST",
          body: fd,
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json.error || "Gagal upload foto");
          continue;
        }

        setForm((f) => ({
          ...f,
          foto_urls: [...f.foto_urls, json.url],
        }));
      }
    } catch (err: any) {
      setError("Upload error: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function hapusFoto(index: number) {
    setForm((f) => ({
      ...f,
      foto_urls: f.foto_urls.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.nama.trim()) {
      setError("Nama produk wajib diisi");
      return;
    }
    if (!form.harga || Number(form.harga) <= 0) {
      setError("Harga wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nama: form.nama.trim(),
        kategori: form.kategori,
        sub_kategori: form.sub_kategori.trim() || null,
        harga: Number(form.harga),
        satuan: form.satuan.trim() || "pcs",
        stok: Number(form.stok) || 0,
        berat_gram: Number(form.berat_gram) || 1000,
        deskripsi: form.deskripsi.trim() || null,
        foto_urls: form.foto_urls,
        status: form.status,
        unggulan: form.unggulan,
      };

      let res: Response;

      if (isEditMode) {
        // EDIT MODE
        res = await fetch("/api/products/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: productId, ...payload }),
        });
      } else {
        // CREATE MODE
        res = await fetch("/api/products/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Gagal simpan");
        return;
      }

      alert(
        isEditMode
          ? "✅ Produk berhasil diupdate!"
          : "✅ Produk berhasil ditambahkan!"
      );
      router.push("/admin/katalog");
      router.refresh();
    } catch (err: any) {
      setError("Error: " + (err.message || "Unknown"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 space-y-5"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
          Nama Produk <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.nama}
          onChange={(e) => setForm({ ...form, nama: e.target.value })}
          placeholder="Contoh: Pupuk Organik Kemasan 1kg"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
          Kategori <span className="text-red-500">*</span>
        </label>
        <select
          value={form.kategori}
          onChange={(e) =>
            setForm({ ...form, kategori: e.target.value as any })
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {KATEGORI_PRODUK.map((k) => (
            <option key={k.id} value={k.id}>
              {k.icon} {k.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
          Sub Kategori (opsional)
        </label>
        <input
          type="text"
          value={form.sub_kategori}
          onChange={(e) =>
            setForm({ ...form, sub_kategori: e.target.value })
          }
          placeholder="Contoh: Pupuk, Bibit, Pestisida"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Harga (Rp) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={form.harga}
            onChange={(e) => setForm({ ...form, harga: e.target.value })}
            placeholder="25000"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Satuan
          </label>
          <input
            type="text"
            value={form.satuan}
            onChange={(e) => setForm({ ...form, satuan: e.target.value })}
            placeholder="kg, pcs, unit, set"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Stok Tersedia
          </label>
          <input
            type="number"
            value={form.stok}
            onChange={(e) => setForm({ ...form, stok: e.target.value })}
            placeholder="100"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Berat per Satuan (gram)
          </label>
          <input
            type="number"
            value={form.berat_gram}
            onChange={(e) =>
              setForm({ ...form, berat_gram: e.target.value })
            }
            placeholder="1000"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
          Deskripsi Produk
        </label>
        <textarea
          value={form.deskripsi}
          onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
          rows={6}
          placeholder="Jelaskan detail produk, kegunaan, cara pakai, dll..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
          Foto Produk (maks 5)
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.foto_urls.map((url, i) => (
            <div
              key={i}
              className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => hapusFoto(i)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>
          ))}
          {form.foto_urls.length < 5 && (
            <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition">
              {uploading ? (
                <span className="text-xs text-gray-500">⏳</span>
              ) : (
                <>
                  <span className="text-2xl text-gray-400">+</span>
                  <span className="text-[10px] text-gray-500">Upload</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUploadFoto}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Format: JPG/PNG/WebP. Maks 5MB per foto.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as any })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="aktif">✅ Aktif (tampil di toko)</option>
            <option value="nonaktif">🚫 Nonaktif</option>
            <option value="sold_out">❌ Sold Out</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 w-full">
            <input
              type="checkbox"
              checked={form.unggulan}
              onChange={(e) =>
                setForm({ ...form, unggulan: e.target.checked })
              }
              className="w-4 h-4"
            />
            <span className="text-sm font-bold text-amber-800">
              ⭐ Produk Unggulan
            </span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex-[2] bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
        >
          {loading
            ? "⏳ Menyimpan..."
            : isEditMode
            ? "💾 Update Produk"
            : "💾 Simpan Produk"}
        </button>
      </div>
    </form>
  );
}
