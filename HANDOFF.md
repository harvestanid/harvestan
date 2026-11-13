# 🤝 HANDOFF — Konteks untuk Chat Baru

File ini untuk melanjutkan development Harvestan di chat baru.
Copy-paste isi file ini (atau link repo) ke chat baru untuk kasih konteks ke AI.

## 🎯 PROJECT INFO

- **Nama:** Harvestan
- **Deskripsi:** SaaS manajemen pertanian & peternakan Indonesia (multi-komoditas + bagi hasil + hutang + GPS + e-commerce + kalkulator pupuk + AI agents + peternakan sapi)
- **Repo:** https://github.com/harvestanid/harvestan
- **Live:** https://harvestan.vercel.app
- **Versi:** v4.4 (Peternakan Sapi + Kalkulator Pupuk Defisit + Multi-Lahan Gabah)
- **User:** Pemula (tidak bisa coding), koding semua oleh AI
- **Development:** Termux di Android
- **Chat ini:** AI buat kode, user paste + test

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

cd ~/projects/harvestan git add . git commit -m "..." git push

**JANGAN:**

cd ~/projects/harvestan && git add . && git commit -m "..." && git push

User pernah bilang: "jangan pake &&", "gaboleh &&", "gaboleh satu baris".

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

## 📁 STRUKTUR FOLDER

### File Root
- `.env.local`, `.gitignore`, `CHANGELOG.md`, `HANDOFF.md`, `PROJECT.md`, `README.md`, `next.config.ts`, `package.json`, `tsconfig.json`, `middleware.ts`, `eslint.config.mjs`

### `app/` (halaman utama)
- `page.tsx` (Landing) + `landing-klien.tsx`
- `layout.tsx` (Root)
- `(auth)/`: login, register, reset-password
- `(dashboard)/`: Halaman pertanian (Dashboard, Penggarap, Gabah, Panen Multi, Ukur, Log Tanam, Kalkulator, Keuangan, Grafik, Laporan, Export, Import, Pesanan, Feedback, Bantuan, Pengaturan, Admin)
- `(peternakan)/`: **Workspace Peternakan (BARU)**
  - `layout.tsx` (Sidebar & Navbar Peternakan)
  - `peternakan/page.tsx` (Dashboard Peternakan)
  - `peternakan/sapi/page.tsx` (Daftar Sapi)
  - `peternakan/sapi/baru/page.tsx` + `form.tsx`
  - `peternakan/sapi/[id]/page.tsx` + `klien.tsx` (Detail, Timbang, Log)
  - `peternakan/sapi/[id]/qr/page.tsx` + `klien.tsx` (Cardholder QR)
  - Halaman Coming Soon: kambing, domba, ayam, bebek
- `sapi-publik/[token]/page.tsx` (Halaman Publik Scan QR)
- `api/`: (akun, lahan, panen, hutang, agents, admin, dll)

### `components/`
- `menu-burger.tsx` (Navigasi Workspace)
- `log-tanam-form.tsx`
- `skema-bagi-hasil-v2.tsx`
- `postcard-panen.tsx` (8 style)
- `share-panen-modal.tsx`
- `peta-mini.tsx` (Auto-zoom polygon)
- `riwayat-panen.tsx`
- `install-pwa.tsx`

### `lib/`
- `supabase/`
- `agents/` (AI Agents)
- `notif/`
- `demo/`
- `utils/`

## 🗄️ DATABASE SCHEMA (Tabel Utama)

### Pertanian
- `penggaraps`, `lands`, `harvests`, `debts`, `categories`, `musim_cabai`, `activity_logs`, `activity_jenis_custom`, `kalender_tanam`, `kalender_kegiatan`, `fertilizers`, `blog_posts`, `products`, `orders`, `reviews`, `shipping_rates`

### Premium & Invoice
- `feedback`, `subscriptions`, `invoices`, `notification_logs`, `premium_orders`

### Demo
- `demo_sessions`

