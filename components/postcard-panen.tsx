"use client";

import { Component, forwardRef, type ReactNode } from "react";

export type PostcardStyle =
  | "harvestanPro"
  | "editorialCream"
  | "boldPop"
  | "polaroid"
  | "fullPhoto"
  | "satelitCard"
  | "neonModern"
  | "earthTone";

export type PostcardData = {
  komoditas: string;
  komoditasLabel: string;
  hasilKg: number;
  luasHa: number;
  produktivitas: number;
  hargaJual: number;
  tanggal: string;
  namaPenggarap?: string | null;
  namaLahan?: string | null;
  profitOwner?: number | null;
  profitPenggarap?: number | null;
  tampilkanProfit: boolean;
  fotoCustomDataUrl?: string | null;
  satelitDataUrl?: string | null;
  polygon?: { type: "Polygon"; coordinates: number[][][] } | null;
  koordinat?: string | null;
  qrDataUrl: string;
  style: PostcardStyle;
};

const KOMODITAS_EMOJI: Record<string, string> = {
  padi: "🌾",
  jagung: "🌽",
  kacang_tanah: "🥜",
  bawang_merah: "🧅",
  cabai_rawit: "🌶️",
  cabai: "🌶️",
};

function safeNum(v: any, fallback = 0): number {
  const n = Number(v);
  return isNaN(n) || !isFinite(n) ? fallback : n;
}

function safeStr(v: any, fallback = ""): string {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

function safeRp(n: any): string {
  const num = safeNum(n);
  return "Rp " + Math.round(num).toLocaleString("id-ID");
}

function safeTanggal(iso: any, short = false): string {
  try {
    const d = new Date(safeStr(iso));
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
      day: short ? "2-digit" : "numeric",
      month: short ? "short" : "long",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function safeLabel(v: any): string {
  const s = safeStr(v, "Padi");
  return s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\s*/gu, "").trim() || "Padi";
}

class StyleBoundary extends Component<
  { children: ReactNode; name: string },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }
  static getDerivedStateFromError(error: any) {
    return {
      hasError: true,
      errorMessage: error?.message || "Unknown error",
    };
  }
  componentDidCatch(error: any) {
    console.error(`[Postcard style: ${this.props.name}]`, error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#fee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            padding: "100px",
            textAlign: "center",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ fontSize: "80px", marginBottom: "20px" }}>⚠️</div>
          <div style={{ fontSize: "36px", color: "#900", fontWeight: 700, marginBottom: "20px" }}>
            Style error: {this.props.name}
          </div>
          <div style={{ fontSize: "24px", color: "#600" }}>{this.state.errorMessage}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LOGO_URL = "/logo.png";
const LANDING_URL = "https://harvestan.vercel.app";

const FONT_SERIF = "Georgia, 'Times New Roman', serif";
const FONT_SANS =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const FONT_DISPLAY = "Impact, 'Arial Black', sans-serif";
const FONT_MONO = "'Courier New', monospace";

const BasePostcard = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  function BasePostcard({ children }, ref) {
    return (
      <div
        ref={ref}
        style={{
          width: "1080px",
          height: "1920px",
          position: "relative",
          overflow: "hidden",
          fontFamily: FONT_SANS,
        }}
      >
        {children}
      </div>
    );
  }
);

// ============ 1. HARVESTAN PRO ============
function StyleHarvestanPro({ data }: { data: PostcardData }) {
  const emoji = KOMODITAS_EMOJI[data.komoditas] || "🌾";
  const hasil = safeNum(data.hasilKg);
  const luas = safeNum(data.luasHa);
  const prod = safeNum(data.produktivitas);
  const harga = safeNum(data.hargaJual);
  const profit = data.profitOwner != null ? safeNum(data.profitOwner) : null;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#1a3a1c" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1000px",
          background: "linear-gradient(135deg, #2c5e2e 0%, #1f4521 50%, #1a3a1c 100%)",
          clipPath: "polygon(0 0, 100% 0, 100% 75%, 0 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(240, 180, 41, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(240, 180, 41, 0.06) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "80px",
          left: "80px",
          right: "80px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 2,
        }}
      >
        <img src={LOGO_URL} alt="Harvestan" style={{ height: "80px", width: "auto" }} />
        <div
          style={{
            background: "#f0b429",
            color: "#1a3a1c",
            padding: "12px 28px",
            borderRadius: "999px",
            fontSize: "22px",
            fontWeight: 900,
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          HASIL PANEN
        </div>
      </div>

      <div style={{ position: "absolute", top: "260px", left: 0, right: 0, textAlign: "center", zIndex: 2 }}>
        <div style={{ fontSize: "180px", lineHeight: 1, marginBottom: "20px" }}>{emoji}</div>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "88px",
            color: "#f0b429",
            letterSpacing: "6px",
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          {safeLabel(data.komoditasLabel)}
        </div>
      </div>

      <div style={{ position: "absolute", top: "780px", left: 0, right: 0, textAlign: "center", zIndex: 2 }}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "260px",
            color: "#ffffff",
            lineHeight: 0.9,
            letterSpacing: "-8px",
          }}
        >
          {Math.round(hasil).toLocaleString("id-ID")}
        </div>
        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: "52px",
            color: "#f0b429",
            fontWeight: 900,
            letterSpacing: "14px",
            marginTop: "20px",
          }}
        >
          KILOGRAM
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "320px",
          left: "80px",
          right: "80px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          zIndex: 2,
        }}
      >
        <StatBox label="LUAS LAHAN" value={luas.toFixed(2)} unit="Ha" />
        <StatBox label="PRODUKTIVITAS" value={Math.round(prod).toLocaleString("id-ID")} unit="Kg/Ha" />
        <StatBox label="HARGA JUAL" value={Math.round(harga).toLocaleString("id-ID")} unit="/ Kg" prefix="Rp " />
        <StatBox label="TANGGAL" value={safeTanggal(data.tanggal, true)} />
      </div>

      {data.tampilkanProfit && profit != null && (
        <div
          style={{
            position: "absolute",
            bottom: "200px",
            left: "80px",
            right: "80px",
            background: "rgba(240, 180, 41, 0.15)",
            border: "2px solid #f0b429",
            borderRadius: "24px",
            padding: "24px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 2,
          }}
        >
          <span style={{ color: "#f0b429", fontSize: "22px", fontWeight: 800, letterSpacing: "3px" }}>
            💵 PROFIT OWNER
          </span>
          <span style={{ color: "#ffffff", fontSize: "44px", fontWeight: 900 }}>
            {safeRp(profit)}
          </span>
        </div>
      )}

      <FooterBar data={data} theme="dark" />
    </div>
  );
}

