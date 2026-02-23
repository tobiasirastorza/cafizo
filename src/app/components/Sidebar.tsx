"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  RiDashboardLine,
  RiFolderChartLine,
  RiUserLine,
  RiWeightLine,
} from "@remixicon/react";

const navigationSections = [
  {
    labelKey: "mainMenu",
    links: [
      { href: "/dashboard", key: "dashboard", icon: RiDashboardLine },
      { href: "/students", key: "clients", icon: RiUserLine },
    ],
  },
  {
    labelKey: "training",
    links: [
      { href: "/exercises", key: "exercises", icon: RiWeightLine },
      { href: "/routines", key: "routines", icon: RiFolderChartLine },
    ],
  },
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
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `locale=${nextLocale};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  };

  return (
    <aside className="relative flex min-h-screen w-full flex-col justify-between border-r border-border bg-background-sidebar md:sticky md:top-0 md:w-[250px] p-4">
      {/* Organization/Brand Section */}
      <div className="mb-8">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground">
            <span className="text-lg font-semibold text-background-card">C</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Cafizo</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1">
        {navigationSections.map((section, sectionIndex) => (
          <div key={section.labelKey} className={sectionIndex > 0 ? "mt-6" : ""}>
            {/* Section Label */}
            <div className="mb-2 px-3 text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
              {t(section.labelKey)}
            </div>

            {/* Section Links */}
            <nav className="space-y-1">
              {section.links.map((link) => {
                const isActive = isActiveLink(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-150 ${
                      isActive
                        ? "bg-background-active text-foreground font-medium"
                        : "text-foreground-secondary hover:bg-background-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    <span>{t(link.key)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Language Switcher */}
      <div className="mt-8">
        <div className="flex rounded-md border border-border bg-background-card p-1">
          {(["en", "es"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLocale(option)}
              className={`flex-1 rounded px-3 py-1.5 text-xs font-medium uppercase tracking-[0.08em] transition-all duration-150 ${
                locale === option
                  ? "bg-background-card border border-border-strong text-foreground"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
