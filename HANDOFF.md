📝 Update HANDOFF.md — FULL FILE (v1.5)

Perintah:

```bash
cd ~/projects/harvestan
micro HANDOFF.md
```

Hapus SEMUA (Ctrl+A → Delete), paste FULL FILE ini:

```markdown
# 🤝 HANDOFF — Konteks untuk Chat Baru

**File ini dibuat untuk melanjutkan development Harvestan di chat baru.**
Copy-paste isi file ini (atau link repo) ke chat baru untuk kasih konteks ke AI.

---

## 🎯 Project Info

- **Nama**: Harvestan
- **Deskripsi**: SaaS manajemen pertanian Indonesia
- **Repo**: https://github.com/harvestanid/harvestan
- **Live**: https://harvestan.vercel.app
- **Versi**: v1.5 (Laporan lengkap + Laporan Tahunan/5 Tahunan)
- **User**: Pemula (tidak bisa coding), koding semua oleh AI
- **Development**: Termux di Android

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **UI**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL + RLS + Auth)
- **Auth**: Supabase Auth (Email + Google OAuth)
- **Hosting**: Vercel
- **Grafik**: Recharts
- **PDF**: jsPDF + custom star drawing
- **Excel**: xlsx (SheetJS)
- **PNG**: html-to-image
- **Maps**: Leaflet + OpenStreetMap (satelit via Esri)
- **Editor**: micro (di Termux)

---

## 📁 Struktur Folder Penting

```

app/
├── page.tsx                          # Landing page (publik)
├── layout.tsx                        # Root layout + SEO metadata
├── auth/callback/route.ts            # Google OAuth callback
├── (auth)/
│   ├── layout.tsx
│   ├── login/page.tsx                # Login (Email + Google)
│   └── register/page.tsx             # Register (Email + Google)
├── (dashboard)/
│   ├── layout.tsx                    # Sidebar + bottom nav (scrollable mobile)
│   ├── dashboard/page.tsx
│   ├── keuangan/
│   │   ├── page.tsx                  # Server (ambil data + musim)
│   │   └── keuangan-client.tsx       # Client (filter tahun/komoditas/musim)
│   ├── grafik/
│   │   ├── page.tsx
│   │   ├── grafik-client.tsx
│   │   └── grafik-cabai.tsx          # Grafik per musim cabai
│   ├── gabah/page.tsx
│   ├── panen-multi/page.tsx
│   ├── ukur-lahan/
│   │   ├── page.tsx                  # Server (baca searchParams)
│   │   └── ukur-content.tsx          # Client (peta + GPS)
│   ├── laporan/
│   │   ├── page.tsx                  # Server
│   │   └── klien.tsx                 # Client (form download)
│   ├── pengaturan/
│   │   ├── page.tsx                  # Tab Akun + Kategori
│   │   ├── akun-tab.tsx
│   │   ├── kategori-tab.tsx
│   │   ├── tab-container.tsx
│   │   └── form.tsx
│   ├── export/page.tsx
│   ├── penggarap/
│   │   ├── page.tsx                  # List + badge kategori
│   │   ├── baru/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx              # Detail + lahan + hutang
│   │       ├── tombol-aksi.tsx
│   │       ├── transfer/
│   │       │   ├── page.tsx
│   │       │   └── form.tsx
│   │       ├── lahan/
│   │       │   ├── baru/page.tsx     # Form + link GPS Walking
│   │       │   └── [landId]/
│   │       │       ├── page.tsx      # Detail + produktivitas per komoditas + mini-map + breakdown musim cabai
│   │       │       ├── tombol-aksi.tsx  # Edit + tombol GPS Walking
│   │       │       └── panen/
│   │       │           ├── baru/
│   │       │           │   ├── page.tsx       # Server
│   │       │           │   └── form-client.tsx  # Client (musim, skema)
│   │       │           └── [harvestId]/
│   │       │               ├── page.tsx     # Detail panen + log + tombol PDF invoice
│   │       │               ├── tombol-aksi.tsx
│   │       │               ├── tombol-download-invoice.tsx  # PDF invoice
│   │       │               └── edit/page.tsx
│   │       └── hutang/
│   │           ├── baru/page.tsx
│   │           └── [debtId]/
│   │               ├── page.tsx
│   │               └── tombol-aksi.tsx
├── api/
│   ├── lahan/[id]/route.ts
│   ├── panen/[id]/route.ts
│   ├── hutang/[id]/route.ts
│   ├── kategori/route.ts
│   ├── musim/route.ts                # CRUD musim cabai
│   ├── musim/[id]/route.ts
│   ├── transfer-lahan/route.ts
│   ├── export/route.ts               # Excel (4 sheet)
│   ├── export-pdf/route.ts           # PDF per penggarap + grafik
│   └── export-laporan/route.ts       # PDF laporan tahunan/5 tahunan
└── auth/logout/route.ts

lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── queries/
│       ├── penggarap.ts
│       ├── penggarap-server.ts
│       ├── panen-server.ts
│       ├── hutang-server.ts
│       ├── kategori-server.ts
│       └── musim-server.ts
└── utils/
├── grafik-helpers.ts
└── hitung-luas.ts

components/
├── install-pwa.tsx
├── skema-bagi-hasil-v2.tsx           # Dropdown skema bagi hasil
├── peta-ukur.tsx                     # Leaflet tracking GPS
├── peta-mini.tsx                     # Mini-map preview polygon
└── peta-mini-wrapper.tsx             # Wrapper client

middleware.ts

```

---

## 🗄️ Database Schema (Supabase)

### `penggaraps`
```

id (uuid, PK)
user_id (uuid, FK auth.users)
nama, alamat, usia, kontak
created_at, updated_at

```

### `lands`
```

id (uuid, PK)
user_id (uuid)
penggarap_id (uuid, FK penggaraps)
nama (text)
luas (numeric)
lokasi_koordinat (text, nullable)
polygon (jsonb, nullable)  -- GeoJSON Polygon dari GPS Walking
created_at, updated_at

```

### `harvests`
```

id (uuid, PK)
user_id, land_id (uuid)
tanggal (date)
komoditas (text, default 'padi')
musim (text, nullable)  -- untuk cabai rawit
hasil_kg, harga_gabah, harga_per_kg
biaya_panen_per_kg, biaya_tambahan, keterangan_biaya
bawa_penggarap, bawa_owner, bawa_lain
persen_owner (default 50)
persen_penggarap (default 50)
profit_bersih, profit_owner, profit_penggarap
potongan_hutang, potongan_hutang_log (jsonb)
total_hutang_sebelum, sisa_hutang_sesudah
catatan (text, nullable)
created_at, updated_at

```

### `debts`
```

id (uuid, PK)
user_id, penggarap_id
tanggal, jumlah, keperluan
dibayar (default 0), sisa
log_perubahan (jsonb, default '[]')
created_at

```

### `categories`
```

id (uuid, PK)
user_id, komoditas
cukup, baik, sangat_baik (numeric, nullable)
created_at, updated_at

```

### `musim_cabai`
```

id (uuid, PK)
user_id (FK auth.users)
nama (text, NOT NULL)
tanggal_mulai, tanggal_selesai (date)
catatan (text)
created_at, updated_at
UNIQUE(user_id, nama)