// ============ 2. EDITORIAL CREAM ============
function StyleEditorialCream({ data }: { data: PostcardData }) {
  const emoji = KOMODITAS_EMOJI[data.komoditas] || "🌾";
  const hasil = safeNum(data.hasilKg);
  const luas = safeNum(data.luasHa);
  const prod = safeNum(data.produktivitas);
  const harga = safeNum(data.hargaJual);
  const profit = data.profitOwner != null ? safeNum(data.profitOwner) : null;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#f7f1e3", fontFamily: FONT_SERIF }}>
      <div style={{ position: "absolute", top: "60px", left: "60px", right: "60px", height: "3px", background: "#2c2c2c" }} />

      <div
        style={{
          position: "absolute",
          top: "100px",
          left: "60px",
          right: "60px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div style={{ fontSize: "18px", letterSpacing: "6px", color: "#2c2c2c", textTransform: "uppercase" }}>
          HARVEST JOURNAL
        </div>
        <div style={{ fontSize: "16px", letterSpacing: "3px", color: "#666", fontStyle: "italic" }}>
          {safeTanggal(data.tanggal, true)}
        </div>
      </div>

      <div style={{ position: "absolute", top: "180px", left: "60px", right: "60px", textAlign: "center" }}>
        <div style={{ fontSize: "24px", letterSpacing: "10px", color: "#999" }}>━━━ {emoji} ━━━</div>
      </div>

      <div style={{ position: "absolute", top: "300px", left: "80px", right: "80px", textAlign: "center" }}>
        <div
          style={{
            fontSize: "140px",
            fontStyle: "italic",
            color: "#2c2c2c",
            lineHeight: 1,
            letterSpacing: "-3px",
            marginBottom: "10px",
          }}
        >
          {safeLabel(data.komoditasLabel)}
        </div>
        <div style={{ fontSize: "28px", letterSpacing: "8px", color: "#8b6f47", fontStyle: "italic" }}>
          — Musim Panen Ini —
        </div>
      </div>

      <div style={{ position: "absolute", top: "740px", left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: "300px", color: "#2c5e2e", lineHeight: 0.85, letterSpacing: "-12px" }}>
          {Math.round(hasil).toLocaleString("id-ID")}
        </div>
        <div style={{ fontSize: "32px", letterSpacing: "14px", color: "#8b6f47", marginTop: "20px", fontStyle: "italic" }}>
          KILOGRAM
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "400px", left: "80px", right: "80px" }}>
        <div style={{ height: "1px", background: "#c9c0ab", marginBottom: "40px" }} />
        <EditorialRow label="Luas Lahan" value={`${luas.toFixed(2)} Ha`} />
        <EditorialRow label="Produktivitas" value={`${Math.round(prod).toLocaleString("id-ID")} Kg/Ha`} />
        <EditorialRow label="Harga Jual" value={`${safeRp(harga)} / Kg`} />
        {data.namaPenggarap && <EditorialRow label="Penggarap" value={safeStr(data.namaPenggarap)} />}
        <div style={{ height: "1px", background: "#c9c0ab", marginTop: "40px" }} />
      </div>

      {data.tampilkanProfit && profit != null && (
        <div style={{ position: "absolute", bottom: "260px", left: "80px", right: "80px", textAlign: "center" }}>
          <div style={{ fontSize: "20px", letterSpacing: "6px", color: "#8b6f47", fontStyle: "italic", marginBottom: "10px" }}>
            — Profit Owner —
          </div>
          <div style={{ fontSize: "56px", color: "#2c5e2e", fontStyle: "italic" }}>{safeRp(profit)}</div>
        </div>
      )}

      <FooterBar data={data} theme="cream" />
    </div>
  );
}

