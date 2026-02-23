import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cafizo",
    short_name: "Cafizo",
    description: "Progreso",
    start_url: "/pwa",
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
  };
}
