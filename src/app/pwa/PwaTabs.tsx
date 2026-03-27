"use client";

import Link from "next/link";

type PwaTabsProps = {
  selectedTab: "classes" | "training" | "history";
  studentId: string;
  selectedDayIndex: number;
  hasClasses: boolean;
  labels: {
    classes: string;
    training: string;
    history: string;
    aria: string;
  };
};

export default function PwaTabs({
  selectedTab,
  studentId,
  selectedDayIndex,
  hasClasses,
  labels,
}: PwaTabsProps) {
  const classesHref = `/pwa?student=${encodeURIComponent(studentId)}&tab=classes`;
  const trainingHref = `/pwa?student=${encodeURIComponent(studentId)}&tab=training&day=${selectedDayIndex}`;
  const historyHref = `/pwa?student=${encodeURIComponent(studentId)}&tab=history`;
  const tabs = [
    { key: "training", label: labels.training, href: trainingHref } as const,
    ...(hasClasses
      ? [{ key: "classes", label: labels.classes, href: classesHref } as const]
      : []),
    { key: "history", label: labels.history, href: historyHref } as const,
  ];

  return (
    <nav className="mt-6 flex border-b border-border" aria-label={labels.aria} role="tablist">
      {tabs.map((tab) => {
        const isActive = selectedTab === tab.key;

        return (
          <Link
            key={tab.key}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("app:navigation-start", { detail: { panel: tab.key } }),
              );
            }}
            className={`inline-flex h-11 flex-1 items-center justify-center border-b-2 px-4 text-sm font-medium transition-colors duration-150 ${
              isActive
                ? "border-accent text-foreground"
                : "border-transparent text-foreground-secondary hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