// ============ 3. BOLD POP (BAUHAUS) ============
function StyleBoldPop({ data }: { data: PostcardData }) {
  const emoji = KOMODITAS_EMOJI[data.komoditas] || "🌾";
  const hasil = safeNum(data.hasilKg);
  const luas = safeNum(data.luasHa);
  const prod = safeNum(data.produktivitas);
  const harga = safeNum(data.hargaJual);
  const profit = data.profitOwner != null ? safeNum(data.profitOwner) : null;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#f5e6d3", fontFamily: FONT_SANS }}>
      {/* blok merah kiri atas */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "480px", height: "480px", background: "#e63946" }} />
      {/* blok biru kanan atas */}
      <div style={{ position: "absolute", top: 0, right: 0, width: "600px", height: "320px", background: "#1d3557" }} />
      {/* blok kuning tengah */}
      <div style={{ position: "absolute", top: "320px", right: "120px", width: "320px", height: "320px", background: "#f4a261" }} />
      {/* garis hitam horizontal */}
      <div style={{ position: "absolute", top: "800px", left: 0, right: 0, height: "20px", background: "#1a1a1a" }} />
      {/* lingkaran hijau bawah kiri */}
      <div style={{ position: "absolute", bottom: "180px", left: "-100px", width: "500px", height: "500px", borderRadius: "50%", background: "#2a9d8f" }} />

      {/* logo tengah atas */}
      <div style={{ position: "absolute", top: "80px", left: "80px", zIndex: 3 }}>
        <img src={LOGO_URL} alt="Harvestan" style={{ height: "70px", width: "auto" }} />
      </div>

      {/* tag komoditas kanan atas */}
      <div style={{ position: "absolute", top: "120px", right: "80px", zIndex: 3, textAlign: "right" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: "44px", color: "#ffffff", letterSpacing: "4px", lineHeight: 1 }}>
          {safeLabel(data.komoditasLabel).toUpperCase()}
        </div>
        <div style={{ fontSize: "18px", color: "#f4a261", fontWeight: 900, letterSpacing: "6px", marginTop: "8px" }}>
          ✦ HARVEST ✦
        </div>
      </div>

      {/* kotak putih besar tengah dengan angka */}
      <div style={{ position: "absolute", top: "380px", left: "80px", right: "80px", background: "#ffffff", border: "8px solid #1a1a1a", padding: "60px 40px", zIndex: 3, textAlign: "center" }}>
        <div style={{ fontSize: "24px", color: "#e63946", fontWeight: 900, letterSpacing: "6px", marginBottom: "10px" }}>
          {emoji} HASIL PANEN
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: "240px", color: "#1a1a1a", lineHeight: 0.85, letterSpacing: "-10px" }}>
          {Math.round(hasil).toLocaleString("id-ID")}
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: "52px", color: "#1d3557", letterSpacing: "14px", marginTop: "10px" }}>
          KILOGRAM
        </div>
      </div>

      {/* stats blok bawah */}
      <div style={{ position: "absolute", top: "950px", left: "80px", right: "80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", zIndex: 3 }}>
        <BauhausBox label="LUAS" value={`${luas.toFixed(2)} Ha`} bg="#1d3557" fg="#ffffff" />
        <BauhausBox label="PRODUKTIVITAS" value={`${Math.round(prod).toLocaleString("id-ID")} Kg/Ha`} bg="#f4a261" fg="#1a1a1a" />
        <BauhausBox label="HARGA JUAL" value={`${safeRp(harga)}/Kg`} bg="#ffffff" fg="#1a1a1a" border />
        <BauhausBox label="TANGGAL" value={safeTanggal(data.tanggal, true)} bg="#e63946" fg="#ffffff" />
      </div>

      {data.tampilkanProfit && profit != null && (
        <div style={{ position: "absolute", bottom: "260px", left: "80px", right: "80px", background: "#1a1a1a", color: "#f4a261", padding: "30px 40px", zIndex: 3, display: "flex", justifyContent: "space-between", alignItems: "center", border: "6px solid #1a1a1a" }}>
          <span style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "4px" }}>💵 PROFIT</span>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: "52px", color: "#ffffff" }}>{safeRp(profit)}</span>
        </div>
      )}

      <FooterBar data={data} theme="bold" />
    </div>
  );
}

