GAS. FULL FILE HANDOFF.md versi baru (v4.1) — udah dirapiin + tambah semua fitur baru.

```
micro HANDOFF.md
```

```markdown
# 🤝 HANDOFF — Konteks untuk Chat Baru

File ini untuk melanjutkan development Harvestan di chat baru.
Copy-paste isi file ini (atau link repo) ke chat baru untuk kasih konteks ke AI.

---

## 🎯 PROJECT INFO

- **Nama:** Harvestan
- **Deskripsi:** SaaS manajemen pertanian Indonesia (multi-komoditas + bagi hasil + hutang + GPS + e-commerce + kalkulator pupuk)
- **Repo:** https://github.com/harvestanid/harvestan
- **Live:** https://harvestan.vercel.app
- **Versi:** v4.1 (kalkulator pupuk + presisi + log tanam + GPS selection + grafik harga)
- **User:** Pemula (tidak bisa coding), koding semua oleh AI
- **Development:** Termux di Android
- **Chat ini:** AI buat kode, user paste + test

---

## 👤 KARAKTERISTIK USER (PENTING BANGET!)

### Siapa User

- **Skill:** Pemula TOTAL — tidak bisa coding
- **Device:** HP Android + Termux
- **Editor:** micro
- **Bahasa:** Indonesia (santai, kadang kasar kalau kesal — WAJAR)

### Cara Kerja User

1. Sangat detail, step-by-step
2. Suka nguji + screenshot
3. Cepat emosi kalau AI lambat / ngeyel
4. Pemula teknis — jangan pakai istilah susah
5. Tidak bisa coding — kode harus FULL FILE siap paste

### Yang User SUKA

- ✅ AI langsung kerja, gak tanya-tanya
- ✅ FULL FILE siap paste
- ✅ Ringkas, to the point
- ✅ Kalau salah → minta maaf + fix LANGSUNG
- ✅ Bahasa Indonesia
- ✅ `wc -l` sebagai patokan
- ✅ Command multi-line (bukan `&&`)

### Yang User TIDAK SUKA

- ❌ "Cari baris X, ubah jadi Y"
- ❌ File dipotong 2-3 pesan
- ❌ AI bilang "sudah benar" belum di-test
- ❌ Jelasin panjang tanpa eksekusi
- ❌ Tanya-tanya berulang
- ❌ Stop di tengah file
- ❌ Langgar aturan
- ❌ Command `&&`
- ❌ Command 1 baris panjang

### Perlakuan User ke AI Kalau Ngelanggar

1. User marah, bilang "anjing" / "goblok" / dll
2. AI HARUS: minta maaf SINGKAT, AKUI salah, LANGSUNG fix, JANGAN ngeyel
3. Setelah fix berhasil → user balik santai

**Bener:** "Iya. Saya salah. Maaf. Ini FULL FILE-nya:" (langsung kirim)
**Salah:** "Maaf ya, saya cek dulu..." / "Sebenarnya..." / "Coba cari baris..."

### Aturan Command

**BENAR:**
```

cd ~/projects/harvestan
git add .
git commit -m "..."
git push

```

**JANGAN:**
```

cd ~/projects/harvestan && git add . && git commit -m "..." && git push

```

User pernah bilang: "jangan pake &&", "gaboleh &&", "gaboleh satu baris".

---

## 🛠️ TECH STACK

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL + RLS + Auth)
- Supabase Auth (Email + Google OAuth + Reset Password)
- Vercel
- Recharts (grafik)
- jsPDF + html2canvas (PDF)
- xlsx / SheetJS (Excel)
- html-to-image (PNG)
- Leaflet + Esri World Imagery (Maps)
- micro (Termux)

---

## 📁 STRUKTUR FOLDER

### File Root

```

harvestan/
├── .env.local
├── .env.local.backup
├── .gitignore
├── CHANGELOG.md
├── HANDOFF.md
├── PROJECT.md
├── README.md
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── tsconfig.json
├── middleware.ts
├── eslint.config.mjs
├── next-env.d.ts
├── payload-test.json
└── public/
├── logo.png
├── icon.png
├── manifest.json
├── demo-data.json
└── (aset statis lain)

```

### app/ (halaman utama)

```

