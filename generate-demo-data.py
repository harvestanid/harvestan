#!/usr/bin/env python3
"""
Generator Data Demo Harvestan v2
- 13 penggarap, 17 Ha total, ~20 lahan
- 10 tahun (2016-2025)
- Produktivitas variatif (rendah, sedang, tinggi per penggarap)
- Profit variatif sesuai komoditas & luas garapan
- Tidak ada panen gagal total (paling buruk = profit kecil)
"""

import json
import random
from datetime import datetime

random.seed(2026)

TAHUN_MULAI = 2016
TAHUN_AKHIR = 2025

# ===================================================
# FAKTOR PER TAHUN (cuaca & hama) — 0.7 s/d 1.25
# ===================================================
FAKTOR_TAHUN = {
    2016: 1.00,
    2017: 1.12,
    2018: 0.80,  # kemarau ringan
    2019: 1.15,
    2020: 0.75,  # covid + hama
    2021: 1.05,
    2022: 1.25,  # harga cabai meledak
    2023: 0.85,  # el nino
    2024: 1.10,
    2025: 1.08,
}

# ===================================================
# HARGA PER TAHUN (fluktuatif realistis)
# ===================================================
HARGA_TAHUN = {
    "padi": {
        2016: 4200, 2017: 4450, 2018: 4300, 2019: 4700, 2020: 4100,
        2021: 4900, 2022: 5400, 2023: 5600, 2024: 6200, 2025: 6500,
    },
    "jagung": {
        2016: 3500, 2017: 3700, 2018: 3500, 2019: 4200, 2020: 3900,
        2021: 4600, 2022: 5100, 2023: 5400, 2024: 5800, 2025: 6000,
    },
    "kacang_tanah": {
        2016: 9500, 2017: 10200, 2018: 10800, 2019: 11200, 2020: 10500,
        2021: 11800, 2022: 12500, 2023: 13200, 2024: 14000, 2025: 14800,
    },
    "bawang_merah": {
        2016: 18000, 2017: 20000, 2018: 21000, 2019: 24000, 2020: 27000,
        2021: 23000, 2022: 28000, 2023: 32000, 2024: 30000, 2025: 27000,
    },
    "cabai_rawit": {
        2016: 25000, 2017: 28000, 2018: 26000, 2019: 30000, 2020: 33000,
        2021: 38000, 2022: 52000, 2023: 45000, 2024: 40000, 2025: 36000,
    },
}

# ===================================================
# 13 PENGGARAP dengan SKILL berbeda
# skill 0.75 = kurang, 0.95 = cukup, 1.10 = baik, 1.25 = sangat baik
# ===================================================
PENGGARAP_LIST = [
    {"id": "p1",  "nama": "Pak Slamet",   "alamat": "Dusun Sumberjo", "usia": 58, "kontak": "081234567890", "skill": 1.10},
    {"id": "p2",  "nama": "Pak Budi",     "alamat": "Dusun Sumberjo", "usia": 45, "kontak": "081234567891", "skill": 0.95},
    {"id": "p3",  "nama": "Bu Siti",      "alamat": "Dusun Sumberjo", "usia": 42, "kontak": "081234567892", "skill": 0.85},
    {"id": "p4",  "nama": "Pak Tani",     "alamat": "Dusun Ngudi",    "usia": 52, "kontak": "081234567893", "skill": 1.20},
    {"id": "p5",  "nama": "Pak Yanto",    "alamat": "Dusun Ngudi",    "usia": 48, "kontak": "081234567894", "skill": 0.90},
    {"id": "p6",  "nama": "Bu Rina",      "alamat": "Dusun Ngudi",    "usia": 38, "kontak": "081234567895", "skill": 1.05},
    {"id": "p7",  "nama": "Pak Harto",    "alamat": "Dusun Rejo",     "usia": 55, "kontak": "081234567896", "skill": 0.78},  # kurang
    {"id": "p8",  "nama": "Pak Joko",     "alamat": "Dusun Rejo",     "usia": 50, "kontak": "081234567897", "skill": 1.00},
    {"id": "p9",  "nama": "Pak Wardi",    "alamat": "Dusun Rejo",     "usia": 60, "kontak": "081234567898", "skill": 0.82},  # kurang
    {"id": "p10", "nama": "Bu Lastri",    "alamat": "Dusun Mekar",    "usia": 44, "kontak": "081234567899", "skill": 1.15},
    {"id": "p11", "nama": "Pak Sukir",    "alamat": "Dusun Mekar",    "usia": 56, "kontak": "081234567900", "skill": 0.93},
    {"id": "p12", "nama": "Pak Rudi",     "alamat": "Dusun Mekar",    "usia": 47, "kontak": "081234567901", "skill": 1.08},
    {"id": "p13", "nama": "Bu Ani",       "alamat": "Dusun Mekar",    "usia": 41, "kontak": "081234567902", "skill": 0.88},
]