// ============ 4. POLAROID (INSTANT FUJI) ============
function StylePolaroid({ data }: { data: PostcardData }) {
  const emoji = KOMODITAS_EMOJI[data.komoditas] || "🌾";
  const hasil = safeNum(data.hasilKg);
  const luas = safeNum(data.luasHa);
  const prod = safeNum(data.produktivitas);
  const harga = safeNum(data.hargaJual);
  const profit = data.profitOwner != null ? safeNum(data.profitOwner) : null;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#e8e2d5", fontFamily: FONT_SANS }}>
      {/* subtle texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(0,0,0,0.06) 0%, transparent 50%)",
        }}
      />

      {/* instant photo frame */}
      <div
        style={{
          position: "absolute",
          top: "140px",
          left: "80px",
          right: "80px",
          background: "#ffffff",
          padding: "40px 40px 40px 40px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          transform: "rotate(-1.5deg)",
        }}
      >
        {/* foto area */}
        <div
          style={{
            width: "100%",
            height: "1200px",
            background: "#2c5e2e",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {data.fotoCustomDataUrl ? (
            <img
              src={data.fotoCustomDataUrl}
              alt="Foto"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "500px" }}>
              {emoji}
            </div>
          )}

          {/* corner date overlay (Fuji style) */}
          <div
            style={{
              position: "absolute",
              bottom: "30px",
              right: "30px",
              background: "rgba(255,140,0,0.9)",
              color: "#ffffff",
              padding: "10px 20px",
              fontFamily: FONT_MONO,
              fontSize: "24px",
              letterSpacing: "2px",
              fontWeight: 700,
            }}
          >
            {safeTanggal(data.tanggal, true)}
          </div>
        </div>

        {/* bottom caption area (thick, Fuji style) */}
        <div style={{ marginTop: "30px", padding: "20px 10px", borderTop: "2px solid #e5e5e5" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ fontFamily: FONT_SERIF, fontStyle: "italic", fontSize: "32px", color: "#333" }}>
              {safeLabel(data.komoditasLabel)}
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: "44px", color: "#1a1a1a", letterSpacing: "-1px" }}>
              {Math.round(hasil).toLocaleString("id-ID")} Kg
            </div>
          </div>
          {data.namaPenggarap && (
            <div style={{ fontFamily: FONT_MONO, fontSize: "20px", color: "#888", marginTop: "16px", letterSpacing: "2px" }}>
              ✎ by {safeStr(data.namaPenggarap)}
            </div>
          )}
        </div>
      </div>

      {/* stats bawah */}
      <div style={{ position: "absolute", bottom: "260px", left: "80px", right: "80px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        <FujiStat label="LUAS" value={`${luas.toFixed(2)} Ha`} />
        <FujiStat label="PROD." value={`${Math.round(prod).toLocaleString("id-ID")} Kg/Ha`} />
        <FujiStat label="HARGA" value={`${safeRp(harga)}/Kg`} />
      </div>

      {data.tampilkanProfit && profit != null && (
        <div style={{ position: "absolute", bottom: "180px", left: "80px", right: "80px", background: "#ffffff", border: "3px solid #ff8c00", padding: "20px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: "20px", color: "#ff8c00", fontWeight: 700, letterSpacing: "3px" }}>
            💵 PROFIT
          </span>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: "40px", color: "#1a1a1a" }}>{safeRp(profit)}</span>
        </div>
      )}

      <FooterBar data={data} theme="polaroid" />
    </div>
  );
}

// ============ 5. FULL PHOTO ============
function StyleFullPhoto({ data }: { data: PostcardData }) {
  const emoji = KOMODITAS_EMOJI[data.komoditas] || "🌾";
  const bg = data.fotoCustomDataUrl || data.satelitDataUrl;
  const hasil = safeNum(data.hasilKg);
  const luas = safeNum(data.luasHa);
  const prod = safeNum(data.produktivitas);
  const harga = safeNum(data.hargaJual);
  const profit = data.profitOwner != null ? safeNum(data.profitOwner) : null;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#1a1a1a", fontFamily: FONT_SANS }}>
      {bg ? (
        <img src={bg} alt="Background" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #2c5e2e 0%, #1a3a1c 100%)" }} />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.95) 100%)",
        }}
      />

      <div style={{ position: "absolute", top: "80px", left: "80px", right: "80px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
        <img src={LOGO_URL} alt="Harvestan" style={{ height: "80px", width: "auto" }} />
        <div style={{ color: "#ffffff", fontSize: "22px", letterSpacing: "4px", textTransform: "uppercase", background: "rgba(0,0,0,0.4)", padding: "12px 24px", borderRadius: "999px" }}>
          {safeTanggal(data.tanggal, true)}
        </div>
      </div>

      <div style={{ position: "absolute", top: "280px", left: 0, right: 0, textAlign: "center", zIndex: 2 }}>
        <div
          style={{
            display: "inline-block",
            color: "#f0b429",
            fontSize: "38px",
            fontWeight: 900,
            letterSpacing: "6px",
            textShadow: "0 2px 12px rgba(0,0,0,0.6)",
          }}
        >
          {emoji} {safeLabel(data.komoditasLabel).toUpperCase()}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: "80px", right: "80px", paddingBottom: "200px", zIndex: 2 }}>
        <div style={{ color: "#f0b429", fontSize: "30px", fontWeight: 800, letterSpacing: "6px", textTransform: "uppercase", marginBottom: "20px" }}>
          🌾 HASIL PANEN
        </div>

        <div style={{ color: "#ffffff", fontSize: "220px", fontWeight: 900, lineHeight: 0.9, letterSpacing: "-8px", fontFamily: FONT_DISPLAY }}>
          {Math.round(hasil).toLocaleString("id-ID")}
        </div>

        <div style={{ color: "#f0b429", fontSize: "56px", fontWeight: 900, letterSpacing: "10px", marginBottom: "50px", fontFamily: FONT_DISPLAY }}>
          KILOGRAM
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: data.tampilkanProfit && profit != null ? "40px" : "0" }}>
          <GlassStat label="LUAS" value={`${luas.toFixed(2)} Ha`} />
          <GlassStat label="PRODUKTIVITAS" value={`${Math.round(prod).toLocaleString("id-ID")} Kg/Ha`} />
          <GlassStat label="HARGA JUAL" value={`${safeRp(harga)}/Kg`} />
        </div>

        {data.tampilkanProfit && profit != null && (
          <div style={{ background: "rgba(240, 180, 41, 0.95)", color: "#2c5e2e", padding: "28px 40px", borderRadius: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "3px" }}>💵 PROFIT OWNER</span>
            <span style={{ fontSize: "52px", fontWeight: 900 }}>{safeRp(profit)}</span>
          </div>
        )}
      </div>

      <FooterBar data={data} theme="dark" />
    </div>
  );
}

