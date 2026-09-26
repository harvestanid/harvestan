📝 FULL UPDATE — HANDOFF.md (v1.1)

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
- **Versi**: v1.1 (Google OAuth + GPS Walking + Panen Bertahap)
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
- **PDF**: jsPDF
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
│   ├── layout.tsx                    # Layout auth (centered)
│   ├── login/page.tsx                # Login (Email + Google)
│   └── register/page.tsx             # Register (Email + Google)
├── (dashboard)/
│   ├── layout.tsx                    # Sidebar + bottom nav
│   ├── dashboard/page.tsx            # Dashboard utama
│   ├── keuangan/page.tsx             # Keuangan & Laba
│   ├── grafik/
│   │   ├── page.tsx
│   │   └── grafik-client.tsx
│   ├── gabah/page.tsx                # Penimbangan Gabah
│   ├── panen-multi/page.tsx          # Input panen multi-lahan
│   ├── ukur-lahan/
│   │   ├── page.tsx                  # Server Component (baca searchParams)
│   │   └── ukur-content.tsx          # Client Component (peta + GPS)
│   ├── bantuan/page.tsx              # (belum ada, opsional)
│   ├── pengaturan/
│   │   ├── page.tsx                  # Tab Akun + Kategori
│   │   ├── akun-tab.tsx
│   │   ├── kategori-tab.tsx
│   │   ├── tab-container.tsx
│   │   └── form.tsx
│   ├── export/page.tsx               # Export Excel + PDF list
│   ├── penggarap/
│   │   ├── page.tsx                  # List penggarap + badge kategori
│   │   ├── baru/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx              # Detail + lahan + hutang
│   │       ├── tombol-aksi.tsx
│   │       ├── transfer/
│   │       │   ├── page.tsx
│   │       │   └── form.tsx
│   │       ├── lahan/
│   │       │   ├── baru/page.tsx     # Form (ada link GPS Walking)
│   │       │   └── [landId]/
│   │       │       ├── page.tsx      # Detail + produktivitas per komoditas + mini-map
│   │       │       ├── tombol-aksi.tsx  # Edit lahan + tombol GPS Walking
│   │       │       └── panen/
│   │       │           ├── baru/
│   │       │           │   ├── page.tsx       # Server Component
│   │       │           │   └── form-client.tsx  # Client (musim, skema)
│   │       │           └── [harvestId]/
│   │       │               ├── page.tsx     # Detail panen + log audit
│   │       │               ├── tombol-aksi.tsx
│   │       │               └── edit/page.tsx
│   │       └── hutang/
│   │           ├── baru/page.tsx
│   │           └── [debtId]/
│   │               ├── page.tsx
│   │               └── tombol-aksi.tsx
├── api/
│   ├── lahan/[id]/route.ts           # PUT, DELETE
│   ├── panen/[id]/route.ts           # PUT, DELETE (auto-revert hutang)
│   ├── hutang/[id]/route.ts          # PUT, DELETE
│   ├── kategori/route.ts             # POST, DELETE
│   ├── musim/route.ts                # POST, GET (musim cabai)
│   ├── musim/[id]/route.ts           # PUT, DELETE
│   ├── transfer-lahan/route.ts       # POST
│   ├── export/route.ts               # Excel (4 sheet)
│   └── export-pdf/route.ts           # PDF per penggarap + grafik
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
│       └── musim-server.ts           # Query musim cabai
└── utils/
├── grafik-helpers.ts             # Helper data grafik
└── hitung-luas.ts                # Hitung luas polygon GPS

components/
├── install-pwa.tsx                   # Install prompt + register SW
├── skema-bagi-hasil-v2.tsx           # Dropdown skema bagi hasil
├── musim-selector.tsx                # Dropdown musim cabai
├── peta-ukur.tsx                     # Peta Leaflet tracking GPS
├── peta-mini.tsx                     # Mini-map preview polygon
└── peta-mini-wrapper.tsx             # Wrapper client untuk peta-mini

middleware.ts                         # Auth middleware

```

---

## 🗄️ Database Schema (Supabase)

### `penggaraps`
```

