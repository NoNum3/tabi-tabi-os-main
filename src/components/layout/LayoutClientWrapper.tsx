// Mark this component as client-side
"use client";

import React from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
    closeSidebarAtom,
    sidebarOpenAtom,
} from "@/application/atoms/sidebarAtoms";
import { Sidebar } from "@/components/layout/Sidebar";
import { GoogleAnalytics } from "@next/third-parties/google";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface LayoutClientWrapperProps {
    children: React.ReactNode;
}

export const LayoutClientWrapper: React.FC<LayoutClientWrapperProps> = (
    { children },
) => {
    // Get sidebar state and setters from Jotai
    const isOpen = useAtomValue(sidebarOpenAtom);
    const closeSidebar = useSetAtom(closeSidebarAtom);

    return (
        <DndProvider backend={HTML5Backend}>
            {/* Render Sidebar */}
            <Sidebar />

            {/* Main Content Area - This structure might need adjusting depending on exact layout needs now */}
            <div className="flex h-screen">
                {/* We might need to adjust main content padding/margin dynamically if sidebar pushes content */}
                {/* For now, assuming overlay as implemented */}
                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>

            {/* Backdrop Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out"
                    onClick={closeSidebar} // Close sidebar when clicking overlay
                    aria-hidden="true"
                />
            )}

            {/* Google Analytics - Moved here as it might depend on client-side logic or session */}
            <GoogleAnalytics
                gaId={process.env.NEXT_PUBLIC_GA_ID || ""}
            />
        </DndProvider>
    );
};
