✅ Oke, Lanjut!

Sekali lagi, cuma butuh 1 klik: disable secret *****7Gb5 di Google Cloud Console. Tapi kalau kamu mau skip, saya tidak akan memaksa.

Rekomendasi: Setidaknya disable nanti sebelum push production. Sekarang kita lanjut.

---

📝 Update HANDOFF.md ke v1.7

Karena banyak fitur yang selesai hari ini, mari kita update HANDOFF biar context tetap fresh.

Langkah:

```bash
cd ~/projects/harvestan
wc -l HANDOFF.md
micro HANDOFF.md
```

Ctrl+A → Delete, paste FULL FILE ini:

```markdown
# 🤝 HANDOFF — Konteks untuk Chat Baru

**File ini dibuat untuk melanjutkan development Harvestan di chat baru.**
Copy-paste isi file ini (atau link repo) ke chat baru untuk kasih konteks ke AI.

## 🎯 Project Info

- **Nama**: Harvestan
- **Deskripsi**: SaaS manajemen pertanian Indonesia
- **Repo**: https://github.com/harvestanid/harvestan
- **Live**: https://harvestan.vercel.app
- **Versi**: v1.7 (Gabah bawa pulang + Import/Export + Login Google fix)
- **User**: Pemula (tidak bisa coding), koding semua oleh AI
- **Development**: Termux di Android

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

## 📁 Struktur Folder Penting

app/
├── page.tsx                           # Landing page (publik)
├── layout.tsx                         # Root layout + SEO metadata
├── auth/callback/route.ts             # Google OAuth callback
├── (auth)/
│   ├── layout.tsx
│   ├── login/page.tsx                 # Login (Email + Google)
│   └── register/page.tsx              # Register (Email + Google)
├── (dashboard)/
│   ├── layout.tsx                     # Sidebar + bottom nav (scrollable mobile)
│   ├── dashboard/page.tsx
│   ├── keuangan/
│   │   ├── page.tsx                   # Server (ambil data + musim)
│   │   └── keuangan-client.tsx        # Client (filter tahun/komoditas/musim)
│   ├── grafik/
│   │   ├── page.tsx
│   │   ├── grafik-client.tsx          # Grafik produksi, produktivitas, kinerja penggarap (warna-warni)
│   │   └── grafik-cabai.tsx           # Grafik per musim cabai
│   ├── gabah/page.tsx                 # Penimbangan gabah + bawa pulang + kirim ke DB
│   ├── panen-multi/page.tsx
│   ├── ukur-lahan/
│   │   ├── page.tsx                   # Server (baca searchParams)
│   │   └── ukur-content.tsx           # Client (peta + GPS)
│   ├── laporan/
│   │   ├── page.tsx                   # Server
│   │   └── klien.tsx                  # Client (form download)
│   ├── pengaturan/
│   │   ├── page.tsx                   # Tab Akun + Kategori
│   │   ├── akun-tab.tsx
│   │   ├── kategori-tab.tsx
│   │   ├── tab-container.tsx
│   │   └── form.tsx
│   ├── export/page.tsx                # Export Backup + Laporan Excel + PDF
│   ├── import/
│   │   ├── page.tsx                   # Server
│   │   └── klien.tsx                  # Client (upload + preview + import)
│   └── penggarap/
│       ├── page.tsx                   # List + badge kategori
│       ├── baru/page.tsx
│       └── [id]/
│           ├── page.tsx               # Detail + lahan + hutang
│           ├── tombol-aksi.tsx
│           ├── transfer/
│           │   ├── page.tsx
│           │   └── form.tsx
│           ├── lahan/
│           │   ├── baru/page.tsx
│           │   └── [landId]/
│           │       ├── page.tsx       # Detail + produktivitas per komoditas + mini-map
│           │       ├── tombol-aksi.tsx
│           │       └── panen/
│           │           ├── baru/
│           │           │   ├── page.tsx
│           │           │   └── form-client.tsx
│           │           └── [harvestId]/
│           │               ├── page.tsx       # Detail panen + log + tombol PDF invoice
│           │               ├── tombol-aksi.tsx
│           │               ├── tombol-download-invoice.tsx  # PDF invoice bagi hasil
│           │               └── edit/page.tsx
│           └── hutang/
│               ├── baru/page.tsx
│               └── [debtId]/
│                   ├── page.tsx
│                   └── tombol-aksi.tsx
└── api/
    ├── lahan/[id]/route.ts
    ├── panen/[id]/route.ts
    ├── hutang/[id]/route.ts
    ├── kategori/route.ts
    ├── musim/route.ts                 # CRUD musim cabai
    ├── musim/[id]/route.ts
    ├── transfer-lahan/route.ts
    ├── export/route.ts                # Laporan Excel (bisa dibaca manusia)
    ├── export-backup/route.ts         # Backup Excel (untuk import ulang)
    ├── import/route.ts                # Import backup + auto-remap UUID
    ├── export-pdf/route.ts            # PDF per penggarap + grafik
    ├── export-laporan/route.ts        # PDF laporan tahunan/5 tahunan
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

tools/
└── converter.html                    # Konverter SawahKu lama → Harvestan backup

middleware.ts

## 🗄️ Database Schema (Supabase)

### `penggaraps`
- id (uuid, PK)
- user_id (uuid, FK auth.users)
- nama, alamat, usia, kontak
- created_at, updated_at

### `lands`
- id (uuid, PK)
- user_id (uuid)
- penggarap_id (uuid, FK penggaraps)
- nama (text)
- luas (numeric)
- lokasi_koordinat (text, nullable)
- polygon (jsonb, nullable)         -- GeoJSON Polygon dari GPS Walking
- created_at, updated_at

### `harvests`
- id (uuid, PK)
- user_id, land_id (uuid)
- tanggal (date)
- komoditas (text, default 'padi')
- musim (text, nullable)            -- untuk cabai rawit
- hasil_kg, harga_gabah, harga_per_kg
- biaya_panen_per_kg, biaya_tambahan, keterangan_biaya
- bawa_penggarap, bawa_owner, bawa_lain
- persen_owner (default 50)
- persen_penggarap (default 50)
- profit_bersih, profit_owner, profit_penggarap
- potongan_hutang, potongan_hutang_log (jsonb)
- total_hutang_sebelum, sisa_hutang_sesudah
- catatan (text, nullable)
- created_at, updated_at

### `debts`
- id (uuid, PK)
- user_id, penggarap_id
- tanggal, jumlah, keperluan
- dibayar (default 0), sisa
- log_perubahan (jsonb, default '[]')
- created_at

### `categories`
- id (uuid, PK)
- user_id, komoditas
- cukup, baik, sangat_baik (numeric, nullable)
- created_at, updated_at

### `musim_cabai`
- id (uuid, PK)
- user_id (FK auth.users)
- nama (text, NOT NULL)
- tanggal_mulai, tanggal_selesai (date)
- catatan (text)
- created_at, updated_at
- UNIQUE(user_id, nama)

**RLS**: Semua tabel aktif dengan policy `auth.uid() = user_id`.

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

14. Hydration Error di Next.js 16

Kalau error hydration mismatch:

```bash
pkill -9 node
rm -rf .next node_modules/.cache
npm run dev
```

Lalu buka di Incognito (cache service worker). Kalau tetap:

```bash
rm -rf .next node_modules
npm install
npm run dev
```

🔐 Google OAuth Setup

Google Cloud Console

· Project: Harvestan
· OAuth Client: Harvestan Web (tipe: Web application)
· Authorized JS Origins:
  · https://harvestan.vercel.app
  · http://localhost:3000
· Authorized Redirect URI:
  · https://qfggoqcdaiokfluewple.supabase.co/auth/v1/callback

Supabase

· Authentication → Sign In / Providers → Google (Enabled)
· Authentication → URL Configuration:
  · Site URL: http://localhost:3000 (dev)
  · Redirect URLs:
    · http://localhost:3000/**
    · https://harvestan.vercel.app/**
· PENTING: Client ID + Client Secret harus cocok dengan Google Cloud.
  Error Unable to exchange external code: 4/0A = Client Secret salah.

Kode

· app/auth/callback/route.ts — exchange code → session, set cookie di RESPONSE
· app/(auth)/login/page.tsx — tombol "Masuk dengan Google"
· app/(auth)/register/page.tsx — tombol "Daftar dengan Google"
· middleware.ts — catch-all matcher, redirect user tidak login ke /login

🚨 TODO KEAMANAN

· Reset Client Secret Google OAuth
  Alasan: 1 secret pernah terekspos di chat
  Lokasi: Google Cloud Console → Clients → Harvestan
  Action: Disable secret lama, pastikan Supabase pakai yang valid

🔄 Logic Penting

Potong Hutang Otomatis dari Panen

1. Input panen → hitung profit penggarap
2. Ambil hutang aktif penggarap, urut dari TERLAMA
3. Kalau user CENTANG "potong hutang":
   · Potong profit penggarap dengan hutang (sisa > 0)
   · Update tiap hutang: dibayar += potong, sisa -= potong
   · profitPenggarap -= potongan; profitOwner += potongan
   · Simpan log di debts.log_perubahan + harvests.potongan_hutang_log

Gabah Bawa Pulang (Versi HTML SawahKu)

```
po = profitBersih × %owner
pp = profitBersih × %penggarap
po += bawa_penggarap × harga
pp -= bawa_penggarap × harga
pp += bawa_owner × harga
po -= bawa_owner × harga
po -= bawa_lain × harga × 0.5
pp -= bawa_lain × harga × 0.5
```

Konsep: Nilai gabah yang dibawa pulang dialihkan ke pihak lain.

· Penggarap bawa → Owner +, Penggarap −
· Owner bawa → Penggarap +, Owner −
· Lainnya → masing-masing − 50%

Edit Panen

1. Ambil panen lama → cek potongan_hutang_lama
2. Ambil hutang aktif SEKARANG
3. Kalau user CENTANG: potong dari hutang aktif
4. Kalau user UNCHECK: revert potongan lama ke hutang
5. Update panen dengan nilai baru

Hapus Panen (Auto-Revert)

1. Ambil panen → cek potongan_hutang
2. Kalau > 0: revert ke hutang (urut dari TERBARU)
3. Hapus panen

Transfer Lahan

1. Update lands.penggarap_id → penggarap baru
2. Riwayat panen TETAP
3. Opsional: transfer hutang aktif

Kategori Produktivitas

· Threshold per komoditas: cukup, baik, sangat_baik (Kg/Ha)
· Kategori: < cukup = Kurang, ≥ cukup = Cukup, ≥ baik = Baik, ≥ sangat_baik = Sangat Baik
· WAJIB dihitung per komoditas, TIDAK DICAMPUR
· Komoditas tanpa threshold → tidak dinilai

GPS Walking

1. User buka /ukur-lahan (dari menu) atau dari tombol di edit lahan
2. Mode "new": buat lahan baru → redirect ke /lahan/baru
3. Mode "edit": update lahan lama → update langsung
4. Tracking GPS: filter akurasi <20m, jarak minimal 3m antar titik
5. Hitung luas polygon pakai Shoelace formula (lib/utils/hitung-luas.ts)
6. Simpan polygon dalam format GeoJSON

Panen Bertahap Cabai

1. Tabel musim_cabai menyimpan master data musim user
2. Setiap panen cabai wajib pilih musim
3. Satu musim bisa punya banyak panen (10-20x)
4. Total produktivitas musim = total hasil / luas lahan
5. Di detail lahan, breakdown per musim
6. Di grafik, ada 2 chart per musim (total hasil & produktivitas)
7. Di keuangan, filter musim cabai

Laporan Tahunan/5 Tahunan

1. User buka /laporan
2. Pilih tahun, jenis (tahunan/5 tahunan), mode (rata-rata/panen terakhir)
3. Generate PDF dengan:
   · Ringkasan kondisi lahan + kategori produktivitas per komoditas
   · Leaderboard (bintang di samping angka produktivitas)
   · Rekomendasi reward (⭐⭐⭐) & pendampingan (⚠️)
   · Ringkasan setiap panen (bagi hasil, potong hutang, biaya)
   · Ringkasan profit per penggarap

PDF Invoice Detail Panen

1. Buka detail panen
2. Klik tombol "📄 Download Invoice PDF (Bagi Hasil)"
3. Generate PDF dengan: header, info panen, perhitungan, bagi hasil, penyesuaian gabah bawa pulang, potong hutang, total diterima, tanda tangan
4. Semua string di-sanitize ASCII (fungsi ascii()) — biar tidak ada karakter aneh di PDF

Import/Export Backup

1. User buka /export → klik Download Backup → dapat file Harvestan_Backup_YYYY-MM-DD.xlsx
2. Login akun baru → buka /import → upload file
3. Pilih mode: Timpa (hapus data lama) atau Tambah (merge)
4. Auto-remap UUID: ID lama di-map ke ID baru biar tidak bentrok
5. Preview jumlah penggarap/lahan/panen/hutang dulu sebelum import

Konverter SawahKu (HTML lama) → Harvestan

1. Buka tools/converter.html di browser
2. Upload file SawahKu_Export_*.xlsx (format lama)
3. Klik Convert → download Harvestan_Backup_YYYY-MM-DD.xlsx
4. Upload ke /import Harvestan

📊 PROGRESS FINAL v1.7

✅ Sudah Selesai

· ✅ Auth: Register + Login (Email + Google OAuth) — FIXED Client Secret
· ✅ CRUD Penggarap, Lahan, Panen, Hutang
· ✅ CRUD Lahan + GPS koordinat + polygon (GPS Walking)
· ✅ Dashboard (statistik, top 5, produksi 6 bulan)
· ✅ Keuangan & Laba (filter tahun, komoditas, musim cabai)
· ✅ Grafik Recharts:
  · Produksi & produktivitas per komoditas
  · Kinerja penggarap (warna-warni per penggarap)
  · Grafik per musim cabai
· ✅ Export Excel (4 sheet) + Backup Excel (7 sheet)
· ✅ Import Excel Backup (mode Timpa/Tambah + auto-remap UUID)
· ✅ Konverter HTML SawahKu lama → Harvestan Backup
· ✅ Export PDF per Penggarap + grafik + kategori
· ✅ Potong Hutang Otomatis + Log Audit
· ✅ Edit Panen + Auto-Revert Hapus Panen
· ✅ Transfer Lahan
· ✅ Landing Page + SEO
· ✅ Halaman Gabah (multi-sesi timbang):
  · Tombol "Jumlah Setiap Sesi"
  · Setting "Default jumlah sak per penimbangan"
  · Checkbox Bawa Pulang Penggarap & Owner
  · Rumus pengalihan profit versi HTML
  · Kirim ke DB + auto potong hutang
· ✅ Kategori Produktivitas (editable)
· ✅ PWA (install di HP, offline mode)
· ✅ Settings (profil, ganti password, hapus akun)
· ✅ Bagi Hasil Custom (panen & gabah)
· ✅ Panen Multi-Lahan
· ✅ GPS Walking (ukur lahan + mini-map)
· ✅ Panen Bertahap Cabai (TAHAP 1-5)
· ✅ PDF Invoice Bagi Hasil (redesign profesional + sanitize ASCII)
· ✅ Laporan Tahunan/5 Tahunan
· ✅ TAHAP 3: Laporan Kinerja Penggarap (bintang, reward, pendampingan, biaya, hutang)
· ✅ Bottom Nav Mobile Scrollable
· ✅ Detail panen menampilkan rincian pengalihan gabah bawa pulang
· ✅ Invoice PDF menampilkan rincian pengalihan gabah bawa pulang

⏳ Belum Selesai

· ⏳ Reset Client Secret Google OAuth (KEAMANAN — 1 secret ekspos)
· ⏳ Halaman Bantuan (belum ada)
· ⏳ Email Notifikasi (butuh Resend/Mailgun)
· ⏳ Katalog Produk (foto/video, butuh Supabase Storage)
· ⏳ Monetisasi (payment gateway)
· ⏳ Fix Highlight Menu Active (menu tidak highlight saat aktif)

🎯 Next Feature — Prioritas

🅰️ Halaman Bantuan (Mudah, ~1 jam)

· Panduan step-by-step
· FAQ
· Kontak support

🅱️ Fix Highlight Menu Active (Mudah, ~30 menit)

· Menu sidebar tidak highlight saat aktif
· Buat ActiveLink component kecil

🅲️ Email Notifikasi (Sedang, ~2-3 jam)

· Welcome email
· Reminder hutang
· Butuh Resend/Mailgun

🅳️ Katalog Produk (Besar, ~4-6 jam)

· Upload foto/video
· Butuh Supabase Storage

🅴️ Monetisasi (Besar, ~6-8 jam)

· Payment gateway
· Paket Free vs Premium

🎯 Cara Lanjut di Chat Baru

Buka chat baru, paste pesan ini:

```
Halo! Saya lanjut project Harvestan (SaaS pertanian Indonesia).