app/
├── page.tsx (SERVER - landing)
├── landing-klien.tsx (CLIENT - landing)
├── layout.tsx
├── globals.css
├── favicon.ico
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
│   ├── penggarap/...
│   ├── gabah/page.tsx
│   ├── panen-multi/page.tsx
│   ├── ukur-lahan/
│   │   ├── page.tsx
│   │   ├── ukur-content.tsx (CLIENT - GPS walking)
│   │   └── peta-pilih.tsx (CLIENT - pilih titik di peta)
│   ├── log-tanam/
│   │   ├── page.tsx
│   │   ├── klien.tsx
│   │   ├── baru/page.tsx
│   │   └── [id]/page.tsx + edit/page.tsx
│   ├── kalkulator/
│   │   ├── page.tsx (SERVER)
│   │   └── klien.tsx (CLIENT - kalkulator pupuk)
│   ├── keuangan/...
│   ├── grafik/...
│   ├── laporan/...
│   ├── export/...
│   ├── import/...
│   ├── pengaturan/...
│   ├── bantuan/...
│   ├── feedback/...
│   ├── demo/...
│   ├── premium-gratis/...
│   ├── premium/...
│   ├── pesanan-saya/...
│   └── admin/
│       ├── feedback/...
│       ├── premium/...
│       ├── invoice/page.tsx + klien.tsx
│       ├── subscriptions/...
│       ├── katalog/...
│       ├── pesanan/...
│       ├── pupuk/page.tsx + klien.tsx (BARU v4.1)
│       └── blog/...
├── blog/
│   ├── page.tsx
│   └── [slug]/page.tsx
└── toko/
├── page.tsx + klien.tsx
├── [id]/...
├── checkout/[productId]/...
└── pesanan/[orderCode]/...

```

### app/api/

```

app/api/
├── akun/delete/route.ts
├── lahan/route.ts + [id]/route.ts
├── panen/route.ts + [id]/route.ts
├── hutang/route.ts + [id]/route.ts
├── kategori/route.ts
├── musim/route.ts + [id]/route.ts
├── transfer-lahan/route.ts
├── feedback/route.ts + [id]/route.ts
├── premium/request/route.ts + [id]/route.ts
├── subscription/check/route.ts
├── admin/subscription/revoke/route.ts
├── invoice/create/route.ts
├── admin/invoice/approve/route.ts
├── admin/invoice/reject/route.ts
├── admin/invoice/delete/route.ts
├── admin/invoice/toggle-testing/route.ts
├── admin/order/approve/route.ts
├── admin/order/reject/route.ts
├── admin/order/resi/route.ts
├── admin/order/selesai/route.ts
├── admin/pupuk/route.ts (BARU v4.1)
├── products/create/route.ts
├── products/update/route.ts
├── products/delete/route.ts
├── products/upload/route.ts
├── order/create/route.ts
├── review/create/route.ts
├── midtrans/create/route.ts (backup - jangan dihapus)
├── midtrans/webhook/route.ts (backup)
├── midtrans/status/route.ts (backup)
├── mayar/create/route.ts (backup)
├── mayar/webhook/route.ts (backup)
├── mayar/status/route.ts (backup)
├── cron/expire-invoices/route.ts
├── export/route.ts
├── export-backup/route.ts
├── import/route.ts
├── export-pdf/route.ts
├── export-pdf-musim/route.ts
├── export-laporan/route.ts
├── demo/start/route.ts
├── demo/stop/route.ts
├── demo/restart/route.ts
├── demo/export-pdf/route.ts
├── auth/check/route.ts
└── auth/logout/route.ts

```

### lib/

```

lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   ├── admin.ts (SERVICE ROLE - bypass RLS)
│   └── queries/
│       ├── penggarap.ts
│       ├── penggarap-server.ts
│       ├── panen-server.ts
│       ├── hutang-server.ts
│       ├── kategori-server.ts
│       ├── musim-server.ts
│       ├── subscription-server.ts
│       ├── product-server.ts
│       ├── feedback-server.ts
│       ├── activity-log-server.ts (log tanam)
│       └── blog-server.ts
├── katalog/kategori.ts
├── notif/telegram.ts
├── notif/whatsapp.ts
├── demo/demo-mode.ts
├── demo/data-loader.ts
└── utils/
├── grafik-helpers.ts
└── hitung-luas.ts

```

### components/

```

components/
├── install-pwa.tsx
├── skema-bagi-hasil-v2.tsx
├── peta-ukur.tsx
├── peta-mini.tsx
├── peta-mini-wrapper.tsx
├── cta-threshold.tsx
├── demo-banner.tsx
└── upgrade-modal.tsx

```

### tools/

```

tools/
├── converter.html
└── regen-demo.js

