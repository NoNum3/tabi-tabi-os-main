import { useEffect, useRef, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { currentSongIndexAtom, playlistAtom, queueAtom, userPlaylistsAtom, fetchPlaylistSongsAtom, setQueueAtom, playingAtom, Playlist } from "@/apps/music/atoms/musicPlayerAtom";
import { deletePlaylistAtom, renamePlaylistAtom, addPlaylistAtom, addSongToPlaylistAtom } from "@/apps/music/atoms/musicPlayerAtom";
import { fetchUserPlaylistsAtom } from "@/apps/music/atoms/musicPlayerAtom";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Download,
  Edit2,
  GripVertical,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
  Copy,
} from "lucide-react";
import { searchYoutube } from "@/utils/youtubeSearch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { supabase } from "@/infrastructure/lib/supabaseClient";
import { loadFeatureState } from "@/utils/storage";
import { getYoutubePlaylistId, fetchYoutubePlaylistVideos } from "../youtubeUtils";
import { userAtom } from "@/application/atoms/authAtoms";
import { useI18n } from '@/locales/client';


const ItemType = "PLAYLIST_ITEM";

interface PlaylistItemProps {
  song: Song;
  index: number;
  moveSong: (from: number, to: number) => void;
  onRemove: (e: React.MouseEvent) => void;
  onPlay: () => void;
  isActive: boolean;
  showCheckbox?: boolean;
  checked?: boolean;
  onCheck?: () => void;
  loading?: boolean;
  isEditing?: boolean;
  editValue?: string;
  onEditClick?: () => void;
  onEditChange?: (v: string) => void;
  onEditSave?: () => void;
  onEditCancel?: () => void;
  isNext?: boolean;
}

// --- Types for DnD ---
interface DragItem {
  index: number;
  type: string;
}

function PlaylistItem({
  song,
  index,
  moveSong,
  onRemove,
  onPlay,
  isActive,
  showCheckbox,
  checked,
  onCheck,
  loading,
  isEditing,
  editValue,
  onEditClick,
  onEditChange,
  onEditSave,
  onEditCancel,
  isNext,
}: PlaylistItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [, drop] = useDrop<DragItem>({
    accept: ItemType,
    hover(item: DragItem) {
      if (item.index === index) return;
      moveSong(item.index, index);
      item.index = index;
    },
  });
  const [{ isDragging }, drag, preview] = useDrag<
    DragItem,
    void,
    { isDragging: boolean }
  >({
    type: ItemType,
    item: { index, type: ItemType },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  drag(drop(ref));
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(song.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Optionally handle error
    }
  };
  // Handler for toggling checkbox when clicking the row (but not on controls)
  const handleRowClick = (e: React.MouseEvent) => {
    if (showCheckbox) {
      // Prevent toggling if clicking on a button or input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "INPUT" ||
        target.closest("button") ||
        target.closest("input")
      ) {
        return;
      }
      if (onCheck) onCheck();
    } else {
      onPlay();
    }
  };
  return (
    <div
      ref={ref}
      className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer w-full min-w-0 ${
        isActive ? "bg-primary/10" : "hover:bg-muted"
      }`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={handleRowClick}
    >
      {showCheckbox && (
        <input
          type="checkbox"
          checked={checked}
          onChange={onCheck}
          className="accent-primary"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <span
        ref={preview as unknown as React.Ref<HTMLSpanElement>}
        className="cursor-grab text-muted-foreground"
      >
        <GripVertical size={16} />
      </span>
      <Image
        src={`https://img.youtube.com/vi/${getYoutubeId(song.url)}/default.jpg`}
        alt="thumb"
        width={80}
        height={48}
        className="w-10 h-6 rounded object-cover"
      />
      <span className="flex items-center gap-2 flex-1 min-w-0 truncate text-xs font-medium">
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void (onEditSave && onEditSave());
            }}
            className="inline-flex gap-1 items-center w-full"
          >
            <input
              value={editValue}
              onChange={(e) => onEditChange && onEditChange(e.target.value)}
              className="px-1 py-0.5 rounded border text-xs bg-muted w-full min-w-0"
              aria-label="Edit song title"
              autoFocus
            />
            <button type="submit" className="px-1 py-0.5 rounded bg-primary text-white text-xs">Save</button>
            <button type="button" onClick={onEditCancel} className="px-1 py-0.5 rounded bg-muted text-xs">Cancel</button>
          </form>
        ) : (
          <>
            {song.title}
            {isNext && (
              <span className="ml-2 text-xs font-bold text-white bg-primary px-2 py-0.5 rounded shadow border border-primary animate-pulse">
                Next
              </span>
            )}
          </>
        )}
      </span>
      <div className="flex gap-1 items-center">
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-muted rounded"
          title="Copy song link"
          aria-label="Copy song link"
        >
          <Copy size={14} />
        </button>
        {copied && (
          <span className="text-xs text-green-600 ml-1" aria-live="polite">Copied!</span>
        )}
        <button
          onClick={onEditClick}
          className="p-1"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={onRemove}
          className="p-1 hover:bg-destructive/20 rounded"
          title="Remove"
        >
          <Trash2 size={14} className="text-destructive" />
        </button>
      </div>
      {loading && (
        <span className="ml-2 text-xs text-muted-foreground">...</span>
      )}
    </div>
  );
}

function getYoutubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Add types for Song and Playlist
interface Song {
  id: string;
  url: string;
  title: string;
  seqId: number;
}

type PlaylistSong = {
  id: string;
  playlist_id: string;
  song_id: string;
  title: string;
  url: string;
  seq_id: number;
  created_at?: string;
};

function playlistSongToSong(ps: PlaylistSong): Song {
  return {
    id: ps.song_id || ps.id,
    url: ps.url,
    title: ps.title,
    seqId: ps.seq_id || 0,
  };
}

const QUEUE_FEATURE_KEY = "musicQueue";

export const MusicPlayerPlaylist = ({
  playlists = [],
  onAddPlaylist,
}: {
  playlists: Playlist[];
  onAddPlaylist: (name: string) => void;
}) => {
  const [playlist] = useAtom(playlistAtom);
  const setCurrentSongIndex = useSetAtom(currentSongIndexAtom);
  const [tab, setTab] = useState<"queue" | "playlists">("queue");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState<string>("");
  const [newVideoTitle, setNewVideoTitle] = useState<string>("");
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; title: string; thumbnail: string }>
  >([]);
  const [toast, setToast] = useState<string>("");
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [savePlaylistName, setSavePlaylistName] = useState<string>("");
  const [saveOnlyChecked, setSaveOnlyChecked] = useState<boolean>(false);
  const playlistRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [playlistDeleteLoading, setPlaylistDeleteLoading] = useState<string | null>(null);
  const [playlistDeleteError, setPlaylistDeleteError] = useState<string | null>(null);
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const setDeletePlaylist = useSetAtom(deletePlaylistAtom);
  const setRenamePlaylist = useSetAtom(renamePlaylistAtom);
  const setAddPlaylist = useSetAtom(addPlaylistAtom);
  const fetchPlaylists = useSetAtom(fetchUserPlaylistsAtom);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [queue] = useAtom(queueAtom);
  const setQueue = useSetAtom(setQueueAtom);
  const [userPlaylists, setUserPlaylists] = useAtom(userPlaylistsAtom);
  const fetchPlaylistSongs = useSetAtom(fetchPlaylistSongsAtom);
  const addSongToPlaylist = useSetAtom(addSongToPlaylistAtom);
  const [playlistThumbs, setPlaylistThumbs] = useState<Record<string, string>>({});
  const [playlistSongsMap, setPlaylistSongsMap] = useState<Record<string, PlaylistSong[]>>({});
  const [editingSong, setEditingSong] = useState<{ playlistId: string; songId: string } | null>(null);
  const [editSongTitle, setEditSongTitle] = useState("");
  const setPlaying = useSetAtom(playingAtom);
  const [editingQueueIdx, setEditingQueueIdx] = useState<number | null>(null);
  const [editQueueSongTitle, setEditQueueSongTitle] = useState("");
  const [importPlaylistLink, setImportPlaylistLink] = useState("");
  const [importPlaylistName, setImportPlaylistName] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [user] = useAtom(userAtom);
  const t = useI18n();

  // Auto-dismiss toast after 2 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Hydrate queue from localStorage on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = loadFeatureState(QUEUE_FEATURE_KEY) || [];
      setQueue(stored as Song[]);
      // Listen for storage events to sync queue in real time
      const handleStorage = (e: StorageEvent) => {
        if (e.key === QUEUE_FEATURE_KEY) {
          const updated = loadFeatureState(QUEUE_FEATURE_KEY) || [];
          setQueue(updated as Song[]);
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    }
  }, [setQueue]);

  // Hydrate playlists and playlist songs from localStorage on client mount and sync in real time
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Playlists
      const playlistsRaw = loadFeatureState("musicPlaylists") as unknown;
      const playlistsSafe = ((playlistsRaw as Playlist[]) || []).map((pl) => ({
        id: pl.id || crypto.randomUUID(),
        name: pl.name || "Untitled",
        user_id: pl.user_id ?? "guest",
        created_at: pl.created_at ?? new Date().toISOString(),
      }));
      setUserPlaylists(playlistsSafe);
      // Playlist songs (for expanded playlists)
      const allSongsRaw = loadFeatureState("musicPlaylistSongs") as unknown;
      setPlaylistSongsMap((allSongsRaw as Record<string, PlaylistSong[]>) || {});
      // Listen for storage events to sync playlists in real time
      const handleStorage = (e: StorageEvent) => {
        if (e.key === "musicPlaylists") {
          const updatedRaw = loadFeatureState("musicPlaylists") as unknown;
          const updatedSafe = ((updatedRaw as Playlist[]) || []).map((pl) => ({
            id: pl.id || crypto.randomUUID(),
            name: pl.name || "Untitled",
            user_id: pl.user_id ?? "guest",
            created_at: pl.created_at ?? new Date().toISOString(),
          }));
          setUserPlaylists(updatedSafe);
        }
        if (e.key === "musicPlaylistSongs") {
          const updatedRaw = loadFeatureState("musicPlaylistSongs") as unknown;
          setPlaylistSongsMap((updatedRaw as Record<string, PlaylistSong[]>) || {});
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    }
  }, [setUserPlaylists, setPlaylistSongsMap]);

  useEffect(() => {
    fetchPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (expandedIdx !== null && playlistRefs.current[expandedIdx]) {
      playlistRefs.current[expandedIdx]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [expandedIdx]);

  useEffect(() => {
    const fetchThumbs = async () => {
      const thumbs: Record<string, string> = {};
      for (const pl of userPlaylists) {
        // If the playlist is expanded and songs are loaded, use the first song from state
        if (expandedIdx !== null && userPlaylists[expandedIdx]?.id === pl.id && (playlistSongsMap[pl.id]?.length ?? 0) > 0) {
          thumbs[pl.id] = playlistSongsMap[pl.id][0].url;
          continue;
        }
        // Otherwise, fetch the first song from Supabase
        const { data } = await supabase
          .from("playlist_songs")
          .select("url")
          .eq("playlist_id", pl.id)
          .order("seq_id", { ascending: true })
          .limit(1)
          .single();
        if (data && data.url) {
          thumbs[pl.id] = data.url;
        }
      }
      setPlaylistThumbs(thumbs);
    };
    if (userPlaylists.length > 0) fetchThumbs();
    // Also refetch when a playlist is expanded/collapsed
  }, [userPlaylists, expandedIdx, playlistSongsMap]);

  // --- Queue logic ---
  const moveSong = (from: number, to: number) => {
    if (from === to) return;
    const updated = [...queue];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setQueue(updated);
  };
  const handleClear = async () => {
    setQueue([]);
  };

  // --- Playlist logic ---
  const handleSaveQueueAsPlaylist = () => {
    setShowSaveDialog(true);
    setSavePlaylistName("");
    setSaveOnlyChecked(selectedVideos.length > 0);
  };
  const handleConfirmSavePlaylist = () => {
    const songsToSave = saveOnlyChecked
      ? selectedVideos.map((i) => playlist[i])
      : playlist;
    if (!savePlaylistName.trim() || songsToSave.length === 0) return;
    // Save playlist (call onAddPlaylist or Supabase logic)
    onAddPlaylist(savePlaylistName.trim());
    setShowSaveDialog(false);
    setSelectedVideos([]);
    setToast(t('music.playlistSaved', { count: 1 }));
  };
  // --- Playlist video management ---
  const handleAddVideoToPlaylist = async (plIdx: number) => {
    const playlistId = userPlaylists[plIdx]?.id;
    if (!playlistId || !newVideoUrl.trim()) return;
    try {
      let title = newVideoTitle.trim();
      if (!title) {
        title = await fetchYoutubeTitle(newVideoUrl.trim());
      }
      const songId = getYoutubeId(newVideoUrl.trim());
      const newSong = {
        id: crypto.randomUUID(),
        playlist_id: playlistId,
        song_id: songId,
        title: title || newVideoUrl.trim(),
        url: newVideoUrl.trim(),
        seq_id: (playlistSongsMap[playlistId]?.length || 0) + 1,
        created_at: new Date().toISOString(),
      };
      await addSongToPlaylist({
        playlistId,
        song: {
          song_id: songId,
          title: title || newVideoUrl.trim(),
          url: newVideoUrl.trim(),
          created_at: new Date().toISOString(),
        },
      });
      setNewVideoUrl("");
      setNewVideoTitle("");
      // Update playlistSongsMap immediately for instant UI feedback
      setPlaylistSongsMap((prev) => ({
        ...prev,
        [playlistId]: [...(prev[playlistId] || []), newSong],
      }));
      // Optionally, also refetch from backend for consistency
      await fetchPlaylistSongs(playlistId);
    } catch {
      setToast(t('music.failedToAddVideo', { count: 1 }));
    }
  };
  const moveVideoInPlaylist = async (
    plIdx: number,
    from: number,
    to: number,
  ) => {
    const pl = userPlaylists[plIdx];
    const playlistId = pl.id;
    const songs = playlistSongsMap[playlistId] || [];
    if (from === to || !songs.length) return;
    const updated = [...songs];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);

    // Update local state for instant UI feedback
    setPlaylistSongsMap((prev) => ({ ...prev, [playlistId]: updated }));

    // Persist to Supabase
    try {
      for (let i = 0; i < updated.length; i++) {
        await supabase
          .from("playlist_songs")
          .update({ seq_id: i + 1 })
          .eq("id", updated[i].id);
      }
    } catch {
      // Optionally: show error toast and revert local state
    }
  };
  // --- File import/export ---
  const handleExport = () => {
    const pl = playlists[0];
    const allSongs = playlistSongsMap[pl.id] || [];
    const text = allSongs.map((s: PlaylistSong) => s.url).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${pl.name || "playlist"}.txt`;
    a.click();
  };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = (ev.target?.result as string).split(/\r?\n/).filter(
        Boolean,
      );
      const songs = lines.map((url, i) => {
        const id = getYoutubeId(url);
        return id ? { id, url, title: url, seqId: i + 1 } : null;
      }).filter((
        s,
      ): s is { id: string; url: string; title: string; seqId: number } => !!s);
      if (songs.length) {
        const name = file.name.replace(/\.txt$/, "");
        onAddPlaylist(name);
        // Store songs in playlistSongsMap:
        setPlaylistSongsMap((prev) => ({
          ...prev,
          [name]: songs.map((s: Song, i) => ({
            id: crypto.randomUUID(),
            playlist_id: name,
            song_id: s.id,
            title: s.title,
            url: s.url,
            seq_id: i + 1,
            created_at: new Date().toISOString(),
          })),
        }));
      }
    };
    reader.readAsText(file);
  };

  // --- Playlist selection for sending to queue ---
  const handleSendSelectedToQueue = () => {
    if (!selectedVideos.length) return;
    const pl = playlists[0];
    const allSongs = playlistSongsMap[pl.id] || [];
    const selectedSongs = selectedVideos.map((i) => playlistSongToSong(allSongs[i]));
    const newQueue = [...queue, ...selectedSongs];
    // If queue was empty, start from first song
    if (queue.length === 0) setCurrentSongIndex(0);
    setQueue(newQueue);
    setToast(t('music.selectedSongsSentToQueue', { count: selectedVideos.length }));
    setSelectedVideos([]);
  };
  const handleSendAllToQueue = () => {
    const pl = playlists[0];
    const allSongs = playlistSongsMap[pl.id] || [];
    const all = allSongs.map(playlistSongToSong);
    // Replace queue and start from first song
    setQueue(all);
    setCurrentSongIndex(0);
    setToast(t('music.allSongsSentToQueue', { count: allSongs.length }));
    setTab("queue");
    setSelectedVideos([]);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    const ytId = getYoutubeId(searchTerm.trim());
    if (ytId) {
      let title = searchTerm.trim();
      if (!newVideoTitle.trim()) {
        title = await fetchYoutubeTitle(searchTerm.trim());
      } else {
        title = newVideoTitle.trim();
      }
      const newQueue = [
        ...queue,
        {
          id: ytId,
          url: searchTerm.trim(),
          title: title || searchTerm.trim(),
          seqId: queue.length + 1,
        },
      ];
      setQueue(newQueue);
      setToast(t('music.addedToQueue', { count: 1 }));
      setSearchTerm("");
      return;
    }
    // Otherwise, search YouTube
    const results = await searchYoutube(searchTerm.trim());
    setSearchResults(results);
  };

  // Add playlist handler:
  const handleAddPlaylist = async () => {
    if (!newVideoTitle.trim()) return;
    setAddLoading(true);
    setAddError(null);
    try {
      await setAddPlaylist(newVideoTitle.trim());
      await fetchPlaylists();
      setNewVideoTitle("");
    } catch {
      setAddError(t('music.failedToAddPlaylist', { count: 1 }));
    } finally {
      setAddLoading(false);
    }
  };

  const handleExpandPlaylist = async (idx: number, playlistId: string) => {
    if (expandedIdx === idx) {
      setExpandedIdx(null);
    } else {
      setExpandedIdx(idx);
      // Fetch songs for this playlist
      const { data } = await supabase
        .from("playlist_songs")
        .select("id, playlist_id, song_id, title, url, seq_id, created_at")
        .eq("playlist_id", playlistId)
        .order("seq_id", { ascending: true });
      if (data) {
        setPlaylistSongsMap((prev) => ({ ...prev, [playlistId]: data }));
      }
    }
  };

  // Helper to fetch YouTube title
  async function fetchYoutubeTitle(url: string) {
    try {
      const id = getYoutubeId(url);
      if (!id) return "";
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
      if (!res.ok) return "";
      const data = await res.json();
      return data.title || "";
    } catch {
      return "";
    }
  }

  // Handler to save song title
  const handleSaveSongTitle = async (playlistId: string, songId: string, url: string) => {
    let title = editSongTitle.trim();
    if (!title) {
      title = await fetchYoutubeTitle(url);
    }
    if (!title) return;
    // Update in Supabase
    await supabase
      .from("playlist_songs")
      .update({ title })
      .eq("id", songId);
    // Update in local state
    setPlaylistSongsMap((prev) => ({
      ...prev,
      [playlistId]: (prev[playlistId] || []).map((s) =>
        s.id === songId ? { ...s, title } : s
      ),
    }));
    setEditingSong(null);
    setEditSongTitle("");
  };

  // Handler to save queue song title
  const handleSaveQueueSongTitle = async (idx: number, url: string) => {
    let title = editQueueSongTitle.trim();
    if (!title) {
      title = await fetchYoutubeTitle(url);
    }
    if (!title) return;
    const updated = queue.map((song, i) =>
      i === idx ? { ...song, title } : song
    );
    setQueue(updated);
    setEditingQueueIdx(null);
    setEditQueueSongTitle("");
  };

  // --- Queue delete logic ---
  const handleRemoveFromQueue = (idx: number) => {
    const updated = queue.filter((_, i) => i !== idx);
    setQueue(updated);
    // Optionally, update currentSongIndex if needed (e.g., if current song is deleted)
  };

  // --- Playlist delete logic ---
  const handleRemoveFromPlaylist = async (plIdx: number, vidIdx: number) => {
    const playlistId = userPlaylists[plIdx]?.id;
    if (!playlistId) return;
    const songs = playlistSongsMap[playlistId] || [];
    const songToRemove = songs[vidIdx];
    // Remove from backend/localStorage
    if (songToRemove?.id) {
      // Try to remove from Supabase/localStorage
      await supabase
        .from("playlist_songs")
        .delete()
        .eq("id", songToRemove.id);
    }
    // Update local state for instant UI feedback
    setPlaylistSongsMap((prev) => ({
      ...prev,
      [playlistId]: songs.filter((_, i) => i !== vidIdx),
    }));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full">
        {/* Toast notification always rendered at root for visibility */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed left-1/2 bottom-8 z-50 -translate-x-1/2 px-6 py-3 rounded-lg border border-primary/30 dark:border-primary/60 shadow-xl bg-primary text-white dark:bg-neutral-900 dark:text-primary-100 text-sm font-semibold flex items-center gap-3 transition-opacity duration-300 animate-fade-in-out"
            style={{ minWidth: 220, maxWidth: '90vw', textAlign: 'center', pointerEvents: 'auto', backdropFilter: 'blur(2px)' }}
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 dark:bg-primary/20 text-primary-100 dark:text-primary-300 mr-2">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
            </span>
            <span>{toast}</span>
          </div>
        )}
        {/* Tabs */}
        <div className="flex gap-2 mb-3 border-b border-border">
          <button
            className={`px-4 py-2 text-sm font-semibold rounded-t ${
              tab === "queue"
                ? "bg-background border-x border-t border-border"
                : "bg-muted text-muted-foreground"
            }`}
            onClick={() => setTab("queue")}
          >
            {t('music.queue', { count: 1 })}
          </button>
          <button
            className={`px-4 py-2 text-sm font-semibold rounded-t ${
              tab === "playlists"
                ? "bg-background border-x border-t border-border"
                : "bg-muted text-muted-foreground"
            }`}
            onClick={() => setTab("playlists")}
          >
            {t('music.playlists', { count: 1 })}
          </button>
        </div>
        {/* Tab Content */}
        {tab === "queue" && (
          <div className="flex-1 flex flex-col min-w-[220px]">
            <div className="flex gap-2 mb-2 items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('music.pasteYouTubeURL', { count: 1 })}
                className="px-2 py-1 rounded border text-xs bg-muted flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-2 py-1 rounded bg-primary/10 text-primary text-xs flex items-center gap-1"
              >
                <Plus size={14} />{t('music.addSearch', { count: 1 })}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mb-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center gap-2 p-1 border-b"
                  >
                    <Image
                      src={result.thumbnail}
                      alt="thumb"
                      width={80}
                      height={48}
                      className="w-10 h-6 rounded object-cover"
                    />
                    <span className="flex-1 truncate text-xs">
                      {result.title}
                    </span>
                    <button
                      onClick={async () => {
                        const newQueue = [
                          ...queue,
                          {
                            id: result.id,
                            url: `https://www.youtube.com/watch?v=${result.id}`,
                            title: result.title,
                            seqId: queue.length + 1,
                          },
                        ];
                        setQueue(newQueue);
                        setToast(t('music.addedToQueue', { count: 1 }));
                      }}
                      className="px-2 py-1 rounded bg-primary/10 text-primary text-xs"
                    >
                      <Plus size={14} />{t('music.add', { count: 1 })}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mb-2 items-center">
              <button
                onClick={handleClear}
                className="px-2 py-1 rounded bg-destructive/10 text-destructive text-xs"
              >
                {t('music.clear', { count: 1 })}
              </button>
              <input
                type="text"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                placeholder={t('music.playlistName', { count: 1 })}
                className="px-2 py-1 rounded border text-xs bg-muted"
              />
              <button
                onClick={handleSaveQueueAsPlaylist}
                className="px-2 py-1 rounded bg-primary/10 text-primary text-xs flex items-center gap-1"
              >
                <Save size={14} />{t('music.saveAsPlaylist', { count: 1 })}
              </button>
              <button
                onClick={() => {
                  // Download queue as TXT
                  const text = queue.map((s) => s.url).join("\n");
                  const blob = new Blob([text], { type: "text/plain" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `queue.txt`;
                  a.click();
                }}
                className="px-2 py-1 rounded bg-muted text-xs flex items-center gap-1 border border-border"
              >
                <Download size={14} />{t('music.downloadAsTxt', { count: 1 })}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto w-full min-w-0">
              {queue.map((song, idx) => (
                <div className="relative flex items-center" key={`${song.id}-${idx}`}>
                  <span className="w-6 text-right mr-2 text-xs text-muted-foreground select-none">{idx + 1}</span>
                  <PlaylistItem
                    song={song}
                    index={idx}
                    moveSong={moveSong}
                    onRemove={(e) => {
                      e.stopPropagation();
                      handleRemoveFromQueue(idx);
                    }}
                    onPlay={() => {
                      setCurrentSongIndex(idx);
                      setPlaying(true);
                    }}
                    loading={false}
                    isEditing={editingQueueIdx === idx}
                    editValue={editQueueSongTitle}
                    onEditClick={() => {
                      setEditingQueueIdx(idx);
                      setEditQueueSongTitle(song.title);
                    }}
                    onEditChange={setEditQueueSongTitle}
                    onEditSave={async () => await handleSaveQueueSongTitle(idx, song.url)}
                    onEditCancel={() => setEditingQueueIdx(null)}
                    isActive={false}
                  />
                </div>
              ))}
              {queue.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4">
                  {t('music.queueEmpty', { count: 1 })}
                </div>
              )}
            </div>
            {showSaveDialog && (
              <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent>
                  <DialogTitle>{t('music.saveQueueAsPlaylist', { count: 1 })}</DialogTitle>
                  <input
                    type="text"
                    value={savePlaylistName}
                    onChange={(e) =>
                      setSavePlaylistName(e.target.value)}
                    placeholder={t('music.playlistName', { count: 1 })}
                    className="w-full px-2 py-1 rounded border text-xs bg-muted mb-2"
                  />
                  {selectedVideos.length > 0 && (
                    <div className="mb-2">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={saveOnlyChecked}
                          onChange={() =>
                            setSaveOnlyChecked((v) => !v)}
                        />
                        {t('music.saveOnlySelected', { count: selectedVideos.length })}
                      </label>
                    </div>
                  )}
                  <DialogFooter>
                    <button
                      onClick={() => setShowSaveDialog(false)}
                      className="px-3 py-1 rounded bg-muted text-xs"
                    >
                      {t('music.cancel', { count: 1 })}
                    </button>
                    <button
                      onClick={handleConfirmSavePlaylist}
                      className="px-3 py-1 rounded bg-primary text-white text-xs"
                    >
                      {t('music.save', { count: 1 })}
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
        {tab === "playlists" && (
          <div className="flex-1 flex flex-col min-w-[220px]">
            <div className="flex gap-2 mb-2 items-center">
              <span className="font-bold text-sm">{t('music.playlists', { count: 1 })}</span>
              <input
                type="text"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                placeholder={t('music.newPlaylistName', { count: 1 })}
                className="px-2 py-1 rounded border text-xs bg-muted"
              />
              <button
                onClick={handleAddPlaylist}
                className="px-2 py-1 rounded bg-primary/10 text-primary text-xs flex items-center gap-1"
                disabled={addLoading}
                aria-label={t('music.addPlaylist', { count: 1 })}
                title={t('music.addPlaylist', { count: 1 })}
              >
                <Plus size={14} />{addLoading ? t('music.adding', { count: 1 }) : t('music.add', { count: 1 })}
              </button>
              {addError && <div role="alert" className="bg-red-100 text-red-800 p-2 rounded text-xs mt-2">{addError}</div>}
              <label className="px-2 py-1 rounded bg-muted text-xs flex items-center gap-1 cursor-pointer">
                <Upload size={14} /> {t('music.import', { count: 1 })}
                <input
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
              {/* New: Import YouTube Playlist by Link */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!importPlaylistLink.trim()) return;
                  setImportLoading(true);
                  setImportError("");
                  const playlistId = getYoutubePlaylistId(importPlaylistLink.trim());
                  if (!playlistId) {
                    setImportError(t('music.invalidYouTubePlaylistLink', { count: 1 }));
                    setImportLoading(false);
                    return;
                  }
                  try {
                    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
                    if (!apiKey) throw new Error(t('music.missingYouTubeAPIKey', { count: 1 }));
                    const videos = await fetchYoutubePlaylistVideos(playlistId, apiKey);
                    if (!videos.length) throw new Error(t('music.noVideosFound', { count: 1 }));
                    const name = importPlaylistName.trim() || `YouTube Playlist (${playlistId})`;
                    if (!user) {
                      // Guest: add playlist and songs in one step
                      const songs = videos.map((v, i) => ({
                        id: v.id,
                        url: `https://www.youtube.com/watch?v=${v.id}`,
                        title: v.title,
                        seqId: i + 1,
                      }));
                      const newPlaylist = {
                        id: `${Date.now()}-${Math.random()}`,
                        name,
                        user_id: "guest",
                        created_at: new Date().toISOString(),
                      };
                      setUserPlaylists([...userPlaylists, newPlaylist]);
                      setImportPlaylistLink("");
                      setImportPlaylistName("");
                      setImportLoading(false);
                      setImportError("");
                      // Store songs in playlistSongsMap:
                      setPlaylistSongsMap((prev) => ({
                        ...prev,
                        [newPlaylist.id]: songs.map((s: Song, i) => ({
                          id: crypto.randomUUID(),
                          playlist_id: newPlaylist.id,
                          song_id: s.id,
                          title: s.title,
                          url: s.url,
                          seq_id: i + 1,
                          created_at: new Date().toISOString(),
                        })),
                      }));
                    } else {
                      // Logged-in: create playlist in Supabase, then add all songs
                      await setAddPlaylist(name);
                      await fetchPlaylists();
                      // Find the new playlist by name
                      const idx = userPlaylists.findIndex((pl) => pl.name === name);
                      if (idx !== -1) {
                        // Add all songs to the playlist in Supabase
                        for (let i = 0; i < videos.length; i++) {
                          const v = videos[i];
                          await addSongToPlaylist({
                            playlistId: userPlaylists[idx].id,
                            song: {
                              song_id: v.id,
                              title: v.title,
                              url: `https://www.youtube.com/watch?v=${v.id}`,
                              created_at: new Date().toISOString(),
                            },
                          });
                        }
                        await fetchPlaylistSongs(userPlaylists[idx].id);
                        setImportPlaylistLink("");
                        setImportPlaylistName("");
                        setImportLoading(false);
                        setImportError("");
                      } else {
                        setImportError(t('music.failedToAddPlaylist', { count: 1 }));
                        setImportLoading(false);
                      }
                    }
                  } catch (err) {
                    setImportError((err as Error).message || t('music.failedToImportPlaylist', { count: 1 }));
                    setImportLoading(false);
                  }
                }}
                className="flex gap-1 items-center"
                style={{ minWidth: 0 }}
                aria-label={t('music.importYouTubePlaylistByLink', { count: 1 })}
              >
                <input
                  type="text"
                  value={importPlaylistLink}
                  onChange={e => setImportPlaylistLink(e.target.value)}
                  placeholder={t('music.pasteYouTubePlaylistLink', { count: 1 })}
                  className="px-2 py-1 rounded border text-xs bg-muted flex-1"
                  aria-label={t('music.YouTubePlaylistLink', { count: 1 })}
                  style={{ minWidth: 0 }}
                  required
                  disabled={importLoading}
                />
                <input
                  type="text"
                  value={importPlaylistName}
                  onChange={e => setImportPlaylistName(e.target.value)}
                  placeholder={t('music.playlistNameOptional', { count: 1 })}
                  className="px-2 py-1 rounded border text-xs bg-muted flex-1"
                  aria-label={t('music.playlistNameOptional', { count: 1 })}
                  style={{ minWidth: 0 }}
                  disabled={importLoading}
                />
                <button
                  type="submit"
                  className="px-2 py-1 rounded bg-primary/10 text-primary text-xs flex items-center gap-1"
                  disabled={importLoading}
                  aria-label={t('music.importPlaylist', { count: 1 })}
                >
                  <Upload size={14} />{importLoading ? t('music.importing', { count: 1 }) : t('music.importPlaylist', { count: 1 })}
                </button>
                {importError && <div role="alert" className="bg-red-100 text-red-800 p-2 rounded text-xs mt-2">{importError}</div>}
              </form>
            </div>
            <div className="flex-1 overflow-y-auto">
              {userPlaylists.map((pl, idx) => {
                const isExpanded = expandedIdx === idx;
                const thumb = playlistThumbs[pl.id]
                  ? `https://img.youtube.com/vi/${getYoutubeId(playlistThumbs[pl.id])}/default.jpg`
                  : "https://placehold.co/80x45?text=No+Image";
                return (
                  <div
                    key={pl.id}
                    className="mb-2 border rounded bg-muted/30 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div
                      className="flex items-center gap-2 px-2 py-1 hover:bg-muted rounded-t cursor-pointer"
                      onClick={() => handleExpandPlaylist(idx, pl.id)}
                    >
                      <Image
                        src={thumb}
                        alt="thumb"
                        width={80}
                        height={48}
                        className="w-12 h-7 rounded object-cover border"
                      />
                      {renamingIdx === idx ? (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setPlaylistDeleteError(null);
                            try {
                              await setRenamePlaylist({ playlistId: pl.id, newName: renameValue });
                              setRenamingIdx(null);
                            } catch {
                              // Optionally: show error toast and revert local state
                            }
                          }}
                          className="flex gap-1 items-center"
                        >
                          <input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="px-1 py-0.5 rounded border text-xs bg-muted"
                            aria-label={t('music.newPlaylistName', { count: 1 })}
                            autoFocus
                          />
                          <button type="submit" className="px-2 py-1 rounded bg-primary text-white text-xs">Save</button>
                          <button type="button" onClick={() => setRenamingIdx(null)} className="px-2 py-1 rounded bg-muted text-xs">Cancel</button>
                        </form>
                      ) : (
                        <>
                          <span className="flex-1 truncate text-xs font-medium">{pl.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingIdx(idx);
                              setRenameValue(pl.name);
                            }}
                            className="p-1"
                          >
                            <Edit2 size={14} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport();
                        }}
                        className="px-2 py-1 rounded bg-muted text-xs flex items-center gap-1 border border-border"
                      >
                        <Download size={14} />{t('music.downloadAsTxt', { count: 1 })}
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setPlaylistDeleteLoading(pl.id);
                          setPlaylistDeleteError(null);
                          try {
                            await setDeletePlaylist(pl.id);
                          } catch {
                            // Optionally: show error toast and revert local state
                          } finally {
                            setPlaylistDeleteLoading(null);
                          }
                        }}
                        className="p-1"
                        aria-label={t('music.deletePlaylist', { count: 1 })}
                        title={t('music.deletePlaylist', { count: 1 })}
                        disabled={playlistDeleteLoading === pl.id}
                      >
                        <Trash2 size={14} className="text-destructive" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedIdx(expandedIdx === idx ? null : idx);
                        }}
                        className="p-1"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                    {isExpanded && (
                      <div
                        ref={(el) => {
                          playlistRefs.current[idx] = el;
                        }}
                        className="p-2 bg-background rounded-b flex flex-col gap-2"
                      >
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newVideoUrl}
                            onChange={(e) => setNewVideoUrl(e.target.value)}
                            placeholder={t('music.youTubeURL', { count: 1 })}
                            className="px-2 py-1 rounded border text-xs bg-muted flex-1"
                          />
                          <input
                            type="text"
                            value={newVideoTitle}
                            onChange={(e) => setNewVideoTitle(e.target.value)}
                            placeholder={t('music.titleOptional', { count: 1 })}
                            className="px-2 py-1 rounded border text-xs bg-muted flex-1"
                          />
                          <button
                            onClick={() => handleAddVideoToPlaylist(idx)}
                            className="px-2 py-1 rounded bg-primary/10 text-primary text-xs flex items-center gap-1"
                          >
                            <Plus size={14} />{t('music.addVideo', { count: 1 })}
                          </button>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <button
                            onClick={() => handleSendAllToQueue()}
                            className="px-2 py-1 rounded bg-primary/10 text-primary text-xs flex items-center gap-1"
                          >
                            <Send size={14} />{t('music.sendAllToQueue', { count: 1 })}
                          </button>
                          <button
                            onClick={() => handleSendSelectedToQueue()}
                            className="px-2 py-1 rounded bg-muted text-xs flex items-center gap-1"
                          >
                            <Send size={14} />{t('music.sendSelected', { count: 1 })}
                          </button>
                        </div>
                        {(playlistSongsMap[pl.id] || []).map((ps, vidIdx) => {
                          const song = playlistSongToSong(ps);
                          const isEditing = editingSong && editingSong.playlistId === pl.id && editingSong.songId === ps.id;
                          const isChecked = selectedVideos.includes(vidIdx);
                          return (
                            <div key={`${song.id}-${vidIdx}`} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setSelectedVideos((prev) =>
                                    prev.includes(vidIdx)
                                      ? prev.filter((i) => i !== vidIdx)
                                      : [...prev, vidIdx]
                                  );
                                }}
                                aria-label={t('music.selectSong', { songTitle: song.title, count: 1 })}
                                className="accent-primary"
                              />
                              <PlaylistItem
                                song={song}
                                index={vidIdx}
                                moveSong={(from, to) => moveVideoInPlaylist(idx, from, to)}
                                onRemove={async (e) => {
                                  e.stopPropagation();
                                  await handleRemoveFromPlaylist(idx, vidIdx);
                                }}
                                onPlay={() => {}}
                                loading={false}
                                isEditing={isEditing}
                                editValue={editSongTitle}
                                onEditClick={() => {
                                  setEditingSong({ playlistId: pl.id, songId: ps.id });
                                  setEditSongTitle(ps.title);
                                }}
                                onEditChange={setEditSongTitle}
                                onEditSave={async () => await handleSaveSongTitle(pl.id, ps.id, ps.url)}
                                onEditCancel={() => setEditingSong(null)}
                                isActive={false}
                              />
                              <button
                                className="px-2 py-1 rounded bg-primary/10 text-primary text-xs ml-2"
                                aria-label={t('music.sendSongToQueue', { songTitle: song.title, count: 1 })}
                                onClick={() => {
                                  // Append only this song to queue, do not touch currentSongIndex or tab
                                  const newQueue = [...queue, song];
                                  setQueue(newQueue);
                                  setToast(t('music.songSentToQueue', { songTitle: song.title, count: 1 }));
                                }}
                              >
                                <Send size={14} />
                              </button>
                            </div>
                          );
                        })}
                        {(playlistSongsMap[pl.id] || []).length === 0 && (
                          <div className="text-xs text-muted-foreground text-center py-2">
                            {t('music.noVideosInPlaylist', { count: 1 })}
                          </div>
                        )}
                      </div>
                    )}
                    {playlistDeleteError && (
                      <div role="alert" className="bg-red-100 text-red-800 p-2 rounded text-xs mt-2">{playlistDeleteError}</div>
                    )}
                  </div>
                );
              })}
              {userPlaylists.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4">
                  {t('music.noPlaylistsSaved', { count: 1 })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};
