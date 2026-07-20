import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/oswald";
import "./globals.css";

import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: {
    default: "Pllayz · Play where the city plays",
    template: "%s · Pllayz",
  },
  description:
    "Book trusted Cricket, Football, Badminton, Pickleball and Tennis venues across Chandigarh, Mohali and Panchkula.",
  applicationName: "Pllayz",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pllayz",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f7f9f8",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
