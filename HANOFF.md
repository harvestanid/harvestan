# 🤝 HANDOFF — Konteks untuk Chat Baru

**File ini dibuat untuk melanjutkan development Harvestan di chat baru.**
Copy-paste isi file ini (atau link repo) ke chat baru untuk kasih konteks ke AI.

---

## 🎯 Project Info

- **Nama**: Harvestan
- **Deskripsi**: SaaS manajemen pertanian Indonesia
- **Repo**: https://github.com/harvestanid/harvestan
- **Live**: https://harvestan.vercel.app
- **Versi**: v1.0 (Full Release — 2026-09-26)
- **User**: Pemula (tidak bisa coding), koding semua oleh AI
- **Development**: Termux di Android

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **UI**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL + RLS + Auth)
- **Hosting**: Vercel
- **Grafik**: Recharts
- **PDF**: jsPDF
- **Excel**: xlsx (SheetJS)
- **PNG**: html-to-image (support oklch Tailwind v4)
- **Editor**: micro (di Termux)

---

## 📁 Struktur Folder Penting
app/
├── page.tsx                          # Landing page (publik)
├── layout.tsx                        # Root layout + SEO metadata
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx                    # Sidebar + bottom nav
│   ├── dashboard/page.tsx            # Dashboard utama
│   ├── keuangan/page.tsx             # Keuangan & Laba
│   ├── grafik/
│   │   ├── page.tsx                  # Halaman Grafik
│   │   └── grafik-client.tsx         # Client component Recharts
│   ├── gabah/page.tsx                # Penimbangan Gabah
│   ├── pengaturan/
│   │   ├── page.tsx                  # Pengaturan Kategori
│   │   └── form.tsx                  # Form kategori
│   ├── export/page.tsx               # Export Excel + PDF list
│   ├── penggarap/
│   │   ├── page.tsx                  # List penggarap + badge kategori
│   │   ├── baru/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx              # Detail penggarap + lahan + hutang
│   │       ├── tombol-aksi.tsx
│   │       ├── transfer/
│   │       │   ├── page.tsx          # Transfer lahan
│   │       │   └── form.tsx
│   │       ├── lahan/
│   │       │   ├── baru/page.tsx
│   │       │   └── [landId]/
│   │       │       ├── page.tsx      # Detail lahan + produktivitas per komoditas
│   │       │       ├── tombol-aksi.tsx
│   │       │       └── panen/
│   │       │           ├── baru/page.tsx
│   │       │           └── [harvestId]/
│   │       │               ├── page.tsx     # Detail panen + log audit
│   │       │               ├── tombol-aksi.tsx
│   │       │               └── edit/page.tsx # Edit panen
│   │       └── hutang/
│   │           ├── baru/page.tsx
│   │           └── [debtId]/
│   │               ├── page.tsx      # Detail hutang + log perubahan
│   │               └── tombol-aksi.tsx
├── api/
│   ├── lahan/[id]/route.ts           # PUT, DELETE lahan
│   ├── panen/[id]/route.ts           # PUT, DELETE panen (auto-revert hutang)
│   ├── hutang/[id]/route.ts          # PUT, DELETE hutang
│   ├── kategori/route.ts             # POST, DELETE kategori
│   ├── transfer-lahan/route.ts       # POST transfer lahan
│   ├── export/route.ts               # GET → Excel (4 sheet)
│   └── export-pdf/route.ts           # GET → PDF per penggarap + grafik
└── auth/logout/route.ts

lib/
├── supabase/
│   ├── client.ts                     # Client-side Supabase
│   ├── server.ts                     # Server-side Supabase (async)
│   └── queries/
│       ├── penggarap.ts              # Client queries
│       ├── penggarap-server.ts       # Server queries penggarap + lahan
│       ├── panen-server.ts           # Server queries panen
│       ├── hutang-server.ts          # Server queries hutang
│       └── kategori-server.ts        # Server queries kategori + helper
└── utils/
└── grafik-helpers.ts             # Helper data grafik

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
polygon (jsonb, nullable)
created_at, updated_at

```

### `harvests`
```

id (uuid, PK)
user_id (uuid)
land_id (uuid, FK lands)
tanggal (date)
komoditas (text, default 'padi')
musim (text, nullable)  -- untuk cabai rawit
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

**RLS**: Semua tabel **aktif** dengan policy `auth.uid() = user_id`.

---

## ⚠️ ATURAN PENTING

### 1. **RLS Policy — WAJIB kirim `user_id`**
Setiap `insert()` **wajib** ada `user_id: user.id`. Kalau lupa → error `new row violates row-level security policy`.

