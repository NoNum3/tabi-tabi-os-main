"use client";

import React from "react";
import { useI18n } from "@/locales/client";
import {
    ChevronRight,
    Image as ImageIcon, // Alias Image to avoid conflict
    // Lock, // Remove unused import
    // Import other icons as needed
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SettingsItemProps {
    icon: React.ElementType;
    titleKey: string; // Key for translation
    descriptionKey: string; // Key for translation
    onClick: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = (
    { icon: Icon, titleKey, descriptionKey, onClick },
) => {
    const t = useI18n();
    return (
        <button
            onClick={onClick}
            className="flex items-center w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
        >
            <Icon className="h-5 w-5 mr-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-grow">
                <p className="text-sm font-medium">
                    {t(titleKey as keyof ReturnType<typeof t>, {
                        defaultValue: titleKey,
                    })}
                </p>
                <p className="text-xs text-muted-foreground">
                    {t(descriptionKey as keyof ReturnType<typeof t>, {
                        defaultValue: descriptionKey,
                    })}
                </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
        </button>
    );
};

interface SettingsListProps {
    // Define the type for the navigateTo function prop
    navigateTo: (view: string) => void; // Specify function signature
}

export const SettingsList: React.FC<SettingsListProps> = ({ navigateTo }) => {
    const t = useI18n();

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border bg-muted/30 sticky top-0 z-10">
                <h2 className="text-lg font-semibold">Background</h2>
            </div>
            <ScrollArea className="flex-grow">
                <div className="p-2 sm:p-4 space-y-1">
                    {/* Personalization Settings */}
                    <h3 className="px-4 pt-5 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("settingsCategoryAppearance", {
                            count: 1,
                        })}
                    </h3>
                    <SettingsItem
                        icon={ImageIcon} // Use alias
                        titleKey="wallpaperSettingsTitle"
                        descriptionKey="wallpaperSettingsDescription"
                        onClick={() => navigateTo("wallpaper")}
                    />
                </div>
            </ScrollArea>
        </div>
    );
};
