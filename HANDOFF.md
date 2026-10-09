Oke, HANDOFF lo udah ada tapi belum update versi terbaru (v4.1). Sekarang udah ada banyak fitur baru yang belum masuk. Ini FULL FILE HANDOFF.md versi baru (v4.2) — udah ditambah semua fitur terbaru.

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
- **Deskripsi:** SaaS manajemen pertanian Indonesia (multi-komoditas + bagi hasil + hutang + GPS + e-commerce + kalkulator pupuk + AI agents)
- **Repo:** https://github.com/harvestanid/harvestan
- **Live:** https://harvestan.vercel.app
- **Versi:** v4.2 (AI agents + postcard polygon + hapus massal)
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
- react-markdown + remark-gfm (render markdown)
- Vercel AI SDK (`ai`, `@ai-sdk/groq`) — AI agents
- Groq (`openai/gpt-oss-120b`) — LLM
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
│   │   ├── page.tsx (terima ?edit=landId)
│   │   ├── ukur-content.tsx (CLIENT - GPS walking + edit mode)
│   │   └── peta-pilih.tsx (CLIENT - pilih titik di peta + edit mode)
│   ├── log-tanam/...
│   ├── kalkulator/...
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
│       ├── pupuk/page.tsx + klien.tsx
│       ├── agents/ (BARU v4.2)
│       │   ├── page.tsx
│       │   └── klien.tsx
│       └── blog/...
├── blog/...
└── toko/...

```

### app/api/

```

