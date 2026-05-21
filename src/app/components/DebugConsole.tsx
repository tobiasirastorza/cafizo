"use client";

import { useEffect } from "react";

const STORAGE_KEY = "vt-debug-console";

export default function DebugConsole() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.has("debug")) {
      if (params.get("debug") === "off") {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, "1");
    }

    if (window.localStorage.getItem(STORAGE_KEY) !== "1") return;

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/eruda";
    script.onload = () => {
      const eruda = (window as unknown as { eruda?: { init: () => void } }).eruda;
      eruda?.init();
    };
    document.body.appendChild(script);
  }, []);

  return null;
}
