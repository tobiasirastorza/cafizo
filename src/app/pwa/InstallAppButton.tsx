"use client";

import { useEffect, useState } from "react";
import { RiDownloadLine } from "@remixicon/react";

type InstallAppButtonProps = {
  locale: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function detectIosSafari() {
  const ua = window.navigator.userAgent.toLowerCase();
  const isIosDevice =
    /iphone|ipad|ipod/.test(ua) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  const isSafari = /safari/.test(ua) && !/crios|fxios|edgios|chrome/.test(ua);
  return isIosDevice && isSafari;
}

export default function InstallAppButton({ locale }: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  const isSpanish = locale.startsWith("es");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIsIosSafari(detectIosSafari());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowIosHelp(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (installed) return null;

  const canInstallDirectly = deferredPrompt !== null;
  const canShowManualIos = isIosSafari;

  if (!canInstallDirectly && !canShowManualIos) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }

    setShowIosHelp((prev) => !prev);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleInstall}
        aria-label={isSpanish ? "Instalar app" : "Install app"}
        title={isSpanish ? "Instalar app" : "Install app"}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background-card text-foreground-secondary transition-colors duration-150 hover:bg-background-muted hover:text-foreground"
      >
        <RiDownloadLine size={18} aria-hidden="true" />
      </button>

      {showIosHelp ? (
        <div className="absolute right-0 top-11 z-20 w-56 rounded-md border border-border bg-background-card p-3 text-left text-xs text-foreground-secondary shadow-sm">
          {isSpanish
            ? "En Safari: toca Compartir y luego Añadir a pantalla de inicio."
            : "In Safari: tap Share, then Add to Home Screen."}
        </div>
      ) : null}
    </div>
  );
}
