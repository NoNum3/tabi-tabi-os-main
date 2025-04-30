import type { Metadata, Viewport } from "next";
import { Itim } from "next/font/google";
import "@/styles/globals.css";
import JotaiProvider from "@/components/providers/JotaiProvider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { GoogleAnalytics } from "@next/third-parties/google";

const font = Itim({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  ),
  title: "Tabi-Tabi OS",
  description:
    "A streamlined toolkit of reusable utilities prioritizing performance, minimalist design, and user experience.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      {
        url: "/icons/dark-ico/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
        rel: "alternate icon",
      },
    ],
    apple: [
      { url: "/icons/dark-ico/apple-icon.png", type: "image/png" },
      {
        url: "/icons/dark-ico/apple-icon-57x57.png",
        sizes: "57x57",
        type: "image/png",
      },
      {
        url: "/icons/dark-ico/apple-icon-60x60.png",
        sizes: "60x60",
        type: "image/png",
      },
      {
        url: "/icons/dark-ico/apple-icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        url: "/icons/dark-ico/apple-icon-76x76.png",
        sizes: "76x76",
        type: "image/png",
      },
      {
        url: "/icons/dark-ico/apple-icon-114x114.png",
        sizes: "114x114",
        type: "image/png",
      },
      {
        url: "/icons/dark-ico/apple-icon-120x120.png",
        sizes: "120x120",
        type: "image/png",
      },
      {
        url: "/icons/dark-ico/apple-icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        url: "/icons/dark-ico/apple-icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        url: "/icons/dark-ico/apple-icon-180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "icon",
        url: "/icons/dark-ico/android-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/icons/dark-ico/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "Tabi-Tabi OS",
    description: "A streamlined toolkit of reusable utilities.",
    url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    siteName: "Tabi-Tabi OS",
    images: [
      {
        url: "/metadata/tabi-og.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tabi-Tabi OS",
    description: "A streamlined toolkit of reusable utilities.",
    images: ["/metadata/tabi-og.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tabi-Tabi OS",
  },
  other: {
    "msapplication-TileColor": "#000000",
    "msapplication-TileImage": "/icons/dark-ico/ms-icon-144x144.png",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={font.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <JotaiProvider>{children}</JotaiProvider>
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
        </ThemeProvider>
      </body>
    </html>
  );
}