```

**RLS**: Semua tabel aktif dengan policy `auth.uid() = user_id`.

---

## ⚠️ ATURAN PENTING

### 1. **RLS Policy — WAJIB kirim `user_id`**
Setiap `insert()` wajib ada `user_id: user.id`.

### 2. **Server Action vs API Route**
- **Form tambah**: Server Action (`'use server'`)
- **Edit/Hapus**: API Route

### 3. **Pola Jawaban AI**
- User pemula, **JANGAN** kasih potongan kode / "cari baris X"
- **SELALU FULL FILE** → user Ctrl+A → Delete → Paste
- Kasih patokan `wc -l` untuk verifikasi
- Kalau error, minta screenshot + `wc -l`

### 4. **micro (Termux)**
- `Ctrl+S` simpan, `Ctrl+Q` keluar
- `"use client"` **HARUS** di baris 1
- Paste kode panjang: tunggu 10 detik, scroll cek `}` terakhir

### 5. **Path dengan `[ ]` atau `( )`**
Wajib pakai tanda kutip:
```bash
micro "app/(dashboard)/penggarap/[id]/page.tsx"
```

6. Nama Kolom Tabel

· hasil_kg, harga_gabah, profit_owner, persen_penggarap
· harga_gabah = harga_per_kg (sync)
· Kategori: cukup, baik, sangat_baik (BUKAN cukup_min)

7. JANGAN CAMPUR PRODUKTIVITAS ANTAR KOMODITAS

Setiap komoditas dihitung terpisah.

8. JANGAN BIKIN NESTED <form>

Modal di dalam <form> utama JANGAN pakai <form> juga. Pakai <div> + tombol dengan onClick.

9. JANGAN pakai useSearchParams() di page.tsx

Di Next.js 16, tidak reliable. Pakai props dari Server Component.

10. JANGAN taruh Client Component di dalam Server Component tanpa wrapper

Kalau butuh useState, useEffect, dll → pisahkan ke Client Component ("use client" baris 1).

11. Sebelum Push, WAJIB npm run build

12. <script> di Server Component = ERROR

Pakai <Script> dari next/script atau taruh di Client Component useEffect.

13. WAJIB: Kill Node Sebelum Clear Cache

Kalau ubah file tapi tidak ke-load:

```bash
pkill -9 node
pkill -9 next
rm -rf .next
rm -rf node_modules/.cache
npm run dev
```

JANGAN cuma Ctrl+C — proses Next.js sering nyangkut dan pegang file .next.

14. @/components/... Import di Server Component

Kalau file Client Component ("use client") dipakai di Server Component, WAJIB:

· File punya "use client" di baris 1
· Pisahkan Client Component ke file sendiri
· JANGAN inline di Server Component

---

🔐 Google OAuth Setup

Google Cloud Console

· Project: Harvestan
· OAuth Client: Harvestan Web
· Authorized JS Origins: https://harvestan.vercel.app, http://localhost:3000
· Authorized Redirect URI: https://qfggoqcdaiokfluewple.supabase.co/auth/v1/callback

Supabase

· Authentication → Sign In / Providers → Google (Enabled)

Kode

· app/auth/callback/route.ts
· app/(auth)/login/page.tsx — tombol "Masuk dengan Google"
· app/(auth)/register/page.tsx — tombol "Daftar dengan Google"

⚠️ Kalau setup OAuth baru lagi: copy Client ID/Secret langsung dari Google Cloud (jangan ketik manual).

---

🔄 Logic Penting

Potong Hutang Otomatis dari Panen

```
1. Input panen → hitung profit penggarap
2. Ambil hutang aktif penggarap, urut dari TERLAMA
3. Kalau user CENTANG "potong hutang":
   - Potong profit penggarap dengan hutang (sisa > 0)
   - Update tiap hutang: dibayar += potong, sisa -= potong
   - profitPenggarap -= potongan; profitOwner += potongan
   - Simpan log di debts.log_perubahan + harvests.potongan_hutang_log
```

Edit Panen

```
1. Ambil panen lama → cek potongan_hutang_lama
2. Ambil hutang aktif SEKARANG
3. Kalau user CENTANG: potong dari hutang aktif
4. Kalau user UNCHECK: revert potongan lama ke hutang
5. Update panen dengan nilai baru
```

Hapus Panen (Auto-Revert)

```
1. Ambil panen → cek potongan_hutang
2. Kalau > 0: revert ke hutang (urut dari TERBARU)
3. Hapus panen
```

Transfer Lahan

```
1. Update lands.penggarap_id → penggarap baru
2. Riwayat panen TETAP
3. Opsional: transfer hutang aktif
```

Kategori Produktivitas

```
- Threshold per komoditas: cukup, baik, sangat_baik (Kg/Ha)
- Kategori: < cukup = Kurang, ≥ cukup = Cukup, ≥ baik = Baik, ≥ sangat_baik = Sangat Baik
- WAJIB dihitung per komoditas, TIDAK DICAMPUR
- Komoditas tanpa threshold → tidak dinilai
```

GPS Walking

```
1. User buka /ukur-lahan (dari menu) atau dari tombol di edit lahan
2. Mode "new": buat lahan baru → redirect ke /lahan/baru
3. Mode "edit": update lahan lama → update langsung
4. Tracking GPS: filter akurasi <20m, jarak minimal 3m antar titik
5. Hitung luas polygon pakai Shoelace formula (lib/utils/hitung-luas.ts)
6. Simpan polygon dalam format GeoJSON
```

Panen Bertahap Cabai

```
1. Tabel musim_cabai menyimpan master data musim user
2. Setiap panen cabai wajib pilih musim
3. Satu musim bisa punya banyak panen (10-20x)
4. Total produktivitas musim = total hasil / luas lahan
5. Di detail lahan, breakdown per musim
6. Di grafik, ada 2 chart per musim (total hasil & produktivitas)
7. Di keuangan, filter musim cabai
```

Laporan Tahunan/5 Tahunan

```
1. User buka /laporan
2. Pilih tahun, jenis (tahunan/5 tahunan), mode (rata-rata/panen terakhir)
3. Generate PDF dengan:
   - Ringkasan kondisi lahan + kategori produktivitas per komoditas (dengan keterangan: Kurang Optimal/Cukup/Baik/Sangat Baik)
   - Leaderboard (bintang di samping angka produktivitas, TIDAK ada kolom evaluasi)
   - Rekomendasi reward (⭐⭐⭐) & pendampingan (⚠️) — hanya kalau kategori di-set
   - Ringkasan setiap panen (bagi hasil, potong hutang, biaya) — BARU
   - Ringkasan profit per penggarap
