import type { MetadataRoute } from "next";

/** Web app manifest (/manifest.webmanifest): name, colours and icons for "Add to home screen". */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prompt.Monster",
    short_name: "Prompt.Monster",
    description: "Fikrini 18 uzman canavar persona ile AI kodlama araçlarına hazır master build prompt'a çevir.",
    start_url: "/studio",
    scope: "/",
    display: "standalone",
    background_color: "#0A0A0B",
    theme_color: "#0A0A0B",
    lang: "tr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
