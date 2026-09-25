=== HARVESTAN PROGRESS (Update 26 Sep 2026) ===

LIVE: https://harvestan.vercel.app
REPO: https://github.com/harvestanid/harvestan
SUPABASE: qfggoqcdaiokfluewple

✅ DONE:
- Landing page
- Auth (register, login, logout, middleware)
- Database schema (5 tabel: penggaraps, lands, harvests, debts, categories)
- CRUD Penggarap (list, tambah, detail, edit, hapus)

⏳ NEXT: CRUD Lahan

STRUKTUR FILE PENTING:
- app/(dashboard)/layout.tsx (sidebar + bottom nav)
- app/(dashboard)/dashboard/page.tsx
- app/(dashboard)/penggarap/page.tsx (list)
- app/(dashboard)/penggarap/baru/page.tsx (form tambah)
- app/(dashboard)/penggarap/[id]/page.tsx (detail)
- app/(dashboard)/penggarap/[id]/tombol-aksi.tsx (edit & hapus)
- app/api/penggarap/[id]/route.ts (API update)
- lib/supabase/client.ts
- lib/supabase/server.ts
- lib/supabase/queries/penggarap.ts (create, update, delete)
- lib/supabase/queries/penggarap-server.ts (getList, getById, getLandsByPenggarap)
- middleware.ts

KOMODITAS: padi, jagung, kacang_tanah, bawang_merah, cabai_rawit
BAGI HASIL: 50:50, 60:40, 70:30, 100:0, custom

NEXT CHAT: paste context di atas + minta lanjut "CRUD Lahan"

- [x] CRUD Penggarap (list, tambah, detail, edit, hapus)