id (uuid, PK)
user_id (uuid, FK auth.users)
nama (text, NOT NULL)
alamat (text, nullable)
usia (int, nullable)
kontak (text, nullable)
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
user_id (uuid)
land_id (uuid, FK lands)
tanggal (date)
komoditas (text, default 'padi')
musim (text, nullable)  -- untuk cabai rawit (nama musim, bukan FK)
hasil_kg (numeric)
harga_gabah (numeric)
harga_per_kg (numeric)  -- sync dengan harga_gabah
biaya_panen_per_kg (numeric, default 0)
biaya_tambahan (numeric, default 0)
keterangan_biaya (text, nullable)
bawa_penggarap (numeric, default 0)
bawa_owner (numeric, default 0)
bawa_lain (numeric, default 0)
persen_owner (numeric, default 50)
persen_penggarap (numeric, default 50)
profit_bersih (numeric, default 0)
profit_owner (numeric, default 0)
profit_penggarap (numeric, default 0)
potongan_hutang (numeric, default 0)
potongan_hutang_log (jsonb, default '[]')
total_hutang_sebelum (numeric, default 0)
sisa_hutang_sesudah (numeric, default 0)
catatan (text, nullable)
created_at, updated_at

```

### `debts`
```

id (uuid, PK)
user_id (uuid)
penggarap_id (uuid, FK penggaraps)
tanggal (date)
jumlah (numeric)
keperluan (text, nullable)
dibayar (numeric, default 0)
sisa (numeric)
log_perubahan (jsonb, default '[]')
created_at

```

### `categories`
```

id (uuid, PK)
user_id (uuid)
komoditas (text)
cukup (numeric, nullable)
baik (numeric, nullable)
sangat_baik (numeric, nullable)
created_at, updated_at

```

### `musim_cabai` (BARU)
```

id (uuid, PK)
user_id (uuid, FK auth.users)
nama (text, NOT NULL)
tanggal_mulai (date, nullable)
tanggal_selesai (date, nullable)
catatan (text, nullable)
created_at, updated_at
UNIQUE(user_id, nama)

```

**RLS**: Semua tabel **aktif** dengan policy `auth.uid() = user_id`.

---

## ⚠️ ATURAN PENTING

### 1. **RLS Policy — WAJIB kirim `user_id`**
Setiap `insert()` **wajib** ada `user_id: user.id`. Kalau lupa → error `new row violates row-level security policy`.

### 2. **Server Action vs API Route**
- **Form tambah**: pakai **Server Action** (`'use server'` di dalam function)
- **Edit/Hapus**: pakai **API Route** (`app/api/.../route.ts`)

### 3. **Pola Jawaban AI**
- User pemula, jangan kasih **potongan kode** atau **cari baris X**
- **Selalu kirim FULL FILE** → user tinggal Ctrl+A → Delete → Paste
- Kalau panjang, kasih patokan `wc -l` untuk cek apakah paste lengkap
- Kalau error, minta screenshot + `wc -l`

### 4. **micro (Termux)**
- `Ctrl+S` = simpan, `Ctrl+Q` = keluar
- Kalau ada `"use client"`, **HARUS** di baris 1
- Paste kode panjang: **tunggu 10 detik**, scroll ke bawah cek `}` terakhir

### 5. **Path dengan `[ ]` atau `( )`**
Wajib pakai **tanda kutip**:
```bash
micro "app/(dashboard)/penggarap/[id]/page.tsx"
```

6. Nama Kolom Tabel

· Konsisten: hasil_kg, harga_gabah, profit_owner, persen_penggarap
· harga_gabah = harga_per_kg (sync)
· Kategori: cukup, baik, sangat_baik (BUKAN cukup_min)

7. JANGAN CAMPUR PRODUKTIVITAS ANTAR KOMODITAS

Setiap komoditas dihitung terpisah.

8. JANGAN BIKIN NESTED <form>

Modal yang ada di dalam <form> utama JANGAN pakai <form> juga. Pakai <div> + tombol dengan onClick.

9. JANGAN pakai useSearchParams() di page.tsx

Di Next.js 16, useSearchParams() di Server Component tidak reliable. Pakai props dari Server Component:

```typescript
// page.tsx (Server Component)
export default async function Page({ searchParams }) {
  const { param1 } = await searchParams;
  return <ClientContent param1={param1} />;
}
```

10. JANGAN taruh Client Component di dalam Server Component tanpa wrapper

Kalau butuh useState, useEffect, dll → pisahkan ke Client Component ("use client" di baris 1), lalu import dari Server Component.

11. Sebelum Push, WAJIB npm run build

Kode jalan di npm run dev ≠ build sukses di Vercel.

12. <script> di Server Component = ERROR

Pakai <Script> dari next/script atau taruh di Client Component useEffect.

13. Next.js Cache Stale

Kalau ubah file tapi tidak ke-load:

```bash
rm -rf .next
rm -rf node_modules/.cache
npm run dev
```

---

🔐 Google OAuth Setup

Google Cloud Console

· Project: Harvestan
· OAuth Client: Harvestan Web
· Client ID: 873471878429-....apps.googleusercontent.com (sudah di Supabase)
· Authorized JS Origins: https://harvestan.vercel.app, http://localhost:3000
· Authorized Redirect URI: https://qfggoqcdaiokfluewple.supabase.co/auth/v1/callback

Supabase

· Authentication → Sign In / Providers → Google (Enabled)
· Client ID + Secret sudah di-paste

Kode

· app/auth/callback/route.ts — handle OAuth callback
· app/(auth)/login/page.tsx — tombol "Masuk dengan Google"
· app/(auth)/register/page.tsx — tombol "Daftar dengan Google"

⚠️ Kalau setup OAuth baru lagi: copy Client ID/Secret langsung dari Google Cloud (jangan ketik manual), compare per karakter.

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
4. Kalau TIDAK centang: potongan = 0
```

