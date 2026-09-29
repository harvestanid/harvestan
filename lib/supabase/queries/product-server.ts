import { createClient } from "@/lib/supabase/server";
import {
  KATEGORI_PRODUK,
  getKategoriLabel,
  getKategoriIcon,
  getKategoriSlug,
} from "@/lib/katalog/kategori";

export type Product = {
  id: string;
  nama: string;
  kategori:
    | "input_pertanian"
    | "output_pertanian"
    | "alat_mesin_pertanian"
    | "furniture_mebel";
  sub_kategori: string | null;
  harga: number;
  satuan: string;
  stok: number;
  berat_gram: number;
  deskripsi: string | null;
  foto_urls: string[];
  status: "aktif" | "nonaktif" | "sold_out";
  unggulan: boolean;
  rating_rata: number;
  total_review: number;
  total_terjual: number;
  created_at: string;
  updated_at: string;
};

// Re-export untuk kompatibilitas
export { KATEGORI_PRODUK, getKategoriLabel, getKategoriIcon, getKategoriSlug };

export async function getProductsList(options?: {
  kategori?: string;
  status?: string;
  search?: string;
  unggulan_only?: boolean;
  limit?: number;
}): Promise<Product[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*")
    .order("unggulan", { ascending: false })
    .order("created_at", { ascending: false });

  if (options?.kategori && options.kategori !== "all") {
    query = query.eq("kategori", options.kategori);
  }

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.unggulan_only) {
    query = query.eq("unggulan", true);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getProductsList error:", error);
    return [];
  }

  let result = (data || []) as Product[];

  if (options?.search) {
    const q = options.search.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        (p.deskripsi || "").toLowerCase().includes(q) ||
        (p.sub_kategori || "").toLowerCase().includes(q)
    );
  }

  return result;
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("getProductById error:", error);
    return null;
  }

  return data as Product;
}

export async function createProduct(input: {
  nama: string;
  kategori: Product["kategori"];
  sub_kategori?: string | null;
  harga: number;
  satuan: string;
  stok: number;
  berat_gram?: number;
  deskripsi?: string | null;
  foto_urls?: string[];
  status?: Product["status"];
  unggulan?: boolean;
}): Promise<{ ok: boolean; product?: Product; message: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .insert({
      nama: input.nama,
      kategori: input.kategori,
      sub_kategori: input.sub_kategori || null,
      harga: input.harga,
      satuan: input.satuan || "pcs",
      stok: input.stok || 0,
      berat_gram: input.berat_gram || 1000,
      deskripsi: input.deskripsi || null,
      foto_urls: input.foto_urls || [],
      status: input.status || "aktif",
      unggulan: input.unggulan || false,
    })
    .select()
    .single();

  if (error) {
    console.error("createProduct error:", error);
    return { ok: false, message: error.message };
  }

  return { ok: true, product: data as Product, message: "Produk dibuat" };
}

export async function updateProduct(
  id: string,
  input: Partial<{
    nama: string;
    kategori: Product["kategori"];
    sub_kategori: string | null;
    harga: number;
    satuan: string;
    stok: number;
    berat_gram: number;
    deskripsi: string | null;
    foto_urls: string[];
    status: Product["status"];
    unggulan: boolean;
  }>
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("updateProduct error:", error);
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Produk diupdate" };
}

export async function deleteProduct(
  id: string
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    console.error("deleteProduct error:", error);
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Produk dihapus" };
}

export async function uploadProductPhoto(
  file: File,
  userId: string
): Promise<{ ok: boolean; url?: string; message: string }> {
  const supabase = await createClient();

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("product-photos")
    .upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return { ok: false, message: error.message };
  }

  const { data: urlData } = supabase.storage
    .from("product-photos")
    .getPublicUrl(filename);

  return { ok: true, url: urlData.publicUrl, message: "Upload sukses" };
}

export async function deleteProductPhoto(
  url: string
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/product-photos/");
    if (pathParts.length < 2) {
      return { ok: false, message: "URL tidak valid" };
    }
    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from("product-photos")
      .remove([filePath]);

    if (error) {
      return { ok: false, message: error.message };
    }

    return { ok: true, message: "Foto dihapus" };
  } catch (err: any) {
    return { ok: false, message: err.message || "Error" };
  }
}
