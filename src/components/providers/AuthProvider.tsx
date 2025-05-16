"use client";

import React, { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { supabase } from "@/infrastructure/lib/supabaseClient";
import {
    authLoadingAtom,
    Profile,
    profileAtom,
    sessionAtom,
    userAtom,
} from "@/application/atoms/authAtoms";
import type { Session, User } from "@supabase/supabase-js";
import type { PrimitiveAtom } from "jotai";

interface AuthProviderProps {
    children: React.ReactNode;
    initialSession?: Session | null; // Accept initialSession from SSR
    initialProfile?: Profile | null; // Accept initialProfile from SSR
}

export const AuthProvider = (
    { children, initialSession, initialProfile }: AuthProviderProps,
) => {
    const [, setSession] = useAtom(
        sessionAtom as PrimitiveAtom<Session | null>,
    );
    const [, setUser] = useAtom(userAtom as PrimitiveAtom<User | null>);
    const [, setProfile] = useAtom(
        profileAtom as PrimitiveAtom<Profile | null>,
    );
    const setLoading = useSetAtom(authLoadingAtom);

    useEffect(() => {
        let profileSubscriptionMounted = true;

        const fetchProfile = async (userId: string) => {
            console.log("[AuthProvider] fetchProfile called with userId:", userId);
            let profileToSet: Profile | null = null;
            try {
                const { data: profileData, error: profileError } =
                    await supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", userId)
                        .single();
                if (
                    profileError &&
                    (!("code" in profileError) ||
                        profileError.code !== "PGRST116")
                ) {
                    console.error(
                        "[AuthProvider] Error fetching profile:",
                        JSON.stringify(profileError, null, 2),
                    );
                } else if (profileData) {
                    const typedData = profileData as { [key: string]: unknown, username?: string | null, full_name?: string | null };
                    profileToSet = {
                        ...profileData,
                        username: typedData.username ?? typedData.full_name ?? null,
                    } as Profile;
                }
            } catch (e) {
                console.error("[AuthProvider] Exception during profile fetch:", e);
            } finally {
                if (profileSubscriptionMounted) {
                    setProfile(profileToSet);
                    setLoading(false);
                    console.log("[AuthProvider] setProfile", profileToSet);
                    console.log("[AuthProvider] fetchProfile result", profileToSet);
                }
            }
        };

        // 1. Hydrate from SSR initialSession if provided
        if (initialSession) {
            setSession(initialSession);
            console.log("[AuthProvider] setSession (SSR)", initialSession);
            setUser(initialSession.user ?? null);
            console.log("[AuthProvider] setUser (SSR)", initialSession.user ?? null);
            if (initialSession.user) {
                if (!initialProfile) {
                    fetchProfile(initialSession.user.id).finally(() => setLoading(false));
                } else {
                    setLoading(false);
                }
            } else {
                setProfile(null);
                setLoading(false);
            }
        } else {
            // 2. Fallback: Initial check from client
            supabase.auth.getSession().then(async ({ data: { session } }) => {
                if (profileSubscriptionMounted) {
                    setSession(session);
                    console.log("[AuthProvider] setSession (client)", session);
                    setUser(session?.user ?? null);
                    console.log("[AuthProvider] setUser (client)", session?.user ?? null);
                    if (session?.user) {
                        await fetchProfile(session.user.id);
                    } else {
                        setProfile(null);
                        console.log("[AuthProvider] setProfile (client) null");
                    }
                    setLoading(false);
                }
            }).catch((err) => {
                console.error("[AuthProvider] Error in getSession:", err);
                setLoading(false);
            });
        }

        // 3. Listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!profileSubscriptionMounted) return;
                setSession(session);
                console.log("[AuthProvider] setSession (onAuthStateChange)", session);
                setUser(session?.user ?? null);
                console.log("[AuthProvider] setUser (onAuthStateChange)", session?.user ?? null);
                if (session?.user) {
                    setLoading(true);
                    setTimeout(async () => {
                        await fetchProfile(session.user.id);
                        setLoading(false);
                    });
                } else {
                    setProfile(null);
                    console.log("[AuthProvider] setProfile (onAuthStateChange) null");
                    setLoading(false);
                }
            },
        );

        // 4. Listen for storage events (cross-tab sync)
        const onStorage = (event: StorageEvent) => {
            if (event.key && event.key.startsWith("sb-")) {
                supabase.auth.getSession().then(({ data: { session } }) => {
                    setSession(session);
                    console.log("[AuthProvider] setSession (storage)", session);
                    setUser(session?.user ?? null);
                    console.log("[AuthProvider] setUser (storage)", session?.user ?? null);
                    if (session?.user) {
                        setTimeout(() => {
                            fetchProfile(session.user.id).finally(() => setLoading(false));
                        });
                    } else {
                        setProfile(null);
                        console.log("[AuthProvider] setProfile (storage) null");
                        setLoading(false);
                    }
                }).catch((err) => {
                    console.error("[AuthProvider] Error in getSession (storage):", err);
                    setLoading(false);
                });
            }
        };
        window.addEventListener("storage", onStorage);

        // 5. Listen for tab focus to re-fetch session (fixes logout on tab switch)
        const onFocus = () => {
            console.log("[AuthProvider] Tab focus event fired");
            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
                console.log("[AuthProvider] setSession (focus)", session);
                setUser(session?.user ?? null);
                console.log("[AuthProvider] setUser (focus)", session?.user ?? null);
                if (session?.user) {
                    console.log("[AuthProvider] Calling fetchProfile from onFocus");
                    setTimeout(() => {
                        fetchProfile(session.user.id)
                            .then(() => console.log("[AuthProvider] fetchProfile completed (onFocus)"))
                            .finally(() => setLoading(false));
                    });
                } else {
                    setProfile(null);
                    console.log("[AuthProvider] setProfile (focus) null");
                    setLoading(false);
                }
            }).catch((err) => {
                console.error("[AuthProvider] Error in getSession (focus):", err);
                setLoading(false);
            });
        };
        window.addEventListener("focus", onFocus);

        return () => {
            profileSubscriptionMounted = false;
            authListener?.subscription.unsubscribe();
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("focus", onFocus);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSession, initialProfile]);

    // Hydrate profile atom from initialProfile whenever it changes
    useEffect(() => {
        if (typeof initialProfile !== "undefined" && initialProfile !== null) {
            setProfile(initialProfile);
            console.log("[AuthProvider] setProfile (SSR initialProfile)", initialProfile);
        }
    }, [initialProfile, setProfile]);

    return <>{children}</>;
};
