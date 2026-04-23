import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PB_BASE_URL = "http://35.209.214.205:8090";
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL!;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD!;

// Cache the admin token with a refresh strategy
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAdminToken(): Promise<string> {
  // Return cached token if still valid (with 5min buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  const res = await fetch(`${PB_BASE_URL}/api/admins/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: PB_ADMIN_EMAIL,
      password: PB_ADMIN_PASSWORD,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to authenticate with PocketBase: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = data.token;
  // PocketBase default token expiration is 2 hours (7200s)
  tokenExpiresAt = Date.now() + 7200 * 1000;

  return cachedToken!;
}

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
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
    const data = await retryResponse.json().catch(() => null);
    return NextResponse.json(data, { status: retryResponse.status });
  }

  const data = await pbResponse.json().catch(() => null);
  return NextResponse.json(data, { status: pbResponse.status });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PATCH = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
