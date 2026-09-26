import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Harvestan - Sistem Manajemen Pertanian Modern",
    template: "%s | Harvestan",
  },
  description:
    "Kelola kebun Anda dengan lebih cerdas. Catat penggarap, lahan, panen, hutang, dan bagi hasil dalam satu aplikasi. Export laporan Excel & PDF. Gratis!",
  keywords: [
    "manajemen pertanian",
    "aplikasi petani",
    "bagi hasil panen",
    "penggarap",
    "sawah",
    "kebun",
    "harvestan",
    "pertanian digital",
  ],
  authors: [{ name: "Harvestan" }],
  creator: "Harvestan",
  publisher: "Harvestan",
  applicationName: "Harvestan",
  metadataBase: new URL("https://harvestan.vercel.app"),
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://harvestan.vercel.app",
    siteName: "Harvestan",
    title: "Harvestan - Sistem Manajemen Pertanian Modern",
    description:
      "Kelola kebun Anda dengan lebih cerdas. Catat penggarap, lahan, panen, hutang, dan bagi hasil dalam satu aplikasi.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Harvestan - Sistem Manajemen Pertanian",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Harvestan - Sistem Manajemen Pertanian Modern",
    description:
      "Kelola kebun Anda dengan lebih cerdas. Gratis untuk petani Indonesia.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232c5e2e'/%3E%3Ctext x='50' y='68' font-size='58' text-anchor='middle' fill='%23ffc107'%3E%F0%9F%8C%BE%3C/text%3E%3C/svg%3E",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
