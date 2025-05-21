"use client";

import { useAtom } from "jotai";
import { profileAtom, userAtom } from "@/application/atoms/authAtoms";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useState } from "react";
import { SignInForm, SignUpForm } from "./AuthForms";
import { supabase } from "@/infrastructure/lib/supabaseClient";
import Image from 'next/image';

export const UserMenu = () => {
    const [user] = useAtom(userAtom);
    const [profile] = useAtom(profileAtom);
    const [showSignIn, setShowSignIn] = useState(false);
    const [showSignUp, setShowSignUp] = useState(false);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        // Optionally clear atoms or show toast
    };

    // Helper to check if profile_picture is a valid URL
    const isValidProfilePicture = (url: string | null | undefined) => {
        return !!url && url.startsWith('http');
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
            <div className="w-10 h-10 rounded-full overflow-hidden border flex items-center justify-center bg-gray-200">
                {user && isValidProfilePicture(profile?.profile_picture) ? (
                    <Image
                        src={profile?.profile_picture ?? ''}
                        alt={profile?.username || user.email || "User"}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                        style={{ objectFit: 'cover' }}
                        priority={true}
                    />
                ) : (
                    <span className="text-base font-bold text-gray-400">{(profile?.username || user?.email || "U").slice(0, 2).toUpperCase()}</span>
                )}
            </div>
            <div className="text-sm font-semibold text-center">
                {profile?.username || user.email}
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
