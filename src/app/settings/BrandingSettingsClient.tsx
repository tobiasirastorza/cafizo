"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { RiCheckLine, RiPaletteLine } from "@remixicon/react";

import { useToast } from "@/app/components/ToastProvider";
import {
  BRAND_PRIMARY_COOKIE,
  DEFAULT_PRIMARY_COLOR,
  getBrandingThemeVariables,
  isAccessibleBrandColor,
  normalizeHexColor,
} from "@/lib/branding-theme";

const PRESET_COLORS = [
  "#2D9D6A",
  "#3A7D6B",
  "#5B6CFA",
  "#8A5CF6",
  "#C56A3D",
];

type BrandingSettingsClientProps = {
  initialPrimaryColor: string;
};

function applyThemeToDocument(primaryColor: string) {
  const root = document.documentElement;
  const variables = getBrandingThemeVariables(primaryColor);

  Object.entries(variables).forEach(([token, value]) => {
    root.style.setProperty(token, value);
  });
}

export default function BrandingSettingsClient({
  initialPrimaryColor,
}: BrandingSettingsClientProps) {
  const t = useTranslations("Settings");
  const toast = useToast();
  const [draftColor, setDraftColor] = useState(initialPrimaryColor);
  const normalizedDraftColor = normalizeHexColor(draftColor);
  const isValidColor = Boolean(normalizedDraftColor);
  const passesContrast = normalizedDraftColor
    ? isAccessibleBrandColor(normalizedDraftColor)
    : false;
  const hasChanges =
    (normalizedDraftColor ?? draftColor.trim().toUpperCase()) !== initialPrimaryColor.toUpperCase();
  const canSave = Boolean(normalizedDraftColor && hasChanges);
  const previewStyle = useMemo(
    () =>
      (getBrandingThemeVariables(normalizedDraftColor ?? initialPrimaryColor) as CSSProperties),
    [initialPrimaryColor, normalizedDraftColor],
  );

  const persistColor = (nextColor: string) => {
    document.cookie = `${BRAND_PRIMARY_COOKIE}=${nextColor};path=/;max-age=31536000;samesite=lax`;
    applyThemeToDocument(nextColor);
  };

  const handleSave = () => {
    if (!isValidColor) {
      toast.error(t("invalidColor"));
      return;
    }

    if (!passesContrast || !normalizedDraftColor) {
      toast.error(t("contrastError"));
      return;
    }

    setDraftColor(normalizedDraftColor);
    persistColor(normalizedDraftColor);
    toast.success(t("saved"));
  };

  const handleReset = () => {
    setDraftColor(DEFAULT_PRIMARY_COLOR);
    persistColor(DEFAULT_PRIMARY_COLOR);
    toast.success(t("resetDone"));
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <section className="border-b border-border pb-6">
        <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
          {t("brandingLabel")}
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-foreground-secondary">{t("description")}</p>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1.5fr)_360px_280px]">
        <section className="rounded-lg border border-border bg-background-card p-5">
          <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("brandingTitle")}</h2>
              <p className="mt-2 text-sm text-foreground-secondary">{t("brandingDescription")}</p>
            </div>
            {initialPrimaryColor === DEFAULT_PRIMARY_COLOR ? (
              <span className="rounded-[4px] bg-background-muted px-2 py-1 text-xs font-medium text-foreground-secondary">
                {t("defaultBadge")}
              </span>
            ) : null}
          </div>

          <div className="mt-5 flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                  {t("pickerLabel")}
                </label>
                <input
                  type="color"
                  aria-label={t("pickerLabel")}
                  value={normalizedDraftColor ?? DEFAULT_PRIMARY_COLOR}
                  onChange={(event) => setDraftColor(event.target.value)}
                  className="h-10 w-full cursor-pointer rounded-md border border-border bg-background-card p-1"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                  {t("hexLabel")}
                </label>
                <input
                  type="text"
                  value={draftColor}
                  onChange={(event) => setDraftColor(event.target.value)}
                  placeholder={DEFAULT_PRIMARY_COLOR}
                  className="h-10 w-full rounded-md border border-border bg-background-card px-3 text-sm text-foreground transition-colors duration-150 focus:border-accent focus:outline-none"
                />
                <p className="mt-2 text-xs text-foreground-secondary">{t("helper")}</p>
                {!isValidColor ? (
                  <p className="mt-2 text-xs text-error">{t("invalidColor")}</p>
                ) : null}
                {isValidColor && !passesContrast ? (
                  <p className="mt-2 text-xs text-error">{t("contrastError")}</p>
                ) : null}
                {isValidColor && passesContrast && !hasChanges ? (
                  <p className="mt-2 text-xs text-foreground-secondary">{t("noChanges")}</p>
                ) : null}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                {t("presetsLabel")}
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((preset) => {
                  const isSelected = normalizeHexColor(draftColor) === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDraftColor(preset)}
                      className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors duration-150 ${
                        isSelected
                          ? "border-accent bg-accent-light text-accent"
                          : "border-border bg-background-card text-foreground hover:bg-background-muted"
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-[4px] border border-border-subtle"
                        style={{ backgroundColor: preset }}
                      />
                      <span>{preset}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="inline-flex h-10 items-center justify-center rounded-md border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("save")}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background-card px-4 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-background-muted"
              >
                {t("reset")}
              </button>
            </div>
          </div>
        </section>

        <aside
          className="rounded-lg border border-border bg-background-card p-5"
          style={previewStyle}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background-card text-accent">
              <RiPaletteLine size={18} />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                {t("previewLabel")}
              </div>
              <h2 className="mt-1 text-lg font-semibold text-foreground">{t("brandingTitle")}</h2>
            </div>
          </div>

          <p className="mt-4 text-sm text-foreground-secondary">{t("previewDescription")}</p>

          <div className="mt-5 flex flex-col gap-3">
            <div className="rounded-md border border-accent/20 bg-accent-light p-3 text-sm font-medium text-accent">
              {t("previewNav")}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-[4px] bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                {t("previewChip")}
              </span>
              <span className="inline-flex items-center rounded-[4px] bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                {t("previewBadge")}
              </span>
            </div>

            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-md border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90"
            >
              {t("previewButton")}
            </button>

            <div className="rounded-md border border-border p-3">
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                {t("previewFocus")}
              </label>
              <input
                readOnly
                value={normalizedDraftColor ?? DEFAULT_PRIMARY_COLOR}
                className="h-10 w-full rounded-md border border-accent bg-background-card px-3 text-sm text-foreground focus:outline-none"
              />
            </div>

            <button
              type="button"
              className="w-fit text-sm font-medium text-accent transition-colors duration-150 hover:text-accent/80"
            >
              {t("previewLink")}
            </button>

            <div className="rounded-md border border-border bg-background-muted p-3">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-[4px] border border-accent bg-accent text-accent-foreground">
                  <RiCheckLine size={14} />
                </span>
                {t("previewChip")}
              </div>
            </div>
          </div>
        </aside>

        <aside className="hidden rounded-lg border border-border bg-background-card p-5 2xl:block">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
              {t("appliesLabel")}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-foreground">{t("appliesTitle")}</h2>
            <p className="mt-2 text-sm text-foreground-secondary">{t("appliesDescription")}</p>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            {["appliesButtons", "appliesNavigation", "appliesSelection", "appliesLinks", "appliesFocus"].map(
              (key) => (
                <div
                  key={key}
                  className="rounded-md border border-border bg-background-card px-3 py-2 text-sm text-foreground"
                >
                  {t(key)}
                </div>
              ),
            )}
          </div>

          <div className="mt-5 border-t border-border-subtle pt-4">
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
              {t("guardrailsLabel")}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {["guardrailNeutral", "guardrailContrast", "guardrailSelection"].map((key) => (
                <p key={key} className="text-sm text-foreground-secondary">
                  {t(key)}
                </p>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
