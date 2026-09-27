# 📝 CHANGELOG Harvestan

Semua perubahan penting dari project ini akan didokumentasikan di file ini.

Format: [Keep a Changelog](https://keepachangelog.com/)
Versioning: [Semantic Versioning](https://semver.org/)

---

## [2.2.0] — 2026-09-27

### 🎉 PRODUCTION READY

Semua fitur sudah diuji dan berjalan dengan baik di production (harvestan.vercel.app).

### Added
- **Halaman Bantuan** — Pusat bantuan dengan 3 tab:
  - Panduan 12 step (daftar, penggarap, lahan, GPS, panen, bagi hasil, hutang, potong hutang, gabah, cabai musiman, grafik, export/import)
  - FAQ 10 pertanyaan
  - Kontak support (WA, email, Telegram)
  - Section troubleshooting

- **Fitur Feedback Anonymous**:
  - Form feedback dengan rating 1-5 bintang + saran fitur + masukan
  - Anti-spam 1x per minggu per user
  - Notifikasi Telegram otomatis ke grup admin
  - Dashboard admin dengan statistik & chart (distribusi rating, tren bulanan)
  - Filter rating, status (unread/pinned), search
  - Mark read, pin, delete feedback
  - Badge merah di sidebar admin (unread count)
  - Active state highlight di sidebar

- **PWA Install Banner**:
  - Banner muncul 3 detik setelah user visit
  - Service worker v1.8
  - Favicon & PWA icon
  - Middleware whitelist static files

### Changed
- Logo Harvestan baru (H + teks, dengan tema pertanian & peternakan)
- Ukuran logo disesuaikan di semua halaman
- Efek klik (press animation) di semua tombol & link
- Middleware catch-all matcher (semua route terproteksi by default)
- Skip TS check di Vercel build

### Fixed
- **Login Google** — Client Secret salah (di-reset di Google Cloud)
- **Middleware blokir static files** — manifest.json & sw.js tidak bisa diakses
- **PWA banner tidak muncul** — force banner 3 detik tanpa nunggu beforeinstallprompt
- **TypeScript boolean type** — di feedback page
- **Halaman Bantuan** — menu sidebar hilang

---

## [2.1.0] — 2026-09-27

### Added
- Halaman Bantuan (draft pertama)

### Fixed
- Menu Bantuan hilang dari sidebar

---

## [2.0.0] — 2026-09-27

### Added
- **Auth Lanjutan**:
  - Konfirmasi password saat register
  - Lupa password via email (Supabase default template)
  - Halaman reset password (2 step)
  - Auto-login setelah reset

- **PWA**:
  - Install banner
  - Service worker dengan cache strategy
  - Favicon & PWA icons

- **Logo Harvestan**:
  - Logo baru (H + teks)
  - Auto-crop whitespace
  - Compress icon < 1MB

- **Efek Klik**:
  - Press animation di semua tombol & link
  - Smooth scroll
  - Focus outline untuk keyboard user

### Changed
- Logo baru di semua halaman
- Middleware catch-all

### Fixed
- Login Google (Client Secret)
- Hydration error di Next.js 16

---

## [1.9.0] — 2026-09-27

### Added
- Gabah bawa pulang (pengalihan profit)
- Tombol "Jumlah Setiap Sesi" di gabah
- Setting default jumlah sak customable
- Checkbox bawa pulang penggarap & owner
- Rincian pengalihan di detail panen & invoice PDF

### Fixed
- Simbol aneh di PDF (sanitize ASCII)
- Konten terpotong di PDF

---

## [1.8.0] — 2026-09-27

### Added
- Import/Export Backup Excel
- Converter SawahKu HTML lama
- Grafik Kinerja Penggarap warna-warni
- Redesign Invoice PDF profesional
- Auto-remap UUID pada import

---

## [1.7.0] — 2026-09-27

### Added
- TAHAP 3: Laporan Kinerja Penggarap (bintang, reward, pendampingan)
- Kategori produktivitas horizontal
- Leaderboard auto-fit

### Fixed
- Bug huruf "e" nyasar di laporan
- Leaderboard terpotong

---

## [1.5.0] — 2026-09-25

### Added
- Login Google OAuth
- GPS Walking (ukur lahan + mini-map)
- Panen Multi-Lahan
- Panen Bertahap Cabai (TAHAP 1-5)
- PDF Invoice Bagi Hasil
- Laporan Tahunan/5 Tahunan
- Bottom nav mobile scrollable

---

## [1.0.0] — 2026-09-24

### Added
- Initial release
- Auth (email + password)
- CRUD Penggarap, Lahan, Panen, Hutang
- Dashboard & statistik
- Export Excel
- Kategori Produktivitas
- PWA basic

---

**Dibuat dengan**: ❤️ + AI, dari nol, tanpa bisa coding 🇮🇩
