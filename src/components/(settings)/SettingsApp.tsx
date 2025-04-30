"use client";

import React, { useState } from "react";
import { WallpaperSettings } from "./WallpaperSettings";
import { SettingsList } from "./SettingsList";

interface SettingsAppProps {
    windowId?: string;
}

// Define the possible views within the Settings app
type SettingsView = string;

export const SettingsApp: React.FC<SettingsAppProps> = () => {
    // const t = useI18n(); // Removed unused variable
    // --- Add Navigation State --- //
    const [currentView, setCurrentView] = useState<SettingsView>("main");

    // --- Navigation Handlers --- //
    const navigateTo = (section: string) => {
        setCurrentView(section);
    };

    const navigateBack = () => {
        setCurrentView("main");
    };

    // --- Render based on currentView --- //
    const renderContent = () => {
        switch (currentView) {
            case "wallpaper":
                return (
                    <WallpaperSettings
                        navigateBack={navigateBack}
                    />
                );
            case "main":
            default:
                return <SettingsList navigateTo={navigateTo} />;
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-background text-foreground">
            {/* Remove Tabs structure, render content directly */}
            {renderContent()}
        </div>
    );
};

export default SettingsApp;