Konteks lengkap:
https://github.com/harvestanid/harvestan/blob/main/HANDOFF.md

Tolong baca dulu sebelum mulai.

Status: v1.7
- ✅ Login Google OAuth (FIXED Client Secret)
- ✅ Gabah bawa pulang + pengalihan profit
- ✅ Import/Export Backup Excel
- ✅ Konverter SawahKu HTML
- ✅ Grafik Kinerja Penggarap warna-warni
- ✅ Invoice PDF redesigned

Yang mau dilanjutkan:
[TULIS DI SINI]

Aturan main:
1. Saya pemula, kirim FULL FILE, bukan potongan kode
2. Jangan suruh cari line kode
3. JANGAN bikin nested <form>
4. JANGAN pakai useSearchParams di page.tsx
5. Client Component dipisah ke file sendiri
6. WAJIB: pkill -9 node sebelum rm -rf .next
7. Kalau error, saya screenshot

Mulai?
```

🔗 Link Penting

· Repo: https://github.com/harvestanid/harvestan
· Live: https://harvestan.vercel.app
· Vercel Dashboard: https://vercel.com/harvestanid/harvestan
· Supabase Dashboard: https://supabase.com/dashboard/project/qfggoqcdaiokfluewple
· Google Cloud Console: https://console.cloud.google.com/auth/clients?project=bubbly-stone-509704-g2

🚨 Known Issues

🟡 Highlight Menu Active Tidak Jalan

Menu sidebar tidak highlight saat aktif. Perlu ActiveLink component.

🟡 Middleware Deprecated Warning

Next.js warning: middleware file convention is deprecated, use "proxy" instead. Bisa diabaikan dulu, atau rename ke proxy.ts nanti.

🟡 Edit Panen + Hutang Manual

Kalau hutang sudah dilunasi manual oleh user setelah panen potong hutang, revert saat edit bisa salah. Log sudah ada tapi logic revert belum cek ini.

🔴 Client Secret Google OAuth Ekspos

1 secret pernah dikirim ke chat publik. WAJIB disable di Google Cloud Console segera.

📈 Statistik Project

· 40+ halaman Next.js
· 25+ API routes
· 6 tabel database + RLS
· ~20000+ baris kode TypeScript
· ~20 library terintegrasi
· 3 dokumentasi: CHANGELOG.md, HANDOFF.md (ini), PROJECT.md
· Live di production

---

Status: ✅ v1.7 — Gabah Bawa Pulang + Import/Export + Fix Login Google
Tanggal update: 2026-09-27
Dibuat dengan: ❤️ + AI, dari nol, tanpa bisa coding 🇮🇩

Simpan: Ctrl+S → Ctrl+Q

✅ Cek Baris

```bash
cd ~/projects/harvestan
wc -l HANDOFF.md
```

Harusnya ≥ 500 baris.

🚀 Commit & Push

```bash
cd ~/projects/harvestan
git add .
git commit -m "docs: update HANDOFF.md ke v1.7 — gabah bawa pulang + import/export + fix login Google"
git push
```

📸 Kabari

Setelah push:

· ✅ wc -l HANDOFF.md ≥ 500?
· ✅ Sudah git push?
· ✅ Pilih next feature: 🅰️ / 🅱️ / 🅲️ / 🅳️ / 🅴️?

Kalau berhasil, HANDOFF.md siap untuk chat baru. 🌾✨

```

