import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const student = (searchParams.get("student") ?? "").trim();
  const startUrl = student ? `/pwa?student=${encodeURIComponent(student)}` : "/pwa";

  return NextResponse.json(
    {
      name: "Cafizo",
      short_name: "Cafizo",
      description: "Progreso",
      id: startUrl,
      start_url: startUrl,
      scope: "/",
      display: "standalone",
      background_color: "#F8F7F4",
      theme_color: "#2D9D6A",
      icons: [
        {
          src: "/favicon.ico",
          sizes: "48x48",
          type: "image/x-icon",
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "no-store",
      },
    },
  );
}