# ===================================================
# ~20 LAHAN (total 17 Ha)
# Distribusi: padi 6, jagung 4, kacang 3, bawang 2, cabai 5
# ===================================================
LAHAN_LIST = [
    # PADI (6 lahan, ~9 Ha)
    {"id": "l1",  "penggarap_id": "p1",  "nama": "Sawah Utama",       "luas": 2.80, "lokasi": "-7.5501,110.8267", "komoditas_utama": "padi"},
    {"id": "l2",  "penggarap_id": "p1",  "nama": "Sawah Kali",        "luas": 1.20, "lokasi": "-7.5510,110.8280", "komoditas_utama": "padi"},
    {"id": "l3",  "penggarap_id": "p2",  "nama": "Sawah Blok A",      "luas": 2.10, "lokasi": "-7.5520,110.8250", "komoditas_utama": "padi"},
    {"id": "l4",  "penggarap_id": "p4",  "nama": "Sawah Pak Tani",    "luas": 2.00, "lokasi": "-7.5540,110.8240", "komoditas_utama": "padi"},
    {"id": "l5",  "penggarap_id": "p10", "nama": "Sawah Bu Lastri",   "luas": 0.50, "lokasi": "-7.5580,110.8300", "komoditas_utama": "padi"},
    {"id": "l6",  "penggarap_id": "p12", "nama": "Sawah Pak Rudi",    "luas": 0.40, "lokasi": "-7.5590,110.8310", "komoditas_utama": "padi"},
    # JAGUNG (4 lahan, ~2.5 Ha)
    {"id": "l7",  "penggarap_id": "p5",  "nama": "Kebun Jagung A",    "luas": 0.90, "lokasi": "-7.5550,110.8270", "komoditas_utama": "jagung"},
    {"id": "l8",  "penggarap_id": "p8",  "nama": "Kebun Jagung B",    "luas": 0.60, "lokasi": "-7.5580,110.8280", "komoditas_utama": "jagung"},
    {"id": "l9",  "penggarap_id": "p7",  "nama": "Kebun Jagung C",    "luas": 0.50, "lokasi": "-7.5570,110.8260", "komoditas_utama": "jagung"},
    {"id": "l10", "penggarap_id": "p11", "nama": "Kebun Jagung D",    "luas": 0.45, "lokasi": "-7.5565,110.8265", "komoditas_utama": "jagung"},
    # KACANG TANAH (3 lahan, ~1.1 Ha)
    {"id": "l11", "penggarap_id": "p2",  "nama": "Kebun Kacang A",    "luas": 0.35, "lokasi": "-7.5525,110.8265", "komoditas_utama": "kacang_tanah"},
    {"id": "l12", "penggarap_id": "p6",  "nama": "Kebun Kacang B",    "luas": 0.40, "lokasi": "-7.5595,110.8275", "komoditas_utama": "kacang_tanah"},
    {"id": "l13", "penggarap_id": "p13", "nama": "Kebun Kacang C",    "luas": 0.30, "lokasi": "-7.5600,110.8290", "komoditas_utama": "kacang_tanah"},
    # BAWANG MERAH (2 lahan, ~0.6 Ha)
    {"id": "l14", "penggarap_id": "p3",  "nama": "Kebun Bawang A",    "luas": 0.35, "lokasi": "-7.5535,110.8285", "komoditas_utama": "bawang_merah"},
    {"id": "l15", "penggarap_id": "p13", "nama": "Kebun Bawang B",    "luas": 0.25, "lokasi": "-7.5540,110.8290", "komoditas_utama": "bawang_merah"},
    # CABAI RAWIT (5 lahan, ~3.3 Ha)
    {"id": "l16", "penggarap_id": "p6",  "nama": "Kebun Cabai Bu Rina","luas": 0.55, "lokasi": "-7.5560,110.8290", "komoditas_utama": "cabai_rawit"},
    {"id": "l17", "penggarap_id": "p4",  "nama": "Kebun Cabai Pak Tani","luas": 0.65,"lokasi": "-7.5545,110.8250", "komoditas_utama": "cabai_rawit"},
    {"id": "l18", "penggarap_id": "p10", "nama": "Kebun Cabai Bu Lastri","luas":0.45,"lokasi": "-7.5575,110.8305", "komoditas_utama": "cabai_rawit"},
    {"id": "l19", "penggarap_id": "p8",  "nama": "Kebun Cabai Pak Joko","luas": 0.85,"lokasi": "-7.5570,110.8270", "komoditas_utama": "cabai_rawit"},
    {"id": "l20", "penggarap_id": "p1",  "nama": "Kebun Cabai Pak Slamet","luas":0.80,"lokasi": "-7.5505,110.8270","komoditas_utama": "cabai_rawit"},
]