// ============ 6. SATELIT CARD ============
function StyleSatelitCard({ data }: { data: PostcardData }) {
  const emoji = KOMODITAS_EMOJI[data.komoditas] || "🌾";
  const hasil = safeNum(data.hasilKg);
  const luas = safeNum(data.luasHa);
  const prod = safeNum(data.produktivitas);
  const harga = safeNum(data.hargaJual);
  const profit = data.profitOwner != null ? safeNum(data.profitOwner) : null;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#1a3a1c", fontFamily: FONT_SANS }}>
      {data.satelitDataUrl ? (
        <img src={data.satelitDataUrl} alt="Peta satelit" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "repeating-linear-gradient(45deg, #3a7d44 0px, #3a7d44 40px, #2c5e2e 40px, #2c5e2e 80px)",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(26,58,28,0.85) 0%, rgba(26,58,28,0.3) 25%, rgba(26,58,28,0.3) 45%, rgba(26,58,28,0.98) 100%)",
        }}
      />

      <div style={{ position: "absolute", top: "80px", left: "80px", right: "80px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
        <img src={LOGO_URL} alt="Harvestan" style={{ height: "80px", width: "auto" }} />
        <div style={{ background: "rgba(240,180,41,0.95)", color: "#1a3a1c", padding: "12px 24px", borderRadius: "999px", fontSize: "22px", fontWeight: 900, letterSpacing: "3px" }}>
          🛰️ SATELIT
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "240px",
          left: "80px",
          right: "80px",
          background: "rgba(255, 255, 255, 0.97)",
          borderRadius: "40px",
          padding: "50px",
          zIndex: 2,
          boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
          <div style={{ fontSize: "80px", lineHeight: 1 }}>{emoji}</div>
          <div>
            <div style={{ fontSize: "18px", color: "#8b6f47", fontWeight: 700, letterSpacing: "4px", marginBottom: "6px" }}>HASIL PANEN</div>
            <div style={{ fontSize: "48px", color: "#2c5e2e", fontWeight: 900, textTransform: "uppercase", lineHeight: 1 }}>
              {safeLabel(data.komoditasLabel)}
            </div>
          </div>
        </div>

        <div style={{ height: "3px", background: "#2c5e2e", width: "100%", marginBottom: "40px" }} />

        <div style={{ fontSize: "200px", color: "#2c5e2e", fontWeight: 900, lineHeight: 0.9, letterSpacing: "-8px", fontFamily: FONT_DISPLAY }}>
          {Math.round(hasil).toLocaleString("id-ID")}
        </div>
        <div style={{ fontSize: "36px", color: "#8b6f47", fontWeight: 900, letterSpacing: "8px", marginBottom: "40px", fontFamily: FONT_DISPLAY }}>
          KILOGRAM
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 30px" }}>
          <SatelitRow label="Luas Lahan" value={`${luas.toFixed(2)} Ha`} />
          <SatelitRow label="Produktivitas" value={`${Math.round(prod).toLocaleString("id-ID")} Kg/Ha`} />
          <SatelitRow label="Harga Jual" value={`${safeRp(harga)}/Kg`} />
          <SatelitRow label="Tanggal" value={safeTanggal(data.tanggal, true)} />
        </div>

        {data.tampilkanProfit && profit != null && (
          <div style={{ marginTop: "40px", paddingTop: "30px", borderTop: "2px dashed #2c5e2e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8b6f47", fontSize: "20px", fontWeight: 800, letterSpacing: "2px" }}>💵 PROFIT OWNER</span>
            <span style={{ color: "#2c5e2e", fontSize: "42px", fontWeight: 900 }}>{safeRp(profit)}</span>
          </div>
        )}
      </div>

      <div style={{ position: "absolute", bottom: "80px", left: "80px", right: "80px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
        <div>
          {data.namaPenggarap && (
            <div style={{ color: "#ffffff", fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}>
              👨‍🌾 {safeStr(data.namaPenggarap)}
            </div>
          )}
          {data.namaLahan && (
            <div style={{ color: "#f0b429", fontSize: "22px", fontWeight: 700, letterSpacing: "2px" }}>
              📍 {safeStr(data.namaLahan)}
            </div>
          )}
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "18px", marginTop: "14px" }}>
            Made with <strong style={{ color: "#f0b429" }}>Harvestan</strong>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "14px", borderRadius: "20px" }}>
          <img src={data.qrDataUrl} alt="QR" style={{ width: "140px", height: "140px", display: "block", borderRadius: "8px" }} />
        </div>
      </div>
    </div>
  );
}

