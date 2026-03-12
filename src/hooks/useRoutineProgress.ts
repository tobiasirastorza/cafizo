const PB_BASE = "https://pb.barrani.app/api";

function buildUrl(path: string) {
  return `${PB_BASE}${path}`;
}

export function buildPocketBaseUrl(path: string) {
  return buildUrl(path);
}
