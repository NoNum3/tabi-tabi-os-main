"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useAtom } from "jotai";
import { focusWindowAtom, taskbarAppsAtom } from "@/application/atoms/windowAtoms";
import { appRegistry } from "@/config/appRegistry";
import { cn } from "@/infrastructure/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSetAtom } from "jotai";
import { toggleSidebarAtom } from "@/application/atoms/sidebarAtoms";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Image from "next/image";
import { useI18n } from "@/locales/client";
// Keep clock commented for now if not implemented
// import { Clock } from "@/components/shared/taskbar/Clock";

const Taskbar: React.FC = () => {
    const t = useI18n();
    const [taskbarApps] = useAtom(taskbarAppsAtom);
    const focusWindow = useSetAtom(focusWindowAtom);
    const [hasMounted, setHasMounted] = useState(false);
    const toggleSidebar = useSetAtom(toggleSidebarAtom);

    // Make taskbarBg reactive
    const [taskbarBg, setTaskbarBg] = useState(() =>
        typeof window !== 'undefined'
            ? getComputedStyle(document.documentElement).getPropertyValue('--taskbar-bg')?.trim()
            : undefined
    );
    useEffect(() => {
        setHasMounted(true);
        const interval = setInterval(() => {
            const current = getComputedStyle(document.documentElement).getPropertyValue('--taskbar-bg')?.trim();
            setTaskbarBg(prev => (prev !== current ? current : prev));
        }, 200);
        return () => clearInterval(interval);
    }, []);

    // Compute dynamic style for accent color and size
    // const accent = typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--accent')?.trim() : undefined;
    const accentIntensity = typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--accent-intensity')?.trim() : undefined;
    // Map intensity (70-130) to height (2.5rem to 4rem)
    const minHeight = 2.5; // rem
    const maxHeight = 4; // rem
    let heightRem = 3; // default
    if (accentIntensity) {
        const percent = Math.max(70, Math.min(130, parseInt(accentIntensity)));
        heightRem = minHeight + ((percent - 70) / 60) * (maxHeight - minHeight);
    }
    const taskbarStyle = {
        background: taskbarBg && /^(#|rgba?\()/i.test(taskbarBg) ? taskbarBg : 'rgba(0,0,0,0.4)',
        height: `${heightRem}rem`,
        transition: 'background 0.3s, height 0.3s',
    };

    if (!hasMounted) {
        return (
            <div className="fixed bottom-0 left-0 right-0 h-12 bg-background/80 backdrop-blur-md border-t border-border z-30 flex items-center justify-between px-3">
                {/* Placeholder or minimal taskbar during hydration */}
            </div>
        );
    }

    return (
        <TooltipProvider delayDuration={150}>
            <footer
                className="fixed bottom-4 left-1/2 transform -translate-x-1/2 max-w-fit border border-white/10 flex items-center justify-center gap-2 px-3 z-50 shadow-lg rounded-full backdrop-blur-lg"
                style={{ ...taskbarStyle, fontSize: 'var(--taskbar-font-size, 14px)' }}
            >
                <div className="flex items-center gap-1" style={{ fontSize: 'inherit' }}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                style={{ width: 'var(--taskbar-icon-size, 24px)', height: 'var(--taskbar-icon-size, 24px)', fontSize: 'inherit' }}
                                className="hover:bg-accent hover:text-accent-foreground rounded-full"
                                onClick={toggleSidebar}
                                aria-label="Toggle Sidebar"
                            >
                                <Menu className="h-full w-full" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center">
                            <p>Toggle Sidebar</p>
                        </TooltipContent>
                    </Tooltip>

                    <div className="h-6 w-px bg-border mx-1"></div>

                    <div className="flex items-center gap-1" style={{ fontSize: 'inherit' }}>
                        {taskbarApps.map((win) => {
                            const appConfig = appRegistry[win.appId];
                            const iconSrc = appConfig?.src;
                            const isActive = win.isActive;
                            const isMinimized = win.isMinimized;
                            const title = win.title || (appConfig
                                ? t(
                                    appConfig.nameKey || win.appId,
                                    { count: 1 },
                                )
                                : "Unknown App");

                            const handleClick = () => {
                                focusWindow(win.id);
                            };

                            const finalIconSrc = iconSrc ||
                                "/icons/default-app.png";

                            return (
                                <Tooltip key={win.id}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            style={{ width: 'var(--taskbar-icon-size, 24px)', height: 'var(--taskbar-icon-size, 24px)', fontSize: 'inherit' }}
                                            className={cn(
                                                "p-1.5 relative overflow-hidden transition-colors duration-150 ease-in-out rounded-full",
                                                isActive && !isMinimized
                                                    ? "bg-accent/80 hover:bg-accent"
                                                    : "hover:bg-accent/50",
                                                isMinimized ? "opacity-70" : "",
                                            )}
                                            onClick={handleClick}
                                            aria-label={`Open ${title}`}
                                        >
                                            <Suspense fallback={<div>Loading...</div>}>
                                                <Image
                                                    src={finalIconSrc}
                                                    alt={title}
                                                    width={24}
                                                    height={24}
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                />
                                            </Suspense>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={5}>
                                        <p>{title}</p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                </div>
            </footer>
        </TooltipProvider>
    );
};

export default Taskbar;
