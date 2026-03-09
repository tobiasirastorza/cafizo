# Todo

## Plan
- [x] Inspect current theme token setup, settings/navigation surface, and persistence constraints.
- [x] Add a minimal Settings entry point with a Branding section for primary accent customization.
- [x] Implement tokenized primary-color persistence and runtime application without changing neutral surfaces.
- [x] Build a constrained preview showing only themeable accent states.
- [x] Verify build behavior and targeted lint for touched files.

## Review
- Added `/settings` inside the shared AppShell and linked it from the sidebar as a workspace-level configuration surface.
- Added a Branding section with color picker, hex input, preset swatches, constrained accent preview, save, and reset actions.
- Persisted the primary accent color through the `vt_brand_primary` cookie and applied it at the root layout level so the theme survives reloads.
- Derived accent variables in `/Users/tobineta/Desktop/vidatotal/front/src/lib/branding-theme.ts` and kept warm neutral surfaces unchanged.
- Updated sidebar active navigation to use the accent treatment so the customization is visible in core navigation.
- `corepack pnpm build` passed.
- Full `corepack pnpm lint` is still blocked by pre-existing issues in `/Users/tobineta/Desktop/vidatotal/front/src/app/components/LocaleSwitcher.tsx`, `/Users/tobineta/Desktop/vidatotal/front/src/app/pwa/InstallAppButton.tsx`, and warnings in `/Users/tobineta/Desktop/vidatotal/front/src/app/dashboard/DashboardClient.tsx`.

- Tightened Settings page width by expanding the content container from max-w-4xl to max-w-6xl and widened the preview column.
- Adjusted save-button gating so it is disabled only when the value is invalid or unchanged. Contrast problems now remain visible inline instead of feeling like an unexplained disabled state.

- Reworked the desktop layout so the page uses the available width intentionally: form, live preview, and a 2xl-only guidance rail for affected states and guardrails.

- Rewrote the Settings copy to remove technical language and make the feature understandable for non-technical nutritionist users.

- Hid the unfinished Settings entry from the sidebar while keeping the implementation in the repo for backend wiring later.
