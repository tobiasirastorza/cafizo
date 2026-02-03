"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  RiBarChartBoxLine,
  RiDashboardLine,
  RiFolderChartLine,
  RiUserLine,
  RiWeightLine,
} from "@remixicon/react";

const links = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/students", key: "clients" },
  { href: "/exercises", key: "exercises" },
  { href: "/routines", key: "routines" },
];

export default function Sidebar() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const isActiveLink = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const setLocale = (nextLocale: "en" | "es") => {
    if (nextLocale === locale) return;
    document.cookie = `locale=${nextLocale};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  };

  return (
    <aside className="relative flex min-h-screen w-full flex-col justify-between border-r-2 border-border bg-black px-6 py-10 md:sticky md:top-0 md:w-[260px]">
      <div>
        <nav className="space-y-8 text-lg font-bold uppercase tracking-widest">
          {links.map((link) => {
            const isActive = isActiveLink(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-4 ${
                  isActive ? "text-accent" : "text-muted-foreground"
                }`}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center">
                  {link.key === "dashboard" && <RiDashboardLine className="h-5 w-5" />}
                  {link.key === "clients" && <RiUserLine className="h-5 w-5" />}
                  {link.key === "exercises" && <RiWeightLine className="h-5 w-5" />}
                  {link.key === "routines" && <RiFolderChartLine className="h-5 w-5" />}
                  {link.key === "programs" && <RiBarChartBoxLine className="h-5 w-5" />}
                </span>
                <span>{t(link.key)}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {(["en", "es"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setLocale(option)}
            className={`h-8 border-2 px-3 text-xs font-bold uppercase tracking-[0.25em] ${
              locale === option
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </aside>
  );
}