### 2. **Server Action vs API Route**
- **Form tambah**: pakai **Server Action** (`'use server'` di dalam function)
- **Edit/Hapus**: pakai **API Route** (`app/api/.../route.ts`)
- **Alasan**: Server Action gampang untuk form, API Route gampang untuk fetch dari client

### 3. **Pola Jawaban AI**
- User pemula, jangan kasih **potongan kode** atau **cari baris X**
- **Selalu kirim FULL FILE** → user tinggal Ctrl+A → Delete → Paste
- Kalau panjang, kasih patokan `wc -l` untuk cek apakah paste lengkap
- Kalau error, minta screenshot + `wc -l`

### 4. **micro (Termux)**
- `Ctrl+S` = simpan
- `Ctrl+Q` = keluar
- Kalau ada `"use client"`, **HARUS** di baris 1 (paling atas) sebelum import
- Paste kode panjang: **tunggu 10 detik**, scroll ke bawah cek sampai `}` terakhir

### 5. **Path dengan `[ ]` atau `( )`**
Wajib pakai **tanda kutip**:
```bash
micro "app/(dashboard)/penggarap/[id]/page.tsx"
```

6. Nama Kolom Tabel

· Konsisten: hasil_kg, harga_gabah, profit_owner, persen_penggarap
· harga_gabah = harga_per_kg (sync)
· Kategori pakai: cukup, baik, sangat_baik (BUKAN cukup_min)

7. JANGAN CAMPUR PRODUKTIVITAS ANTAR KOMODITAS

Setiap komoditas harus dihitung terpisah (padi punya produktivitas sendiri, jagung sendiri, dst).

8. Sebelum Push, WAJIB npm run build

Kode jalan di npm run dev ≠ build sukses di Vercel. Selalu jalankan npm run build sebelum push:

```bash
npm run build
```

Kalau sukses → baru git push.

9. File Dead Code Bikin Build Gagal

File lama yang tidak dipakai tapi masih ada bisa bikin build gagal karena TypeScript strict. Contoh kasus: lib/supabase/queries/lahan.ts (sudah dihapus).

---

🔄 Logic Penting

Potong Hutang Otomatis dari Panen

```
1. Input panen → hitung profit penggarap = profitBersih × (100 - persenOwner)/100
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
5. Kalau sebelumnya potong + sekarang masih centang: revert dulu → potong ulang
6. Update panen dengan nilai baru
```

Hapus Panen (Auto-Revert)

```
1. Ambil panen → cek potongan_hutang
2. Kalau > 0:
   - Ambil hutang penggarap urut TERBARU
   - Revert (kembalikan) potongan ke hutang
   - Update log di debts
3. Hapus panen
```

Transfer Lahan

```
1. Update lands.penggarap_id → penggarap baru
2. Riwayat panen TETAP (karena terikat land_id, bukan penggarap_id)
3. Opsional: transfer hutang aktif penggarap
```

Kategori Produktivitas

```
- Threshold per komoditas: cukup, baik, sangat_baik (Kg/Ha)
- Kategori: < cukup = Kurang, ≥ cukup = Cukup, ≥ baik = Baik, ≥ sangat_baik = Sangat Baik
- WAJIB dihitung per komoditas, TIDAK DICAMPUR
- Komoditas tanpa data panen → tidak ditampilkan
```

---

📊 PROGRESS FINAL v1.0

✅ Sudah Selesai (100%)

· ✅ Auth (Register, Login, Logout + RLS)
· ✅ CRUD Penggarap (list, tambah, detail, edit, hapus)
· ✅ CRUD Lahan + GPS koordinat
· ✅ CRUD Panen (tambah, detail, edit, hapus)
· ✅ CRUD Hutang (tambah, detail, edit, lunasi, hapus)
· ✅ Dashboard (statistik, top 5, produksi 6 bulan)
· ✅ Keuangan & Laba (profit bulanan, per komoditas, per lahan)
· ✅ Halaman Grafik Recharts:
  · Grafik garis produksi per komoditas
  · Grafik garis produktivitas per komoditas
  · Grafik bar kinerja penggarap (per komoditas)
  · Grafik detail per penggarap
· ✅ Export Excel (4 sheet: Penggarap, Lahan, Panen, Hutang)
· ✅ Export PDF per Penggarap:
  · Data penggarap + ringkasan keuangan
  · Evaluasi produktivitas per komoditas
  · Grafik produksi & produktivitas per komoditas
  · Daftar lahan + riwayat panen + riwayat hutang
