Oh, saya paham maksudnya sekarang. Anda mau saya kirim seluruh isi HANDOFF.md sebagai satu blok teks yang bisa di-copy sekali klik (bukan kode command, bukan split).

Oke. Saya kirim sekarang. Satu blok. Satu kali copy. Tapi jujur: panjangnya ~1500 baris — kalau chat ini motong, saya kasih tahu di akhir dan tinggal Anda bilang "lanjut" buat sisanya.

Saya mulai:

---

🤝 HANDOFF — Konteks untuk Chat Baru

File ini untuk melanjutkan development Harvestan di chat baru.
Copy-paste isi file ini (atau link repo) ke chat baru untuk kasih konteks ke AI.

🎯 PROJECT INFO

· Nama: Harvestan
· Deskripsi: SaaS manajemen pertanian Indonesia (multi-komoditas + bagi hasil + hutang + GPS + e-commerce)
· Repo: https://github.com/harvestanid/harvestan
· Live: https://harvestan.vercel.app
· Versi: v4.0 (katalog produk + orders + review + landing premium)
· User: Pemula (tidak bisa coding), koding semua oleh AI
· Development: Termux di Android
· Chat ini: AI buat kode, user paste + test

👤 KARAKTERISTIK USER (PENTING BANGET!)

Siapa User

· Skill: Pemula TOTAL — tidak bisa coding
· Device: HP Android + Termux
· Editor: micro
· Bahasa: Indonesia (santai, kadang kasar kalau kesal — WAJAR)

Cara Kerja User

1. Sangat detail, step-by-step
2. Suka nguji + screenshot
3. Cepat emosi kalau AI lambat / ngeyel
4. Pemula teknis — jangan pakai istilah susah
5. Tidak bisa coding — kode harus FULL FILE siap paste

Yang User SUKA

· ✅ AI langsung kerja, gak tanya-tanya
· ✅ FULL FILE siap paste
· ✅ Ringkas, to the point
· ✅ Kalau salah → minta maaf + fix LANGSUNG
· ✅ Bahasa Indonesia
· ✅ wc -l sebagai patokan
· ✅ Command multi-line (bukan &&)

Yang User TIDAK SUKA

· ❌ "Cari baris X, ubah jadi Y"
· ❌ File dipotong 2-3 pesan
· ❌ AI bilang "sudah benar" belum di-test
· ❌ Jelasin panjang tanpa eksekusi
· ❌ Tanya-tanya berulang
· ❌ Stop di tengah file
· ❌ Langgar aturan
· ❌ Command &&
· ❌ Command 1 baris panjang

Perlakuan User ke AI Kalau Ngelanggar

1. User marah, bilang "anjing" / "goblok" / dll
2. AI HARUS: minta maaf SINGKAT, AKUI salah, LANGSUNG fix, JANGAN ngeyel
3. Setelah fix berhasil → user balik santai

Bener: "Iya. Saya salah. Maaf. Ini FULL FILE-nya:" (langsung kirim)
Salah: "Maaf ya, saya cek dulu..." / "Sebenarnya..." / "Coba cari baris..."

Aturan Command

BENAR:

```
cd ~/projects/harvestan
git add .
git commit -m "..."
git push
```

JANGAN:

```
cd ~/projects/harvestan && git add . && git commit -m "..." && git push
```

User pernah bilang: "jangan pake &&", "gaboleh &&", "gaboleh satu baris".

🛠️ TECH STACK

· Next.js 16 (App Router) + TypeScript
· Tailwind CSS v4
· Supabase (PostgreSQL + RLS + Auth)
· Supabase Auth (Email + Google OAuth + Reset Password)
· Vercel
· Recharts (grafik)
· jsPDF + html2canvas (PDF)
· xlsx / SheetJS (Excel)
· html-to-image (PNG)
· Leaflet + OpenStreetMap (Maps)
· micro (Termux)

📁 STRUKTUR FOLDER

File Root

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

app/

