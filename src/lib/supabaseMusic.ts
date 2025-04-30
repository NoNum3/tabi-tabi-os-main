import { supabase } from "./supabaseClient";
import type { Database } from "../../database.types";

// --- Types ---
type PlaylistSongRow = Database["public"]["Tables"]["playlist_songs"]["Row"];
type PlaylistSongInsert =
    Database["public"]["Tables"]["playlist_songs"]["Insert"];
type PlaylistRow = Database["public"]["Tables"]["playlists"]["Row"];

const QUEUE_PLAYLIST_NAME = "Current Queue";

// --- Playlists ---
export async function getUserPlaylists(
    userId: string,
): Promise<(PlaylistRow & { songs: PlaylistSongRow[] })[]> {
    const { data, error } = await supabase
        .from("playlists")
        .select(
            "id, user_id, name, created_at, playlist_songs(id, playlist_id, seq_id, song_id, title, url)",
        )
        .eq("user_id", userId)
        .neq("name", QUEUE_PLAYLIST_NAME)
        .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((
        pl: PlaylistRow & { playlist_songs?: PlaylistSongRow[] },
    ) => ({
        ...pl,
        songs: (pl.playlist_songs || []) as PlaylistSongRow[],
    }));
}

export async function addPlaylist(
    userId: string,
    name: string,
): Promise<PlaylistRow & { songs: PlaylistSongRow[] }> {
    const { data, error } = await supabase
        .from("playlists")
        .insert([{ user_id: userId, name }])
        .select("id, user_id, name, created_at")
        .single();
    if (error) throw error;
    if (!data || !data.id || !data.user_id || !data.name) {
        throw new Error("Playlist creation failed: missing fields");
    }
    return {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        created_at: data.created_at ?? null,
        songs: [],
    };
}

export async function renamePlaylist(
    playlistId: string,
    name: string,
): Promise<void> {
    const { error } = await supabase
        .from("playlists")
        .update({ name })
        .eq("id", playlistId);
    if (error) throw error;
}

export async function deletePlaylist(playlistId: string): Promise<void> {
    const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", playlistId);
    if (error) throw error;
}

export async function addSongToPlaylist(
    playlistId: string,
    song: Omit<PlaylistSongInsert, "playlist_id">,
): Promise<void> {
    const { error } = await supabase
        .from("playlist_songs")
        .insert([{ ...song, playlist_id: playlistId }]);
    if (error) throw error;
}

export async function removeSongFromPlaylist(
    playlistId: string,
    songId: number,
): Promise<void> {
    const { error } = await supabase
        .from("playlist_songs")
        .delete()
        .eq("playlist_id", playlistId)
        .eq("id", songId);
    if (error) throw error;
}

export async function reorderSongsInPlaylist(
    playlistId: string,
    songIds: number[],
): Promise<void> {
    // Update the 'seq_id' field for ordering
    const updates = songIds.map((id, i) =>
        supabase.from("playlist_songs").update({ seq_id: i + 1 }).eq("id", id)
            .eq("playlist_id", playlistId)
    );
    const results = await Promise.all(updates);
    for (const r of results) if (r.error) throw r.error;
}

// --- Queue as Special Playlist ---
export async function getOrCreateQueuePlaylist(
    userId: string,
): Promise<PlaylistRow & { songs: PlaylistSongRow[] }> {
    const { data, error } = await supabase
        .from("playlists")
        .select(
            "id, user_id, name, created_at, playlist_songs(id, playlist_id, seq_id, song_id, title, url)",
        )
        .eq("user_id", userId)
        .eq("name", QUEUE_PLAYLIST_NAME)
        .single();
    if (error && error.code === "PGRST116") { // Not found
        const { data: created, error: createError } = await supabase
            .from("playlists")
            .insert([{ user_id: userId, name: QUEUE_PLAYLIST_NAME }])
            .select("id, user_id, name, created_at")
            .single();
        if (createError) throw createError;
        if (!created || !created.id || !created.user_id || !created.name) {
            throw new Error("Queue playlist creation failed: missing fields");
        }
        return {
            id: created.id,
            user_id: created.user_id,
            name: created.name,
            created_at: created.created_at ?? null,
            songs: [],
        };
    } else if (error) {
        throw error;
    }
    if (!data || !data.id || !data.user_id || !data.name) {
        throw new Error("Queue playlist fetch failed: missing fields");
    }
    return {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        created_at: data.created_at ?? null,
        songs: (data.playlist_songs || []) as PlaylistSongRow[],
    };
}

export async function getUserQueue(userId: string): Promise<PlaylistSongRow[]> {
    const queue = await getOrCreateQueuePlaylist(userId);
    return [...queue.songs].sort((a, b) => a.seq_id - b.seq_id);
}

export async function setUserQueue(
    userId: string,
    songs: Omit<PlaylistSongInsert, "playlist_id" | "id">[],
): Promise<void> {
    const queue = await getOrCreateQueuePlaylist(userId);
    // Remove all existing songs
    const { error: delError } = await supabase
        .from("playlist_songs")
        .delete()
        .eq("playlist_id", queue.id);
    if (delError) throw delError;
    // Insert new songs
    if (songs.length > 0) {
        const inserts = songs.map((s, i) => ({
            ...s,
            playlist_id: queue.id,
            seq_id: i + 1,
        }));
        const { error: insError } = await supabase
            .from("playlist_songs")
            .insert(inserts);
        if (insError) throw insError;
    }
}

// Set all songs for a playlist (delete all, then insert new)
export async function setPlaylistSongs(
    playlistId: string,
    songs: Omit<PlaylistSongInsert, "playlist_id" | "id">[],
): Promise<void> {
    // Remove all existing songs
    const { error: delError } = await supabase
        .from("playlist_songs")
        .delete()
        .eq("playlist_id", playlistId);
    if (delError) throw delError;
    // Insert new songs
    if (songs.length > 0) {
        const inserts = songs.map((s, i) => ({
            ...s,
            playlist_id: playlistId,
            seq_id: i + 1,
        }));
        const { error: insError } = await supabase
            .from("playlist_songs")
            .insert(inserts);
        if (insError) throw insError;
    }
}

// You must import and initialize your supabase client as 'supabase' for these helpers to work.