// ============ 7. NEON MODERN (ARCADE) ============
function StyleNeonModern({ data }: { data: PostcardData }) {
  const emoji = KOMODITAS_EMOJI[data.komoditas] || "🌾";
  const hasil = safeNum(data.hasilKg);
  const luas = safeNum(data.luasHa);
  const prod = safeNum(data.produktivitas);
  const harga = safeNum(data.hargaJual);
  const profit = data.profitOwner != null ? safeNum(data.profitOwner) : null;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0014", fontFamily: FONT_MONO }}>
      {/* scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 4px)",
        }}
      />

      {/* grid horizon */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "700px",
          backgroundImage:
            "linear-gradient(rgba(255, 0, 200, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 200, 0.4) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          transform: "perspective(300px) rotateX(60deg)",
          transformOrigin: "bottom",
        }}
      />

      {/* glow top */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "600px",
          background: "radial-gradient(ellipse, rgba(255, 0, 200, 0.5) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
      />

      {/* logo */}
      <div style={{ position: "absolute", top: "80px", left: "80px", zIndex: 3 }}>
        <img src={LOGO_URL} alt="Harvestan" style={{ height: "70px", width: "auto", filter: "brightness(0) invert(1)" }} />
      </div>

      {/* date top right */}
      <div style={{ position: "absolute", top: "90px", right: "80px", zIndex: 3 }}>
        <div
          style={{
            background: "#ff00c8",
            color: "#0a0014",
            padding: "10px 20px",
            fontFamily: FONT_MONO,
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "3px",
            boxShadow: "0 0 30px rgba(255, 0, 200, 0.7)",
          }}
        >
          {safeTanggal(data.tanggal, true)}
        </div>
      </div>

      {/* player 1 header */}
      <div style={{ position: "absolute", top: "260px", left: 0, right: 0, textAlign: "center", zIndex: 3 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: "24px", color: "#00ffe1", letterSpacing: "8px", marginBottom: "10px" }}>
          ★ PLAYER 1 ★
        </div>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "100px",
            color: "#ff00c8",
            letterSpacing: "4px",
            lineHeight: 1,
            textShadow: "0 0 20px #ff00c8, 0 0 40px #ff00c8, 0 0 80px rgba(255, 0, 200, 0.5)",
          }}
        >
          {safeLabel(data.komoditasLabel).toUpperCase()}
        </div>
      </div>

      {/* emoji */}
      <div style={{ position: "absolute", top: "500px", left: 0, right: 0, textAlign: "center", zIndex: 3, fontSize: "140px" }}>
        {emoji}
      </div>

      {/* skor besar */}
      <div style={{ position: "absolute", top: "720px", left: 0, right: 0, textAlign: "center", zIndex: 3 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: "22px", color: "#00ffe1", letterSpacing: "6px", marginBottom: "10px" }}>
          HIGH SCORE
        </div>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "260px",
            color: "#00ffe1",
            lineHeight: 0.85,
            letterSpacing: "-10px",
            textShadow: "0 0 30px #00ffe1, 0 0 60px #00ffe1, 0 0 100px rgba(0, 255, 225, 0.6)",
          }}
        >
          {Math.round(hasil).toLocaleString("id-ID")}
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: "36px", color: "#ff00c8", letterSpacing: "16px", marginTop: "10px", textShadow: "0 0 20px #ff00c8" }}>
          KG
        </div>
      </div>

      {/* arcade stats */}
      <div style={{ position: "absolute", bottom: "380px", left: "80px", right: "80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", zIndex: 3 }}>
        <ArcadeBox label="LUAS" value={`${luas.toFixed(2)} Ha`} color="#00ffe1" />
        <ArcadeBox label="PRODUKTIVITAS" value={`${Math.round(prod).toLocaleString("id-ID")} Kg/Ha`} color="#ff00c8" />
        <ArcadeBox label="HARGA" value={`${safeRp(harga)}/Kg`} color="#ffe600" />
        <ArcadeBox label="TANGGAL" value={safeTanggal(data.tanggal, true)} color="#00ffe1" />
      </div>

      {data.tampilkanProfit && profit != null && (
        <div
          style={{
            position: "absolute",
            bottom: "260px",
            left: "80px",
            right: "80px",
            background: "#0a0014",
            border: "3px solid #ffe600",
            padding: "24px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 3,
            boxShadow: "0 0 40px rgba(255, 230, 0, 0.5)",
          }}
        >
          <span style={{ fontFamily: FONT_MONO, fontSize: "22px", color: "#ffe600", letterSpacing: "4px", fontWeight: 700 }}>
            💰 COIN
          </span>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: "48px", color: "#ffffff", textShadow: "0 0 20px #ffe600" }}>
            {safeRp(profit)}
          </span>
        </div>
      )}

      <FooterBar data={data} theme="neon" />
    </div>
  );
}

