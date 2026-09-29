import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Brick VPN — Free, open-source VPN, built in public",
    template: "%s — Brick VPN",
  },
  description:
    "Brick is a free, open-source, privacy-focused VPN client for Android, built on a sing-box core. No telemetry. In active development.",
  metadataBase: new URL("https://brickvpn.dev"),
  openGraph: {
    type: "website",
    siteName: "Brick VPN",
    title: "Brick VPN — Free, open-source VPN, built in public",
    description:
      "A free, open-source, privacy-focused VPN client for Android. Built on a sing-box core. No telemetry. In active development.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brick VPN — Free, open-source VPN, built in public",
    description:
      "A free, open-source, privacy-focused VPN client for Android. Built on a sing-box core. No telemetry. In active development.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
