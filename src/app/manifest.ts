import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pllayz · Tricity Sports Venues",
    short_name: "Pllayz",
    description:
      "Login-gated multi-sport venue booking across Chandigarh, Mohali and Panchkula.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9f8",
    theme_color: "#f7f9f8",
    orientation: "portrait-primary",
    categories: ["sports", "lifestyle", "booking"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