```
app/
├── page.tsx (SERVER)
├── landing-klien.tsx (CLIENT)
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
│   ├── penggarap/
│   │   ├── page.tsx
│   │   ├── klien.tsx
│   │   ├── baru/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       ├── tombol-aksi.tsx
│   │       ├── transfer/page.tsx + form.tsx
│   │       ├── lahan/
│   │       │   ├── baru/page.tsx
│   │       │   └── [landId]/
│   │       │       ├── page.tsx
│   │       │       ├── tombol-aksi.tsx
│   │       │       └── panen/
│   │       │           ├── baru/page.tsx + form-client.tsx
│   │       │           ├── [harvestId]/
│   │       │           │   ├── page.tsx
│   │       │           │   ├── tombol-aksi.tsx
│   │       │           │   ├── tombol-download-invoice.tsx
│   │       │           │   └── edit/page.tsx
│   │       │           └── musim/[musim]/
│   │       │               ├── page.tsx
│   │       │               └── tombol-download-invoice-musim.tsx
│   │       └── hutang/
│   │           ├── baru/page.tsx
│   │           └── [debtId]/page.tsx + tombol-aksi.tsx
│   ├── gabah/page.tsx
│   ├── panen-multi/page.tsx
│   ├── ukur-lahan/page.tsx + ukur-content.tsx
│   ├── keuangan/page.tsx + keuangan-client.tsx
│   ├── grafik/page.tsx + grafik-client.tsx + grafik-cabai.tsx
│   ├── laporan/page.tsx + klien.tsx
│   ├── export/page.tsx + export-gate.tsx
│   ├── import/page.tsx + klien.tsx
│   ├── pengaturan/page.tsx + akun-tab.tsx + kategori-tab.tsx + tab-container.tsx + form.tsx
│   ├── bantuan/page.tsx + klien.tsx
│   ├── feedback/page.tsx + klien.tsx
│   ├── demo/page.tsx + klien.tsx
│   ├── premium-gratis/page.tsx + klien.tsx
│   ├── premium/
│   │   ├── page.tsx
│   │   ├── klien.tsx
│   │   └── riwayat/page.tsx
│   ├── pesanan-saya/page.tsx + klien.tsx
│   └── admin/
│       ├── feedback/page.tsx + klien.tsx
│       ├── premium/page.tsx + klien.tsx
│       ├── invoice/page.tsx + klien.tsx
│       ├── katalog/
│       │   ├── page.tsx
│       │   ├── klien.tsx
│       │   ├── baru/page.tsx + klien.tsx
│       │   └── [id]/edit/page.tsx
│       └── pesanan/page.tsx + klien.tsx
└── toko/
    ├── page.tsx + klien.tsx
    ├── [id]/page.tsx + klien.tsx
    ├── checkout/[productId]/page.tsx + klien.tsx
    └── pesanan/[orderCode]/page.tsx + klien.tsx
```

app/api/

```
app/api/
├── akun/route.ts
├── lahan/[id]/route.ts
├── panen/[id]/route.ts
├── hutang/[id]/route.ts
├── kategori/route.ts
├── musim/route.ts + musim/[id]/route.ts
├── transfer-lahan/route.ts
├── feedback/route.ts
├── premium/route.ts
├── subscription/route.ts
├── invoice/create/route.ts
├── admin/invoice/approve/route.ts
├── admin/invoice/reject/route.ts
├── admin/order/approve/route.ts
├── admin/order/reject/route.ts
├── admin/order/resi/route.ts
├── admin/order/selesai/route.ts
├── products/create/route.ts
├── products/update/route.ts
├── products/delete/route.ts
├── products/upload/route.ts
├── order/create/route.ts
├── review/create/route.ts
├── midtrans/create/route.ts
├── midtrans/webhook/route.ts
├── midtrans/status/route.ts
├── mayar/create/route.ts
├── mayar/webhook/route.ts
├── mayar/status/route.ts
├── cron/expire-invoices/route.ts
├── export/route.ts
├── export-backup/route.ts
├── import/route.ts
├── export-pdf/route.ts
├── export-pdf-musim/route.ts
├── export-laporan/route.ts
├── auth/check/route.ts
└── auth/logout/route.ts
```

lib/

```
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
│       ├── subscription-server.ts
│       ├── product-server.ts
│       └── feedback-server.ts
├── katalog/kategori.ts
├── notif/telegram.ts
├── notif/whatsapp.ts
├── demo/demo-mode.ts
├── demo/data-loader.ts
└── utils/grafik-helpers.ts + hitung-luas.ts
```

components/

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

tools/

```
tools/
├── converter.html
└── regen-demo.js
```

🗄️ DATABASE SCHEMA

