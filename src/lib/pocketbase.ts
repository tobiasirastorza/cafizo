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

const PB_BASE_URL = "https://pb.barrani.app";
const PB_FETCH_TIMEOUT_MS = Number(process.env.PB_FETCH_TIMEOUT_MS ?? 30000);
const PB_FETCH_RETRIES = Number(process.env.PB_FETCH_RETRIES ?? 2);

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number) {
  return status >= 500 || status === 429 || status === 408;
}

function isNonNetworkBuildError(message: string) {
  return message.includes("Dynamic server usage");
}

async function fetchWithTimeout(input: string, init?: RequestInit) {
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= PB_FETCH_RETRIES) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PB_FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
        cache: "no-store",
      });
      const elapsed = Date.now() - startedAt;

      if (isRetryableStatus(response.status) && attempt < PB_FETCH_RETRIES) {
        console.error(
          `[PB] retryable status=${response.status} attempt=${attempt + 1} elapsedMs=${elapsed} url=${input}`,
        );
        attempt += 1;
        await sleep(300 * attempt);
        continue;
      }

      return response;
    } catch (error) {
      const elapsed = Date.now() - startedAt;
      if (error instanceof Error && error.name === "AbortError") {
        lastError = new Error(
          `PocketBase request timeout after ${PB_FETCH_TIMEOUT_MS}ms (attempt ${attempt + 1})`,
        );
      } else {
        lastError =
          error instanceof Error
            ? error
            : new Error("PocketBase request failed");
      }

      if (isNonNetworkBuildError(lastError.message)) {
        throw lastError;
      }

      console.error(
        `[PB] request failed attempt=${attempt + 1} elapsedMs=${elapsed} url=${input} error=${lastError.message}`,
      );

      if (attempt >= PB_FETCH_RETRIES) {
        break;
      }

      attempt += 1;
      await sleep(300 * attempt);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError ?? new Error("PocketBase request failed");
}

export async function pbList<T extends PocketBaseRecord>(
  collection: string,
  query?: Record<string, string | number>,
): Promise<PocketBaseList<T>> {
  const res = await fetchWithTimeout(
    buildUrl(`/collections/${collection}/records`, query),
  );

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
): Promise<T | null> {
  const res = await fetchWithTimeout(
    buildUrl(`/collections/${collection}/records/${id}`),
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `PocketBase get failed: ${collection}/${id} (${res.status}) ${detail}`,
    );
  }

  return res.json();
}
