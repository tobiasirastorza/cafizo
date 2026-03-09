import { cookies } from "next/headers";

import AppShell from "@/app/components/AppShell";
import {
  BRAND_PRIMARY_COOKIE,
  DEFAULT_PRIMARY_COLOR,
  normalizeHexColor,
} from "@/lib/branding-theme";

import BrandingSettingsClient from "./BrandingSettingsClient";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const initialPrimaryColor =
    normalizeHexColor(cookieStore.get(BRAND_PRIMARY_COOKIE)?.value) ?? DEFAULT_PRIMARY_COLOR;

  return (
    <AppShell>
      <BrandingSettingsClient initialPrimaryColor={initialPrimaryColor} />
    </AppShell>
  );
}