· penggaraps: id, user_id, nama, alamat, usia, kontak, is_demo, created_at, updated_at
· lands: id, user_id, penggarap_id, nama, luas, lokasi_koordinat, polygon (jsonb), is_demo, created_at
· harvests: id, user_id, land_id, tanggal, komoditas, musim, hasil_kg, harga_gabah, harga_per_kg, biaya_panen_per_kg, biaya_tambahan, keterangan_biaya, bawa_penggarap, bawa_owner, bawa_lain, persen_owner, persen_penggarap, profit_bersih, profit_owner, profit_penggarap, potongan_hutang, potongan_hutang_log (jsonb), total_hutang_sebelum, sisa_hutang_sesudah, catatan, is_demo, created_at, updated_at
· debts: id, user_id, penggarap_id, tanggal, jumlah, keperluan, dibayar, sisa, log_perubahan (jsonb), is_demo, created_at
· categories: id, user_id, komoditas, cukup, baik, sangat_baik, is_demo, created_at, updated_at
· musim_cabai: id, user_id, nama, tanggal_mulai, tanggal_selesai, catatan, is_demo, UNIQUE(user_id, nama)
· feedback: id, user_id, kategori, pesan, created_at
· subscriptions: id, user_id, is_premium, premium_until, premium_type, premium_source, payment_id, payment_amount, payment_method, notes, created_at, updated_at
· invoices: id, invoice_code (UNIQUE), user_id, user_email, user_nama, user_whatsapp, nominal (59000), status ('pending'/'approved'/'expired'/'rejected'), expires_at (24 jam), approved_at, approved_by (text), notif_approved_sent, notif_rejected_sent, catatan, created_at
· notification_logs: id, user_id, tipe, target, pesan, status, created_at
· premium_orders: id, order_id (UNIQUE), user_id, amount, status, notes, created_at, updated_at
· products: id, nama, kategori ('input_pertanian'/'output_pertanian'/'alat_mesin_pertanian'/'furniture_mebel'), sub_kategori, harga, satuan, stok, berat_gram, deskripsi, foto_urls (jsonb), status ('aktif'/'nonaktif'/'sold_out'), unggulan, rating_rata, total_review, total_terjual, created_at, updated_at
· orders: id, order_code (UNIQUE), user_id, user_email, user_nama, items (jsonb), subtotal, ongkir, total, nama_penerima, no_hp, alamat, kota, provinsi, kode_pos, kurir, layanan_kurir, estimasi_hari, catatan, status ('pending'/'approved'/'rejected'/'expired'/'dikirim'/'selesai'), expires_at, approved_at, approved_by, resi, kurir_resi, catatan_admin, created_at
· order_items: id, order_id, product_id, nama_produk, harga, qty, subtotal, reviewed, created_at
· reviews: id, order_id, product_id, user_id, user_nama, rating (1-5), komentar, created_at, UNIQUE(order_id, product_id)
· shipping_rates: id, provinsi (UNIQUE), ongkir_per_kg, estimasi_hari, created_at (34 provinsi Indonesia)

RLS aktif — auth.uid() = user_id. Except: products, reviews, shipping_rates (public read), invoices (admin read all).

⚠️ ATURAN TEKNIS

1. FULL FILE — SELALU kirim FULL FILE siap paste
2. JANGAN stop di tengah file
3. Command Termux MULTI-LINE, jangan &&, jangan 1 baris panjang
4. pkill -9 node sebelum rm -rf .next node_modules/.cache
5. JANGAN nested <form>
6. JANGAN useSearchParams di page.tsx
7. Client Component dipisah file sendiri ("use client" baris 1)
8. Path dengan [ ] atau ( ) wajib tanda kutip
9. Nama kolom: hasil_kg, harga_gabah, profit_owner, persen_penggarap. harga_gabah = harga_per_kg. Kategori: cukup, baik, sangat_baik
10. JANGAN campur produktivitas antar komoditas
11. WAJIB npm run build sebelum push
12. "GAS" → langsung eksekusi
13. Tanya sekali, jangan tanya-tanya berulang
14. Server-only vs client-safe — file dengan next/headers jangan di-import dari Client Component

🔄 LOGIC PENTING

