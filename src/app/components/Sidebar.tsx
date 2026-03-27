"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  RiCalendarEventLine,
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
      { href: "/classes", key: "classes", icon: RiCalendarEventLine },
      { href: "/exercises", key: "exercises", icon: RiWeightLine },
      { href: "/routines", key: "routines", icon: RiFolderChartLine },
    ],
  },
];

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export default function Sidebar({ className, onNavigate }: SidebarProps) {
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
    <aside
      className={`relative flex h-screen w-full flex-col border-r border-border bg-background-sidebar p-4 md:sticky md:top-0 md:w-[250px] ${className ?? ""}`}
    >
      {/* Organization/Brand Section */}
      <div className="mb-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="overflow-hidden rounded-full border border-border bg-background-card p-2">
            <Image
              src="/logo.jpeg"
              alt="Vida Total logo"
              width={64}
              height={64}
              className="h-16 w-16 bg-background-card object-contain"
              priority
            />
          </div>
          <div className="text-base font-semibold text-foreground">Vida Total</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="min-h-0 flex-1 overflow-y-auto">
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
                    onClick={onNavigate}
                    className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-all duration-150 ${
                      isActive
                        ? "border border-accent/20 bg-accent-light text-accent font-medium"
                        : "border-transparent text-foreground-secondary hover:bg-background-muted hover:text-foreground"
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
      <div className="mt-4 pt-3">
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
