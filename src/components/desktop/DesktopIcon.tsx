"use client";

import React from "react";
import Image from "next/image";
import { useAtom } from "jotai";
import { openWindowAtom } from "@/application/atoms/windowAtoms";
// import { appRegistry } from "@/config/appRegistry"; // Removed unused import
import { useI18n } from "@/locales/client";
import { playSound } from "@/infrastructure/lib/utils";
import { AppRegistration } from "@/types"; // Import the defined type

interface DesktopIconProps {
    app: AppRegistration; // Use the defined type
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({ app }) => {
    const [, openWindow] = useAtom(openWindowAtom);
    const t = useI18n();

    const handleOpenApp = () => {
        playSound("/sounds/click.mp3"); // Optional: Add click sound
        openWindow({
            id: `${app.id}-${Date.now()}`,
            appId: app.id,
            title: t(app.nameKey as keyof ReturnType<typeof t>, {
                count: 1,
            }),
            initialSize: app.defaultSize || { width: 600, height: 400 },
            minSize: app.minSize,
            children: React.createElement(app.component),
        });
    };

    return (
        <button
            onClick={handleOpenApp}
            className="flex flex-col items-center justify-center w-20 h-24 p-2 text-center rounded-md hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent focus:ring-white/50 transition-colors duration-150 group"
            title={t(app.nameKey as keyof ReturnType<typeof t>, {
                count: 1,
            })} // Tooltip with translated name
        >
            <div className="relative w-10 h-10 mb-1">
                {/* Assume icons are in /icons/apps/ or similar */}
                <Image
                    src={app.src}
                    alt={`${t(app.nameKey as keyof ReturnType<typeof t>, {
                        count: 1,
                    })} Icon`}
                    width={40}
                    height={40}
                    className="object-contain group-hover:scale-110 transition-transform"
                />
            </div>
            <span className="text-xs text-white dark:text-gray-200 font-medium truncate w-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                {t(app.nameKey as keyof ReturnType<typeof t>, {
                    count: 1,
                })}
            </span>
        </button>
    );
};