Edit Panen

```
1. Ambil panen lama → cek potongan_hutang_lama
2. Ambil hutang aktif SEKARANG
3. Kalau user CENTANG: potong dari hutang aktif (langsung)
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
2. Riwayat panen TETAP (karena terikat land_id)
3. Opsional: transfer hutang aktif
```

Kategori Produktivitas

```
- Threshold per komoditas: cukup, baik, sangat_baik (Kg/Ha)
- Kategori: < cukup = Kurang, ≥ cukup = Cukup, ≥ baik = Baik, ≥ sangat_baik = Sangat Baik
- WAJIB dihitung per komoditas, TIDAK DICAMPUR
- Komoditas tanpa data panen → tidak ditampilkan
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

Panen Bertahap Cabai (Musim)

```
1. Tabel musim_cabai menyimpan master data musim user
2. Setiap panen cabai wajib pilih musim
3. Satu musim bisa punya banyak panen (10-20x)
4. Total produktivitas musim = total hasil / luas lahan
5. Di detail lahan, breakdown per musim
```

---

📊 PROGRESS FINAL v1.1

✅ Sudah Selesai (100%)

· ✅ Auth: Register + Login (Email + Google OAuth) + Logout
· ✅ CRUD Penggarap (list, tambah, detail, edit, hapus)
· ✅ CRUD Lahan + GPS koordinat + polygon (GPS Walking)
· ✅ CRUD Panen (tambah, detail, edit, hapus)
· ✅ CRUD Hutang (tambah, detail, edit, lunasi, hapus)
· ✅ Dashboard (statistik, top 5, produksi 6 bulan)
· ✅ Keuangan & Laba (profit bulanan, per komoditas, per lahan)
· ✅ Halaman Grafik Recharts (produksi & produktivitas per komoditas, kinerja penggarap)
· ✅ Export Excel (4 sheet)
· ✅ Export PDF per Penggarap + grafik
· ✅ Potong Hutang Otomatis + Log Audit
· ✅ Edit Panen + Auto-Revert Hapus Panen
· ✅ Transfer Lahan (dengan opsi transfer hutang)
· ✅ Landing Page + SEO
· ✅ Halaman Gabah (multi-sesi timbang, export PNG)
· ✅ Kategori Produktivitas (editable, badge di preview & PDF)
· ✅ PWA (install di HP, offline mode)
· ✅ Settings (profil, ganti password, hapus akun)
· ✅ Bagi Hasil Custom (panen & gabah)
· ✅ Panen Multi-Lahan (gabung panen dari beberapa lahan)
· ✅ GPS Walking (ukur lahan + preview mini-map)
· ✅ Login & Register Google OAuth
· ✅ Panen Bertahap Cabai — TAHAP 1 & 2:
  · Tabel musim_cabai ✅
  · Query + API musim ✅
  · Form input panen dengan dropdown musim ✅
  · Modal bikin musim baru ✅

⏳ Belum Selesai

· ⏳ Panen Bertahap Cabai — TAHAP 3: Detail lahan breakdown per musim (khusus cabai)
· ⏳ Panen Bertahap Cabai — TAHAP 4: Grafik per musim
· ⏳ Panen Bertahap Cabai — TAHAP 5: Filter musim di halaman grafik & keuangan
· ⏳ Halaman Bantuan (belum ada, opsional)
· ⏳ Email Notifikasi (opsional, butuh Resend/Mailgun)
· ⏳ Katalog Produk (foto/video, butuh storage)
· ⏳ Monetisasi (payment gateway)
· ⏳ Fix Highlight Menu Active (menu sidebar tidak highlight saat aktif — karena bug hydration)

---

🎯 Next Feature — Prioritas

🅰️ Panen Bertahap Cabai — TAHAP 3 (rekomendasi)

Effort: Sedang (~1-2 jam)
Value: ⭐⭐⭐⭐

Yang perlu dibuat:

· Di halaman detail lahan (/penggarap/[id]/lahan/[landId]/page.tsx):
  · Kalau lahan punya panen cabai → tampilkan breakdown per musim
  · Setiap musim: total hasil, frekuensi panen, produktivitas
  · Bisa expand/collapse detail panen per musim

🅱️ TAHAP 4 & 5 — Grafik & Filter

Effort: Sedang (~2-3 jam)

🅲️ Halaman Bantuan

Effort: Kecil (~1-2 jam)
Value: ⭐⭐⭐⭐

🅳️ Email Notifikasi

Effort: Sedang (~2-3 jam)

🅴️ Katalog Produk

Effort: Besar (~6-8 jam)

🅵️ Monetisasi

Effort: Besar (~8-10 jam)

---

🎯 Cara Lanjut di Chat Baru

Buka chat baru, paste pesan ini:

```
Halo! Saya lanjut project Harvestan (SaaS pertanian Indonesia).