### Peternakan (BARU)
- `livestocks` (id, user_id, public_token, jenis, jenis_kelamin, tanggal_lahir, bobot_awal, tinggi_awal, panjang_awal, harga_beli, tanggal_masuk, status, foto_url, is_public, is_demo, created_at)
- `livestock_measurements` (id, livestock_id, tanggal, bobot_kg, tinggi_cm, panjang_cm, catatan, created_at)
- `livestock_logs` (id, livestock_id, tanggal, jenis_kegiatan, keterangan, biaya, created_at)

### AI Agents
- `agent_logs`

### RLS
RLS aktif — `auth.uid() = user_id`. Exception: public read untuk `products`, `reviews`, `shipping_rates`, `blog_posts`, `fertilizers`. Untuk tabel `livestocks`, ada policy tambahan `public can view public livestocks` (khusus `is_public = true`).

## ⚠️ ATURAN TEKNIS (WAJIB!)

1. **FULL FILE** — SELALU kirim FULL FILE siap paste
2. JANGAN stop di tengah file
3. Command Termux MULTI-LINE, jangan `&&`, jangan 1 baris panjang
4. `pkill -9 node` sebelum `rm -rf .next node_modules/.cache`
5. JANGAN nested `<form>`
6. JANGAN `useSearchParams` di `page.tsx`
7. Client Component dipisah file sendiri (`"use client"` baris 1)
8. Path dengan `[ ]` atau `( )` wajib tanda kutip
9. Nama kolom: `hasil_kg`, `harga_gabah`, `profit_owner`, `persen_penggarap`. Kategori: `cukup`, `baik`, `sangat_baik`
10. JANGAN campur produktivitas antar komoditas
11. WAJIB `npm run build` sebelum push
12. **"GAS"** → langsung eksekusi
13. Tanya sekali, jangan tanya-tanya berulang
14. Server-only vs client-safe
15. Pakai `createAdminClient` (service role) untuk operasi admin
16. **Command Termux dalam 1 blok**
17. **KALAU TIDAK TAU FILE, JANGAN NEBAK. Minta output grep.**

## 🔄 LOGIC PENTING

### Potong Hutang Otomatis
- Input panen → potong profit penggarap dengan hutang (TERLAMA)
- Update `dibayar += potong`, `sisa -= potong`, log di `debts.log_perubahan` + `harvests.potongan_hutang_log`.

### Hapus Panen (single & bulk)
- Auto-revert potongan hutang berdasarkan `potongan_hutang_log`.

### Kalender Tanam
- Multi-hari, HST dinamis, Export ICS (All-Day), PDF Timeline + Grid Bulanan.

### Log Tanam
- Filter Jenis Custom, Total Biaya ngikutin filter, PDF rapi (foto bukti, zebra, rekap jenis).
- **Upload foto**: Hanya user Premium.

### Kalkulator Pupuk
- **Logika Defisit Target**: Phonska dominan (prioritas 3x), kekurangan N/P/K diisi Urea/SP-36/ZK.
- **Pupuk Organik**: Selalu 100% (tidak dipotong meskipun opsi pengurangan kimia dicentang).
- **Opsi Pengurangan 25/50%**: Hanya memotong pupuk kimia.

### Penimbangan Gabah (Multi-Lahan)
- Bisa pilih banyak lahan.
- Hasil dibagi proporsional sesuai luas lahan.
- **Bawa Pulang**: Centang per-sak (Penggarap / Owner).

### Postcard Panen
- 8 style, polygon overlay, share IG (Web Share API).

### Peternakan Sapi
- **Fokus Penggemukan**: Harga beli bakalan (RAHASIA, tidak tampil di publik).
- **Timbang & Ukur**: Bobot, Tinggi, Panjang + Foto terbaru (replace).
- **ADG Otomatis**: (Bobot Akhir - Bobot Awal) / Total Hari.
- **Log Biaya**: Pakan, Obat, Tenaga Kerja, dll.
- **QR Cardholder**: Link publik `/sapi-publik/[token]` (token acak, bukan eartag).
- **Halaman Publik**: Hanya menampilkan data non-harga (Jenis, Bobot, Grafik, Foto).
- **AI (Belum)**: Harga pasar otomatis & fitur Tanya AI.