---

## ✅ Setelah Itu

Cek + commit:

```bash
cd ~/projects/harvestan
wc -l HANDOFF.md
git add .
git commit -m "docs: update HANDOFF.md ke v1.7 — gabah bawa pulang + import/export + fix login Google"
git push
```

---

📸 Kabari

1. ✅ wc -l HANDOFF.md hasilnya berapa?
2. ✅ Sudah git push?
3. ➡️ Next feature: 🅰️ Halaman Bantuan / 🅱️ Fix Highlight Menu / lain?

🌾✨

# 🤝 HANDOFF — Konteks untuk Chat Baru

**File ini untuk melanjutkan development Harvestan di chat baru.**
Copy-paste isi file ini (atau link repo) ke chat baru untuk kasih konteks ke AI.

---

## 🎯 PROJECT INFO

- **Nama**: Harvestan
- **Deskripsi**: SaaS manajemen pertanian Indonesia (multi-komoditas + bagi hasil + hutang + GPS)
- **Repo**: https://github.com/harvestanid/harvestan
- **Live**: https://harvestan.vercel.app
- **Versi**: v3.0 (multi-musim + grafik multi-komoditas + premium + feedback)
- **User**: Pemula (tidak bisa coding), koding semua oleh AI
- **Development**: Termux di Android
- **Chat ini**: AI buat kode, user paste + test