// ============ 8. EARTH TONE (SUNSET SAWAH) ============
function StyleEarthTone({ data }: { data: PostcardData }) {
  const emoji = KOMODITAS_EMOJI[data.komoditas] || "🌾";
  const hasil = safeNum(data.hasilKg);
  const luas = safeNum(data.luasHa);
  const prod = safeNum(data.produktivitas);
  const harga = safeNum(data.hargaJual);
  const profit = data.profitOwner != null ? safeNum(data.profitOwner) : null;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #ff8c42 0%, #ffb84d 25%, #e8d5a8 55%, #8b6f47 100%)", fontFamily: FONT_SERIF }}>
      {/* matahari */}
      <div
        style={{
          position: "absolute",
          top: "180px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #fff2b8 0%, #ffcc66 40%, #ff8c42 80%)",
          boxShadow: "0 0 120px 40px rgba(255, 204, 102, 0.6)",
        }}
      />

      {/* awan silhouette */}
      <div
        style={{
          position: "absolute",
          top: "300px",
          left: "100px",
          width: "300px",
          height: "60px",
          borderRadius: "40px",
          background: "rgba(255,255,255,0.4)",
          filter: "blur(8px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "380px",
          right: "150px",
          width: "220px",
          height: "50px",
          borderRadius: "40px",
          background: "rgba(255,255,255,0.35)",
          filter: "blur(8px)",
        }}
      />

      {/* silhouette sawah (batang padi) */}
      <div style={{ position: "absolute", bottom: "500px", left: 0, right: 0, height: "300px", display: "flex", justifyContent: "space-around", alignItems: "flex-end", opacity: 0.5 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{ width: "6px", height: `${180 + (i % 5) * 20}px`, background: "#5a3e1b", transform: `rotate(${(i % 3 - 1) * 8}deg)`, transformOrigin: "bottom" }} />
        ))}
      </div>

      {/* logo atas */}
      <div style={{ position: "absolute", top: "80px", left: "80px", zIndex: 3 }}>
        <img src={LOGO_URL} alt="Harvestan" style={{ height: "70px", width: "auto" }} />
      </div>

      {/* tag kanan atas */}
      <div style={{ position: "absolute", top: "100px", right: "80px", zIndex: 3, textAlign: "right" }}>
        <div style={{ fontFamily: FONT_SERIF, fontSize: "20px", color: "#5a3e1b", fontStyle: "italic", letterSpacing: "3px" }}>
          {safeTanggal(data.tanggal, true)}
        </div>
      </div>

      {/* komoditas atas matahari */}
      <div style={{ position: "absolute", top: "620px", left: 0, right: 0, textAlign: "center", zIndex: 3 }}>
        <div style={{ fontSize: "100px", marginBottom: "10px" }}>{emoji}</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: "60px", color: "#3d2a14", letterSpacing: "8px", textTransform: "uppercase" }}>
          {safeLabel(data.komoditasLabel)}
        </div>
      </div>

      {/* angka gede */}
      <div style={{ position: "absolute", top: "1000px", left: 0, right: 0, textAlign: "center", zIndex: 3 }}>
        <div style={{ fontFamily: FONT_SERIF, fontSize: "28px", color: "#3d2a14", fontStyle: "italic", letterSpacing: "6px", marginBottom: "10px" }}>
          — Hasil Panen —
        </div>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "280px",
            color: "#2c1810",
            lineHeight: 0.9,
            letterSpacing: "-10px",
            textShadow: "0 4px 20px rgba(255,255,255,0.3)",
          }}
        >
          {Math.round(hasil).toLocaleString("id-ID")}
        </div>
        <div style={{ fontFamily: FONT_SERIF, fontSize: "36px", color: "#5a3e1b", letterSpacing: "14px", fontStyle: "italic", marginTop: "10px" }}>
          KILOGRAM
        </div>
      </div>

      {/* stats */}
      <div style={{ position: "absolute", bottom: "340px", left: "80px", right: "80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 40px", zIndex: 3 }}>
        <SunsetRow label="Luas Lahan" value={`${luas.toFixed(2)} Ha`} />
        <SunsetRow label="Produktivitas" value={`${Math.round(prod).toLocaleString("id-ID")} Kg/Ha`} />
        <SunsetRow label="Harga Jual" value={`${safeRp(harga)}/Kg`} />
        <SunsetRow label="Tanggal" value={safeTanggal(data.tanggal, true)} />
      </div>

      {data.tampilkanProfit && profit != null && (
        <div
          style={{
            position: "absolute",
            bottom: "220px",
            left: "80px",
            right: "80px",
            background: "#3d2a14",
            color: "#f7e6c8",
            padding: "24px 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderRadius: "20px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
            zIndex: 3,
          }}
        >
          <span style={{ fontSize: "22px", fontStyle: "italic", letterSpacing: "3px" }}>💵 Profit Owner</span>
          <span style={{ fontSize: "44px", fontWeight: 900, fontFamily: FONT_DISPLAY }}>{safeRp(profit)}</span>
        </div>
      )}

      <FooterBar data={data} theme="earth" />
    </div>
  );
}

