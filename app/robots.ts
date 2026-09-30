import type { MetadataRoute } from "next";

const SITE_URL = "https://harvestan.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog", "/toko", "/register", "/login"],
        disallow: [
          "/dashboard",
          "/penggarap",
          "/keuangan",
          "/grafik",
          "/laporan",
          "/export",
          "/import",
          "/pengaturan",
          "/admin",
          "/log-tanam",
          "/gabah",
          "/panen-multi",
          "/ukur-lahan",
          "/pesanan-saya",
          "/feedback",
          "/bantuan",
          "/demo",
          "/premium",
          "/premium-gratis",
          "/api",
          "/auth",
          "/toko/checkout",
          "/toko/pesanan",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
