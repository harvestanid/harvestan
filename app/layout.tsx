import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { InstallPWA } from "@/components/install-pwa";

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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Harvestan",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://harvestan.vercel.app",
    siteName: "Harvestan",
    title: "Harvestan - Sistem Manajemen Pertanian Modern",
    description:
      "Kelola kebun Anda dengan lebih cerdas. Catat penggarap, lahan, panen, hutang, dan bagi hasil dalam satu aplikasi.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Harvestan - Sistem Manajemen Pertanian Modern",
    description:
      "Kelola kebun Anda dengan lebih cerdas. Gratis untuk petani Indonesia.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#2c5e2e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Harvestan" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <InstallPWA />
      </body>
    </html>
  );
}
