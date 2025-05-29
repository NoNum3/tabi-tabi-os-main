"use client";

import React, { useState } from "react";
import { useI18n } from "@/locales/client";
import {
    ChevronRight,
    Image as ImageIcon, // Alias Image to avoid conflict
    // Lock, // Remove unused import
    // Import other icons as needed
    Palette,
    Moon,
    Layout
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "next-themes";

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
    const { theme, setTheme } = useTheme();
    const [search, setSearch] = useState("");

    // Settings data for search/filter
    const settings = [
        {
            category: t("settingsCategoryTaskbar", { count: 1 }),
            items: [
                {
                    icon: Palette,
                    titleKey: "accentColorSettingsTitle",
                    descriptionKey: "accentColorSettingsDescription",
                    onClick: () => navigateTo("accentColor"),
                },
                {
                    icon: Layout,
                    titleKey: "taskbarColorSettingsTitle",
                    descriptionKey: "taskbarColorSettingsDescription",
                    onClick: () => navigateTo("taskbarColor"),
                },
                {
                    icon: Layout,
                    titleKey: "taskbarIconSizeTitle",
                    descriptionKey: "taskbarIconSizeDescription",
                    onClick: () => navigateTo("taskbarIconSize"),
                },
            ],
        },
        {
            category: t("settingsCategoryAppearance", { count: 1 }),
            items: [
                {
                    icon: ImageIcon,
                    titleKey: "wallpaperSettingsTitle",
                    descriptionKey: "wallpaperSettingsDescription",
                    onClick: () => navigateTo("wallpaper"),
                },
                {
                    icon: Moon,
                    titleKey: "darkModeTitle",
                    descriptionKey: "darkModeDescription",
                    onClick: () => {},
                    isThemeToggle: true,
                },
            ],
        },
    ];

    // Filter settings by search
    const filteredSettings = settings.map(section => ({
        ...section,
        items: section.items.filter(item => {
            const title = t(item.titleKey, { count: 1 }).toLowerCase();
            const desc = t(item.descriptionKey, { count: 1 }).toLowerCase();
            return (
                !search ||
                title.includes(search.toLowerCase()) ||
                desc.includes(search.toLowerCase())
            );
        }),
    })).filter(section => section.items.length > 0);

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border bg-muted/30 sticky top-0 z-10">
                <input
                    type="text"
                    placeholder="Search settings..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="mt-2 w-full px-3 py-2 rounded border border-border bg-background text-sm"
                    aria-label="Search settings"
                />
            </div>
            <ScrollArea className="flex-grow">
                <div className="p-2 sm:p-4 space-y-1">
                    {filteredSettings.map(section => (
                        <React.Fragment key={section.category}>
                            <h3 className="px-4 pt-5 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {section.category}
                            </h3>
                            {section.items.map((item) =>
                                item.isThemeToggle ? (
                                    <div key={item.titleKey} className="flex items-center px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors">
                                        <item.icon className="h-5 w-5 mr-4 text-muted-foreground flex-shrink-0" />
                                        <div className="flex-grow">
                                            <p className="text-sm font-medium">{t(item.titleKey, { count: 1 })}</p>
                                            <p className="text-xs text-muted-foreground">{t(item.descriptionKey, { count: 1 })}</p>
                                        </div>
                                        <div className="flex gap-2 ml-2" role="radiogroup" aria-label={t('darkModeTitle', { count: 1 })}>
                                            <button
                                                className={`px-2 py-1 rounded text-xs font-medium border ${theme === 'light' ? 'bg-accent text-accent-foreground border-accent' : 'bg-muted text-muted-foreground border-border'} focus:outline-none focus:ring-2 focus:ring-primary`}
                                                aria-checked={theme === 'light'}
                                                role="radio"
                                                onClick={() => setTheme('light')}
                                            >
                                                {t('themeLight', { count: 1 })}
                                            </button>
                                            <button
                                                className={`px-2 py-1 rounded text-xs font-medium border ${theme === 'dark' ? 'bg-accent text-accent-foreground border-accent' : 'bg-muted text-muted-foreground border-border'} focus:outline-none focus:ring-2 focus:ring-primary`}
                                                aria-checked={theme === 'dark'}
                                                role="radio"
                                                onClick={() => setTheme('dark')}
                                            >
                                                {t('themeDark', { count: 1 })}
                                            </button>
                                            <button
                                                className={`px-2 py-1 rounded text-xs font-medium border ${theme === 'system' ? 'bg-accent text-accent-foreground border-accent' : 'bg-muted text-muted-foreground border-border'} focus:outline-none focus:ring-2 focus:ring-primary`}
                                                aria-checked={theme === 'system'}
                                                role="radio"
                                                onClick={() => setTheme('system')}
                                            >
                                                {t('themeSystem', { count: 1 })}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <SettingsItem
                                        key={item.titleKey}
                                        icon={item.icon}
                                        titleKey={item.titleKey}
                                        descriptionKey={item.descriptionKey}
                                        onClick={item.onClick}
                                    />
                                )
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};