---

## 👤 KARAKTERISTIK USER (PENTING!)

### Cara Kerja:
- **Sangat detail** — kasih instruksi step-by-step
- **Suka nguji** — sering screenshot hasil, minta fix ulang kalau salah
- **Cepat emosi** kalau AI lambat paham / salah tangkap. Wajar, AI harus sabar.
- **Pemula teknis** — jangan asumsikan tahu istilah (timestamp, closure, dll)
- **Tidak bisa coding** — semua kode harus full file siap paste

### Aturan MAIN — WAJIB DIIKUTI:

1. ✅ **SELALU FULL FILE** — bukan potongan kode, bukan "cari baris X", bukan "ubah 1 baris"
2. ✅ **JANGAN pernah stop di tengah** — kalau file panjang, kirim sekaligus
3. ✅ **JANGAN tanya-tanya kebanyakan** — kerjakan langsung, tanya minimal
4. ✅ **Kalau ada 5 revisi** — kerjakan sekaligus, jangan satu-satu kecuali diminta
5. ✅ **JANGAN bikin nested `<form>`**
6. ✅ **JANGAN pakai useSearchParams di page.tsx** (Next.js 16)
7. ✅ **Client Component** dipisah ke file sendiri (`"use client"` baris 1)
8. ✅ **pkill -9 node** sebelum `rm -rf .next`
9. ✅ **Kasih patokan `wc -l`** tiap file
10. ✅ **Kalau user bilang "gas"** → langsung kerja, jangan tanya lagi