app/api/
├── akun/delete/route.ts
├── lahan/route.ts + [id]/route.ts
├── panen/route.ts + [id]/route.ts
├── panen/delete-bulk/route.ts (BARU v4.2 - hapus massal + revert hutang)
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
├── admin/pupuk/route.ts
├── agents/run/route.ts (BARU v4.2 - orchestrator)
├── agents/log/route.ts (BARU v4.2 - get + delete log)
├── agents/generate-image/route.ts (BARU v4.2 - Pollinations AI)
├── products/create/route.ts
├── products/update/route.ts
├── products/delete/route.ts
├── products/upload/route.ts
├── order/create/route.ts
├── review/create/route.ts
├── midtrans/* (backup)
├── mayar/* (backup)
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
│   ├── admin.ts (SERVICE ROLE)
│   └── queries/...
├── agents/ (BARU v4.2)
│   ├── context.ts (model bisnis Harvestan)
│   ├── orchestrator.ts (otak utama)
│   ├── agents/
│   │   ├── content-creator.ts
│   │   ├── marketing.ts
│   │   ├── idea-innovator.ts
│   │   ├── social-media.ts
│   │   └── image-creator.ts
│   └── tools/
│       ├── image-gen.ts
│       └── parse-image-prompts.ts
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
├── upgrade-modal.tsx
├── tipe-garap-picker.tsx
├── badge-tipe-garap.tsx
├── postcard-panen.tsx (BARU v4.2 - 8 style + polygon overlay)
├── share-panen-modal.tsx (BARU v4.2)
├── tombol-share-panen.tsx (BARU v4.2)
└── riwayat-panen.tsx (BARU v4.2 - select + hapus massal)

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
- **lands:** id, user_id, penggarap_id, nama, luas, lokasi_koordinat, polygon (jsonb), is_demo, tipe_garap ('mandiri'/'bagi_hasil_owner'/'bagi_hasil_penggarap'), nama_owner_external, persen_owner_default, persen_penggarap_default, created_at, updated_at
- **harvests:** id, user_id, land_id, tanggal, komoditas, musim, hasil_kg, harga_gabah, harga_per_kg, biaya_panen_per_kg, biaya_tambahan, keterangan_biaya, bawa_penggarap, bawa_owner, bawa_lain, persen_owner, persen_penggarap, profit_bersih, profit_owner, profit_penggarap, potongan_hutang, potongan_hutang_log (jsonb), total_hutang_sebelum, sisa_hutang_sesudah, catatan, is_demo, created_at, updated_at
- **debts:** id, user_id, penggarap_id, tanggal, jumlah, keperluan, dibayar, sisa, log_perubahan (jsonb), is_demo, created_at
- **categories:** id, user_id, komoditas, cukup, baik, sangat_baik, is_demo, created_at, updated_at
- **musim_cabai:** id, user_id, nama, tanggal_mulai, tanggal_selesai, catatan, is_demo, UNIQUE(user_id, nama)
- **activity_logs:** id, user_id, land_id, tanggal, jenis, catatan, foto_urls (jsonb), is_demo, created_at, updated_at
- **activity_jenis_custom:** id, user_id, nama, created_at
- **demo_sessions:** user_id, is_active, started_at, expires_at, last_restart_at, total_restarts

### Tabel Premium & Invoice

- **feedback:** id, user_id, kategori, pesan, created_at
- **subscriptions:** id, user_id, is_premium, premium_until, premium_type, premium_source, payment_id, payment_amount, payment_method, notes, created_at, updated_at
- **invoices:** id, invoice_code (UNIQUE), user_id, user_email, user_nama, user_whatsapp, nominal (59000), status ('pending'/'approved'/'expired'/'rejected'), expires_at (24 jam), approved_at, approved_by, notif_approved_sent, notif_rejected_sent, catatan, is_testing, created_at
- **notification_logs:** id, user_id, tipe, target, pesan, status, created_at
- **premium_orders:** id, order_id (UNIQUE), user_id, amount, status, notes, created_at, updated_at

### Tabel Toko (Katalog)

- **products:** id, nama, kategori, sub_kategori, harga, satuan, stok, berat_gram, deskripsi, foto_urls (jsonb), status, unggulan, rating_rata, total_review, total_terjual, created_at, updated_at
- **orders:** id, order_code (UNIQUE), user_id, user_email, user_nama, items (jsonb), subtotal, ongkir, total, nama_penerima, no_hp, alamat, kota, provinsi, kode_pos, kurir, layanan_kurir, estimasi_hari, catatan, status, expires_at, approved_at, approved_by, resi, kurir_resi, catatan_admin, created_at
- **order_items:** id, order_id, product_id, nama_produk, harga, qty, subtotal, reviewed, created_at
- **reviews:** id, order_id, product_id, user_id, user_nama, rating (1-5), komentar, created_at, UNIQUE(order_id, product_id)
- **shipping_rates:** id, provinsi (UNIQUE), ongkir_per_kg, estimasi_hari, created_at

### Tabel Kalkulator Pupuk

- **fertilizers:** id, nama, merk, jenis ('subsidi'/'non_subsidi'/'organik'), n_persen, p_persen, k_persen, unsur_lain, kemasan_kg, is_active, urutan, created_at, updated_at

### Tabel Blog

- **blog_posts:** id, slug (UNIQUE), judul, excerpt, konten (markdown), cover_url, kategori, tags (jsonb), status, meta_title, meta_description, view_count, created_at, updated_at, published_at

### Tabel AI Agents (BARU v4.2)

- **agent_logs:** id, user_id, perintah, rencana, hasil (jsonb), mode ('normal'/'refine'), feedback, created_at, updated_at

### RLS

RLS aktif — `auth.uid() = user_id`. Except:
- `products`, `reviews`, `shipping_rates`, `blog_posts` (public read)
- `fertilizers` (public read, admin write via service role)
- `invoices` (admin read all)
- `agent_logs` (user hanya akses miliknya)

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
14. Server-only vs client-safe
15. Pakai `createAdminClient` (service role) untuk operasi admin
16. **Command Termux dalam 1 blok** — jangan dipisah-pisah per baris jadi banyak blok

---

## 🔄 LOGIC PENTING

### Potong Hutang Otomatis

Input panen → potong profit penggarap dengan hutang (TERLAMA), update `dibayar += potong`, `sisa -= potong`, `profitPenggarap -= potongan`, `profitOwner += potongan`, log di `debts.log_perubahan` + `harvests.potongan_hutang_log`.

### Hapus Panen (single & bulk)

Auto-revert potongan hutang:
- Ambil `potongan_hutang_log` dari harvest
- Untuk setiap `debt_id`, tambah `sisa += jumlah`, kurangi `dibayar -= jumlah`
- Hapus entry di `debts.log_perubahan` yang `aksi: "potong_panen"` dengan `jumlah` sama
- Bulk: loop semua harvest ID, revert satu-satu, baru delete

### Gabah Bawa Pulang

```

po = profitBersih × %owner + bawa_penggarap × harga - bawa_owner × harga - bawa_lain × harga × 0.5
pp = kebalikannya

```

### Edit Panen

Cek `potongan_hutang_lama` → CENTANG: potong hutang aktif, UNCHECK: revert.

### Transfer Lahan

Update `lands.penggarap_id`, riwayat tetap.

### Kategori Produktivitas

Threshold per komoditas (Kg/Ha), per komoditas, JANGAN dicampur.

### GPS Walking (ukur-lahan mode 1)

- Kalman filter 1D (state posisi + kecepatan)
- Filter akurasi > 40m ditahan
- Anti-glitch: loncatan > 40m diabaikan
- Titik ungu tiap gerak ≥ 10m
- Tunggu 3 fix stabil
- Pakai `ref` bukan `state`

### GPS Selection (ukur-lahan mode 2)

- Tab switcher: "Jalan Keliling" vs "Pilih di Peta"
- Tap peta (Leaflet + Esri World Imagery)
- Shoelace formula
- Simpan ke `lands`

### Mode Edit Lahan (v4.2)

- Dari halaman edit lahan → tombol "📍 Ukur Ulang GPS" → `/ukur-lahan?edit={landId}`
- Di ukur-lahan, judul ganti "Ukur Ulang Lahan", penggarap terkunci
- Setelah ukur → tombol "💾 Update Lahan Ini" → konfirmasi "UPDATE"
- UPDATE `lands`: luas, lokasi_koordinat, polygon (bukan INSERT)

### Log Tanam

- Catat aktivitas harian
- Jenis custom (tabel `activity_jenis_custom`)
- Foto opsional

### Kalkulator Pupuk

**2 Mode:**
1. **Standar** — dosis anjuran Kementan/Balitbangtan
2. **Presisi** — input analisis tanah, koreksi dosis otomatis

**Kebutuhan hara per komoditas (kg/ha):**
| Komoditas | N | P₂O₅ | K₂O | Benih |
|-----------|---|------|-----|-------|
| Padi | 120 | 60 | 60 | 25-40 kg |
| Jagung | 150 | 75 | 75 | 20-25 kg |
| Cabai | 150 | 100 | 100 | 0.5-1 kg |
| Bawang Merah | 120 | 90 | 75 | 800-1.200 kg umbi |

**Dosis Dolomit:** interpolasi pH (pH 4.0 = 10 t/ha → pH 6.0 = 0.75 t/ha).

**Dosis Organik:** 2 t/ha.

**Mode Pemupukan:** Split (N=3x, K=2x, P=1x, NPK=2x), 1x Apply, Custom.

**Pengurangan Pupuk Kimia:** 25% atau 50% kalau pakai organik.

**Incremental Mixing:** bagi pupuk terbanyak jadi 2-5 tumpukan, campur satu-satu, gabung.

### Postcard Panen (v4.2)

- 8 style: harvestanPro, editorialCream, boldPop, polaroid, fullPhoto, **satelitCard** (baru), neonModern, earthTone
- Style **satelitCard**: full background satelit + polygon overlay (warna `#10b981` cerah + border putih)
- Polygon overlay pakai **crop scaling** untuk objectFit: cover
- Generate satelit: fetch tile Esri World Imagery (1024×1024) + hitung zoom auto-fit
- **Share ke IG Story**: Web Share API (`navigator.share` dengan file), fallback download PNG

### AI Agents (v4.2)

**5 agent:**
1. **content-creator** — caption, script, blog
2. **marketing-strategist** — strategi kampanye, analisis target
3. **idea-innovator** — brainstorming ide fitur
4. **social-media-manager** — content calendar, jadwal
5. **image-creator** — prompt gambar AI + generate gambar

**Orchestrator:**
- Terima perintah user
- Tentukan agent mana yang jalan (pakai LLM Groq)
- Multi-chain: agent berikutnya terima hasil agent sebelumnya
- Output: JSON `{agents: [...], alasan: "..."}`

**Mode:**
- `normal` — fresh generate
- `refine` — revisi hasil dengan feedback user

**Log:**
- Tabel `agent_logs`
- Simpan perintah, rencana, hasil, mode, feedback
- Bisa hapus log

**Image Generation:**
- Provider: **Pollinations AI** (`image.pollinations.ai`)
- Fallback 3 model: `turbo`, `flux`, `sana`/`kontext`
- Optional `POLLINATIONS_API_KEY` (untuk hilangkan rate limit)
- Status: kena HTTP 402 (butuh credit) — perlu daftar Seed tier gratis

**Groq LLM:**
- Model: `openai/gpt-oss-120b`
- Env: `GROQ_API_KEY`

**Context (`lib/agents/context.ts`):**
- Model bisnis Harvestan
- Target user (pemilik lahan >0,5 Ha, gapoktan, dinas)
- Revenue (premium Rp 59.000, Toko, affiliate)
- Value proposition (bagi hasil otomatis, GPS, grafik, postcard, dll)
- Tone of voice brand
- Aturan output: HANYA markdown, JANGAN HTML tag (`<br>` dll)

---

## 📊 PROGRESS v4.2

### ✅ Selesai

**Fitur Utama:**
- Landing page premium
- Manajemen penggarap, lahan, panen, hutang
- GPS Ukur Lahan — 2 mode (Jalan Keliling + Pilih di Peta)
- **Mode Edit Lahan** — ukur ulang via GPS dari halaman edit (v4.2)
- Log Tanam
- Kalkulator Pupuk — Standar + Presisi
- Admin Kelola Pupuk
- Gabah, Panen Multi, Panen Cabai per Musim
- Keuangan, Grafik (per komoditas + harga), Laporan
- Export Excel / PDF / Backup, Import
- Pengaturan, Bantuan, Feedback
- Demo Mode
- Premium via transfer bank
- Katalog produk + Toko
- Blog SEO
- **Postcard Panen** — 8 style, polygon overlay, share IG (v4.2)
- **Riwayat Panen** — pilih & hapus massal (v4.2)
- **Fix double-submit** tombol simpan panen (`useFormStatus`) (v4.2)
- **AI Agents** — 5 agent + orchestrator + log (v4.2)

**Payment Gateway (backup):**
- Mayar (nunggu KYC)
- Midtrans (cadangan)

### ⏳ Belum

- **Image generation** — kena limit Pollinations (butuh daftar Seed tier)
- **Virtual Office** — visual dengan avatar agent (belum dimulai)
- **Regenerate + Refine** AI Agents — udah ada tombol, test lagi
- **Export PNG** AI Agents output (html-to-image)
- Reset Client Secret Google OAuth
- Notif Email (Resend/Mailgun)
- Fitur Referral
- Notif Hutang
- Mayar QRIS (nunggu KYC)
- Kurir RajaOngkir
- Shopping cart

---

## 🚨 KNOWN ISSUES

1. 🔴 **Client Secret Google OAuth ekspos** `*****7Gb5` — belum dikonfirmasi disable
2. 🟡 Middleware deprecated → proxy (abaikan)
3. 🟡 Mayar KYC belum approve
4. 🟢 PDF penggarap — text extraction bug di viewer, visual rapi
5. 🟡 Import error di `/api/mayar/*` dan `/api/midtrans/*` — sengaja dibiarkan (backup)
6. 🟡 **Image generation Pollinations** — kena HTTP 402, butuh daftar https://auth.pollinations.ai untuk Seed tier gratis
7. 🟡 **AI agents** — kalau Groq rate limit, agent error. Perlu fallback Gemini.

---

## 🎯 NEXT FEATURE

**Prioritas Tinggi:**
- Fix image generation (daftar Pollinations Seed tier, atau ganti provider Cloudflare Workers AI / Together AI)
- Virtual Office — dashboard dengan avatar agent + logo Harvestan
- Reset Google OAuth (5 menit)
- Notif Email (2-3 jam)

**Prioritas Sedang:**
- Notif Hutang
- Kurir RajaOngkir
- Fitur Referral

**Fase 2:**
- Mayar QRIS
- Shopping cart
- Image generation premium

---

## 🔗 LINK PENTING

- **Repo:** https://github.com/harvestanid/harvestan
- **Live:** https://harvestan.vercel.app
- **Vercel:** https://vercel.com/harvestanid/harvestan
- **Supabase:** https://supabase.com/dashboard/project/qfggoqcdaiokfluewple
- **Google Cloud:** https://console.cloud.google.com/auth/clients?project=bubbly-stone-509704-g2
- **Discord:** https://discord.gg/v8RZbADBM
- **Groq:** https://console.groq.com/keys
- **Pollinations Auth:** https://auth.pollinations.ai

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

Status: v4.2

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
11. Command Termux — SATU BLOK, jangan && atau 1 baris panjang
12. Kalau langgar aturan → minta maaf singkat, langsung fix, JANGAN ngeyel

Yang mau dilanjutkan:
[TULIS DI SINI]

Mulai?

```

---

## 📈 STATISTIK PROJECT

- **~75+ halaman** Next.js
- **~55+ API routes**
- **~20 tabel** database + RLS
- **~45.000+ baris** kode TypeScript
- **~22 library** terintegrasi
- **3 dokumentasi:** CHANGELOG.md, HANDOFF.md (ini), PROJECT.md
- **Live di production**

---

**Status:** ✅ v4.2 — AI Agents + Postcard Polygon + Hapus Massal
**Tanggal update:** 2026-10-09
**Dibuat dengan:** ❤️ + AI, dari nol, tanpa bisa coding 🇮🇩
```

wc -l: ~635 baris

---

Setelah paste:

```
cd ~/projects/harvestan

git add .

git commit -m "docs: update HANDOFF v4.2 — AI agents + postcard polygon + hapus massal"

git push
```

Lapor kalau sukses. 🌾
