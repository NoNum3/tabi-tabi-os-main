"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAtomValue, useSetAtom } from "jotai";
import {
    addAppToDashboardAtom,
    addedAppIdsAtom,
    removeAppFromDashboardAtom,
} from "@/application/atoms/dashboardAtoms";
import { AppCategory, appRegistry } from "@/config/appRegistry";
import Image from "next/image";
import { useI18n } from "@/locales/client";
import { Grip, LayoutGrid, List, PlusCircle, Search, X } from "lucide-react";
import { cn } from "@/infrastructure/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type SortOption = "name-asc" | "name-desc";
type DisplayMode = "comfortable-grid" | "compact-grid" | "list";

interface AppCardProps {
    appId: string;
    config: typeof appRegistry[string];
    displayMode: DisplayMode;
    isInstalled: boolean;
}

export const AppStoreWindow: React.FC = () => {
    const t = useI18n();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<
        AppCategory | "All"
    >(
        "All",
    );
    const [sortOption, setSortOption] = useState<SortOption>("name-asc");
    const [displayMode, setDisplayMode] = useState<DisplayMode>(
        "comfortable-grid",
    );
    const addedAppIds = useAtomValue(addedAppIdsAtom);
    const installedAppIdsSet = new Set(addedAppIds);

    const allCategories: AppCategory[] = Array.from(
        new Set(Object.values(appRegistry).map((app) => app.category)),
    );

    const filteredAndSortedApps = Object.entries(appRegistry)
        // Exclude the App Store itself from the list
        .filter(([appId]) => appId !== "appStore")
        // Existing filters for search and category
        .filter(([appId, config]) => {
            const name = t(config.nameKey || appId, { count: 1 });
            const matchesSearch = name.toLowerCase().includes(
                searchTerm.toLowerCase(),
            );
            const matchesCategory = selectedCategory === "All" ||
                config.category === selectedCategory;
            return matchesSearch && matchesCategory;
        })
        .sort(([, configA], [, configB]) => {
            const nameA = t(configA.nameKey || "", { count: 1 });
            const nameB = t(configB.nameKey || "", { count: 1 });
            if (sortOption === "name-asc") {
                return nameA.localeCompare(nameB);
            }
            return nameB.localeCompare(nameA);
        });

    const installedApps: [string, typeof appRegistry[string]][] = [];
    const availableApps: [string, typeof appRegistry[string]][] = [];

    filteredAndSortedApps.forEach(([appId, config]) => {
        if (installedAppIdsSet.has(appId)) {
            installedApps.push([appId, config]);
        } else {
            availableApps.push([appId, config]);
        }
    });

    const groupedApps: {
        [key in AppCategory]?: [string, typeof appRegistry[string]][];
    } = {};
    if (selectedCategory !== "All") {
        filteredAndSortedApps.forEach(([appId, config]) => {
            if (!groupedApps[config.category]) {
                groupedApps[config.category] = [];
            }
            groupedApps[config.category]?.push([appId, config]);
        });
    }

    const displayInstalledAvailableSplit = selectedCategory === "All";

    return (
        <div className="flex flex-col h-full bg-background text-foreground">
            {/* Header & Controls */}
            <div className="p-3 sm:p-4 border-b border-border sticky top-0 bg-background z-10 space-y-3">
                <h2 className="text-lg font-semibold">
                    {t("appStoreTitle", { count: 1 })}
                </h2>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder={t("appStoreSearch", { count: 1 })}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 w-full"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                        <Select
                            value={selectedCategory}
                            onValueChange={(value: AppCategory | "All") =>
                                setSelectedCategory(value)}
                        >
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <SelectValue
                                    placeholder={t("appStoreFilterCategory", { count: 1 })}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">
                                    {t("appStoreAllCategories", { count: 1 })}
                                </SelectItem>
                                {allCategories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {t(`appStoreCategory${category.charAt(0).toUpperCase() + category.slice(1)}`, { count: 1 })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={sortOption}
                            onValueChange={(value: SortOption) =>
                                setSortOption(value)}
                        >
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <SelectValue
                                    placeholder={t("appStoreSortBy", { count: 1 })}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name-asc">
                                    {t("appStoreSortNameAsc", { count: 1 })}
                                </SelectItem>
                                <SelectItem value="name-desc">
                                    {t("appStoreSortNameDesc", { count: 1 })}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <ToggleGroup
                            type="single"
                            value={displayMode}
                            onValueChange={(value: DisplayMode) =>
                                value && setDisplayMode(value)}
                            aria-label="Display mode"
                            className="justify-start"
                        >
                            <ToggleGroupItem
                                value="comfortable-grid"
                                aria-label="Comfortable Grid"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="compact-grid"
                                aria-label="Compact Grid"
                            >
                                <Grip className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="list"
                                aria-label="List view"
                            >
                                <List className="h-4 w-4" />
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </div>
            </div>

            {/* App Grid/List */}
            <ScrollArea className="flex-grow p-3 sm:p-4 space-y-6">
                {displayInstalledAvailableSplit
                    ? (
                        <>
                            {/* --- Render Installed Apps Section --- */}
                            {installedApps.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3 px-1">
                                        {t("appStoreSectionInstalled", { count: 1 })}
                                    </h3>
                                    <AppContainer displayMode={displayMode}>
                                        {installedApps.map((
                                            [appId, config],
                                        ) => (
                                            <AppCard
                                                key={appId}
                                                appId={appId}
                                                config={config}
                                                displayMode={displayMode}
                                                isInstalled={true}
                                            />
                                        ))}
                                    </AppContainer>
                                </section>
                            )}

                            {/* --- Separator --- */}
                            {installedApps.length > 0 &&
                                availableApps.length > 0 && (
                                <hr className="border-border my-4" />
                            )}

                            {/* --- Render Available Apps Section --- */}
                            {availableApps.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3 px-1">
                                        {t("appStoreSectionAvailable", { count: 1 })}
                                    </h3>
                                    <AppContainer displayMode={displayMode}>
                                        {availableApps.map((
                                            [appId, config],
                                        ) => (
                                            <AppCard
                                                key={appId}
                                                appId={appId}
                                                config={config}
                                                displayMode={displayMode}
                                                isInstalled={false}
                                            />
                                        ))}
                                    </AppContainer>
                                </section>
                            )}

                            {/* Handle case where no apps match filters at all */}
                            {installedApps.length === 0 &&
                                availableApps.length === 0 && (
                                <div className="text-center text-muted-foreground py-10">
                                    {t("appStoreNoAppsFound", { count: 1 })}
                                </div>
                            )}
                        </>
                    )
                    : (
                        /* --- Original Rendering (when category filter is active) --- */
                        /* This part might need refinement if category + installed/available is desired */
                        <AppContainer displayMode={displayMode}>
                            {filteredAndSortedApps.map(([appId, config]) => (
                                <AppCard
                                    key={appId}
                                    appId={appId}
                                    config={config}
                                    displayMode={displayMode}
                                    isInstalled={installedAppIdsSet.has(appId)}
                                />
                            ))}
                            {filteredAndSortedApps.length === 0 && (
                                <div className="text-center text-muted-foreground py-10">
                                    {t("appStoreNoAppsFound", { count: 1 })}
                                </div>
                            )}
                        </AppContainer>
                    )}
            </ScrollArea>
        </div>
    );
};

