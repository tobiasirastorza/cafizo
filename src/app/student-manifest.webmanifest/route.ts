import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const student = (searchParams.get("student") ?? "").trim();
  const startUrl = student ? `/pwa?student=${encodeURIComponent(student)}` : "/pwa";

  return NextResponse.json(
    {
      name: "Vida Total",
      short_name: "Vida Total",
      description: "Progreso",
      id: startUrl,
      start_url: startUrl,
      scope: "/",
      display: "standalone",
      background_color: "#F8F7F4",
      theme_color: "#2D9D6A",
      icons: [
        {
          src: "/pwa-192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/pwa-512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/pwa-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
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
