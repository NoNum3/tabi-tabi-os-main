"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const SessionSyncer = (): null => {
    const router = useRouter();

    useEffect(() => {
        const onFocus = () => {
            router.refresh();
        };
        const onStorage = (event: StorageEvent) => {
            if (event.key && event.key.startsWith("sb-")) {
                router.refresh();
            }
        };
        window.addEventListener("focus", onFocus);
        window.addEventListener("storage", onStorage);
        return () => {
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("storage", onStorage);
        };
    }, [router]);

    return null;
};