const AppContainer: React.FC<
    React.PropsWithChildren<{ displayMode: DisplayMode }>
> = (
    { children, displayMode },
) => {
    const gridClasses = displayMode === "list"
        ? "flex flex-col gap-2"
        : displayMode === "compact-grid"
        ? "grid gap-3 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]"
        : "grid gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]";

    return <div className={gridClasses}>{children}</div>;
};

const AppCard: React.FC<AppCardProps> = (
    { appId, config, displayMode, isInstalled },
) => {
    const t = useI18n();
    const addApp = useSetAtom(addAppToDashboardAtom);
    const removeApp = useSetAtom(removeAppFromDashboardAtom);

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        addApp(appId);
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeApp(appId);
    };

    const buttonProps = isInstalled
        ? {
            variant: "secondary" as const,
            onClick: handleRemove,
            textKey: "appStoreRemove",
            icon: <X className="h-4 w-4 mr-1.5" />,
        }
        : {
            variant: "default" as const,
            onClick: handleAdd,
            textKey: "appStoreAdd",
            icon: <PlusCircle className="h-4 w-4 mr-1.5" />,
        };

    const cardContent = (
        <>
            <Image
                src={config.src}
                alt={t(config.nameKey || appId, { count: 1 })}
                width={displayMode === "list"
                    ? 32
                    : displayMode === "compact-grid"
                    ? 40
                    : 48}
                height={displayMode === "list"
                    ? 32
                    : displayMode === "compact-grid"
                    ? 40
                    : 48}
                className="rounded-md flex-shrink-0 shadow-md"
            />
            <div
                className={cn(
                    "flex-grow overflow-hidden",
                    displayMode === "list" ? "ml-3" : "mt-2 text-center",
                )}
            >
                <p
                    className={cn(
                        "font-medium truncate",
                        displayMode === "list" ? "text-sm" : "text-xs",
                    )}
                    title={t(config.nameKey || appId, { count: 1 })}
                >
                    {t(config.nameKey || appId, { count: 1 })}
                </p>
                {displayMode !== "compact-grid" && (
                    <p className="text-xs text-muted-foreground truncate">
                        {t(`appStoreCategory${config.category.charAt(0).toUpperCase() + config.category.slice(1)}`, { count: 1 })}
                    </p>
                )}
            </div>
        </>
    );

    if (displayMode === "list") {
        return (
            <div className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                {cardContent}
                <Button
                    size="sm"
                    variant={buttonProps.variant}
                    onClick={buttonProps.onClick}
                    className="ml-auto flex-shrink-0"
                >
                    {buttonProps.icon}
                    {t(buttonProps.textKey as keyof ReturnType<typeof t>, {
                        count: 1,
                    })}
                </Button>
            </div>
        );
    } else {
        return (
            <div
                className={cn(
                    "group relative flex flex-col items-center p-3 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-150 ease-in-out",
                    displayMode === "compact-grid"
                        ? "aspect-square justify-center"
                        : "",
                )}
            >
                {cardContent}
                <Button
                    size="sm"
                    variant={buttonProps.variant}
                    onClick={buttonProps.onClick}
                    className="mt-2 w-full"
                >
                    {buttonProps.icon}
                    {t(buttonProps.textKey as keyof ReturnType<typeof t>, {
                        count: 1,
                    })}
                </Button>
            </div>
        );
    }
};
AppCard.displayName = "AppCard";
