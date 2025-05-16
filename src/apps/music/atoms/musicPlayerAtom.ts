import { atom } from "jotai";
import { supabase } from "@/infrastructure/lib/supabaseClient";
import { userAtom } from "@/application/atoms/authAtoms";
import { Song } from "@/apps/music/types/Song";
import { loadFeatureState, saveFeatureState } from "@/utils/storage";
import type { Tables } from "@/types/supabase";

// Define the shape of the persisted state
interface MusicPlayerState {
  playlist: Song[];
  currentSongIndex: number;
  isPlaying: boolean;
  isWindowOpen: boolean;
  currentTime: number;
  volume: number;
}

const defaultSongs: Song[] = [
  {
    url: "https://www.youtube.com/watch?v=Fp5ghKduTK8",
    title: "Ghibli Melody",
    id: "Fp5ghKduTK8",
    seqId: 1,
  },
  {
    url: "https://www.youtube.com/watch?v=rrFlMNT4blk",
    title: "Harukaze - Rihwa",
    id: "rrFlMNT4blk",
    seqId: 2,
  },
  {
    url: "https://www.youtube.com/watch?v=7oU-eM8dM4Y",
    title: "One Summer's Day - Joe Hisaishi",
    id: "7oU-eM8dM4Y",
    seqId: 3,
  },
  {
    url: "https://www.youtube.com/watch?v=92IUxkS6nFY",
    title: "Path of the Wind - Totoro OST",
    id: "92IUxkS6nFY",
    seqId: 4,
  },
  {
    url: "https://www.youtube.com/watch?v=8ykEy-yPBFc",
    title: "Kimi wo Nosete - Laputa OST",
    id: "8ykEy-yPBFc",
    seqId: 5,
  },
  {
    url: "https://www.youtube.com/watch?v=6hzrDeceEKc",
    title: "Summer - Joe Hisaishi",
    id: "6hzrDeceEKc",
    seqId: 6,
  },
];

// Default state object
const defaultMusicPlayerState: MusicPlayerState = {
  playlist: defaultSongs,
  currentSongIndex: 0,
  isPlaying: false,
  isWindowOpen: false,
  currentTime: 0,
  volume: 0.7,
};

// Get stored state or use defaults - SAFE INITIALIZATION
const getInitialState = (): MusicPlayerState => {
  // Only access localStorage on the client
  if (typeof window === "undefined") {
    return defaultMusicPlayerState;
  }
  return defaultMusicPlayerState;
};

// --- Base Atom ---
// The single source of truth for persisted state, initialized safely
const baseMusicPlayerAtom = atom<MusicPlayerState>(getInitialState());

// --- Persisted State Atom (Handles Reading/Writing to Base and Storage) ---
export const musicPlayerStateAtom = atom(
  (get) => get(baseMusicPlayerAtom),
  (
    get,
    set,
    update: MusicPlayerState | ((prev: MusicPlayerState) => MusicPlayerState),
  ) => {
    const newState = typeof update === "function"
      ? update(get(baseMusicPlayerAtom))
      : update;
    set(baseMusicPlayerAtom, newState);
  },
);

// --- Playlist Atoms (Supabase CRUD) ---
export const playlistAtom = atom<Song[]>([]);

