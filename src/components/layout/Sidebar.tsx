"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { cn } from "@/infrastructure/lib/utils";
import { useAtomValue } from "jotai";
import { sidebarOpenAtom } from "@/application/atoms/sidebarAtoms";
import { useI18n } from "@/locales/client";
import { profileAtom, userAtom } from "@/application/atoms/authAtoms";
import { formatDistanceToNow } from "date-fns";

// --- Configuration for Sidebar Items ---

// TODO: Replace with actual user data and auth logic later

// --- Sidebar Component ---
export const Sidebar: React.FC = () => {
    const t = useI18n();
    const isOpen = useAtomValue(sidebarOpenAtom);

    // Auth State
    const user = useAtomValue(userAtom);
    const profile = useAtomValue(profileAtom);

    // Calculate account age
    let accountAge = "";
    if (user?.created_at) {
        try {
            accountAge = formatDistanceToNow(new Date(user.created_at), {
                addSuffix: true,
            });
        } catch {
            /* (e) */ accountAge = "Error calculating age";
        }
    }

    return (
        <aside
            className={cn(
                "fixed top-0 left-0 h-screen w-64 bg-background/90 backdrop-blur-sm border-r border-border z-50",
                "flex flex-col transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "-translate-x-full",
            )}
        >
            <div className="p-4 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-10 w-10 border">
                        <AvatarImage
                            src={profile?.avatar_url ?? undefined}
                            alt={profile?.username || "User Avatar"}
                        />
                        <AvatarFallback>
                            <User className="h-5 w-5" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-foreground truncate">
                            {profile?.username || "Guest"}
                        </p>
                        {accountAge && (
                            <p className="text-xs text-muted-foreground">
                                Member for {accountAge}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-border mt-auto flex-shrink-0">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-1">
                    {t("bookmarkAddNew", { count: 1 })}
                </h4>
                <Button
                    variant="link"
                    size="sm"
                    className="justify-start p-0 h-auto text-muted-foreground hover:text-primary"
                    onClick={() => {/* Open App Store */}}
                >
                    Discover more apps in the App Store
                </Button>
            </div>
        </aside>
    );
};