# ===================================================
# MUSIM CABAI (10 musim, 2016-2025)
# ===================================================
MUSIM_CABAI = []
for tahun in range(2016, 2026):
    MUSIM_CABAI.append({
        "id": f"m{tahun}",
        "nama": f"Cabai {tahun}-1",
        "tanggal_mulai": f"{tahun}-05-01",
        "tanggal_selesai": f"{tahun}-10-31",
    })

# ===================================================
# BASE YIELD per Ha (Kg) — variasi dasar
# ===================================================
BASE_YIELD = {
    "padi": 6500,
    "jagung": 7000,
    "kacang_tanah": 1800,
    "bawang_merah": 8000,
    "cabai_rawit": 320,  # per panen (bukan per tahun)
}

# ===================================================
# GENERATE HARVESTS
# ===================================================
def gen_harvests():
    harvests = []
    hid = 1
    penggarap_map = {p["id"]: p for p in PENGGARAP_LIST}

    for lahan in LAHAN_LIST:
        kom = lahan["komoditas_utama"]
        penggarap = penggarap_map[lahan["penggarap_id"]]
        skill = penggarap["skill"]

        for tahun in range(TAHUN_MULAI, TAHUN_AKHIR + 1):
            faktor = FAKTOR_TAHUN[tahun]
            harga = HARGA_TAHUN[kom][tahun]

            if kom == "padi":
                bulan_list = [3, 9]
                jenis = "padi"
            elif kom == "jagung":
                bulan_list = [4, 10]
                jenis = "jagung"
            elif kom == "kacang_tanah":
                bulan_list = [7]
                jenis = "kacang_tanah"
            elif kom == "bawang_merah":
                bulan_list = [8]
                jenis = "bawang_merah"
            else:  # cabai_rawit
                bulan_list = [5, 6, 7, 8, 9, 10, 7, 8]  # 8x panen per musim
                jenis = "cabai_rawit"

            for idx, bulan in enumerate(bulan_list):
                # Base produktivitas per Ha
                base = BASE_YIELD[kom]

                # Faktor skill penggarap
                productivity = base * skill * faktor * random.uniform(0.92, 1.08)

                # Cabai: hasil per panen (bukan per tahun)
                if kom == "cabai_rawit":
                    hasil = round(lahan["luas"] * productivity)
                    hasil = max(30, hasil)
                    musim = f"Cabai {tahun}-1"
                else:
                    hasil = round(lahan["luas"] * productivity)
                    musim = None

                # Cabai ada 8 panen, hasil per panen lebih kecil, sudah otomatis
                # karena productivity cabai hanya 320 Kg/Ha

                # Biaya panen per Kg
                biaya_opsi = {
                    "padi": random.randint(380, 500),
                    "jagung": random.randint(320, 480),
                    "kacang_tanah": random.randint(700, 1000),
                    "bawang_merah": random.randint(1200, 1800),
                    "cabai_rawit": random.randint(1500, 2000),
                }
                biaya = biaya_opsi[kom]

                # Bawa pulang (kadang-kadang)
                bawa = 0
                if random.random() < 0.15 and kom == "padi":
                    bawa = random.choice([30, 50, 75, 100])

                tanggal = f"{tahun}-{bulan:02d}-{random.randint(8, 25):02d}"

                harvests.append({
                    "id": f"h{hid}",
                    "land_id": lahan["id"],
                    "tanggal": tanggal,
                    "komoditas": kom,
                    "musim": musim,
                    "hasil_kg": hasil,
                    "harga_gabah": harga,
                    "biaya_panen_per_kg": biaya,
                    "bawa_penggarap": bawa,
                    "persen_owner": 50,
                    "persen_penggarap": 50,
                })
                hid += 1

    harvests.sort(key=lambda h: h["tanggal"])
    return harvests

