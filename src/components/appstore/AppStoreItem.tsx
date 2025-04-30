"use client";

import React from "react";
import Image from "next/image";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Minus, Plus } from "lucide-react";
import { useI18n } from "@/locales/client";
import type { AppRegistryEntry } from "@/config/appRegistry"; // Import the type

interface AppStoreItemProps {
    app: AppRegistryEntry & { id: string }; // Add id explicitly if not in entry
}

export const AppStoreItem: React.FC<AppStoreItemProps> = ({ app }) => {
    const t = useI18n();
    const appName = t(app.id as keyof ReturnType<typeof t>, {
        count: 1,
    }); // Get translated name

    // Placeholder state/logic for like/add
    const isLiked = false; // TODO: Get from user state
    const likeCount = Math.floor(Math.random() * 100); // TODO: Get from backend
    const isAdded = false; // TODO: Get from user dashboard state

    const handleLike = () => {
        console.log("Like clicked for:", app.id);
        // TODO: Implement like logic (update state, call backend)
    };

    const handleAddRemove = () => {
        console.log("Add/Remove clicked for:", app.id);
        // TODO: Implement add/remove logic (update dashboard state)
    };

    return (
        <Card className="flex flex-col overflow-hidden h-full shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="p-4 flex-row items-center gap-3 space-y-0">
                <Image
                    src={app.src}
                    alt={appName}
                    width={40}
                    height={40}
                    className="rounded-md border border-border bg-muted object-contain p-1"
                />
                <CardTitle className="text-base font-medium leading-none flex-grow truncate">
                    {appName}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm text-muted-foreground flex-grow">
                {/* TODO: Add App Description here */}
                Placeholder description for{" "}
                {appName}. This app helps you do amazing things!
            </CardContent>
            <CardFooter className="p-3 flex justify-between items-center border-t bg-muted/30">
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-2 ${
                        isLiked
                            ? "text-red-500 hover:text-red-600"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={handleLike}
                >
                    <Heart
                        className={`h-4 w-4 mr-1 ${
                            isLiked ? "fill-current" : ""
                        }`}
                    />
                    <span className="text-xs tabular-nums">{likeCount}</span>
                </Button>
                <Button
                    variant={isAdded ? "outline" : "default"}
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={handleAddRemove}
                >
                    {isAdded
                        ? <Minus className="h-4 w-4 mr-1" />
                        : <Plus className="h-4 w-4 mr-1" />}
                    {isAdded ? t("appStoreRemove", { count: 1 }) : t("appStoreAdd", { count: 1 })}
                </Button>
            </CardFooter>
        </Card>
    );
};