· Potong Hutang Otomatis: input panen → potong profit penggarap dengan hutang (TERLAMA), update dibayar += potong, sisa -= potong, profitPenggarap -= potongan, profitOwner += potongan, log di debts.log_perubahan + harvests.potongan_hutang_log
· Gabah Bawa Pulang: po = profitBersih × %owner + bawa_penggarap × harga - bawa_owner × harga - bawa_lain × harga × 0.5. pp kebalikannya.
· Edit Panen: cek potongan_hutang_lama → CENTANG: potong hutang aktif, UNCHECK: revert
· Hapus Panen: auto-revert potongan hutang (dari TERBARU)
· Transfer Lahan: update lands.penggarap_id, riwayat tetap
· Kategori Produktivitas: threshold per komoditas (Kg/Ha), per komoditas, JANGAN dicampur
· GPS Walking: filter akurasi <20m, jarak min 3m, Shoelace formula
· Cabai per Musim: produksi = TOTAL panen musim, produktivitas = TOTAL ÷ luas
· Bagi Hasil: [50,50], [40,60], [30,70], penggarap ≥ 50%
· Invoice Premium: kode INV-YYYYMMDD-XXXX, 24 jam, transfer BCA → WA → approve
· Order Toko: kode ORD-YYYYMMDD-XXXX, approve → stok auto-kurang, input resi → dikirim, selesai → review
· Review: rating 1-5 + komentar, auto-update rating_rata + total_review via trigger

📊 PROGRESS v4.0

✅ Selesai