· ✅ Potong Hutang Otomatis dari panen
· ✅ Edit Panen + Log Audit
· ✅ Auto-Revert Hapus Panen
· ✅ Transfer Lahan (dengan opsi transfer hutang)
· ✅ Landing Page (hero, fitur, cara kerja, FAQ, CTA) + SEO
· ✅ Halaman Gabah (multi-sesi timbang, reset/hapus sesi, rincian perhitungan, export PNG)
· ✅ Kategori Produktivitas (editable, per komoditas, badge di preview & PDF)

🎯 Fitur Berikutnya (Opsional)

· 🅰️ PWA / Offline Mode — install di HP seperti native app (recommended)
· 🅱️ Notifikasi WhatsApp — kirim invoice/laporan otomatis
· 🅲️ Multi-User / Team — satu owner, banyak operator
· 🅳️ Halaman Settings — profil user, ganti password
· 🅴️ Backup Cloud Otomatis — export ke Google Drive tiap minggu
· 🅵️ Domain Custom (.id) — branding lebih profesional
· 🅶️ Integrasi Harga Pasar — rekomendasi harga jual

---

🎯 Cara Lanjut di Chat Baru

Buka chat baru, paste pesan ini:

```
Halo! Saya lanjut project Harvestan (SaaS pertanian Indonesia).

Konteks lengkap ada di:
https://github.com/harvestanid/harvestan/blob/main/HANDOFF.md

Tolong baca file itu dulu sebelum kita mulai.

Status: v1.0 sudah LIVE di https://harvestan.vercel.app
Semua fitur inti selesai. Sekarang mau lanjut ke [FITUR X].

Aturan main:
1. Saya pemula, TIDAK BISA coding
2. Selalu kirim FULL FILE, bukan potongan kode
3. Jangan suruh saya cari line kode
4. Kalau butuh ubah file, kasih perintah mkdir + micro + kode lengkap
5. Kalau error, saya screenshot
6. Sebelum push, WAJIB test `npm run build` lokal dulu
7. RLS: setiap insert WAJIB kirim user_id
8. Jangan campur produktivitas antar komoditas

Mulai dari mana?
```

---

🔗 Link Penting

· Repo: https://github.com/harvestanid/harvestan
· Live: https://harvestan.vercel.app
· Vercel Dashboard: https://vercel.com/harvestanid/harvestan
· Supabase Dashboard: https://supabase.com/dashboard/project/qfggoqcdaio...

---

🚨 Known Issues

🟡 Middleware Deprecated

Next.js warning: middleware file convention is deprecated, use "proxy" instead.
Belum urgent. Bisa migrasi nanti dengan:

```bash
npx @next/codemod@canary middleware-to-proxy .
```

🟡 Edit Panen + Hutang Manual

Kalau hutang sudah dilunasi manual oleh user setelah panen potong hutang, revert saat edit bisa salah. Log sudah ada tapi logic revert belum cek ini.

🟡 Build Warnings

Ada warning process.cwd() di Edge Runtime — tidak masalah, hanya info.

---

📈 Statistik Project

· 22 halaman Next.js
· 13 API routes
· 5 tabel database + RLS
· ~7000+ baris kode TypeScript
· ~12 library terintegrasi
· 3 dokumentasi: CHANGELOG.md, HANDOFF.md (ini), PROJECT.md
· Live di production sejak 2026-09-26

---

Status: ✅ v1.0 FULL RELEASE — LIVE
Tanggal rilis: 2026-09-26
Dibuat dengan: ❤️ + AI, dari nol, tanpa bisa coding 🇮🇩

```

**Simpan:** `Ctrl+S` → `Ctrl+Q`

---

## 📝 STEP 2: Cek Baris

```bash
wc -l HANDOFF.md
```

Minimal ≥ 350 baris. Kalau kurang jauh → paste ulang.

---

📝 STEP 3: Commit & Push

```bash
git add HANDOFF.md
git commit -m "docs: update HANDOFF.md ke v1.0 — fitur lengkap & cara lanjut"
git push
```

---

📝 STEP 4: Cek di GitHub

Buka: https://github.com/harvestanid/harvestan/blob/main/HANDOFF.md

Harusnya muncul versi baru dengan:

· ✅ Section "Versi: v1.0"
· ✅ Struktur folder lengkap (dengan /grafik, /gabah, /pengaturan)
· ✅ Schema categories
· ✅ Aturan penting (9 poin)
· ✅ Progress 100% lengkap
· ✅ Link penting
· ✅ Known issues
· ✅ Statistik project

---

🎯 Setelah Selesai

HANDOFF.md siap untuk:

1. Buka chat baru kalau chat ini terlalu panjang
2. Referensi kalau ada masalah
3. Onboarding kalau ada developer lain yang bantu