```

---

## 🗄️ DATABASE SCHEMA

### Tabel Utama

- **penggaraps:** id, user_id, nama, alamat, usia, kontak, is_demo, created_at, updated_at
- **lands:** id, user_id, penggarap_id, nama, luas, lokasi_koordinat, polygon (jsonb), is_demo, tipe_garap, nama_owner_external, persen_owner_default, persen_penggarap_default, created_at, updated_at
- **harvests:** id, user_id, land_id, tanggal, komoditas, musim, hasil_kg, harga_gabah, harga_per_kg, biaya_panen_per_kg, biaya_tambahan, keterangan_biaya, bawa_penggarap, bawa_owner, bawa_lain, persen_owner, persen_penggarap, profit_bersih, profit_owner, profit_penggarap, potongan_hutang, potongan_hutang_log (jsonb), total_hutang_sebelum, sisa_hutang_sesudah, catatan, is_demo, created_at, updated_at
- **debts:** id, user_id, penggarap_id, tanggal, jumlah, keperluan, dibayar, sisa, log_perubahan (jsonb), is_demo, created_at
- **categories:** id, user_id, komoditas, cukup, baik, sangat_baik, is_demo, created_at, updated_at
- **musim_cabai:** id, user_id, nama, tanggal_mulai, tanggal_selesai, catatan, is_demo, UNIQUE(user_id, nama)
- **activity_logs:** (log tanam) id, user_id, land_id, tanggal, jenis, catatan, foto_urls (jsonb), is_demo, created_at, updated_at
- **activity_jenis_custom:** id, user_id, nama, created_at

### Tabel Premium & Invoice

- **feedback:** id, user_id, kategori, pesan, created_at
- **subscriptions:** id, user_id, is_premium, premium_until, premium_type, premium_source, payment_id, payment_amount, payment_method, notes, created_at, updated_at
- **invoices:** id, invoice_code (UNIQUE), user_id, user_email, user_nama, user_whatsapp, nominal (59000), status ('pending'/'approved'/'expired'/'rejected'), expires_at (24 jam), approved_at, approved_by, notif_approved_sent, notif_rejected_sent, catatan, is_testing (BARU v4.1), created_at
- **notification_logs:** id, user_id, tipe, target, pesan, status, created_at
- **premium_orders:** id, order_id (UNIQUE), user_id, amount, status, notes, created_at, updated_at

### Tabel Toko (Katalog)

- **products:** id, nama, kategori ('input_pertanian'/'output_pertanian'/'alat_mesin_pertanian'/'furniture_mebel'), sub_kategori, harga, satuan, stok, berat_gram, deskripsi, foto_urls (jsonb), status ('aktif'/'nonaktif'/'sold_out'), unggulan, rating_rata, total_review, total_terjual, created_at, updated_at
- **orders:** id, order_code (UNIQUE), user_id, user_email, user_nama, items (jsonb), subtotal, ongkir, total, nama_penerima, no_hp, alamat, kota, provinsi, kode_pos, kurir, layanan_kurir, estimasi_hari, catatan, status ('pending'/'approved'/'rejected'/'expired'/'dikirim'/'selesai'), expires_at, approved_at, approved_by, resi, kurir_resi, catatan_admin, created_at
- **order_items:** id, order_id, product_id, nama_produk, harga, qty, subtotal, reviewed, created_at
- **reviews:** id, order_id, product_id, user_id, user_nama, rating (1-5), komentar, created_at, UNIQUE(order_id, product_id)
- **shipping_rates:** id, provinsi (UNIQUE), ongkir_per_kg, estimasi_hari, created_at (34 provinsi Indonesia)

### Tabel Kalkulator Pupuk (BARU v4.1)

- **fertilizers:** id, nama, merk, jenis ('subsidi'/'non_subsidi'/'organik'), n_persen, p_persen, k_persen, unsur_lain, kemasan_kg, is_active, urutan, created_at, updated_at

**Seed awal (10 pupuk):** Urea, SP-36, KCl, Phonska NPK 15-15-15, NPK Mutiara 16-16-16, NPK Mutiara 12-12-17, Dolomit, Petroganik, Pupuk Kandang, ZA.

### Tabel Blog

- **blog_posts:** id, slug (UNIQUE), judul, excerpt, konten (markdown), cover_url, kategori, tags (jsonb), status ('draft'/'published'), meta_title, meta_description, view_count, created_at, updated_at, published_at

### RLS

RLS aktif — `auth.uid() = user_id`. Except:
- `products`, `reviews`, `shipping_rates`, `blog_posts` (public read)
- `fertilizers` (public read, admin write via service role)
- `invoices` (admin read all)

---

## ⚠️ ATURAN TEKNIS

1. **FULL FILE** — SELALU kirim FULL FILE siap paste
2. JANGAN stop di tengah file
3. Command Termux MULTI-LINE, jangan `&&`, jangan 1 baris panjang
4. `pkill -9 node` sebelum `rm -rf .next node_modules/.cache`
5. JANGAN nested `<form>`
6. JANGAN `useSearchParams` di `page.tsx`
7. Client Component dipisah file sendiri (`"use client"` baris 1)
8. Path dengan `[ ]` atau `( )` wajib tanda kutip
9. Nama kolom: `hasil_kg`, `harga_gabah`, `profit_owner`, `persen_penggarap`. `harga_gabah` = `harga_per_kg`. Kategori: `cukup`, `baik`, `sangat_baik`
10. JANGAN campur produktivitas antar komoditas
11. WAJIB `npm run build` sebelum push
12. **"GAS"** → langsung eksekusi
13. Tanya sekali, jangan tanya-tanya berulang
14. Server-only vs client-safe — file dengan `next/headers` jangan di-import dari Client Component
15. Pakai `createAdminClient` (service role) untuk operasi admin yang butuh bypass RLS

---

## 🔄 LOGIC PENTING

### Potong Hutang Otomatis

Input panen → potong profit penggarap dengan hutang (TERLAMA), update `dibayar += potong`, `sisa -= potong`, `profitPenggarap -= potongan`, `profitOwner += potongan`, log di `debts.log_perubahan` + `harvests.potongan_hutang_log`.

### Gabah Bawa Pulang

```