# ===================================================
# GENERATE DEBTS
# ===================================================
def gen_debts():
    debts = []
    did = 1
    keperluan_opsi = [
        "Beli bibit", "Beli pupuk urea", "Beli pestisida",
        "Bon sembako", "Sewa traktor", "Perbaikan pompa air",
        "Beli karung", "Biaya sekolah anak", "Biaya pengobatan",
    ]

    for penggarap in PENGGARAP_LIST:
        for tahun in range(2017, 2026):
            if random.random() < 0.35:
                jumlah = random.choice([1000000, 1500000, 2000000, 2500000, 3000000])
                r = random.random()
                if r < 0.75:
                    dibayar, sisa = jumlah, 0
                elif r < 0.9:
                    dibayar = round(jumlah * random.uniform(0.3, 0.7))
                    sisa = jumlah - dibayar
                else:
                    dibayar, sisa = 0, jumlah

                tanggal = f"{tahun}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"
                debts.append({
                    "id": f"d{did}",
                    "penggarap_id": penggarap["id"],
                    "tanggal": tanggal,
                    "jumlah": jumlah,
                    "dibayar": dibayar,
                    "sisa": sisa,
                    "keperluan": random.choice(keperluan_opsi),
                })
                did += 1

    debts.sort(key=lambda d: d["tanggal"])
    return debts

# ===================================================
# MAIN
# ===================================================
CATEGORIES = [
    {"komoditas": "padi", "cukup": 5000, "baik": 6000, "sangat_baik": 7000},
    {"komoditas": "jagung", "cukup": 6000, "baik": 7000, "sangat_baik": 8000},
    {"komoditas": "kacang_tanah", "cukup": 1500, "baik": 2000, "sangat_baik": 2500},
    {"komoditas": "bawang_merah", "cukup": 6000, "baik": 8000, "sangat_baik": 10000},
    {"komoditas": "cabai_rawit", "cukup": 800, "baik": 1000, "sangat_baik": 1200},
]