export const fetchPlaylistAtom = atom(null, async (get, set) => {
  const user = get(userAtom);
  if (!user) return;
  // Fetch user songs
  const { data: songs, error } = await supabase
    .from("music_songs")
    .select("id, title, url, seq_id")
    .eq("user_id", user.id)
    .order("seq_id", { ascending: true });
  if (error) throw error;
  if (!songs || songs.length === 0) {
    // Copy global songs to user only if user has no songs
    const { data: defaults } = await supabase
      .from("music_songs")
      .select("title, url, seq_id")
      .is("user_id", null);
    if (defaults && defaults.length > 0) {
      for (const song of defaults) {
        await supabase.from("music_songs").insert({
          user_id: user.id,
          title: song.title,
          url: song.url,
          seq_id: song.seq_id,
        });
      }
      // Fetch again
      const { data: newSongs } = await supabase
        .from("music_songs")
        .select("id, title, url, seq_id")
        .eq("user_id", user.id)
        .order("seq_id", { ascending: true });
      // Use newSongs for deduplication
      const seen = new Set();
      const deduped = (newSongs || []).map((song) => ({
        ...song,
        seqId: song.seq_id,
      }))
        .filter((song) => {
          const id = getYoutubeId(song.url);
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      set(playlistAtom, deduped);
      return;
    }
  }
  // Deduplicate by YouTube video ID
  const seen = new Set();
  const deduped = (songs || []).map((song) => ({ ...song, seqId: song.seq_id }))
    .filter((song) => {
      const id = getYoutubeId(song.url);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  set(playlistAtom, deduped);
});

export const addSongAtom = atom(
  null,
  async (get, set, newSong: Omit<Song, "id">) => {
    const user = get(userAtom);
    if (!user) return;
    // Use seq_id for backend, seqId for local state
    const { data, error } = await supabase
      .from("music_songs")
      .insert({
        user_id: user.id,
        title: newSong.title,
        url: newSong.url,
        seq_id: newSong.seqId,
      })
      .select("id, title, url, seq_id")
      .single();
    if (error) throw error;
    // Map seq_id to seqId for Song type
    set(playlistAtom, [...get(playlistAtom), { ...data, seqId: data.seq_id }]);
    set(fetchPlaylistAtom);
  },
);

export const updateSongTitleAtom = atom(
  null,
  async (
    get,
    set,
    { songId, newTitle }: { songId: string; newTitle: string },
  ) => {
    const { error } = await supabase
      .from("music_songs")
      .update({ title: newTitle })
      .eq("id", songId);
    if (error) throw error;
    set(
      playlistAtom,
      get(playlistAtom).map((song) =>
        song.id === songId ? { ...song, title: newTitle } : song
      ),
    );
    set(fetchPlaylistAtom);
  },
);

export const deleteSongAtom = atom(null, async (get, set, songId: string) => {
  const { error } = await supabase
    .from("music_songs")
    .delete()
    .eq("id", songId);
  if (error) throw error;
  set(playlistAtom, get(playlistAtom).filter((song) => song.id !== songId));
  set(fetchPlaylistAtom);
});

// --- Local UI/Playback State Atoms (unchanged) ---
export const currentSongIndexAtom = atom(0);
export const playingAtom = atom(false);
export const currentTimeAtom = atom(0);
export const isWindowOpenAtom = atom(false);
export const volumeAtom = atom(0.7);
export const durationAtom = atom<number>(0);
export const playedSecondsAtom = atom<number>(0);
export const seekingAtom = atom<boolean>(false);
export const showVideoAtom = atom<boolean>(false);

export const currentSongAtom = atom<Song | null>((get) => {
  const playlist = get(playlistAtom);
  const index = get(currentSongIndexAtom);
  if (playlist.length === 0) return null;
  return playlist[index] || null;
});

// --- Derived atoms (remain largely unchanged, use new derived atoms) ---

// --- Persistence Atom (Simplified - now just triggers save on base atom changes) ---
// We can still keep this atom if components rely on it to explicitly trigger saves,
// but the main saving logic is now in musicPlayerStateAtom's write function.
// Let's make it simpler or potentially remove if not strictly needed.
// For now, let's make it just trigger a read/write on the main state atom
// to ensure the save logic runs if needed (though technically setting any
// derived atom already triggers it).
export const persistMusicPlayerState = atom(
  null, // Read function is null
  (get, set, update: Partial<MusicPlayerState>) => {
    set(musicPlayerStateAtom, (prev: MusicPlayerState) => ({ ...prev, ...update }));
  },
);

// --- Action atoms (Need to use the new derived setter atoms) ---

// Now handled by the write function of currentSongIndexAtom
// export const setCurrentSongIndexAtom = atom(...)

export const nextSongAtom = atom(null, (get, set) => {
  const playlist = get(playlistAtom);
  if (playlist.length <= 1) return;
  const currentIndex = get(currentSongIndexAtom);
  set(currentSongIndexAtom, currentIndex + 1); // Setter handles validation and persistence
  set(currentTimeAtom, 0); // Reset time
  set(playingAtom, true); // Usually start playing next
});

export const previousSongAtom = atom(null, (get, set) => {
  const playlist = get(playlistAtom);
  if (playlist.length <= 1) return;
  const currentIndex = get(currentSongIndexAtom);
  set(currentSongIndexAtom, currentIndex - 1); // Setter handles validation and persistence
  set(currentTimeAtom, 0); // Reset time
  set(playingAtom, true); // Usually start playing previous
});

export const removeSongAtom = atom(null, (get, set, indexToRemove: number) => {
  const playlist = get(playlistAtom);
  const currentIndex = get(currentSongIndexAtom);

  if (indexToRemove < 0 || indexToRemove >= playlist.length) return;

  const newPlaylist = playlist.filter((_, index) => index !== indexToRemove);
  set(playlistAtom, newPlaylist); // Use derived setter

  // Adjust current index if needed
  if (newPlaylist.length === 0) {
    set(currentSongIndexAtom, 0); // Use derived setter
    set(playingAtom, false); // Use derived setter
  } else if (indexToRemove === currentIndex) {
    // Currently playing song was removed
    // The setter for currentSongIndexAtom handles wrapping/clamping
    set(currentSongIndexAtom, currentIndex); // Re-set to trigger validation
    set(currentTimeAtom, 0); // Reset time
  } else if (indexToRemove < currentIndex) {
    // If we removed a song before the current one, adjust the index
    set(currentSongIndexAtom, currentIndex - 1); // Use derived setter
  }
  set(fetchPlaylistAtom);
});

// Helper to extract YouTube video ID from URL
export function getYoutubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// --- Types for Playlists ---
// Use generated types for playlists
export type Playlist = Tables<"playlists">;

// Add created_at as optional to PlaylistSong type
type PlaylistSong = {
  id: string;
  playlist_id: string;
  song_id: string;
  title: string;
  url: string;
  seq_id: number;
  created_at?: string;
};

// --- Atoms for Playlists ---
const PLAYLISTS_FEATURE_KEY = "musicPlaylists";
const PLAYLIST_SONGS_FEATURE_KEY = "musicPlaylistSongs";

// Atom for all user playlists
export const userPlaylistsAtom = atom<Playlist[]>([]);

// Atom for current playlist ID
export const currentPlaylistIdAtom = atom<string | null>(null);

// Atom for songs in the current playlist
export const currentPlaylistSongsAtom = atom<PlaylistSong[]>([]);

// Fetch all playlists for the user (or from localStorage for guests)
export const fetchUserPlaylistsAtom = atom(null, async (get, set) => {
  const user = get(userAtom);
  if (!user) {
    // Guest: load from localStorage
    const playlists = loadFeatureState<Playlist[]>(PLAYLISTS_FEATURE_KEY) || [];
    set(userPlaylistsAtom, playlists);
    return;
  }
  // Logged in: fetch from Supabase, fallback to localStorage on error
  try {
    const { data, error } = await supabase
      .from("playlists")
      .select("id, user_id, name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    set(userPlaylistsAtom, data || []);
  } catch (err) {
    console.error("Supabase fetch failed, using local playlists:", err);
    const playlists = loadFeatureState<Playlist[]>(PLAYLISTS_FEATURE_KEY) || [];
    set(userPlaylistsAtom, playlists);
  }
});

// Fetch songs for a playlist
export const fetchPlaylistSongsAtom = atom(
  null,
  async (get, set, playlistId: string) => {
    const user = get(userAtom);
    if (!user) {
      // Guest: load from localStorage
      const allSongs = loadFeatureState<Record<string, PlaylistSong[]>>(
        PLAYLIST_SONGS_FEATURE_KEY,
      ) || {};
      set(currentPlaylistSongsAtom, (allSongs[playlistId] || []).map((s) => ({ ...s, created_at: (s as PlaylistSong).created_at ?? new Date().toISOString() })));
      return;
    }
    // Logged in: fetch from Supabase, fallback to localStorage on error
    try {
      const { data, error } = await supabase
        .from("playlist_songs")
        .select("id, playlist_id, song_id, title, url, seq_id, created_at")
        .eq("playlist_id", playlistId)
        .order("seq_id", { ascending: true });
      if (error) throw error;
      set(currentPlaylistSongsAtom, (data || []).map((s) => ({ ...s, created_at: (s as PlaylistSong).created_at ?? new Date().toISOString() })));
    } catch (err) {
      console.error("Supabase fetch failed, using local playlist songs:", err);
      const allSongs = loadFeatureState<Record<string, PlaylistSong[]>>(
        PLAYLIST_SONGS_FEATURE_KEY,
      ) || {};
      set(currentPlaylistSongsAtom, allSongs[playlistId] || []);
    }
  },
);

// Add a new playlist
export const addPlaylistAtom = atom(null, async (get, set, name: string) => {
  const user = get(userAtom);
  if (!user) {
    // Guest: save to localStorage
    const playlists = loadFeatureState<Playlist[]>(PLAYLISTS_FEATURE_KEY) || [];
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      user_id: "guest",
      name,
      created_at: new Date().toISOString(),
    };
    const updated = [...playlists, newPlaylist];
    saveFeatureState(PLAYLISTS_FEATURE_KEY, updated);
    set(userPlaylistsAtom, updated);
    return newPlaylist.id;
  }
  // Logged in: insert to Supabase
  const { data, error } = await supabase
    .from("playlists")
    .insert({ user_id: user.id, name })
    .select("id, user_id, name, created_at")
    .single();
  if (error) throw error;
  set(userPlaylistsAtom, [...get(userPlaylistsAtom), data]);
  return data.id;
});

// Add a song to a playlist (prevent duplicates)
export const addSongToPlaylistAtom = atom(
  null,
  async (
    get,
    set,
    { playlistId, song }: {
      playlistId: string;
      song: Omit<PlaylistSong, "id" | "playlist_id" | "seq_id">;
    },
  ) => {
    const user = get(userAtom);
    // Check for duplicate by song_id
    const currentSongs = get(currentPlaylistSongsAtom);
    if (currentSongs.some((s) => s.song_id === song.song_id)) return;
    const seq_id = currentSongs.length + 1;
    if (!user) {
      // Guest: save to localStorage
      const allSongs = loadFeatureState<Record<string, PlaylistSong[]>>(
        PLAYLIST_SONGS_FEATURE_KEY,
      ) || {};
      const newSong: PlaylistSong = {
        id: crypto.randomUUID(), // Use a string for local-only songs
        playlist_id: playlistId,
        seq_id,
        created_at: new Date().toISOString(),
        ...song,
      };
      const updated = {
        ...allSongs,
        [playlistId]: [...(allSongs[playlistId] || []), newSong],
      };
      saveFeatureState(PLAYLIST_SONGS_FEATURE_KEY, updated);
      set(currentPlaylistSongsAtom, updated[playlistId].map((s) => ({ ...s, created_at: s.created_at || new Date().toISOString() })));
      return;
    }
    // Logged in: insert to Supabase
    const { data, error } = await supabase
      .from("playlist_songs")
      .insert({
        playlist_id: playlistId,
        song_id: song.song_id,
        title: song.title,
        url: song.url,
        seq_id,
      })
      .select("id, playlist_id, song_id, title, url, seq_id, created_at")
      .single();
    if (error) throw error;
    set(currentPlaylistSongsAtom, [...get(currentPlaylistSongsAtom), { ...data, created_at: data.created_at || new Date().toISOString() }]);
  },
);

// Remove a song from a playlist
export const removeSongFromPlaylistAtom = atom(
  null,
  async (
    get,
    set,
    { playlistId, songId }: { playlistId: string; songId: string },
  ) => {
    const user = get(userAtom);
    if (!user) {
      // Guest: localStorage
      const allSongs = loadFeatureState<Record<string, PlaylistSong[]>>(
        PLAYLIST_SONGS_FEATURE_KEY,
      ) || {};
      const updated = {
        ...allSongs,
        [playlistId]: (allSongs[playlistId] || []).filter((s) =>
          s.song_id !== songId
        ).map((s) => ({ ...s, created_at: s.created_at || new Date().toISOString() })),
      };
      saveFeatureState(PLAYLIST_SONGS_FEATURE_KEY, updated);
      set(currentPlaylistSongsAtom, updated[playlistId].map((s) => ({ ...s, created_at: s.created_at || new Date().toISOString() })));
      return;
    }
    // Logged in: Supabase
    const { error } = await supabase
      .from("playlist_songs")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("song_id", songId);
    if (error) throw error;
    set(
      currentPlaylistSongsAtom,
      get(currentPlaylistSongsAtom).filter((s) => s.song_id !== songId),
    );
  },
);

// Reorder songs in a playlist
export const reorderPlaylistSongsAtom = atom(
  null,
  async (
    get,
    set,
    { playlistId, newOrder }: { playlistId: string; newOrder: PlaylistSong[] },
  ) => {
    const user = get(userAtom);
    if (!user) {
      // Guest: localStorage
      const allSongs = loadFeatureState<Record<string, PlaylistSong[]>>(
        PLAYLIST_SONGS_FEATURE_KEY,
      ) || {};
      const reordered = newOrder.map((s, i) => ({ ...s, seq_id: i + 1, created_at: s.created_at || new Date().toISOString() }));
      const updated = { ...allSongs, [playlistId]: reordered };
      saveFeatureState(PLAYLIST_SONGS_FEATURE_KEY, updated);
      set(currentPlaylistSongsAtom, reordered);
      return;
    }
    // Logged in: Supabase (batch update)
    for (let i = 0; i < newOrder.length; i++) {
      const s = newOrder[i];
      await supabase
        .from("playlist_songs")
        .update({ seq_id: i + 1 })
        .eq("id", s.id);
    }
    set(
      currentPlaylistSongsAtom,
      newOrder.map((s, i) => ({ ...s, seq_id: i + 1, created_at: s.created_at || new Date().toISOString() })),
    );
  },
);

// Clear a playlist
export const clearPlaylistAtom = atom(
  null,
  async (get, set, playlistId: string) => {
    const user = get(userAtom);
    if (!user) {
      // Guest: localStorage
      const allSongs = loadFeatureState<Record<string, PlaylistSong[]>>(
        PLAYLIST_SONGS_FEATURE_KEY,
      ) || {};
      const updated: Record<string, PlaylistSong[]> = {
        ...allSongs,
        [playlistId]: [],
      };
      saveFeatureState(PLAYLIST_SONGS_FEATURE_KEY, updated);
      set(currentPlaylistSongsAtom, []);
      return;
    }
    // Logged in: Supabase
    const { error } = await supabase
      .from("playlist_songs")
      .delete()
      .eq("playlist_id", playlistId);
    if (error) throw error;
    set(currentPlaylistSongsAtom, []);
  },
);

// Delete a playlist
export const deletePlaylistAtom = atom(
  null,
  async (get, set, playlistId: string) => {
    const user = get(userAtom);
    if (!user) {
      // Guest: localStorage
      const playlists = loadFeatureState<Playlist[]>(PLAYLISTS_FEATURE_KEY) || [];
      const updated = playlists.filter((pl) => pl.id !== playlistId);
      saveFeatureState(PLAYLISTS_FEATURE_KEY, updated);
      set(userPlaylistsAtom, updated);
      return;
    }
    // Logged in: Supabase
    const { error } = await supabase
      .from("playlists")
      .delete()
      .eq("id", playlistId);
    if (error) throw error;
    set(userPlaylistsAtom, get(userPlaylistsAtom).filter((pl) => pl.id !== playlistId));
  },
);

// Rename a playlist
export const renamePlaylistAtom = atom(
  null,
  async (get, set, { playlistId, newName }: { playlistId: string; newName: string }) => {
    const user = get(userAtom);
    if (!user) {
      // Guest: localStorage
      const playlists = loadFeatureState<Playlist[]>(PLAYLISTS_FEATURE_KEY) || [];
      const updated = playlists.map((pl) =>
        pl.id === playlistId ? { ...pl, name: newName } : pl
      );
      saveFeatureState(PLAYLISTS_FEATURE_KEY, updated);
      set(userPlaylistsAtom, updated);
      return;
    }
    // Logged in: Supabase
    const { error } = await supabase
      .from("playlists")
      .update({ name: newName })
      .eq("id", playlistId);
    if (error) throw error;
    set(
      userPlaylistsAtom,
      get(userPlaylistsAtom).map((pl) =>
        pl.id === playlistId ? { ...pl, name: newName } : pl
      )
    );
  },
);

// --- Queue Atom with Persistence ---
const QUEUE_FEATURE_KEY = "musicQueue";

// Primitive atom for reading the queue
export const queueAtom = atom<Song[]>(
  typeof window !== "undefined" ? loadFeatureState<Song[]>(QUEUE_FEATURE_KEY) || [] : []
);

// Writable atom for updating and persisting the queue
export const setQueueAtom = atom(
  null,
  (get, set, newQueue: Song[]) => {
    set(queueAtom, newQueue);
    saveFeatureState(QUEUE_FEATURE_KEY, newQueue);
  }
);

// TODO: UI integration for drag-and-drop, modals for save/load, toasts for feedback
// TODO: Playlist sharing (future)