```

PDF Invoice Detail Panen

```
1. Buka detail panen
2. Klik tombol "📄 Download Invoice PDF (Bagi Hasil)"
3. Generate PDF dengan: header, info panen, perhitungan, bagi hasil, potong hutang, total diterima, tanda tangan
```

---

📊 PROGRESS FINAL v1.5

✅ Sudah Selesai

· ✅ Auth: Register + Login (Email + Google OAuth)
· ✅ CRUD Penggarap, Lahan, Panen, Hutang
· ✅ CRUD Lahan + GPS koordinat + polygon (GPS Walking)
· ✅ Dashboard (statistik, top 5, produksi 6 bulan)
· ✅ Keuangan & Laba (filter tahun, komoditas, musim cabai)
· ✅ Grafik Recharts:
  · Produksi & produktivitas per komoditas
  · Kinerja penggarap
  · Grafik per musim cabai (total hasil & produktivitas)
· ✅ Export Excel (4 sheet)
· ✅ Export PDF per Penggarap + grafik + kategori
· ✅ Potong Hutang Otomatis + Log Audit
· ✅ Edit Panen + Auto-Revert Hapus Panen
· ✅ Transfer Lahan
· ✅ Landing Page + SEO
· ✅ Halaman Gabah (multi-sesi timbang)
· ✅ Kategori Produktivitas (editable, badge di preview & PDF)
· ✅ PWA (install di HP, offline mode)
· ✅ Settings (profil, ganti password, hapus akun)
· ✅ Bagi Hasil Custom (panen & gabah)
· ✅ Panen Multi-Lahan
· ✅ GPS Walking (ukur lahan + mini-map)
· ✅ Panen Bertahap Cabai (TAHAP 1-5):
  · Tabel musim_cabai + API + Query
  · Form input panen dropdown musim + modal bikin musim
  · Detail lahan: breakdown per musim (expandable)
  · Grafik per musim (bar chart total hasil & produktivitas)
  · Filter musim di halaman keuangan
· ✅ PDF Invoice Bagi Hasil di detail panen
· ✅ Laporan Tahunan/5 Tahunan:
  · Ringkasan kondisi + kategori produktivitas per komoditas (keterangan lengkap)
  · Leaderboard dengan bintang ⭐⭐⭐ di samping angka (TIDAK ada kolom evaluasi)
  · Rekomendasi reward & pendampingan
  · Ringkasan setiap panen (bagi hasil, potong hutang, biaya)
  · Ringkasan profit owner & penggarap per penggarap
· ✅ Bottom Nav Mobile Scrollable (semua 11 menu accessible)
· ✅ Fix glitch huruf doubling di PDF penggarap (kolom komoditas)

⏳ Belum Selesai

· ⏳ TAHAP 3: Update Laporan Kinerja Penggarap Existing:
  · Tambah kategori produktivitas dengan bintang ⭐
  · Tambah rekomendasi reward & pendampingan
  · Tambah rincian biaya & hutang lengkap
  · Konsisten dengan Laporan Tahunan yang baru
· ⏳ Halaman Bantuan (belum ada)
· ⏳ Email Notifikasi (butuh Resend/Mailgun)
· ⏳ Katalog Produk (foto/video, butuh storage)
· ⏳ Monetisasi (payment gateway)
· ⏳ Fix Highlight Menu Active (menu tidak highlight saat aktif)

---

🎯 Next Feature — Prioritas

🅰️ TAHAP 3: Update Laporan Kinerja Penggarap (rekomendasi)

Effort: Sedang (~1-2 jam)

Yang perlu diupdate di app/api/export-pdf/route.ts:

· Tambah kategori produktivitas dengan bintang ⭐ di samping nilai
· Tambah rekomendasi reward & pendampingan (kalau kategori di-set)
· Tambah rincian biaya lengkap per panen
· Tambah rincian hutang lengkap
· Konsisten dengan Laporan Tahunan

🅱️ Halaman Bantuan

· Panduan step-by-step
· FAQ
· Kontak support

🅲️ Email Notifikasi

· Welcome email
· Reminder hutang
· Butuh Resend/Mailgun

🅳️ Katalog Produk

· Upload foto/video
· Butuh Supabase Storage

🅴️ Monetisasi

· Payment gateway
· Paket Free vs Premium

---

🎯 Cara Lanjut di Chat Baru

Buka chat baru, paste pesan ini:

```
Halo! Saya lanjut project Harvestan (SaaS pertanian Indonesia).

