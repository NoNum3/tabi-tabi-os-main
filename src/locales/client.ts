"use client"; // Ensure this is treated as a client module

import { createI18nClient } from "next-international/client";

export const {
    useI18n,
    useScopedI18n,
    I18nProviderClient,
    useChangeLocale,
    useCurrentLocale,
} = createI18nClient({
    en: () => import("./en"),
    "zh-TW": () => import("./zh-TW"),
});
