import type { Metadata, Viewport } from "next";
import { Itim } from "next/font/google";
import "@/styles/globals.css";
import JotaiProvider from "@/components/providers/JotaiProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { I18nProviderClient } from "@/locales/client";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LayoutClientWrapper } from "@/components/layout/LayoutClientWrapper";
import { createSupabaseServerClient } from "@/infrastructure/lib/supabaseServerClient";
import { Toaster } from "@/components/ui/sonner";
import { AuthAtomLogger } from "@/components/debug/AuthAtomLogger";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

// Removed dynamic export as async components are dynamic by default
// export const dynamic = 'force-dynamic';

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
        images: [{ url: "/metadata/tabi-og.png", width: 1200, height: 630 }],
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

// Define RootLayoutProps if not already defined
// Remove RootLayoutProps interface, as Next.js now provides params as a Promise in async layouts

// Update RootLayout to use the new async params pattern
export default async function RootLayout({ children, params }: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    const resolvedParams = await params;
    const locale = resolvedParams.locale;

    // SSR: Fetch Supabase session on the server
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    // Fetch profile if session exists
    let profile = null;
    if (session?.user) {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
        if (data) {
            const typedData = data as { [key: string]: unknown, username?: string | null, full_name?: string | null };
            profile = {
                ...data,
                username: typedData.username ?? typedData.full_name ?? null,
            };
        }
    }

    return (
        <html lang={locale} suppressHydrationWarning>
            <head />
            <body className={font.className}>
                <I18nProviderClient locale={locale}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <JotaiProvider>
                            <AuthProvider
                                initialSession={session}
                                initialProfile={profile}
                            >
                                <AuthAtomLogger />
                                <LayoutClientWrapper>
                                    {children}
                                </LayoutClientWrapper>
                                <Toaster position="bottom-right" />
                                <Analytics />
                                <SpeedInsights />
                            </AuthProvider>
                        </JotaiProvider>
                    </ThemeProvider>
                </I18nProviderClient>
            </body>
        </html>
    );
}
