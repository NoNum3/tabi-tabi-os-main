import { atom, WritableAtom } from "jotai";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

// Profile type matches Supabase profiles table
export interface Profile {
    id: string; // uuid
    full_name: string | null;
    avatar_url: string | null;
    email: string;
    created_at: string | null;
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
        set(authLoadingAtom, true);
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", id)
            .single();
        if (error) {
            set(profileAtom as WritableAtom<Profile | null, [Profile | null], void>, null);
        } else {
            set(profileAtom as WritableAtom<Profile | null, [Profile | null], void>, data as Profile);
        }
        set(authLoadingAtom, false);
    },
);

// Atom to update profile (full name, avatar)
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
