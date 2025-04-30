import React, { useEffect, useRef, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { currentSongIndexAtom, playlistAtom } from "@/atoms/musicPlayerAtom";
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
} from "lucide-react";
import { searchYoutube } from "@/utils/youtubeSearch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

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
      className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${
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
      <span className="flex-1 truncate text-xs font-medium">
        {song.title}
      </span>
      <div className="flex gap-1 items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(song.url);
          }}
          className="p-1 hover:bg-primary/20 rounded"
          title="Copy YouTube Link"
        >
          <Send size={14} />
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
interface Playlist {
  id: string;
  name: string;
  songs: Song[];
}

export const MusicPlayerPlaylist = ({
  playlists = [],
  onAddPlaylist,
  onAddVideoToPlaylist,
  onRemoveVideoFromPlaylist,
  onMoveVideoInPlaylist,
  savePlaylists,
  currentSongIndex,
}: {
  playlists: Playlist[];
  onAddPlaylist: (name: string) => void;
  onAddVideoToPlaylist: (idx: number, url: string, title: string) => void;
  onRemoveVideoFromPlaylist: (plIdx: number, vidIdx: number) => void;
  onMoveVideoInPlaylist: (plIdx: number, from: number, to: number) => void;
  savePlaylists: (playlists: Playlist[]) => void;
  currentSongIndex: number;
}) => {
  const [playlist, setPlaylist] = useAtom(playlistAtom);
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

  useEffect(() => {
    if (expandedIdx !== null && playlistRefs.current[expandedIdx]) {
      playlistRefs.current[expandedIdx]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [expandedIdx]);

  // --- Queue logic ---
  const moveSong = async (from: number, to: number) => {
    if (from === to) return;
    const updated = [...playlist];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setPlaylist(updated);
  };
  const handleRemove = async () => {
    const updated = playlist.filter((_, i) => i !== currentSongIndex);
    setPlaylist(updated);
  };
  const handlePlay = () => {
    setCurrentSongIndex(currentSongIndex);
  };
  const handleClear = async () => {
    setPlaylist([]);
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
    setToast("Playlist saved!");
  };
  const handleLoadPlaylist = (
    videoIndexes: number[] | null = null,
  ) => {
    const pl = playlists[0];
    let songs = pl.songs;
    if (videoIndexes) songs = videoIndexes.map((i: number) => pl.songs[i]);
    setPlaylist(songs);
    setCurrentSongIndex(0);
    setTab("queue");
  };
  const handleDeletePlaylist = () => {
    // Implement delete playlist logic
  };
  // --- Playlist video management ---
  const handleAddVideoToPlaylist = async (plIdx: number) => {
    onAddVideoToPlaylist(plIdx, newVideoUrl, newVideoTitle);
    setNewVideoUrl("");
    setNewVideoTitle("");
  };
  const handleRemoveVideoFromPlaylist = async (
    plIdx: number,
    vidIdx: number,
  ) => {
    onRemoveVideoFromPlaylist(plIdx, vidIdx);
  };
  const moveVideoInPlaylist = async (
    plIdx: number,
    from: number,
    to: number,
  ) => {
    onMoveVideoInPlaylist(plIdx, from, to);
  };
  // --- File import/export ---
  const handleExport = () => {
    const pl = playlists[0];
    const text = pl.songs.map((s) => s.url).join("\n");
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
        // Add videos to the new playlist
        const idx = playlists.findIndex((pl) => pl.name === name);
        if (idx !== -1) {
          const updated = playlists.map((pl, i) =>
            i === idx ? { ...pl, songs } : pl
          );
          savePlaylists(updated);
        }
      }
    };
    reader.readAsText(file);
  };

  // --- Playlist selection for sending to queue ---
  const handleToggleSelect = (vidIdx: number) => {
    setSelectedVideos((prev) =>
      prev.includes(vidIdx)
        ? prev.filter((i) => i !== vidIdx)
        : [...prev, vidIdx]
    );
  };
  const handleSendSelectedToQueue = () => {
    if (!selectedVideos.length) return;
    handleLoadPlaylist(selectedVideos);
    setSelectedVideos([]);
  };
  const handleSendAllToQueue = () => {
    handleLoadPlaylist();
    setSelectedVideos([]);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    // If YouTube URL, add directly
    const ytId = getYoutubeId(searchTerm.trim());
    if (ytId) {
      const newQueue = [
        ...playlist,
        {
          id: ytId,
          url: searchTerm.trim(),
          title: searchTerm.trim(),
          seqId: playlist.length + 1,
        },
      ];
      setPlaylist(newQueue);
      setToast("Added to queue!");
      setSearchTerm("");
      return;
    }
    // Otherwise, search YouTube
    const results = await searchYoutube(searchTerm.trim());
    setSearchResults(results);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full">
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
            Queue
          </button>
          <button
            className={`px-4 py-2 text-sm font-semibold rounded-t ${
              tab === "playlists"
                ? "bg-background border-x border-t border-border"
                : "bg-muted text-muted-foreground"
            }`}
            onClick={() => setTab("playlists")}
          >
            Playlists
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
                placeholder="Paste YouTube URL or search keywords"
                className="px-2 py-1 rounded border text-xs bg-muted flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-2 py-1 rounded bg-primary/10 text-primary text-xs flex items-center gap-1"
              >
                <Plus size={14} />Add/Search
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
                          ...playlist,
                          {
                            id: result.id,
                            url: `https://www.youtube.com/watch?v=${result.id}`,
                            title: result.title,
                            seqId: playlist.length + 1,
                          },
                        ];
                        setPlaylist(newQueue);
                        setToast("Added to queue!");
                      }}
                      className="px-2 py-1 rounded bg-primary/10 text-primary text-xs"
                    >
                      <Plus size={14} />Add
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
                Clear
              </button>
              <input
                type="text"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                placeholder="Playlist name"
                className="px-2 py-1 rounded border text-xs bg-muted"
              />
              <button
                onClick={handleSaveQueueAsPlaylist}
                className="px-2 py-1 rounded bg-primary/10 text-primary text-xs flex items-center gap-1"
              >
                <Save size={14} />Save as Playlist
              </button>
              <button
                onClick={() => {
                  // Download queue as TXT
                  const text = playlist.map((s) => s.url).join("\n");
                  const blob = new Blob([text], { type: "text/plain" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `queue.txt`;
                  a.click();
                }}
                className="px-2 py-1 rounded bg-muted text-xs flex items-center gap-1 border border-border"
              >
                <Download size={14} />Download as TXT
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {playlist.map((song, idx) => (
                <div className="relative" key={`${song.id}-${idx}`}>
                  <PlaylistItem
                    song={song}
                    index={idx}
                    moveSong={moveSong}
                    onRemove={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    onPlay={() =>
                      handlePlay()}
                    isActive={idx === currentSongIndex}
                    loading={false}
                  />
                  {idx === currentSongIndex + 1 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary font-semibold bg-muted px-2 py-0.5 rounded">
                      Next
                    </span>
                  )}
                </div>
              ))}
              {playlist.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4">
                  Queue is empty
                </div>
              )}
            </div>
            {toast && (
              <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-2 rounded shadow">
                {toast}
              </div>
            )}
            {showSaveDialog && (
              <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent>
                  <DialogTitle>Save Queue as Playlist</DialogTitle>
                  <input
                    type="text"
                    value={savePlaylistName}
                    onChange={(e) =>
                      setSavePlaylistName(e.target.value)}
                    placeholder="Playlist name"
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
                        Save only selected songs ({selectedVideos.length})
                      </label>
                    </div>
                  )}
                  <DialogFooter>
                    <button
                      onClick={() => setShowSaveDialog(false)}
                      className="px-3 py-1 rounded bg-muted text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmSavePlaylist}
                      className="px-3 py-1 rounded bg-primary text-white text-xs"
                    >
                      Save
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
              <span className="font-bold text-sm">Playlists</span>
              <input
                type="text"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                placeholder="New playlist name"
                className="px-2 py-1 rounded border text-xs bg-muted"
              />
              <button
                onClick={() => {
                  // Implement add playlist logic
                }}
                className="px-2 py-1 rounded bg-primary/10 text-primary text-xs flex items-center gap-1"
              >
                <Plus size={14} />Add
              </button>
              <label className="px-2 py-1 rounded bg-muted text-xs flex items-center gap-1 cursor-pointer">
                <Upload size={14} /> Import
                <input
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </div>
            <div className="flex-1 overflow-y-auto">
              {playlists.map((pl, idx) => {
                // Get thumbnail from first song or fallback
                const thumb = pl.songs && pl.songs.length > 0
                  ? `https://img.youtube.com/vi/${
                    getYoutubeId(pl.songs[0].url)
                  }/default.jpg`
                  : "https://placehold.co/80x45?text=No+Image";
                return (
                  <div
                    key={idx}
                    className="mb-2 border rounded bg-muted/30 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div
                      className="flex items-center gap-2 px-2 py-1 hover:bg-muted rounded-t cursor-pointer"
                      onClick={() =>
                        setExpandedIdx(expandedIdx === idx ? null : idx)}
                    >
                      <Image
                        src={thumb}
                        alt="thumb"
                        width={80}
                        height={48}
                        className="w-12 h-7 rounded object-cover border"
                      />
                      <span className="flex-1 truncate text-xs font-medium">
                        {pl.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Implement edit playlist logic
                        }}
                        className="p-1"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport();
                        }}
                        className="px-2 py-1 rounded bg-muted text-xs flex items-center gap-1 border border-border"
                      >
                        <Download size={14} />Download as TXT
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlaylist();
                        }}
                        className="p-1"
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
                    {expandedIdx === idx && (
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
                            placeholder="YouTube URL"
                            className="px-2 py-1 rounded border text-xs bg-muted flex-1"
                          />
                          <input
                            type="text"
                            value={newVideoTitle}
                            onChange={(e) => setNewVideoTitle(e.target.value)}
                            placeholder="Title (optional)"
                            className="px-2 py-1 rounded border text-xs bg-muted flex-1"
                          />
                          <button
                            onClick={() => handleAddVideoToPlaylist(idx)}
                            className="px-2 py-1 rounded bg-primary/10 text-primary text-xs flex items-center gap-1"
                          >
                            <Plus size={14} />Add Video
                          </button>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <button
                            onClick={() => handleSendAllToQueue()}
                            className="px-2 py-1 rounded bg-primary/10 text-primary text-xs flex items-center gap-1"
                          >
                            <Send size={14} />Send All to Queue
                          </button>
                          <button
                            onClick={() => handleSendSelectedToQueue()}
                            className="px-2 py-1 rounded bg-muted text-xs flex items-center gap-1"
                          >
                            <Send size={14} />Send Selected
                          </button>
                        </div>
                        {pl.songs.map((song, vidIdx) => (
                          <PlaylistItem
                            key={`${song.id}-${vidIdx}`}
                            song={song}
                            index={vidIdx}
                            moveSong={(from, to) =>
                              moveVideoInPlaylist(idx, from, to)}
                            onRemove={(e) => {
                              e.stopPropagation();
                              handleRemoveVideoFromPlaylist(idx, vidIdx);
                            }}
                            onPlay={() => {}}
                            isActive={false}
                            showCheckbox={true}
                            checked={selectedVideos.includes(vidIdx)}
                            onCheck={() => handleToggleSelect(vidIdx)}
                            loading={false}
                          />
                        ))}
                        {pl.songs.length === 0 && (
                          <div className="text-xs text-muted-foreground text-center py-2">
                            No videos in this playlist
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {playlists.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No playlists saved
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};