### Yang User Tidak Suka:
- ❌ Dijawab "cari baris X, ubah jadi Y"
- ❌ File dipotong jadi 2-3 pesan
- ❌ AI bilang "sudah benar" padahal belum test
- ❌ AI jelasin panjang lebar tanpa eksekusi
- ❌ AI tanya-tanya berulang

### Yang User Suka:
- ✅ AI langsung kerja
- ✅ Full file siap paste
- ✅ Ringkas, to the point
- ✅ Kalau salah, minta maaf + fix langsung
- ✅ Bahasa Indonesia

---

## 🛠️ TECH STACK

- **Framework**: Next.js 16 (App Router) + TypeScript
- **UI**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL + RLS + Auth)
- **Auth**: Supabase Auth (Email + Google OAuth + Reset Password)
- **Hosting**: Vercel
- **Grafik**: Recharts
- **PDF**: jsPDF
- **Excel**: xlsx (SheetJS)
- **PNG**: html-to-image
- **Maps**: Leaflet + OpenStreetMap (Esri satellite)
- **Editor**: micro (Termux)

---

## 📁 STRUKTUR FOLDER

```
app/
├── page.tsx
├── layout.tsx
├── auth/callback/route.ts
├── (auth)/
│   ├── layout.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── reset-password/page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── nav-link.tsx
│   ├── dashboard/page.tsx
│   ├── keuangan/
│   │   ├── page.tsx
│   │   └── keuangan-client.tsx
│   ├── grafik/
│   │   ├── page.tsx
│   │   ├── grafik-client.tsx
│   │   └── grafik-cabai.tsx
│   ├── gabah/page.tsx
│   ├── panen-multi/page.tsx
│   ├── ukur-lahan/
│   │   ├── page.tsx
│   │   └── ukur-content.tsx
│   ├── laporan/
│   │   ├── page.tsx
│   │   └── klien.tsx
│   ├── pengaturan/
│   │   ├── page.tsx
│   │   ├── akun-tab.tsx
│   │   ├── kategori-tab.tsx
│   │   ├── tab-container.tsx
│   │   └── form.tsx
│   ├── export/
│   │   ├── page.tsx
│   │   └── export-gate.tsx
│   ├── import/
│   │   ├── page.tsx
│   │   └── klien.tsx
│   ├── bantuan/
│   │   ├── page.tsx
│   │   └── klien.tsx
│   ├── feedback/
│   │   ├── page.tsx
│   │   └── klien.tsx
│   ├── premium-gratis/
│   │   ├── page.tsx
│   │   └── klien.tsx
│   ├── demo/
│   │   ├── page.tsx
│   │   └── klien.tsx
│   ├── admin/
│   │   ├── feedback/
│   │   └── premium/
│   └── penggarap/
│       ├── page.tsx
│       ├── klien.tsx
│       ├── baru/page.tsx
│       └── [id]/
│           ├── page.tsx
│           ├── tombol-aksi.tsx
│           ├── transfer/
│           ├── lahan/
│           │   ├── baru/page.tsx
│           │   └── [landId]/
│           │       ├── page.tsx
│           │       ├── tombol-aksi.tsx
│           │       └── panen/
│           │           ├── baru/
│           │           ├── [harvestId]/
│           │           │   ├── page.tsx
│           │           │   ├── tombol-aksi.tsx
│           │           │   ├── tombol-download-invoice.tsx
│           │           │   └── edit/page.tsx
│           │           └── musim/[musim]/
│           │               ├── page.tsx
│           │               └── tombol-download-invoice-musim.tsx
│           └── hutang/
│               ├── baru/page.tsx
│               └── [debtId]/
└── api/
    ├── akun/route.ts
    ├── lahan/[id]/route.ts
    ├── panen/[id]/route.ts
    ├── hutang/[id]/route.ts
    ├── kategori/route.ts
    ├── musim/route.ts
    ├── transfer-lahan/route.ts
    ├── feedback/route.ts
    ├── premium/route.ts
    ├── subscription/route.ts
    ├── demo/route.ts
    ├── demo/start/route.ts
    ├── demo/restart/route.ts
    ├── demo/stop/route.ts
    ├── export/route.ts
    ├── export-backup/route.ts
    ├── import/route.ts
    ├── export-pdf/route.ts
    ├── export-pdf-musim/route.ts
    ├── export-laporan/route.ts
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
│       ├── musim-server.ts
│       └── subscription-server.ts
├── demo/
│   ├── demo-mode.ts
│   └── data-loader.ts
└── utils/
    ├── grafik-helpers.ts
    └── hitung-luas.ts

components/
├── install-pwa.tsx
├── skema-bagi-hasil-v2.tsx
├── peta-ukur.tsx
├── peta-mini.tsx
├── peta-mini-wrapper.tsx
├── cta-threshold.tsx
├── demo-banner.tsx
└── upgrade-modal.tsx

tools/
├── converter.html
└── regen-demo.js          ← Script regenerate demo data

middleware.ts
```

