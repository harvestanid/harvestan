"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // ===== REGISTER SERVICE WORKER =====
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("✅ Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.log("❌ Service Worker registration failed:", err);
        });
    }

    // ===== PWA INSTALL LOGIC =====
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Kalau sudah install, jangan tampilkan banner
    if (isStandalone) {
      setIsReady(true);
      return;
    }

    // Cek dismiss (24 jam)
    const dismissed = localStorage.getItem("pwa-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const hoursSince = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        setIsReady(true);
        return;
      }
    }

    // ===== TANGKAP beforeinstallprompt EVENT =====
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log("✅ beforeinstallprompt event captured");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // ===== FORCE SHOW BANNER AFTER 3 DETIK =====
    // Tidak nunggu beforeinstallprompt — banner langsung muncul
    // Tombol Install akan trigger Chrome prompt kalau PWA valid
    const timer = setTimeout(() => {
      setShowBanner(true);
      setIsReady(true);
    }, 3000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    // Kalau Chrome belum fire beforeinstallprompt, kita trigger manual
    if (!deferredPrompt) {
      // Coba trigger prompt Chrome (kalau ada)
      const anyWindow = window as any;
      if (anyWindow.deferredPrompt) {
        anyWindow.deferredPrompt.prompt();
        await anyWindow.deferredPrompt.userChoice;
        anyWindow.deferredPrompt = null;
        setShowBanner(false);
        return;
      }

      // Kalau tetap tidak ada, kasih instruksi manual
      alert(
        "📱 Cara Install Harvestan:\n\n" +
          "• Chrome Android: Menu ⋮ → 'Install app' / 'Tambahkan ke layar utama'\n" +
          "• Safari iOS: Tombol Share → 'Tambahkan ke Layar Utama'\n" +
          "• Chrome Desktop: Ikon install di address bar (kanan URL)"
      );
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("✅ User accepted install");
      setIsInstalled(true);
    } else {
      console.log("❌ User dismissed install");
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  }

  function handleDismiss() {
    setShowBanner(false);
    localStorage.setItem("pwa-dismissed", Date.now().toString());
  }

  if (isInstalled) return null;

  if (showBanner) {
    return (
      <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50">
        <div className="bg-gradient-to-br from-green-700 to-green-900 text-white rounded-2xl shadow-2xl p-4 border-2 border-green-500">
          <div className="flex items-start gap-3">
            <div className="bg-white rounded-lg p-1.5 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon.png"
                alt="Harvestan"
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm mb-1">
                Install Harvestan di HP
              </div>
              <p className="text-xs text-green-100 mb-3 leading-relaxed">
                Akses lebih cepat, bisa offline, seperti aplikasi native!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleInstall}
                  className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-bold px-4 py-1.5 rounded-lg text-xs transition"
                >
                  📱 Install Sekarang
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-green-100 hover:text-white text-xs font-medium px-2 transition"
                >
                  Nanti
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-green-200 hover:text-white text-lg leading-none flex-shrink-0"
              aria-label="Tutup"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
