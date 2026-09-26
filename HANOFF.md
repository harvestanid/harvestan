# 🤝 HANDOFF — Konteks untuk Chat Baru

**File ini dibuat untuk melanjutkan development Harvestan di chat baru.**

Copy-paste isi file ini (atau link repo) ke chat baru untuk kasih konteks ke AI.

---

## 🎯 Project Info

- **Nama**: Harvestan
- **Deskripsi**: SaaS manajemen pertanian Indonesia
- **Repo**: https://github.com/harvestanid/harvestan
- **Live**: https://harvestan.vercel.app
- **User**: Pemula (tidak bisa coding), koding semua oleh AI
- **Development**: Termux di Android

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **UI**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL + RLS + Auth)
- **Hosting**: Vercel
- **Excel**: `xlsx` (SheetJS)
- **Editor**: micro (di Termux)

---

## 📁 Struktur Folder Penting
app/
├── (auth)/                          # Login, register
├── (dashboard)/
│   ├── layout.tsx                   # Sidebar + bottom nav
│   ├── dashboard/page.tsx           # Dashboard utama
│   ├── keuangan/page.tsx            # Keuangan & Laba
│   ├── export/page.tsx              # Export Excel
│   ├── penggarap/
│   │   ├── page.tsx                 # List penggarap
│   │   ├── baru/page.tsx            # Tambah penggarap
│   │   └── [id]/
│   │       ├── page.tsx             # Detail penggarap + lahan + hutang
│   │       ├── tombol-aksi.tsx
│   │       ├── lahan/
│   │       │   ├── baru/page.tsx
│   │       │   └── [landId]/
│   │       │       ├── page.tsx     # Detail lahan + riwayat panen
│   │       │       ├── tombol-aksi.tsx
│   │       │       └── panen/
│   │       │           ├── baru/page.tsx
│   │       │           └── [harvestId]/
│   │       │               ├── page.tsx     # Detail panen + log
│   │       │               ├── tombol-aksi.tsx
│   │       │               └── edit/page.tsx # Edit panen
│   │       └── hutang/
│   │           ├── baru/page.tsx
│   │           └── [debtId]/
│   │               ├── page.tsx     # Detail hutang + log
│   │               └── tombol-aksi.tsx
│   └── gabah/page.tsx               # KOSONG, perlu diisi
├── api/
│   ├── lahan/[id]/route.ts          # PUT, DELETE lahan
│   ├── panen/[id]/route.ts          # PUT, DELETE panen (auto-revert hutang)
│   ├── hutang/[id]/route.ts         # PUT, DELETE hutang
│   └── export/route.ts              # GET → generate Excel

lib/supabase/
├── client.ts                        # Client-side Supabase
├── server.ts                        # Server-side Supabase
└── queries/
├── penggarap.ts                 # Client queries penggarap
├── penggarap-server.ts          # Server queries penggarap + lahan
├── panen-server.ts              # Server queries panen
└── hutang-server.ts             # Server queries hutang

middleware.ts                        # Auth middleware

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

### `categories` (belum dipakai)
```

-- untuk kategori produktivitas per komoditas

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

Edit Panen (Logic Baru)

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

---

🎯 Next Feature (yang belum)

Pilih salah satu:

· 🅰️ Transfer Lahan — pindah lahan dari penggarap A → B
· 🅱️ Export PDF per Penggarap — laporan cetak/WA
· 🅲️ Grafik Recharts — chart interaktif
· 🅳️ Halaman Gabah — menu ada, isi kosong
· 🅴️ Kategori Produktivitas — threshold per komoditas

---

📊 Progress

~98% fitur inti selesai!

Yang sudah:

· ✅ Auth
· ✅ CRUD Penggarap
· ✅ CRUD Lahan
· ✅ CRUD Panen
· ✅ CRUD Hutang
· ✅ Dashboard
· ✅ Keuangan
· ✅ Export Excel
· ✅ Potong Hutang Otomatis
· ✅ Edit Panen + Log
· ✅ Auto-Revert Hapus Panen