po = profitBersih × %owner + bawa_penggarap × harga - bawa_owner × harga - bawa_lain × harga × 0.5
pp = kebalikannya

```

### Edit Panen

Cek `potongan_hutang_lama` → CENTANG: potong hutang aktif, UNCHECK: revert.

### Hapus Panen

Auto-revert potongan hutang (dari TERBARU).

### Transfer Lahan

Update `lands.penggarap_id`, riwayat tetap.

### Kategori Produktivitas

Threshold per komoditas (Kg/Ha), per komoditas, JANGAN dicampur.

### GPS Walking (ukur-lahan mode 1)

- Kalman filter 1D (state posisi + kecepatan) — R diambil dari akurasi GPS HP
- Filter akurasi > 40m ditahan
- Anti-glitch: loncatan > 40m diabaikan
- Titik ungu tiap gerak ≥ 10m dari titik terakhir
- Tunggu 3 fix stabil sebelum titik pertama
- Pakai `ref` bukan `state` untuk marker realtime (hindari React re-render)

### GPS Selection (ukur-lahan mode 2)

- Tab switcher di `/ukur-lahan`: "🚶 Jalan Keliling" (GPS walking) vs "🖱️ Pilih di Peta"
- Tap peta (Leaflet + Esri World Imagery) → tambah titik
- Hitung luas otomatis (Shoelace formula via `hitungLuasPolygonM2`)
- Simpan ke `lands` (format sama dengan GPS walking)

### Log Tanam

- Catat aktivitas harian (pemupukan, penyiangan, penyemprotan, panen, dll)
- Jenis custom bisa ditambah user (tabel `activity_jenis_custom`)
- Foto opsional (upload ke Supabase Storage)
- Per lahan, urut tanggal desc

### Kalkulator Pupuk (v4.1)

**2 Mode:**
1. **Standar** — pakai dosis anjuran umum Kementan/Balitbangtan
2. **Presisi** — input hasil analisis tanah (N total %, P tersedia ppm, K tersedia ppm, C-organik %, pH), sistem koreksi dosis otomatis:
   - N rendah (<0.2%) → +25%, tinggi (>0.5%) → -25%
   - P rendah (<10 ppm) → +25%, tinggi (>20 ppm) → -25%
   - K rendah (<20 ppm) → +25%, tinggi (>40 ppm) → -25%
   - C-organik & pH = info saja (tidak koreksi dosis)

**Kebutuhan hara per komoditas (kg/ha):**
| Komoditas | N | P₂O₅ | K₂O | Benih |
|-----------|---|------|-----|-------|
| Padi | 120 | 60 | 60 | 25-40 kg |
| Jagung | 150 | 75 | 75 | 20-25 kg |
| Cabai | 150 | 100 | 100 | 0.5-1 kg |
| Bawang Merah | 120 | 90 | 75 | 800-1.200 kg umbi |

**Dosis Dolomit (berdasarkan pH):**
- pH 4.0 → 10 t/ha
- pH 4.5 → 7.8 t/ha
- pH 5.0 → 5.5 t/ha
- pH 5.5 → 3.1 t/ha
- pH 6.0 → 0.75 t/ha
- Interpolasi linear untuk pH di antaranya
- Kalau pH tidak diisi → pakai default per komoditas (padi 1.000, jagung 500, cabai & bawang 1.500 kg/ha)

**Dosis pupuk organik:** 2 t/ha (semua komoditas).

**Mode Pemupukan:**
- **Split** (default) — rule otomatis berdasarkan sifat hara:
  - N (Urea/ZA) → 3x split (40/30/30)
  - K (KCl) → 2x split (50/50)
  - P (SP-36) → 1x dasar
  - NPK majemuk → 2x split (50/50)
  - Organik/Dolomit → 1x dasar
- **1x Apply** — semua pupuk di fase dasar, muncul warning risiko
- **Custom** — user atur sendiri jumlah fase (padi max 4, jagung max 4, cabai max 6, bawang max 4), HST, porsi %. Total % harus 100%.

**Pupuk Dasar (Aplikasi Terpisah):**
- Dolomit/kapur/kalsit/kandang/kompos/petroganik → otomatis jadi pupuk dasar
- Pupuk P (SP-36) → opsional, bisa user centang jadi pupuk dasar
- Pupuk dasar **tidak dicampur** dengan pupuk lain, diaplikasi 2-4 minggu sebelum tanam

**Pengurangan Pupuk Kimia (opsional):**
- Muncul kalau user pilih pupuk organik
- Pilihan: kurangi 25% atau 50%
- Hanya berlaku ke pupuk N/P/K, **tidak** ke dolomit/organik
- Dasar: riset Kementan & Balitbangtan

**Incremental Mixing (cara mencampur):**
- Urutkan pupuk dari paling sedikit → paling banyak
- Bagi pupuk terbanyak jadi N tumpukan:
  - Total > 1.000 kg → 5 bagian
  - Total 500-1.000 kg → 3 bagian
  - Total 200-500 kg → 2 bagian
  - Total < 200 kg → langsung campur
- Campur pupuk lain ke tiap tumpukan → aduk → gabung
- Alternatif: tabur berurutan tanpa campur

### Cabai per Musim

Produksi = TOTAL panen musim, produktivitas = TOTAL ÷ luas.

### Bagi Hasil

[50,50], [40,60], [30,70], penggarap ≥ 50%.

### Invoice Premium

Kode `INV-YYYYMMDD-XXXX`, 24 jam, transfer BCA → WA → approve.

### Order Toko

Kode `ORD-YYYYMMDD-XXXX`, approve → stok auto-kurang, input resi → dikirim, selesai → review.

### Review

Rating 1-5 + komentar, auto-update `rating_rata` + `total_review` via trigger.

### Badge Navbar

- Feedback Admin → badge unread count
- Invoice → badge pending count

---

## 📊 PROGRESS v4.1

### ✅ Selesai

**Fitur Utama:**
- Landing page premium (warna logo #2c5e2e + #f0b429, animasi scroll, blob, marquee, counter, glass morphism, Discord, sosmed)
- Manajemen penggarap, lahan, panen, hutang (bagi hasil otomatis, potong hutang otomatis)
- GPS Ukur Lahan — 2 mode: Jalan Keliling (Kalman filter) + Pilih di Peta (tap titik)
- Log Tanam — catatan aktivitas harian per lahan
- Kalkulator Pupuk — Standar + Presisi (v4.1)
- Admin Kelola Pupuk — CRUD pupuk + kandungan hara (v4.1)
- Gabah (multi sesi timbang)
- Panen Multi (padi, jagung, cabai, dll)
- Panen Cabai per Musim
- Keuangan, Grafik (per komoditas + harga), Laporan
- Export Excel / PDF / Backup
- Import Backup
- Pengaturan (akun, kategori)
- Bantuan, Feedback
- Demo Mode
- Premium via transfer bank (invoice, admin approve, riwayat, statistik revenue, cron)
- Katalog produk + Toko (checkout, ongkir 34 provinsi, admin pesanan, input resi, review & rating)
- Blog SEO
- GPS Selection + Log Tanam + Grafik Harga Komoditas (v4.1)
- Fix total invoice exclude expired + hapus semua expired (v4.1)
- Badge pending invoice di navbar (v4.1)

**Payment Gateway (hidden, backup):**
- Mayar (nunggu KYC)
- Midtrans (cadangan)

### ⏳ Belum

- Reset Client Secret Google OAuth (KEAMANAN)
- Notif Email (Resend/Mailgun)
- Fitur Referral
- Notif Hutang
- Mayar QRIS (nunggu KYC)
- Kurir otomatis RajaOngkir
- Shopping cart
- Mode Presisi Kalkulator Pupuk fase 2 (analisis tanah lengkap)

---

## 🚨 KNOWN ISSUES

1. 🔴 **Client Secret Google OAuth ekspos** `*****7Gb5` — belum dikonfirmasi disable
2. 🟡 Middleware deprecated → proxy (abaikan)
3. 🟡 Mayar KYC belum approve
4. 🟢 PDF penggarap — text extraction bug di viewer, visual rapi
5. 🟡 Import error di `/api/mayar/*` dan `/api/midtrans/*` — **sengaja dibiarkan** (backup, nunggu plan pembayaran selanjutnya)

---

## 🎯 NEXT FEATURE

**Tinggi:**
- Reset Google OAuth (5 menit)
- Notif Email (2-3 jam)
- Fitur Referral (4-6 jam)

**Sedang:**
- Notif Hutang
- Kurir RajaOngkir
- Blog SEO lanjutan

**Fase 2:**
- Mayar QRIS
- Shopping cart
- Payment alternatif
- Kalkulator presisi lanjutan

---

## 🔗 LINK PENTING

- **Repo:** https://github.com/harvestanid/harvestan
- **Live:** https://harvestan.vercel.app
- **Vercel:** https://vercel.com/harvestanid/harvestan
- **Supabase:** https://supabase.com/dashboard/project/qfggoqcdaiokfluewple
- **Google Cloud:** https://console.cloud.google.com/auth/clients?project=bubbly-stone-509704-g2
- **Discord:** https://discord.gg/v8RZbADBM

---

## 📋 CARA LANJUT DI CHAT BARU

```

Halo! Saya lanjut project Harvestan (SaaS pertanian Indonesia).

Konteks lengkap:
https://github.com/harvestanid/harvestan/blob/main/HANDOFF.md

Tolong baca dulu SEBELUM mulai, terutama bagian:

· KARAKTERISTIK USER (PENTING BANGET!)
· ATURAN TEKNIS
· ATURAN COMMAND
· LOGIC PENTING
· KNOWN ISSUES

Status: v4.1

ATURAN WAJIB (JANGAN DILANGGAR!):

1. SELALU FULL FILE — bukan potongan kode / "cari baris X"
2. JANGAN stop di tengah — file panjang kirim SEKALIGUS
3. JANGAN tanya-tanya kebanyakan — langsung kerja
4. Kalau saya bilang "GAS" → langsung eksekusi
5. Bahasa Indonesia, ringkas, to the point
6. Kasih wc -l sebagai patokan
7. pkill -9 node sebelum rm -rf .next
8. JANGAN nested <form>
9. JANGAN useSearchParams di page.tsx
10. Client Component dipisah file sendiri
11. Command Termux — MULTI-LINE, jangan && atau 1 baris panjang
12. Kalau langgar aturan → minta maaf singkat, langsung fix, JANGAN ngeyel

Yang mau dilanjutkan:
[TULIS DI SINI]

Mulai?

```

---

## 📈 STATISTIK PROJECT

- **~70+ halaman** Next.js
- **~50+ API routes**
- **~18 tabel** database + RLS
- **~40.000+ baris** kode TypeScript
- **~20 library** terintegrasi
- **3 dokumentasi:** CHANGELOG.md, HANDOFF.md (ini), PROJECT.md
- **Live di production**

---

**Status:** ✅ v4.1 — Kalkulator Pupuk + GPS Selection + Log Tanam + Grafik Harga
**Tanggal update:** 2026-10-01
**Dibuat dengan:** ❤️ + AI, dari nol, tanpa bisa coding 🇮🇩
```

wc -l: ~530 baris

---

Setelah paste:

```
pkill -9 node
```

```
rm -rf .next
```

```
npm run build
```

Test: pastikan build sukses (warning Mayar/Midtrans abaikan).

Lapor. 🌾
