import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PB_BASE_URL = "https://api.vidatotal.fit";
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

// Cache the admin token with a refresh strategy
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAdminToken(): Promise<string> {
  // Return cached token if still valid (with 5min buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
    throw new Error("Missing PB_ADMIN_EMAIL or PB_ADMIN_PASSWORD");
  }

  const res = await fetch(`${PB_BASE_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: PB_ADMIN_EMAIL,
      password: PB_ADMIN_PASSWORD,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to authenticate with PocketBase: ${res.status} ${body}`);
  }

  const data = await res.json();
  cachedToken = data.token;
  // PocketBase default token expiration is 2 hours (7200s)
  tokenExpiresAt = Date.now() + 7200 * 1000;

  return cachedToken!;
}

async function toNextResponse(pbResponse: Response) {
  if ([204, 205, 304].includes(pbResponse.status)) {
    return new NextResponse(null, { status: pbResponse.status });
  }

  const text = await pbResponse.text();
  if (!text) {
    return new NextResponse(null, { status: pbResponse.status });
  }

  try {
    const json = JSON.parse(text);
    return NextResponse.json(json, { status: pbResponse.status });
  } catch {
    return new NextResponse(text, {
      status: pbResponse.status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pbPath = `/api/${path.join("/")}`;
    const pbUrl = `${PB_BASE_URL}${pbPath}${request.nextUrl.search}`;

    const token = await getAdminToken();

    const init: RequestInit = {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      init.body = await request.text();
    }

    const pbResponse = await fetch(pbUrl, init);

    // If token expired, refresh and retry once
    if (pbResponse.status === 401) {
      cachedToken = null; // force refresh
      const freshToken = await getAdminToken();

      if (init.headers) {
        (init.headers as Record<string, string>).Authorization = `Bearer ${freshToken}`;
      }

      const retryResponse = await fetch(pbUrl, init);
      return toNextResponse(retryResponse);
    }

    return toNextResponse(pbResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proxy error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PATCH = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