Konteks lengkap:
https://github.com/harvestanid/harvestan/blob/main/HANDOFF.md

Tolong baca dulu sebelum mulai.

Status: v1.5
- ✅ Login Google OAuth
- ✅ GPS Walking (ukur lahan + mini-map)
- ✅ Panen Multi-Lahan
- ✅ Panen Bertahap Cabai (TAHAP 1-5)
- ✅ PDF Invoice Bagi Hasil di detail panen
- ✅ Laporan Tahunan/5 Tahunan (kategori lengkap, leaderboard bintang, ringkasan panen)
- ✅ Bottom nav mobile scrollable
- ✅ Fix glitch PDF penggarap

Yang mau dilanjutkan:
- 📄 TAHAP 3: Update Laporan Kinerja Penggarap Existing
  - Tambah kategori produktivitas dengan bintang ⭐ di samping nilai
  - Tambah rekomendasi reward & pendampingan
  - Tambah rincian biaya & hutang lengkap
  - Konsisten dengan Laporan Tahunan

Aturan main:
1. Saya pemula, kirim FULL FILE, bukan potongan kode
2. Jangan suruh cari line kode
3. JANGAN bikin nested <form>
4. JANGAN pakai useSearchParams di page.tsx
5. Client Component dipisah ke file sendiri
6. WAJIB: pkill -9 node sebelum rm -rf .next
7. Kalau error, saya screenshot

Mulai TAHAP 3?
```

---

🔗 Link Penting

· Repo: https://github.com/harvestanid/harvestan
· Live: https://harvestan.vercel.app
· Vercel Dashboard: https://vercel.com/harvestanid/harvestan
· Supabase Dashboard: https://supabase.com/dashboard/project/qfggoqcdaiokfluewple
· Google Cloud Console: https://console.cloud.google.com/auth/clients?project=bubbly-stone-509704-g2

---

🚨 Known Issues

🟡 Highlight Menu Active Tidak Jalan

Menu sidebar tidak highlight saat aktif. Ini karena bug hydration — kita hapus usePathname() dari layout. Bisa ditambahkan lagi dengan ActiveLink component kecil.

🟡 Middleware Deprecated

Next.js warning: middleware file convention is deprecated, use "proxy" instead.

🟡 Edit Panen + Hutang Manual

Kalau hutang sudah dilunasi manual oleh user setelah panen potong hutang, revert saat edit bisa salah. Log sudah ada tapi logic revert belum cek ini.

---

📈 Statistik Project

· 35+ halaman Next.js
· 20+ API routes
· 6 tabel database + RLS
· ~18000+ baris kode TypeScript
· ~20 library terintegrasi
· 3 dokumentasi: CHANGELOG.md, HANDOFF.md (ini), PROJECT.md
· Live di production

---

Status: ✅ v1.5 — Laporan Lengkap + Laporan Tahunan/5 Tahunan
Tanggal update: 2026-09-27
Dibuat dengan: ❤️ + AI, dari nol, tanpa bisa coding 🇮🇩

```

**Simpan:** `Ctrl+S` → `Ctrl+Q`

---

## ✅ Cek Baris

```bash
cd ~/projects/harvestan
wc -l HANDOFF.md
```

Harusnya ≥ 480 baris.

---

🚀 Commit & Push

```bash
cd ~/projects/harvestan
git add .
git commit -m "docs: update HANDOFF.md ke v1.5 — laporan lengkap + laporan tahunan"
git push
```

---

📸 Kabari

Setelah push:

1. ✅ wc -l HANDOFF.md ≥ 480?
2. ✅ Sudah git push?

Kalau berhasil, HANDOFF.md siap untuk chat baru. 🌾✨