## 📊 PROGRESS v4.4

### ✅ Selesai
- Landing page premium
- Manajemen pertanian (Penggarap, Lahan, Panen, Hutang)
- GPS Ukur Lahan (2 mode)
- Log Tanam (Filter, PDF, Foto Premium)
- Kalkulator Pupuk (Defisit Target, Organik 100%)
- Gabah (Multi-Lahan, Bawa Pulang per Sak)
- Kalender Tanam (ICS, PDF)
- AI Agents (5 agent + Orchestrator)
- Admin Mode Gratis Premium (Global Toggle)
- **Peternakan Sapi (CRUD, Timbang, Log, QR Cardholder, Halaman Publik)**

### ⏳ Belum (NEXT)
- **AI Sapi**: Harga pasar otomatis (via Groq), Kalkulasi Karkas/Daging, Tanya AI untuk pembeli.
- **Peternakan**: Kambing, Domba, Ayam, Bebek (Coming Soon).
- Image generation Pollinations (HTTP 402).
- Virtual Office (avatar agent).
- Notif Email, Notif Hutang, Referral.
- Payment Gateway Mayar/Midtrans (nunggu KYC).

## 🚨 KNOWN ISSUES
1. 🔴 Client Secret Google OAuth ekspos — belum di-reset.
2. 🟡 Middleware deprecated → proxy (abaikan).
3. 🟡 Mayar KYC belum approve.
4. 🟢 PDF penggarap — visual rapi (text extraction bug di viewer).
5. 🟡 Image generation Pollinations — kena HTTP 402.
6. 🟡 AI Agents error kalau Groq rate limit (perlu fallback Gemini).

## 🔗 LINK PENTING
- Repo: https://github.com/harvestanid/harvestan
- Live: https://harvestan.vercel.app
- Vercel: https://vercel.com/harvestanid/harvestan
- Supabase: https://supabase.com/dashboard/project/qfggoqcdaiokfluewple
- Google Cloud: https://console.cloud.google.com/auth/clients?project=bubbly-stone-509704-g2
- Discord: https://discord.gg/v8RZbADBM
- Groq: https://console.groq.com/keys
- Pollinations Auth: https://auth.pollinations.ai

## 📋 CARA LANJUT DI CHAT BARU

Halo! Saya lanjut project Harvestan (SaaS pertanian & peternakan Indonesia).

Tolong baca dulu SEBELUM mulai, terutama bagian:
- KARAKTERISTIK USER (PENTING BANGET!)
- ATURAN TEKNIS
- ATURAN COMMAND
- LOGIC PENTING
- KNOWN ISSUES

Status: v4.4

ATURAN WAJIB (JANGAN DILANGGAR!):
1. SELALU FULL FILE — bukan potongan kode / "cari baris X"
2. JANGAN stop di tengah — file panjang kirim SEKALIGUS
3. JANGAN tanya-tanya kebanyakan — langsung kerja
4. Kalau saya bilang "GAS" → langsung eksekusi
5. Bahasa Indonesia, ringkas, to the point
6. Kasih wc -l sebagai patokan
7. pkill -9 node sebelum rm -rf .next
8. JANGAN nested form
9. JANGAN useSearchParams di page.tsx
10. Client Component dipisah file sendiri
11. Command Termux — SATU BLOK, jangan && atau 1 baris panjang
12. Kalau langgar aturan → minta maaf singkat, langsung fix, JANGAN ngeyel
13. JIKA TIDAK TAU FILE, JANGAN NEBAK. Minta output grep.

Yang mau dilanjutkan: [TULIS DI SINI]

Mulai?