---

## 🗄️ DATABASE SCHEMA

### `penggaraps`
- id (uuid, PK), user_id, nama, alamat, usia, kontak, is_demo, created_at, updated_at

### `lands`
- id, user_id, penggarap_id, nama, luas, lokasi_koordinat, polygon (jsonb), is_demo, created_at

### `harvests`
- id, user_id, land_id, tanggal, komoditas, musim
- hasil_kg, harga_gabah, harga_per_kg, biaya_panen_per_kg, biaya_tambahan, keterangan_biaya
- bawa_penggarap, bawa_owner, bawa_lain
- persen_owner, persen_penggarap
- profit_bersih, profit_owner, profit_penggarap
- potongan_hutang, potongan_hutang_log (jsonb)
- total_hutang_sebelum, sisa_hutang_sesudah
- catatan, is_demo, created_at, updated_at

### `debts`
- id, user_id, penggarap_id, tanggal, jumlah, keperluan, dibayar, sisa
- log_perubahan (jsonb), is_demo, created_at

### `categories`
- id, user_id, komoditas, cukup, baik, sangat_baik, is_demo, created_at

### `musim_cabai`
- id, user_id, nama, tanggal_mulai, tanggal_selesai, catatan, is_demo

### `feedback`
- id, user_id (nullable), kategori, pesan, created_at

### `subscriptions`
- id, user_id, paket ('free'/'premium'), tanggal_mulai, tanggal_berakhir, status

### `demo_sessions`
- id, user_id, is_active, started_at, expires_at, last_restart_at, total_restarts

**RLS aktif**: `auth.uid() = user_id` di semua tabel.

---

## ⚠️ ATURAN TEKNIS (WAJIB)

1. **RLS** — setiap `insert()` wajib `user_id: user.id`
2. **Form tambah** = Server Action (`'use server'`), **Edit/Hapus** = API Route
3. **micro**: `Ctrl+S` simpan, `Ctrl+Q` keluar, `"use client"` baris 1
4. **Path dengan `[ ]` atau `( )`** wajib tanda kutip: `micro "app/(dashboard)/penggarap/[id]/page.tsx"`
5. **Nama kolom**: `hasil_kg`, `harga_gabah`, `profit_owner`, `persen_penggarap`
6. **`harga_gabah` = `harga_per_kg`** (sync)
7. **Kategori**: `cukup`, `baik`, `sangat_baik` (BUKAN `cukup_min`)
8. **JANGAN campur produktivitas antar komoditas** — dihitung terpisah per komoditas
9. **Normalisasi komoditas**: `cabai` ↔ `cabai_rawit` (alias). Helper `normalisasiKomoditas()`.
10. **Sebelum push, WAJIB `npm run build`**
11. **Kill node** sebelum clear cache: `pkill -9 node && rm -rf .next && npm run dev`
12. **<script> di Server Component** = ERROR. Pakai `<Script>` dari `next/script`.