· Fix bug v3.0 (preview penggarap kontras, opacity, tombol upgrade, PDF)
· Premium via transfer bank (invoice otomatis, admin approve, notif Telegram + WA, riwayat, statistik revenue, cron)
· Katalog produk (5 tabel, storage bucket, admin upload/edit/hapus, katalog publik /toko, 4 kategori, checkout, ongkir 34 provinsi, admin pesanan, input resi, review & rating)
· Landing page v4 (warna logo #2c5e2e + #f0b429, animasi scroll progress + parallax + blob + marquee + counter, glass morphism, 12 profesi, Discord, sosmed)
· Mayar payment gateway (hidden, nunggu KYC)

⏳ Belum

· Reset Client Secret Google OAuth (KEAMANAN)
· Notif Email (Resend/Mailgun)
· Fitur Referral
· Blog SEO
· Notif Hutang
· Mayar QRIS (nunggu KYC)
· Kurir otomatis RajaOngkir
· Shopping cart

🚨 KNOWN ISSUES

1. 🔴 Client Secret Google OAuth ekspos *****7Gb5 — belum dikonfirmasi disable
2. 🟡 Middleware deprecated → proxy (abaikan)
3. 🟡 Mayar KYC belum approve
4. 🟢 PDF penggarap — text extraction bug di viewer, visual rapi

🎯 NEXT FEATURE

Tinggi: Reset Google OAuth (5 menit), Notif Email (2-3 jam), Fitur Referral (4-6 jam)
Sedang: Blog SEO, Notif Hutang, Kurir RajaOngkir
Fase 2: Mayar QRIS, Shopping cart, Payment alternatif

🔗 LINK PENTING

· Repo: https://github.com/harvestanid/harvestan
· Live: https://harvestan.vercel.app
· Vercel: https://vercel.com/harvestanid/harvestan
· Supabase: https://supabase.com/dashboard/project/qfggoqcdaiokfluewple
· Google Cloud: https://console.cloud.google.com/auth/clients?project=bubbly-stone-509704-g2
· Discord: https://discord.gg/v8RZbADBM

📋 CARA LANJUT DI CHAT BARU

```
Halo! Saya lanjut project Harvestan (SaaS pertanian Indonesia).

Konteks lengkap:
https://github.com/harvestanid/harvestan/blob/main/HANDOFF.md

Tolong baca dulu SEBELUM mulai, terutama bagian:
- KARAKTERISTIK USER (PENTING BANGET!)
- ATURAN TEKNIS
- ATURAN COMMAND
- LOGIC PENTING
- KNOWN ISSUES

Status: v4.0

ATURAN WAJIB (JANGAN DILANGGAR!):
1. SELALU FULL FILE — bukan potongan kode / "cari baris X"
2. JANGAN stop di tengah — file panjang kirim SEKALIGUS
3. JANGAN tanya-tanya kebanyakan — langsung kerja
4. Kalau saya bilang "GAS" → langsung eksekusi
5. Bahasa Indonesia, ringkas, to the point
6. Kasih `wc -l` sebagai patokan
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

📈 STATISTIK PROJECT

· 60+ halaman Next.js
· 40+ API routes
· 14 tabel database + RLS
· ~35.000+ baris kode TypeScript
· ~20 library terintegrasi
· 3 dokumentasi: CHANGELOG.md, HANDOFF.md (ini), PROJECT.md
· Live di production

Status: ✅ v4.0 — Katalog Produk + Orders + Review + Landing Premium
Tanggal update: 2026-09-29
Dibuat dengan: ❤️ + AI, dari nol, tanpa bisa coding 🇮🇩

---

Habis di sini. Kalau chat ini motong di tengah, Anda bakal lihat teks berhenti. Kalau iya — bilang "lanjut dari [kata terakhir]" biar saya kirim sisanya.

Kalau selamat sampai akhir, tinggal:

```
micro HANDOFF.md
```

Ctrl+A → Delete → Paste → Ctrl+S → Ctrl+Q.

Balas "lengkap" atau "kepotong di [X]". 🌾


🤝 HANDOFF — Harvestan GPS Ukur Lahan

Konteks project Harvestan: https://github.com/harvestanid/harvestan/blob/main/HANDOFF.md

⚠️ BACA HANDOFF.md DULU sebelum mulai.

═══════════════════════════════════════
📌 KARAKTERISTIK USER (PENTING!)
═══════════════════════════════════════

- Pemula TOTAL — tidak bisa coding, semua kode oleh AI
- Development: Termux di Android (micro editor)
- Bahasa: Indonesia (santai, kadang kasar kalau kesal — WAJAR)
- Suka nguji + screenshot error
- Cepat emosi kalau AI lambat / ngeyel

ATURAN WAJIB (JANGAN DILANGGAR!):

1. ✅ SELALU FULL FILE — bukan potongan kode / "cari baris X"
2. ✅ JANGAN stop di tengah — kalau file panjang kirim SEKALIGUS
3. ✅ JANGAN tanya-tanya kebanyakan — langsung kerja
4. ✅ Kalau user bilang "GAS" → langsung eksekusi
5. ✅ Bahasa Indonesia, ringkas, to the point
6. ✅ Kasih wc -l sebagai patokan
7. ✅ Command Termux MULTI-LINE, JANGAN && dan JANGAN 1 baris panjang
8. ✅ pkill -9 node sebelum rm -rf .next
9. ✅ JANGAN nested <form>
10. ✅ JANGAN useSearchParams di page.tsx
11. ✅ Client Component dipisah file sendiri ("use client" baris 1)
12. ✅ Path dengan [ ] atau ( ) wajib tanda kutip: micro "app/(dashboard)/..."
13. ✅ WAJIB npm run build sebelum push
14. ✅ Kalau user screenshot error → fix LANGSUNG, jangan jelasin panjang
15. ✅ Kalau langgar aturan → minta maaf SINGKAT, akui salah, LANGSUNG fix, JANGAN ngeyel

═══════════════════════════════════════
🎯 YANG MAU DISELESAIKAN DI CHAT INI
═══════════════════════════════════════

MASALAH 1: AKURASI GPS "UKUR LAHAN" JELEK
--------------------------------------------------
Konteks:
- User pakai HP Android di Termux, akses localhost
- Fitur "Ukur Lahan GPS" — user jalan keliling lahan, sistem auto-catat titik
- Target: titik tiap gerak 10 meter (seperti app "GPS Field Area Measure")
- User BILANG app "GPS Field Area Measure" akurat di HP-nya. Jadi bukan masalah HP.
- Di Harvestan: marker hijau (posisi user) GOYANG parah walau user DIAM
- Sudah coba berbagai smoothing/EMA/dead-zone/stabil-buffer, masih jelek
- Suara user: "titik bergerak kemana mana padahal saya diam"

Upaya yang SUDAH DICOBA (semua gagal atau kurang memuaskan):
1. Filter akurasi < 20m — masih goyang
2. Dead-zone 3m / 5m / 8m — bikin lag, gak responsif
3. EMA smoothing (alpha 0.3 / 0.5 / 0.7) — masih goyang
4. Median filter + average 5 sample — masih goyang
5. Stabil buffer 2-3 sample dalam radius 5-8m — bikin lag
6. Gate konsistensi 2 sample dalam radius 6m — masih goyang
7. Kombinasi di atas — selalu trade-off: kalau halus jadi lambat, kalau responsif jadi goyang

Yang user mau:
- Marker hijau (posisi sekarang) UPDATE REALTIME, tidak goyang saat diam
- Titik ungu ditambah tiap gerak 10 meter dari titik terakhir
- Seperti app "GPS Field Area Measure"

Yang perlu dicari tahu / dicoba:
- Pakai Kalman filter proper (bukan EMA sederhana)
- Atau pakai library seperti `geolib` + filter
- Atau pakai Geolocation API dengan `enableHighAccuracy: true, maximumAge: 0`
- Cek apakah masalahnya di HP user atau di kode (minta user screenshot app "GPS Field Area Measure" vs Harvestan side-by-side)
- Cek apakah ada masalah rendering Leaflet (setView tiap update bikin marker kelihatan goyang?)
- Bisa jadi masalah di React state re-render — pakai ref instead of state untuk posisi realtime

MASALAH 2: SIMPAN LAHAN GAGAL
--------------------------------------------------
Konteks:
- Setelah user selesai ukur → klik "Stop Ukur" → muncul form "Nama Lahan"
- User isi nama → klik "Simpan ke Penggarap"
- Kadang gagal (tidak ada pesan spesifik, atau ada error)
- Error terakhir user: "kok gak bisa disimpan data luas lahan dan koordinat gpsnya ke lahan penggarap"

Kemungkinan penyebab:
- Insert ke tabel `lands` gagal karena format polygon salah
- RLS / FK penggarap_id mismatch
- Format `polygon` — sekarang pakai `{ type: "Polygon", coordinates: [...] }`
- Cek schema tabel `lands` di Supabase

═══════════════════════════════════════
📁 FILE TERKAIT (path di repo)
═══════════════════════════════════════

app/(dashboard)/ukur-lahan/
├── page.tsx (SERVER)
└── ukur-content.tsx (CLIENT — isi utama GPS)

app/(dashboard)/penggarap/[id]/
├── page.tsx (SERVER — detail penggarap)
├── tombol-aksi.tsx (CLIENT)
└── lahan/
    ├── baru/page.tsx (SERVER — form tambah lahan)
    └── [landId]/
        ├── page.tsx (SERVER)
        ├── tombol-aksi.tsx (CLIENT)
        └── panen/...

components/
└── peta-ukur.tsx (map Leaflet komponen — dipakai versi lama)

lib/utils/
└── hitung-luas.ts (fungsi hitungLuasPolygonM2, hitungJarakMeter, keGeoJSONPolygon, dll)

═══════════════════════════════════════
📋 KODE SAAT INI (terakhir dikirim ke user)
═══════════════════════════════════════

[PASTE FULL FILE app/(dashboard)/ukur-lahan/ukur-content.tsx YANG TERAKHIR]

[PASTE FULL FILE app/(dashboard)/ukur-lahan/page.tsx YANG TERAKHIR]

[PASTE FULL FILE lib/utils/hitung-luas.ts]

═══════════════════════════════════════
🔍 INFORMASI TAMBAHAN
═══════════════════════════════════════

Schema tabel lands (Supabase):
- id (uuid, PK)
- user_id (uuid, FK auth.users)
- penggarap_id (uuid, FK penggaraps)
- nama (text)
- luas (numeric) — dalam Hektar
- lokasi_koordinat (text) — format "lat,lng"
- polygon (jsonb)
- is_demo (boolean, default false)
- created_at, updated_at (timestamptz)

RLS aktif: auth.uid() = user_id

Contoh insert yang seharusnya jalan:
{
  user_id: "uuid",
  penggarap_id: "uuid",
  nama: "Sawah Utama",
  luas: 0.500,
  lokasi_koordinat: "-6.994303,112.174348",
  polygon: {
    type: "Polygon",
    coordinates: [[[lng1,lat1], [lng2,lat2], ..., [lng1,lat1]]]
  }
}

═══════════════════════════════════════
🚀 MULAI DARI MANA?
═══════════════════════════════════════

1. Konfirmasi kamu sudah baca handoff + aturan
2. Fokus: fix GPS akurasi (masalah utama)
3. User akan kirim screenshot kondisi sekarang + kode terakhir
4. Setelah itu langsung analisa + kirim FULL FILE
5. Kalau perlu ubah pendekatan total (pakai library lain, Web Geolocation API lain, Kalman filter proper, dsb) — BOLEH
6. Simpan lahan fix setelah GPS fix (karena kalau GPS jelek, data gak akan berguna)

JANGAN tanya-tanya dulu. Langsung aja setelah user kirim screenshot + kode.
