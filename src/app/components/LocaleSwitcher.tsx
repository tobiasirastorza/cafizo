"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

const LOCALES = ["en", "es"] as const;

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const setLocale = (nextLocale: (typeof LOCALES)[number]) => {
    if (nextLocale === locale) return;
    document.cookie = `locale=${nextLocale};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  };

  return (
    <div className="space-y-3 border-2 border-border bg-background p-6">
      <div className="text-base font-bold uppercase tracking-widest text-muted-foreground">
        Language
      </div>
      <div className="flex flex-wrap gap-3">
        {LOCALES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setLocale(option)}
            className={`h-11 border-2 px-4 text-sm font-bold uppercase tracking-[0.2em] transition-colors ${
              locale === option
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {option === "en" ? "English" : "Español"}
          </button>
        ))}
      </div>
    </div>
  );
}