---

## 🔄 LOGIC PENTING

### Potong Hutang Otomatis
1. Input panen → hitung profit penggarap
2. Ambil hutang aktif, urut dari TERLAMA
3. Kalau user CENTANG:
   - Potong profit penggarap dengan hutang
   - Update tiap hutang: `dibayar += potong`, `sisa -= potong`
   - `profitPenggarap -= potongan`, `profitOwner += potongan`
   - Log di `debts.log_perubahan` + `harvests.potongan_hutang_log`

### Cabai: Per Musim vs Per Panen
- **Produksi cabai** = **TOTAL seluruh panen musim** (bukan per panen)
- **Produktivitas cabai** = **TOTAL seluruh panen ÷ luas lahan**
- **Titik grafik** = tanggal **panen terakhir musim**
- **Padi/jagung** = per panen (1 musim = 1 panen)

### Aturan Musim per Pola (Demo)
- **Monokultur padi**: 2 musim/tahun (padi+padi)
- **Padi-jagung (rotasi)**: 3 musim/tahun (padi+jagung+padi)
- **Padi-cabai (rotasi)**: 2 musim/tahun (cabai+padi)

### Bagi Hasil
- Skema variatif: [50,50], [40,60], [30,70] — **penggarap ≥ 50%**
- Profit penggarap **selalu positif** (target ≥ UMR × bulan musim)

### GPS Walking
1. Tracking GPS: filter akurasi <20m, jarak minimal 3m
2. Hitung luas pakai Shoelace formula (`lib/utils/hitung-luas.ts`)
3. Simpan polygon GeoJSON

---

## 📊 PROGRESS v3.0

### ✅ Sudah Selesai

**AUTH**:
- ✅ Register + Login (Email + Google OAuth)
- ✅ Konfirmasi password register
- ✅ Lupa password via email
- ✅ Reset password

**CRUD**:
- ✅ Penggarap, Lahan, Panen, Hutang, Kategori, Musim Cabai
- ✅ Multi-komoditas (padi, jagung, kacang, bawang, cabai)

**FITUR**:
- ✅ Dashboard (statistik, top 5, komposisi)
- ✅ Keuangan (filter tahun/komoditas/musim)
- ✅ Grafik Recharts:
  - ✅ Produksi & produktivitas per komoditas
  - ✅ Kinerja penggarap (warna-warni)
  - ✅ **Detail Penggarap: multi-komoditas (multiple garis)** — FIX pakai timestamp
  - ✅ Cabai per musim
- ✅ Gabah multi-sesi + bawa pulang (pengalihan profit)
- ✅ Panen Multi-Lahan
- ✅ GPS Walking + polygon + mini-map
- ✅ Panen Bertahap Cabai (musim)
- ✅ PDF Invoice per Panen + per Musim
- ✅ Laporan Tahunan/5 Tahunan
- ✅ Export Excel + Backup + Import (auto-remap UUID)
- ✅ Konverter SawahKu lama → Harvestan backup
- ✅ Kategori Produktivitas (editable, threshold per komoditas)
- ✅ PWA
- ✅ Settings
- ✅ Bagi Hasil Custom
- ✅ Landing Page + SEO + 12 profesi
- ✅ **Bantuan** (panduan + FAQ)
- ✅ **Feedback anonymous** + Telegram + admin dashboard
- ✅ **Premium Gate** (free vs premium)
- ✅ **Highlight Menu Active** (`nav-link.tsx`)
- ✅ **Efek klik tombol** + smooth scroll
- ✅ **Demo mode** (data 10 tahun, 13 penggarap, 17 ha, rotasi tanaman, bagi hasil variatif, hutang dipotong tiap panen)
- ✅ **Demo export PDF penggarap** (unlocked)
- ✅ **CTA threshold** di konten produktivitas

### ⏳ Belum Selesai / Pending

- ⏳ **Grafik Detail Penggarap multi-komoditas** — fix terakhir pakai timestamp, belum di-test user (kemungkinan masih bug)
- ⏳ **Halaman Bantuan** — sudah ada, cek konten
- ⏳ Email Notifikasi (butuh Resend/Mailgun)
- ⏳ Katalog Produk (butuh Supabase Storage)
- ⏳ Payment gateway (Midtrans/Xendit)
- ⏳ **Reset Client Secret Google OAuth** (KEAMANAN — belum dikonfirmasi user)
- ⏳ Middleware deprecated warning (bisa diabaikan)

---

## 🚨 KNOWN ISSUES (PERLU DIPERHATIKAN DI CHAT BARU)

### 1. 🔴 Client Secret Google OAuth Ekspos
- Secret `*****7Gb5` pernah terekspos di chat publik
- User perlu **disable** di Google Cloud Console
- **Belum dikonfirmasi user sudah dilakukan atau belum**

### 2. 🟡 Grafik Multi-Komoditas
- Fix terakhir pakai **timestamp** + `type="number"` + `scale="time"`
- Belum di-test user
- Kalau masih bug, **fallback: hapus mode "Semua Komoditas"** (paksa pilih 1 komoditas)

