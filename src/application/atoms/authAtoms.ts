import { atom, WritableAtom } from "jotai";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/infrastructure/lib/supabaseClient";

// Profile type matches Supabase profiles table
export interface Profile {
    id: string; // uuid
    username: string | null;
    profile_picture: string | null;
    email: string;
    created_at: string | null;
    // points?: number | null;
    // level?: number | null;
}

export const sessionAtom = atom<Session | null>(null);
sessionAtom.debugLabel = "sessionAtom";

export const userAtom = atom<User | null>(null);
userAtom.debugLabel = "userAtom";

export const profileAtom = atom<Profile | null>(null);
profileAtom.debugLabel = "profileAtom";

// Optional: Atom to track loading state during auth checks/profile fetch
export const authLoadingAtom = atom<boolean>(true);
authLoadingAtom.debugLabel = "authLoadingAtom";

// Async atom to fetch profile from Supabase
export const fetchProfileAtom = atom(
    null,
    async (get, set, id: string) => {
        try {
            set(authLoadingAtom, true);
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", id)
                .single();
            if (error) {
                set(profileAtom as WritableAtom<Profile | null, [Profile | null], void>, null);
            } else {
                // Map full_name to username for backward compatibility
                const typedData = data as { [key: string]: unknown, username?: string | null, full_name?: string | null };
                const profileData = {
                    ...data,
                    username: typedData.username ?? typedData.full_name ?? null,
                };
                set(profileAtom as WritableAtom<Profile | null, [Profile | null], void>, profileData as Profile);
            }
        } finally {
            set(authLoadingAtom, false);
        }
    },
);

// Atom to update profile (username, avatar)
export const updateProfileAtom = atom(
    null,
    async (get, set, updates: Partial<Profile>) => {
        const user = get(userAtom);
        if (!user) return;
        const { error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", user.id);
        if (!error) {
            set(fetchProfileAtom, user.id); // Refresh profile
        }
    },
);
