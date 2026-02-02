import PocketBase from "pocketbase";

type PocketBaseList<T> = {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

type PocketBaseRecord = {
  id: string;
};

const PB_BASE_URL = (
  process.env.PB_URL ??
  process.env.NEXT_PUBLIC_PB_URL ??
  "http://127.0.0.1:8090"
).replace(/\/$/, "");

export function createPocketBase() {
  const pb = new PocketBase(PB_BASE_URL);
  pb.beforeSend = (url, options) => {
    options.cache = "no-store";
    return { url, options };
  };
  return pb;
}

export async function authAsAdmin() {
  const pb = createPocketBase();
  await pb.collection("_superusers").authWithPassword(
    process.env.PB_ADMIN_EMAIL!,
    process.env.PB_ADMIN_PASSWORD!
  );
  return pb;
}

function buildUrl(path: string, query?: Record<string, string | number>) {
  const url = new URL(`${PB_BASE_URL}/api${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

export async function pbList<T extends PocketBaseRecord>(
  collection: string,
  query?: Record<string, string | number>,
): Promise<PocketBaseList<T>> {
  const res = await fetch(buildUrl(`/collections/${collection}/records`, query), {
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `PocketBase list failed: ${collection} (${res.status}) ${detail}`,
    );
  }

  return res.json();
}

export async function pbGetOne<T extends PocketBaseRecord>(
  collection: string,
  id: string,
): Promise<T> {
  const res = await fetch(buildUrl(`/collections/${collection}/records/${id}`), {
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `PocketBase get failed: ${collection}/${id} (${res.status}) ${detail}`,
    );
  }

  return res.json();
}
