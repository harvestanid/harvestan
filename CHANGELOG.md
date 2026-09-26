# Changelog Harvestan

Semua perubahan penting pada project Harvestan dicatat di sini.

Format: `[tanggal] — [fitur] — [deskripsi]`

---

## 2026-09-26

### ✅ Fitur: Log/Audit Trail Hutang
- Tambah kolom `potongan_hutang_log` (JSONB) di tabel `harvests`
- Tambah kolom `log_perubahan` (JSONB) di tabel `debts`
- Setiap aksi potong/revert hutang tercatat dengan timestamp
- Halaman detail hutang menampilkan log perubahan
- Halaman detail panen menampilkan riwayat perubahan hutang

### ✅ Fitur: Auto-Revert Hutang saat Hapus Panen
- Hapus panen dengan potongan hutang → hutang otomatis dikembalikan
- Pesan konfirmasi menampilkan info potongan hutang
- Log revert tercatat sebagai `revert_hapus_panen`

### ✅ Fitur: Edit Panen (Lengkap)
- Halaman `/penggarap/[id]/lahan/[landId]/panen/[harvestId]/edit`
- Checkbox "Potong Hutang" default tercentang kalau panen lama punya potongan
- Logic: revert kalau uncheck, potong ulang kalau check
- Auto-recalculate profit owner & penggarap dari hasil baru
- Log lengkap di tabel `harvests` dan `debts`

### ✅ Fitur: Keuangan Page
- Halaman `/keuangan`
- Kartu statistik: Profit Owner, Profit Penggarap, Hutang Aktif, Total Panen
- Chart profit bulanan (12 bulan terakhir) — bar owner & penggarap
- Top 5 Penggarap by Profit Owner
- Profit per Komoditas (padi, jagung, dll)
- Tabel Profit per Lahan
- Info total potongan hutang dari panen

### ✅ Fitur: Export Excel
- Halaman `/export`
- 4 sheet: Penggarap, Lahan, Panen, Hutang
- Library: `xlsx` (SheetJS)
- File: `Harvestan_Export_YYYY-MM-DD.xlsx`
- Menu di sidebar: "📥 Export Data"

### ✅ Fitur: Potong Hutang Otomatis dari Panen
- Saat input panen, ada checkbox "Potong Hutang dari Profit Penggarap"
- Sistem otomatis:
  - Hitung profit penggarap
  - Kurangi dengan hutang aktif (urut dari tertua)
  - Update `dibayar` & `sisa` di tabel `debts`
  - Simpan `potongan_hutang`, `total_hutang_sebelum`, `sisa_hutang_sesudah` di `harvests`
  - Geser dari profit penggarap → owner
- Info daftar hutang aktif muncul di form

### ✅ Fitur: Dashboard
- Halaman `/dashboard`
- 4 kartu statistik: Penggarap, Lahan, Panen, Hutang Aktif
- Profit Summary (Owner & Penggarap)
- Top 5 Penggarap by Profit Owner
- Chart produksi 6 bulan terakhir (CSS bar)
- Aktivitas terbaru (panen & hutang)

### ✅ Fitur: CRUD Hutang
- Halaman `/penggarap/[id]/hutang/baru` (form tambah)
- Halaman `/penggarap/[id]/hutang/[debtId]` (detail)
- Tombol Aksi: Edit, Lunasi, Hapus
- Field: tanggal, jumlah, keperluan, dibayar, sisa
- Validasi: `step="any"` biar tidak error

### ✅ Fitur: CRUD Panen
- Halaman `/penggarap/[id]/lahan/[landId]/panen/baru` (form tambah)
- Halaman `/penggarap/[id]/lahan/[landId]/panen/[harvestId]` (detail)
- Tombol Aksi: Edit, Hapus
- Field: tanggal, komoditas, hasil_kg, harga_gabah, biaya_panen_per_kg, biaya_tambahan, persen_owner, catatan
- Auto-hitung: profit_bersih, profit_owner, profit_penggarap

### ✅ Fitur: CRUD Lahan
- Halaman `/penggarap/[id]/lahan/baru` (form tambah)
- Halaman `/penggarap/[id]/lahan/[landId]` (detail + riwayat panen)
- Field: nama, luas, lokasi_koordinat
- GPS link ke Google Maps

### ✅ Fitur: CRUD Penggarap
- Halaman `/penggarap` (list)
- Halaman `/penggarap/baru` (form tambah)
- Halaman `/penggarap/[id]` (detail + lahan + hutang)
- Edit & Hapus

### ✅ Fitur: Auth
- Register, Login, Logout
- Middleware
- RLS di semua tabel

---

## ⚠️ Known Issues / TODO

### 🔴 RLS Policy: Wajib Kirim `user_id`
Setiap insert ke tabel dengan policy `auth.uid() = user_id` **WAJIB** kirim `user_id` di payload. Kalau tidak → error `new row violates row-level security policy`.

### 🟡 Middleware Deprecated
Next.js warning: `middleware file convention is deprecated, use "proxy" instead`.
Belum urgent, tapi bisa migrasi nanti.

### 🟡 Edit Panen + Hutang Manually Dibayar
Kalau hutang sudah **dilunasi manual** oleh user setelah panen potong hutang, revert saat edit bisa salah. Perlu mitigasi tambahan (log sudah ada, tapi logic revert belum cek ini).

---

## 🚀 Next Feature Ideas

- [ ] **Transfer Lahan** (pindahkan lahan dari penggarap A → B)
- [ ] **Export PDF per Penggarap** (laporan kinerja)
- [ ] **Grafik Recharts** (chart interaktif, ganti CSS bar)
- [ ] **Halaman Gabah** (menu sudah ada, halaman kosong)
- [ ] **Notifikasi WhatsApp** (kirim invoice via WA)
- [ ] **Multi-user / Team** (satu owner, banyak operator)
- [ ] **PWA / Offline Mode**
- [ ] **Kategori Produktivitas** (threshold per komoditas)
- [ ] **Report Bulanan Otomatis** (kirim email)
- [ ] **Backup Otomatis ke Cloud**

---

## 📊 Progress

**~98% fitur inti selesai!**

| Kategori | Status |
|----------|--------|
| Auth | ✅ |
| CRUD Penggarap | ✅ |
| CRUD Lahan | ✅ |
| CRUD Panen | ✅ |
| CRUD Hutang | ✅ |
| Dashboard | ✅ |
| Keuangan | ✅ |
| Export Excel | ✅ |
| Potong Hutang Otomatis | ✅ |
| Edit Panen | ✅ |
| Log/Audit Trail | ✅ |
| Auto-Revert Hapus | ✅ |
| Transfer Lahan | ⏳ |
| Export PDF | ⏳ |
