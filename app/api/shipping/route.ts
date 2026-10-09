import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// ============================================================
// Proxy ke Komerce RajaOngkir API
// ============================================================

const API_KEY = process.env.RAJAONGKIR_API_KEY;
const BASE_URL = "https://rajaongkir.komerce.id/api/v1";

// Cache in-memory biar gak boros hit API (reset tiap server restart)
const cacheCari = new Map<string, { data: any; expired: number }>();
const cacheOngkir = new Map<string, { data: any; expired: number }>();

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam untuk search kota

// Kurir yang didukung
const KURIR_LIST = ["jne", "jnt", "sicepat", "anteraja", "ninja", "pos"];

// ============================================================
// POST /api/shipping/search — cari kota/kecamatan
// Body: { search: "tuban" }
// ============================================================
async function handleSearch(search: string) {
  if (!search || search.trim().length < 3) {
    return NextResponse.json(
      { error: "Kata kunci minimal 3 karakter" },
      { status: 400 }
    );
  }

  const key = search.toLowerCase().trim();
  const cached = cacheCari.get(key);
  if (cached && cached.expired > Date.now()) {
    return NextResponse.json({ ok: true, data: cached.data });
  }

  const url = `${BASE_URL}/destination/domestic-destination?search=${encodeURIComponent(
    search
  )}`;

  const res = await fetch(url, {
    headers: { key: API_KEY || "" },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `RajaOngkir HTTP ${res.status}: ${text.slice(0, 200)}` },
      { status: 500 }
    );
  }

  const json = await res.json();
  const data = json?.data || [];

  cacheCari.set(key, { data, expired: Date.now() + CACHE_TTL_MS });

  return NextResponse.json({ ok: true, data });
}

// ============================================================
// POST /api/shipping/cost — hitung ongkir semua kurir
// Body: { destination: 71754, weight: 1000 }
// ============================================================
async function handleCost(destination: number, weight: number) {
  if (!destination || !weight) {
    return NextResponse.json(
      { error: "destination dan weight wajib diisi" },
      { status: 400 }
    );
  }

  const origin = process.env.RAJAONGKIR_ORIGIN_ID;
  if (!origin) {
    return NextResponse.json(
      { error: "RAJAONGKIR_ORIGIN_ID belum di-set" },
      { status: 500 }
    );
  }

  const cacheKey = `${origin}-${destination}-${weight}`;
  const cached = cacheOngkir.get(cacheKey);
  if (cached && cached.expired > Date.now()) {
    return NextResponse.json({ ok: true, data: cached.data });
  }

  // Panggil semua kurir paralel
  const promises = KURIR_LIST.map(async (kurir) => {
    try {
      const body = new URLSearchParams({
        origin: String(origin),
        destination: String(destination),
        weight: String(weight),
        courier: kurir,
        price: "lowest",
      });

      const res = await fetch(`${BASE_URL}/calculate/domestic-cost`, {
        method: "POST",
        headers: {
          key: API_KEY || "",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) return [];

      const json = await res.json();
      const data = json?.data || [];

      // Normalisasi format
      return data.map((d: any) => ({
        kurir: kurir,
        kurir_label: d.name || kurir.toUpperCase(),
        layanan: (d.service || "").toLowerCase(),
        layanan_label: d.service || "",
        deskripsi: d.description || "",
        biaya: Number(d.cost) || 0,
        estimasi: d.etd || "-",
      }));
    } catch (err) {
      console.error(`Kurir ${kurir} error:`, err);
      return [];
    }
  });

  const hasil = (await Promise.all(promises)).flat();

  // Sort dari termurah
  hasil.sort((a, b) => a.biaya - b.biaya);

  cacheOngkir.set(cacheKey, { data: hasil, expired: Date.now() + CACHE_TTL_MS });

  return NextResponse.json({ ok: true, data: hasil });
}

// ============================================================
// Route handler
// ============================================================
export async function POST(req: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: "RAJAONGKIR_API_KEY belum di-set" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const action = body.action;

    if (action === "search") {
      return await handleSearch(body.search || "");
    }

    if (action === "cost") {
      return await handleCost(
        Number(body.destination),
        Number(body.weight)
      );
    }

    return NextResponse.json(
      { error: "action tidak valid. Pakai 'search' atau 'cost'" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Shipping API error:", err);
    return NextResponse.json(
      { error: err.message || "Error" },
      { status: 500 }
    );
  }
}
