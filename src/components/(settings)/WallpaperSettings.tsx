"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAtom, useSetAtom } from "jotai";
import {
    applyPreviewBackgroundAtom,
    BackgroundFit,
    BackgroundSettings,
    backgroundSettingsAtom,
    previewBackgroundAtom,
} from "@/atoms/backgroundAtom"; // Re-use existing atoms
import { playSound } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
// Removed Card imports as we will use direct layout
import { useI18n } from "@/locales/client";
import { ArrowLeft } from "lucide-react";
import type { PrimitiveAtom } from "jotai";

// Definitions from BackgroundChanger (can be moved to a shared place later if needed)
const backgrounds = [
    "/background/bg-1.png",
    "/background/bg-2.png",
    "/background/bg-3.png",
    "/background/bg-4.png",
    "/background/bg-5.png",
    "/background/bg-6.png",
];

interface WallpaperSettingsProps {
    navigateBack: () => void;
}

export const WallpaperSettings: React.FC<WallpaperSettingsProps> = (
    { navigateBack },
) => {
    const t = useI18n();
    const [savedSettings] = useAtom(backgroundSettingsAtom);
    const [previewSettings, setPreviewSettings] = useAtom(
        previewBackgroundAtom as PrimitiveAtom<BackgroundSettings | null>,
    );
    const applyPreview = useSetAtom(applyPreviewBackgroundAtom);

    const [tempSettings, setTempSettings] = useState<BackgroundSettings>(
        savedSettings,
    );
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Move fitOptions here so t is available
    const fitOptions: { value: BackgroundFit; label: string }[] = [
        {
            value: "fill",
            label: t("wallpaperFill", {
                count: 1,
            }),
        },
        {
            value: "fit",
            label: t("wallpaperFit", { count: 1 }),
        },
        { value: "stretch", label: t("wallpaperStretch", { count: 1 }) },
        { value: "tile", label: t("wallpaperTile", { count: 1 }) },
        { value: "center", label: t("wallpaperCenter", { count: 1 }) },
    ];

    // --- Hooks copied from BackgroundChanger --- //
    useEffect(() => {
        setTempSettings(savedSettings);
    }, [savedSettings]);

    useEffect(() => {
        if (savedSettings.url && savedSettings.url.startsWith("data:image")) {
            setUploadedImage(savedSettings.url);
        }
    }, [savedSettings.url]);

    useEffect(() => {
        if (JSON.stringify(tempSettings) !== JSON.stringify(savedSettings)) {
            setPreviewSettings(tempSettings);
        } else {
            setPreviewSettings(null);
        }
    }, [tempSettings, savedSettings, setPreviewSettings]);

    useEffect(() => {
        return () => {
            setPreviewSettings(null);
        };
    }, [setPreviewSettings]);

    // --- Handlers copied from BackgroundChanger --- //
    const handleSelectBackground = (bgUrl: string | null) => {
        playSound("/sounds/click.mp3");
        setTempSettings((prev) => ({ ...prev, url: bgUrl }));
    };

    const handleChangeFit = (value: string) => {
        setTempSettings((prev) => ({
            ...prev,
            fit: value as BackgroundFit,
        }));
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            if (result.length > 4 * 1024 * 1024) {
                alert(
                    "Image too large! Please select an image smaller than 4MB.",
                );
                return;
            }
            setUploadedImage(result);
            handleSelectBackground(result);
        };
        reader.onerror = () => {
            alert("Failed to read image file.");
        };
        reader.readAsDataURL(file);
    };

    const handleApply = () => {
        playSound("/sounds/click.mp3");
        applyPreview();
        navigateBack(); // Go back to main list after applying
    };

    const handleCancel = () => {
        playSound("/sounds/click.mp3");
        setPreviewSettings(null);
        navigateBack(); // Go back to main list
    };

    const hasChanges = previewSettings !== null;

    // --- JSX structure copied and adapted from BackgroundChanger --- //
    return (
        // Add outer div for layout including header
        <div className="flex flex-col h-full w-full">
            {/* --- Settings Header with Back Button --- */}
            <div className="flex items-center p-3 border-b border-border bg-muted/30 sticky top-0 z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2 h-8 w-8"
                    onClick={navigateBack}
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <h2 className="text-base font-semibold">
                    {t("wallpaperSettingsTitle", { count: 1 })}
                </h2>
            </div>

            {/* Use ScrollArea for content overflow */}
            <ScrollArea className="flex-grow w-full p-4 sm:p-6">
                <div className="space-y-6">
                    {/* Background Options */}
                    <div>
                        <h3 className="text-base font-semibold mb-3">
                            {t("wallpaperImage", { count: 1 })}
                        </h3>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
                            {/* No Image Option */}
                            <div
                                className={`cursor-pointer border-2 transition-colors ${
                                    tempSettings.url === null
                                        ? "border-primary bg-primary/10"
                                        : "border-muted hover:border-primary/50 bg-muted"
                                } rounded-lg overflow-hidden flex items-center justify-center min-h-[70px] sm:min-h-[80px]`}
                                onClick={() => handleSelectBackground(null)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        handleSelectBackground(null);
                                    }
                                }}
                            >
                                <div className="text-center text-xs sm:text-sm font-medium">
                                    {t("wallpaperNoImage", { count: 1 })}
                                </div>
                            </div>

                            {/* Upload Image Slot */}
                            <div
                                className={`cursor-pointer border-2 transition-colors relative ${
                                    uploadedImage &&
                                        tempSettings.url === uploadedImage
                                        ? "border-primary"
                                        : "border-muted hover:border-primary/50 bg-muted"
                                } rounded-lg overflow-hidden flex items-center justify-center min-h-[70px] sm:min-h-[80px]`}
                                onClick={() => fileInputRef.current?.click()}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        fileInputRef.current?.click();
                                    }
                                }}
                            >
                                {uploadedImage
                                    ? (
                                        <Image
                                            src={uploadedImage}
                                            alt="Uploaded Background"
                                            fill
                                            sizes="(max-width: 640px) 100vw, 300px"
                                            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                    )
                                    : (
                                        <div className="text-center text-xs sm:text-sm font-medium">
                                            {t("wallpaperUpload", { count: 1 })}
                                        </div>
                                    )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                        </div>
                        {/* Predefined Background Images */}
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                            {backgrounds.map((bg) => (
                                <div
                                    key={bg}
                                    className={`cursor-pointer border-2 transition-colors ${
                                        tempSettings.url === bg
                                            ? "border-primary"
                                            : "border-transparent hover:border-primary/50"
                                    } rounded-lg overflow-hidden aspect-[16/10] sm:aspect-video`}
                                    onClick={() => handleSelectBackground(bg)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === "Enter" || e.key === " "
                                        ) {
                                            handleSelectBackground(bg);
                                        }
                                    }}
                                >
                                    <Image
                                        src={bg}
                                        alt={`Background ${
                                            bg.split("/").pop()?.split(".")[0]
                                        }`}
                                        width={160} // Provide base sizes for better initial load
                                        height={100}
                                        sizes="(max-width: 640px) 150px, 200px"
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fit Options */}
                    <div>
                        <h4 className="text-sm font-semibold mb-2">
                            {t("wallpaperFitMode", { count: 1 })}
                        </h4>
                        <Select
                            value={tempSettings.fit}
                            onValueChange={handleChangeFit}
                        >
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue
                                    placeholder={t("wallpaperSelectFitMode", {
                                        count: 1,
                                    })}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {fitOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-sm py-3 px-4 -mx-4 -mb-4 border-t border-border sm:-mx-6 sm:-mb-6 sm:px-6 sm:py-4 rounded-b-lg">
                        <Button variant="ghost" onClick={handleCancel}>
                            {t("timerCancel", { count: 1 })}
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleApply}
                            disabled={!hasChanges}
                        >
                            {t("applyChange", { count: 1 })}
                        </Button>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};
