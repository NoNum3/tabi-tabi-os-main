import { createI18nMiddleware } from "next-international/middleware";
import { type NextRequest } from "next/server";

const I18nMiddleware = createI18nMiddleware({
    locales: ["en", "zh-TW"],
    defaultLocale: "en",
    // Optional: Enable locale detection based on headers
    // urlMappingStrategy: 'rewrite', // Keeps locale in URL
});

export function middleware(request: NextRequest) {
    return I18nMiddleware(request);
}

export const config = {
    matcher: [
        // Skip internal paths, API routes, and paths likely containing static assets (e.g., with a file extension)
        "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sounds/|icons/|metadata/|background/|.*\.\w+).*)",
    ],
};