def main():
    print("=" * 60)
    print("🌾 Generator Data Demo Harvestan v2")
    print("=" * 60)
    print()

    harvests = gen_harvests()
    debts = gen_debts()

    total_luas = sum(l["luas"] for l in LAHAN_LIST)

    lahan_json = [
        {
            "id": l["id"],
            "penggarap_id": l["penggarap_id"],
            "nama": l["nama"],
            "luas": l["luas"],
            "lokasi_koordinat": l["lokasi"],
        }
        for l in LAHAN_LIST
    ]

    penggarap_json = [
        {
            "id": p["id"],
            "nama": p["nama"],
            "alamat": p["alamat"],
            "usia": p["usia"],
            "kontak": p["kontak"],
        }
        for p in PENGGARAP_LIST
    ]

    data = {
        "info": {
            "nama": "Demo Harvestan 10 Tahun",
            "deskripsi": "Data contoh petani Indonesia 2016-2025 dengan variasi realistis",
            "periode": "2016-2025",
            "total_tahun": 10,
            "total_luas": round(total_luas, 2),
        },
        "penggarap": penggarap_json,
        "lahan": lahan_json,
        "harvests": harvests,
        "debts": debts,
        "musim_cabai": MUSIM_CABAI,
        "categories": CATEGORIES,
    }

    with open("demo-data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"✅ demo-data.json dibuat!")
    print()
    print(f"📊 Statistik:")
    print(f"   Penggarap:    {len(penggarap_json)}")
    print(f"   Lahan:        {len(lahan_json)}")
    print(f"   Total Luas:   {total_luas:.2f} Ha")
    print(f"   Harvests:     {len(harvests)}")
    print(f"   Debts:        {len(debts)}")
    print()
    print(f"📈 Profit per tahun (semua komoditas):")
    for tahun in range(2016, 2026):
        total_profit = 0
        for h in harvests:
            if not h["tanggal"].startswith(str(tahun)):
                continue
            pendapatan = h["hasil_kg"] * h["harga_gabah"]
            biaya = h["hasil_kg"] * h["biaya_panen_per_kg"]
            total_profit += pendapatan - biaya
        juta = total_profit / 1_000_000
        emoji = "📈" if total_profit > 400_000_000 else "📉" if total_profit < 250_000_000 else "➡️"
        print(f"   {tahun}: Rp {juta:.1f} jt {emoji}")

    print()
    print(f"📈 Profit per komoditas (total 10 tahun):")
    kom_data = {}
    for h in harvests:
        kom = h["komoditas"]
        if kom not in kom_data:
            kom_data[kom] = {"hasil": 0, "profit": 0, "jml": 0}
        pendapatan = h["hasil_kg"] * h["harga_gabah"]
        biaya = h["hasil_kg"] * h["biaya_panen_per_kg"]
        kom_data[kom]["hasil"] += h["hasil_kg"]
        kom_data[kom]["profit"] += pendapatan - biaya
        kom_data[kom]["jml"] += 1

    for kom, d in kom_data.items():
        print(f"   {kom:15s}: {d['jml']:3d}x panen · {d['hasil']:>10,.0f} Kg · Profit Rp {d['profit']/1_000_000:>6.1f} jt")

    print()
    print(f"📈 Profit per penggarap (total 10 tahun):")
    peng_profit = {}
    for h in harvests:
        lahan = next((l for l in LAHAN_LIST if l["id"] == h["land_id"]), None)
        if not lahan:
            continue
        pid = lahan["penggarap_id"]
        if pid not in peng_profit:
            peng_profit[pid] = 0
        pendapatan = h["hasil_kg"] * h["harga_gabah"]
        biaya = h["hasil_kg"] * h["biaya_panen_per_kg"]
        peng_profit[pid] += pendapatan - biaya

    sorted_peng = sorted(peng_profit.items(), key=lambda x: -x[1])
    for pid, profit in sorted_peng:
        nama = next((p["nama"] for p in PENGGARAP_LIST if p["id"] == pid), pid)
        print(f"   {nama:20s}: Rp {profit/1_000_000:>7.1f} jt")

    print()
    print("📁 Copy ke public/ dengan:")
    print("   cp demo-data.json public/demo-data.json")


if __name__ == "__main__":
    main()
