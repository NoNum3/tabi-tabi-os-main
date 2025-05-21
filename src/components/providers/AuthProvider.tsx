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
                } else if (profileData) {
                    const typedData = profileData as { [key: string]: unknown, username?: string | null, full_name?: string | null };
                    profileToSet = {
                        ...profileData,
                        username: typedData.username ?? typedData.full_name ?? null,
                    } as Profile;
                }
            } catch {
            } finally {
                if (profileSubscriptionMounted) {
                    setProfile(profileToSet);
                    setLoading(false);
                }
            }
        };

        // 1. Hydrate from SSR initialSession if provided
        if (initialSession) {
            setSession(initialSession);
            setUser(initialSession.user ?? null);
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
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        await fetchProfile(session.user.id);
                    } else {
                        setProfile(null);
                    }
                    setLoading(false);
                }
            }).catch(() => {
                setLoading(false);
            });
        }

        // 3. Listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!profileSubscriptionMounted) return;
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    setLoading(true);
                    setTimeout(async () => {
                        await fetchProfile(session.user.id);
                        setLoading(false);
                    });
                } else {
                    setProfile(null);
                    setLoading(false);
                }
            },
        );

        // 4. Listen for storage events (cross-tab sync)
        const onStorage = (event: StorageEvent) => {
            if (event.key && event.key.startsWith("sb-")) {
                supabase.auth.getSession().then(({ data: { session } }) => {
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        setTimeout(() => {
                            fetchProfile(session.user.id).finally(() => setLoading(false));
                        });
                    } else {
                        setProfile(null);
                    }
                }).catch(() => {
                    setLoading(false);
                });
            }
        };
        window.addEventListener("storage", onStorage);

        // 5. Listen for tab focus to re-fetch session (fixes logout on tab switch)
        const onFocus = () => {
            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    setTimeout(() => {
                        fetchProfile(session.user.id)
                            .finally(() => setLoading(false));
                    });
                } else {
                    setProfile(null);
                    setLoading(false);
                }
            }).catch(() => {
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
        }
    }, [initialProfile, setProfile]);

    return <>{children}</>;
};
