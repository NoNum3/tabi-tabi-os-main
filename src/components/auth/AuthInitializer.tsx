"use client";

import { useCallback, useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { supabase } from "@/lib/supabaseClient";
import {
    authLoadingAtom,
    Profile,
    profileAtom,
    sessionAtom,
    userAtom,
} from "@/atoms/authAtoms";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import type { PrimitiveAtom } from "jotai";
import type { Session } from "@supabase/supabase-js";
import type { FC } from "react";

export const AuthInitializer: FC = () => {
    const [, setSession] = useAtom(
        sessionAtom as PrimitiveAtom<Session | null>,
    );
    const [, setUser] = useAtom(userAtom as PrimitiveAtom<User | null>);
    const [, setProfile] = useAtom(
        profileAtom as PrimitiveAtom<Profile | null>,
    );
    const setLoading = useSetAtom(authLoadingAtom);
    const router = useRouter();

    const fetchAndSetProfile = useCallback(async (user: User) => {
        try {
            console.log("[Auth] Fetching profile for user:", user.id);
            const { data, error, status } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error && status !== 406) { // 406 means no rows found, which is not an error for a missing profile
                throw error;
            }

            if (data) {
                console.log("[Auth] Profile fetched:", data);
                setProfile(data as Profile);
                localStorage.setItem("cachedProfile", JSON.stringify(data));
            } else {
                console.log("[Auth] No profile found");
                setProfile(null); // No profile found
                localStorage.removeItem("cachedProfile");
            }
        } catch (error) {
            console.error("[Auth] Error fetching profile:", error);
            setProfile(null); // Set profile to null on error
            localStorage.removeItem("cachedProfile");
        }
    }, [setProfile]);

    useEffect(() => {
        // Immediately set loading to true when component mounts and starts checking auth state
        setLoading(true);

        // Load cached profile for instant display
        const cached = localStorage.getItem("cachedProfile");
        if (cached) {
            try {
                setProfile(JSON.parse(cached));
                console.log("[Auth] Loaded cached profile from localStorage");
            } catch {
                localStorage.removeItem("cachedProfile");
            }
        }

        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            console.log("[Auth] Initial session:", session);
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchAndSetProfile(session.user);
            }
            setLoading(false); // Loading finished after initial check
        }).catch((error) => {
            console.error("[Auth] Error getting initial session:", error);
            setLoading(false); // Ensure loading is false even on error
        });

        // Set up the onAuthStateChange listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log("[Auth] onAuthStateChange event:", event, session);
                setLoading(true); // Set loading true during auth state changes
                setSession(session);
                setUser(session?.user ?? null);

                if (
                    event === "SIGNED_IN" || event === "TOKEN_REFRESHED" ||
                    event === "INITIAL_SESSION"
                ) {
                    if (session?.user) {
                        await fetchAndSetProfile(session.user);
                    } else {
                        setProfile(null);
                        localStorage.removeItem("cachedProfile");
                    }
                } else if (event === "SIGNED_OUT") {
                    setProfile(null);
                    localStorage.removeItem("cachedProfile");
                    console.log(
                        "[Auth] User signed out, profile set to null",
                    );
                }
                setLoading(false); // Loading finished after processing event
            },
        );

        // Add visibilitychange event to rehydrate session on tab focus
        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                router.refresh();
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);

        // Cleanup listener on unmount
        return () => {
            authListener?.subscription?.unsubscribe();
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [
        setSession,
        setUser,
        setProfile,
        setLoading,
        fetchAndSetProfile,
        router,
    ]);

    return null;
};
