"use client";

import { useAtom } from "jotai";
import { profileAtom, userAtom } from "@/atoms/authAtoms";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { useState } from "react";
import { SignInForm, SignUpForm } from "./AuthForms";
import { supabase } from "@/lib/supabaseClient";

export const UserMenu = () => {
    const [user] = useAtom(userAtom);
    const [profile] = useAtom(profileAtom);
    const [showSignIn, setShowSignIn] = useState(false);
    const [showSignUp, setShowSignUp] = useState(false);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        // Optionally clear atoms or show toast
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center gap-2 p-2">
                <Button variant="outline" onClick={() => setShowSignIn(true)}>
                    <User className="w-4 h-4 mr-2" /> Sign In
                </Button>
                <SignInForm open={showSignIn} onOpenChange={setShowSignIn} />
                <SignUpForm open={showSignUp} onOpenChange={setShowSignUp} />
                <div className="text-xs text-muted-foreground">
                    No account?{" "}
                    <button
                        className="underline"
                        onClick={() => {
                            setShowSignIn(false);
                            setShowSignUp(true);
                        }}
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-2 p-2">
            <Avatar className="w-10 h-10">
                <AvatarImage
                    src={profile?.avatar_url || undefined}
                    alt={profile?.full_name || user.email || "User"}
                />
                <AvatarFallback>
                    {(profile?.full_name || user.email || "U").slice(0, 2)
                        .toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="text-sm font-semibold text-center">
                {profile?.full_name || user.email}
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
            >
                <LogOut className="w-4 h-4" /> Sign Out
            </Button>
        </div>
    );
};

export default UserMenu;