// ============ HELPER COMPONENTS ============
function StatBox({ label, value, unit, prefix }: { label: string; value: string; unit?: string; prefix?: string }) {
  return (
    <div style={{ background: "rgba(240, 180, 41, 0.1)", border: "1px solid rgba(240, 180, 41, 0.4)", borderRadius: "20px", padding: "20px 24px" }}>
      <div style={{ fontSize: "16px", color: "#f0b429", fontWeight: 800, letterSpacing: "3px", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "32px", color: "#ffffff", fontWeight: 900 }}>
        {prefix}{value}{unit && <span style={{ fontSize: "18px", color: "#f0b429", marginLeft: "6px" }}>{unit}</span>}
      </div>
    </div>
  );
}

function EditorialRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "20px 0", borderBottom: "1px solid #e0d8c0" }}>
      <span style={{ fontSize: "24px", color: "#8b6f47", fontStyle: "italic" }}>{label}</span>
      <span style={{ fontSize: "30px", color: "#2c2c2c", fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function BauhausBox({ label, value, bg, fg, border }: { label: string; value: string; bg: string; fg: string; border?: boolean }) {
  return (
    <div style={{ background: bg, color: fg, padding: "24px 20px", border: border ? "6px solid #1a1a1a" : "none" }}>
      <div style={{ fontSize: "18px", fontWeight: 900, letterSpacing: "3px", marginBottom: "8px", opacity: 0.85 }}>{label}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: "32px", letterSpacing: "-1px" }}>{value}</div>
    </div>
  );
}

function FujiStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#ffffff", border: "2px solid #1a1a1a", padding: "16px 12px", textAlign: "center", boxShadow: "4px 4px 0 #1a1a1a" }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: "14px", color: "#888", letterSpacing: "2px", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: "24px", color: "#1a1a1a" }}>{value}</div>
    </div>
  );
}

function GlassStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.3)", borderRadius: "20px", padding: "20px", textAlign: "center" }}>
      <div style={{ fontSize: "16px", color: "#f0b429", fontWeight: 800, letterSpacing: "3px", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "26px", color: "#ffffff", fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function SatelitRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "16px", color: "#8b6f47", fontWeight: 700, letterSpacing: "2px", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "26px", color: "#2c5e2e", fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function ArcadeBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#0a0014", border: `2px solid ${color}`, padding: "20px", boxShadow: `0 0 20px ${color}40` }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: "14px", color: color, letterSpacing: "3px", marginBottom: "8px", fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: "28px", color: "#ffffff", letterSpacing: "1px" }}>{value}</div>
    </div>
  );
}

function SunsetRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "16px 0", borderBottom: "2px dashed rgba(90, 62, 27, 0.4)" }}>
      <div style={{ fontSize: "18px", color: "#5a3e1b", fontStyle: "italic", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "30px", color: "#2c1810", fontWeight: 700, fontFamily: FONT_SERIF }}>{value}</div>
    </div>
  );
}

function FooterBar({ data, theme }: { data: PostcardData; theme: string }) {
  const config: Record<string, { text: string; sub: string; qrBg: string }> = {
    dark: { text: "#ffffff", sub: "rgba(255,255,255,0.5)", qrBg: "#ffffff" },
    cream: { text: "#2c2c2c", sub: "#8b6f47", qrBg: "#2c5e2e" },
    bold: { text: "#2c5e2e", sub: "#2c5e2e", qrBg: "#2c5e2e" },
    polaroid: { text: "#2c2c2c", sub: "#8b6f47", qrBg: "#2c5e2e" },
    neon: { text: "#ffffff", sub: "#00ffe1", qrBg: "#ffffff" },
    earth: { text: "#2c1810", sub: "#5a3e1b", qrBg: "#3d2a14" },
  };
  const c = config[theme] || config.dark;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "60px",
        left: "80px",
        right: "80px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "40px",
        zIndex: 2,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: c.sub, fontSize: "18px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
          Made with Harvestan
        </div>
        <div style={{ color: c.sub, fontSize: "14px", marginTop: "4px", letterSpacing: "1px" }}>
          harvestan.vercel.app
        </div>
      </div>
      <div style={{ background: c.qrBg, padding: "10px", borderRadius: "14px", flexShrink: 0 }}>
        <img src={data.qrDataUrl} alt="QR" style={{ width: "110px", height: "110px", display: "block", borderRadius: "6px" }} />
      </div>
    </div>
  );
}

// ============ MAIN EXPORT ============
const PostcardPanen = forwardRef<HTMLDivElement, { data: PostcardData }>(
  function PostcardPanen({ data }, ref) {
    return (
      <BasePostcard ref={ref}>
        <StyleBoundary name={data.style}>
          {data.style === "harvestanPro" && <StyleHarvestanPro data={data} />}
          {data.style === "editorialCream" && <StyleEditorialCream data={data} />}
          {data.style === "boldPop" && <StyleBoldPop data={data} />}
          {data.style === "polaroid" && <StylePolaroid data={data} />}
          {data.style === "fullPhoto" && <StyleFullPhoto data={data} />}
          {data.style === "satelitCard" && <StyleSatelitCard data={data} />}
          {data.style === "neonModern" && <StyleNeonModern data={data} />}
          {data.style === "earthTone" && <StyleEarthTone data={data} />}
        </StyleBoundary>
      </BasePostcard>
    );
  }
);

export default PostcardPanen;
export { LANDING_URL };