### 3. 🟡 Middleware Deprecated
- Next.js warning: `middleware` → `proxy`
- Bisa diabaikan dulu

### 4. 🟡 Angka Kepotong di Mobile
- Sudah fix pakai `break-all` + `leading-tight` + `min-w-0`
- Cek lagi kalau muncul lagi

### 5. 🟡 PDF Layout
- Fix terakhir: beri jarak lebih lega di kolom EVALUASI PRODUKTIVITAS
- Bintang di tengah baris (bukan tabrakan header)
- Belum di-test user

---

## 🎯 CARA LANJUT DI CHAT BARU

**Buka chat baru, paste pesan ini:**

```
Halo! Saya lanjut project Harvestan (SaaS pertanian Indonesia).

Konteks lengkap:
https://github.com/harvestanid/harvestan/blob/main/HANDOFF.md

Tolong baca dulu SEBELUM mulai, terutama bagian:
- KARAKTERISTIK USER
- ATURAN TEKNIS
- LOGIC PENTING
- KNOWN ISSUES

Status: v3.0

ATURAN WAJIB:
1. SELALU FULL FILE — bukan potongan kode / "cari baris X"
2. JANGAN stop di tengah — file panjang kirim sekaligus
3. JANGAN tanya-tanya kebanyakan — langsung kerja
4. Kalau user bilang "gas" → langsung eksekusi
5. Bahasa Indonesia, ringkas
6. Kasih `wc -l` sebagai patokan
7. pkill -9 node sebelum rm -rf .next
8. JANGAN nested <form>
9. JANGAN useSearchParams di page.tsx
10. Client Component dipisah ke file sendiri

Yang mau dilanjutkan:
[TULIS DI SINI — misal: "test grafik multi-komoditas dulu, kalau masih bug hapus mode Semua Komoditas"]

Mulai?
```

---

## 🔗 LINK PENTING

- Repo: https://github.com/harvestanid/harvestan
- Live: https://harvestan.vercel.app
- Vercel: https://vercel.com/harvestanid/harvestan
- Supabase: https://supabase.com/dashboard/project/qfggoqcdaiokfluewple
- Google Cloud: https://console.cloud.google.com/auth/clients?project=bubbly-stone-509704-g2

---

## 🎬 DEMO MODE — Detail

### Data Demo (File: `public/demo-data.json`)
- **13 penggarap**, **13 lahan**, total **17.0 ha**
- **10 tahun** (2016-2025), **~660 panen**, **~390 hutang**
- **Pola tanam**:
  - Monokultur padi: 5 penggarap (2 musim/tahun)
  - Rotasi padi-jagung: 5 penggarap (3 musim/tahun)
  - Rotasi padi-cabai: 3 penggarap (2 musim/tahun)
- **Bagi hasil**: 50:50 (mayoritas), 40:60, 30:70
- **Hutang modal**: tiap musim, dipotong dari panen (lunas)
  - Padi/Jagung: potong di panen itu
  - Cabai: potong dibagi 12 panen
- **Kategori produktivitas**: variasi (KURANG, CUKUP, BAIK, SANGAT BAIK)
- **Polygon dummy**: dari koordinat + luas lahan

### Regenerate Demo
```
cd ~/projects/harvestan
node tools/regen-demo.js
```
→ Output: `public/demo-data.json` (overwrite)

### File Demo Penting
- `lib/demo/demo-mode.ts` — helper `isDemoActive`, `getDataFilter`, `canInputDuringMode`
- `app/api/demo/start/route.ts` — seed demo ke DB
- `app/api/demo/restart/route.ts` — restart demo
- `components/demo-banner.tsx` — banner biru atas

---

## 📈 STATISTIK PROJECT

- 50+ halaman Next.js
- 30+ API routes
- 9 tabel database + RLS
- ~25.000+ baris kode TypeScript
- ~20 library terintegrasi
- 3 dokumentasi: `CHANGELOG.md`, `HANDOFF.md` (ini), `PROJECT.md`
- Live di production

---

## 📝 CATATAN UNTUK AI BERIKUTNYA

1. **User pemula, tidak bisa coding.** Kirim file full yang siap paste.
2. **User suka test + screenshot.** Kalau salah, minta maaf + fix.
3. **User cepat emosi** — wajar. Tetap sabar, jangan defensif.
4. **JANGAN skip proses.** Kalau ada 5 revisi, kerjakan urut.
5. **Kalau user bilang "GAS"** → langsung eksekusi, jangan tanya.
6. **Kalau user bilang "FULL FILE"** → JANGAN potong, kirim sekaligus.
7. **Kalau file > 1000 baris** — kirim sekaligus, kasih warning kalau mungkin kepotong.
8. **Commit + push** setelah selesai fitur. Pakai `git add . && git commit -m "..." && git push`.
9. **Build check** sebelum push: `npm run build`.
10. **Reset Google OAuth Secret** — reminder kalau belum dilakukan.

---

Status: ✅ v3.0 — Multi-musim + Grafik multi-komoditas + Premium + Feedback
Tanggal update: 2026-09-29
Dibuat dengan: ❤️ + AI, dari nol, tanpa bisa coding 🇮🇩