Konteks lengkap ada di:
https://github.com/harvestanid/harvestan/blob/main/HANDOFF.md

Tolong baca file itu dulu sebelum kita mulai.

Status: v1.1 — Login Google, GPS Walking, Panen Multi-Lahan, 
Panen Bertahap Cabai (TAHAP 1 & 2) sudah selesai.

Sekarang mau lanjut TAHAP 3: Detail lahan breakdown per musim (khusus cabai).

Aturan main:
1. Saya pemula, TIDAK BISA coding
2. Selalu kirim FULL FILE, bukan potongan kode
3. Jangan suruh saya cari line kode
4. Kalau error, saya screenshot
5. JANGAN bikin nested <form>
6. JANGAN pakai useSearchParams di page.tsx (pakai props dari server)
7. Client Component harus dipisah ke file sendiri

Mulai dari mana?
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

🟡 Middleware Deprecated

Next.js warning: middleware file convention is deprecated, use "proxy" instead.
Belum urgent. Bisa migrasi nanti.

🟡 Highlight Menu Active Tidak Jalan

Menu sidebar tidak highlight saat aktif. Ini karena bug hydration — kita hapus usePathname() dari layout. Bisa ditambahkan lagi dengan ActiveLink component kecil.

🟡 Edit Panen + Hutang Manual

Kalau hutang sudah dilunasi manual oleh user setelah panen potong hutang, revert saat edit bisa salah. Log sudah ada tapi logic revert belum cek ini.

---

📈 Statistik Project

· 30+ halaman Next.js
· 15+ API routes
· 6 tabel database + RLS
· ~12000+ baris kode TypeScript
· ~18 library terintegrasi
· 3 dokumentasi: CHANGELOG.md, HANDOFF.md (ini), PROJECT.md
· Live di production

---

Status: ✅ v1.1 — Login Google + GPS Walking + Panen Bertahap Cabai (partial)
Tanggal update: 2026-09-27
Dibuat dengan: ❤️ + AI, dari nol, tanpa bisa coding 🇮🇩

```

**Simpan:** `Ctrl+S` → `Ctrl+Q`

---

## ✅ Cek Baris

```bash
wc -l HANDOFF.md
```

Harusnya ≥ 500 baris.

---

🚀 Commit & Push

```bash
cd ~/projects/harvestan
git add .
git commit -m "docs: update HANDOFF.md ke v1.1 — Google OAuth + GPS Walking + Panen Bertahap"
git push
```

---

🎯 Setelah Push

Buka chat baru, paste pesan ini:

```
Halo! Saya lanjut project Harvestan.

Konteks lengkap ada di:
https://github.com/harvestanid/harvestan/blob/main/HANDOFF.md

Tolong baca dulu sebelum kita mulai.

Status: v1.1 — Login Google, GPS Walking, Panen Multi-Lahan, 
Panen Bertahap Cabai (TAHAP 1 & 2) sudah selesai.

Mau lanjut TAHAP 3: Detail lahan breakdown per musim (khusus cabai).

Aturan:
1. Saya pemula, kirim FULL FILE
2. Jangan suruh cari line kode
3. JANGAN bikin nested <form>
4. JANGAN pakai useSearchParams di page.tsx
5. Client Component harus dipisah ke file sendiri

Mulai dari mana?
```

---

Eksekusi, push, buka chat baru! Kabari kalau ada yang bingung. 🌾✨
