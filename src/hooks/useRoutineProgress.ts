import { buildProxyUrl } from "@/lib/pocketbase";

function buildUrl(path: string) {
  // Route through our server-side proxy to ensure auth headers are included
  const proxyUrl = new URL(buildProxyUrl(path));
  return proxyUrl.toString();
}

export function buildPocketBaseUrl(path: string) {
  return buildUrl(path);
}
