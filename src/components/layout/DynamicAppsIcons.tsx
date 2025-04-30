"use client";

import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useEffect, useState } from "react"; // Import hooks

// --- Define Quotes ---
const loadingQuotes = [
    "Rearranging the pixels...",
    "Polishing the icons...",
    "Loading awesome apps...",
    "Brewing some code...",
    "Waking up the components...",
    "Almost there...",
    "Summoning the UI...",
];

// --- Updated Loading Component for Full Screen ---
const LoadingFallback = () => {
    const [quote, setQuote] = useState("");

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * loadingQuotes.length);
        setQuote(loadingQuotes[randomIndex]);
    }, []);

    return (
        // --- Apply fixed positioning and background for full screen overlay ---
        <div className="fixed inset-0 z-[9998] flex flex-col justify-center items-center bg-background/90 backdrop-blur-sm text-center">
            {/* Increased spinner size for full screen */}
            <LoadingSpinner size="lg" />
            {quote && (
                <p className="mt-4 text-lg text-muted-foreground italic">
                    {quote}
                </p>
            )}
        </div>
    );
};

// --- Dynamically import AppsIcons with updated fallback ---
const AppsIcons = dynamic(
    () => import("@/components/apps").then((mod) => mod.AppsIcons),
    {
        ssr: false,
        // Use the new LoadingFallback component
        loading: LoadingFallback, // Pass the component reference
    },
);

// This component just renders the dynamically imported AppsIcons
export default function DynamicAppsIcons() {
    return <AppsIcons />;
}
