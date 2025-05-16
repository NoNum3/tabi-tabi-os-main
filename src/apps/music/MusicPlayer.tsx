"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import ReactPlayer from "react-player/youtube";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Rewind,
  FastForward,
  MoreVertical,
} from "lucide-react";

import {
  addPlaylist,
} from "@/infrastructure/lib/supabaseMusic";
import {
  addSongAtom,
  currentSongIndexAtom,
  currentTimeAtom,
  fetchPlaylistAtom,
  getYoutubeId,
  persistMusicPlayerState,
  playingAtom,
  queueAtom,
  setQueueAtom,
  volumeAtom,
  userPlaylistsAtom,
} from "@/apps/music/atoms/musicPlayerAtom";
import { userAtom } from "@/application/atoms/authAtoms";
import { MusicPlayerAddSongForm } from "@/apps/music/components/MusicPlayerAddSongForm";
import { MusicPlayerCurrentSong } from "@/apps/music/components/MusicPlayerCurrentSong";
import { MusicPlayerPlaylist } from "@/apps/music/components/MusicPlayerPlaylist";
import { MusicPlayerVideo } from "@/apps/music/components/MusicPlayerVideo";
import { windowRegistryAtom } from "@/application/atoms/windowAtoms";

// Define a YouTube player interface for type safety
interface YouTubePlayerWithMethods {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (volume: number) => void;
  [key: string]: unknown; // Replace any with unknown for better type safety
}

// Create a global reference to ensure playback continues when window is closed
let globalYoutubePlayer: YouTubePlayerWithMethods | null = null;

// Flag to track if we're in a page unload state
let isPageUnloading = false;

// Set up beforeunload handler to prevent zombie audio
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    isPageUnloading = true;
    if (globalYoutubePlayer) {
      // Stop any playing audio when the page is about to unload
      try {
        if (typeof globalYoutubePlayer.pauseVideo === "function") {
          globalYoutubePlayer.pauseVideo();
        }
      } catch {
        console.error("Error stopping YouTube playback on page unload:");
      }
    }
  });
}

// Helper to format time (MM:SS)
const formatTime = (seconds: number) => {
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();
  const ss = date.getUTCSeconds().toString().padStart(2, "0");
  if (hh) {
    return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
  }
  return `${mm}:${ss}`;
};

const MusicPlayer: React.FC = () => {
  const [user] = useAtom(userAtom);
  const [queue] = useAtom(queueAtom);
  const setQueue = useSetAtom(setQueueAtom);
  const fetchPlaylist = useSetAtom(fetchPlaylistAtom);
  const addSong = useSetAtom(addSongAtom);
  const [currentSongIndex, setCurrentSongIndex] = useAtom(currentSongIndexAtom);
  const [playing, setPlaying] = useAtom(playingAtom);
  const [currentTime, setCurrentTime] = useAtom(currentTimeAtom);
  const [volume, setVolume] = useAtom(volumeAtom);
  const [, persistState] = useAtom(persistMusicPlayerState);

  // Local state
  const [duration, setDuration] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [newSongUrl, setNewSongUrl] = useState("");
  const [newSongTitle, setNewSongTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Refs
  const playerRef = useRef<ReactPlayer>(null);
  const ignoreEvents = useRef(false);
  const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  // Use Jotai atom for playlists
  const [playlists] = useAtom(userPlaylistsAtom);

  const prevSongIndexRef = useRef(currentSongIndex);
  const prevQueueRef = useRef(queue);

  useEffect(() => {
    prevSongIndexRef.current = currentSongIndex;
    prevQueueRef.current = queue;
  }, [currentSongIndex, queue]);

  // Add song to playlist handler
  const handleAddToPlaylist = () => {
    if (!newSongUrl.trim()) return;
    const videoId = getYoutubeId(newSongUrl);
    if (!videoId) return;
    // ... existing code ...
  };

  // Initialize the playlist with sequential IDs if they don't exist
  useEffect(() => {
    if (queue.length > 0 && !("seqId" in queue[0])) {
      const updatedPlaylist = queue.map((song, index) => ({
        ...song,
        seqId: index + 1,
      }));
      setQueue(updatedPlaylist);
    } else if (queue.length === 0) {
      // Find the highest seqId to set the nextSeqId correctly
      // const maxId = Math.max(
      //   ...playlist.map((song) => ("seqId" in song ? (song as Song).seqId : 0)),
      // );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Current song - derived state
  const currentSong = queue[currentSongIndex] || null;

  // Initial setup: register player cleanup on mount once
  useEffect(() => {
    const cleanup = () => {
      if (
        globalYoutubePlayer &&
        typeof globalYoutubePlayer.pauseVideo === "function"
      ) {
        try {
          // Ensure we persist the state one last time
          if (playerRef.current) {
            const newTime = playerRef.current.getCurrentTime() || 0;
            persistState({ currentTime: newTime });
          }

          // If we're actually unloading the page, stop the player
          if (isPageUnloading) {
            globalYoutubePlayer.pauseVideo();
            globalYoutubePlayer = null;
          }
        } catch {
          console.error("Error during cleanup:");
        }
      }
    };

    window.addEventListener("pagehide", cleanup);
    return () => {
      window.removeEventListener("pagehide", cleanup);
    };
  }, [persistState]);

  // Mark window as open when component mounts and closed when unmounted
  useEffect(() => {
    persistState({ isWindowOpen: true });

    return () => {
      persistState({ isWindowOpen: false });
      // Don't stop playback on unmount - audio will continue in background
    };
  }, [persistState]);

  // Apply volume changes to the player (guard with isPlayerReady)
  useEffect(() => {
    if (
      isPlayerReady &&
      globalYoutubePlayer &&
      typeof globalYoutubePlayer.setVolume === "function"
    ) {
      const volumeToSet = isMuted ? 0 : volume * 100;
      globalYoutubePlayer.setVolume(volumeToSet);
    }
  }, [volume, isMuted, isPlayerReady]);

  // Fetch playlist on mount (and when user changes)
  useEffect(() => {
    if (user) fetchPlaylist();
  }, [user, fetchPlaylist]);

  // Extract sync logic into a useCallback function
  const syncPlayerState = useCallback(async () => {
    if (isPageUnloading || !globalYoutubePlayer || !currentSong) {
      // console.log(
      //   "syncPlayerState: Skipping due to page unload, no player, or no current song.",
      // );
      return;
    }

    if (!isPlayerReady && playerRef.current) {
      // Attempt to get player again if not ready
      try {
        const player = playerRef.current.getInternalPlayer();
        if (player && typeof player.setVolume === "function") {
          globalYoutubePlayer = player as YouTubePlayerWithMethods;
          // console.log("syncPlayerState: Player obtained, proceeding with sync.");
        } else {
          // console.log("syncPlayerState: Player still not ready, cannot sync.");
          return; // Player not truly ready, exit
        }
      } catch {
        /* (error) */
        // console.error("syncPlayerState: Error obtaining player:", error);
        return; // Error obtaining player, exit
      }
    }

    if (!globalYoutubePlayer) {
      // console.log("syncPlayerState: Global player not available after re-check.");
      return;
    }

    // console.log("Syncing player state. Initial sync done?", initialSyncDone);
    ignoreEvents.current = true;
    setIsLoading(true);

    try {
      // Ensure volume is set correctly
      // globalYoutubePlayer.setVolume(isMuted ? 0 : volume * 100);

      // Sync playing state
      if (playing) {
        // console.log("syncPlayerState: Attempting to play video.");
        await globalYoutubePlayer.playVideo();
      } else {
        // console.log("syncPlayerState: Attempting to pause video.");
        await globalYoutubePlayer.pauseVideo();
      }

      // Sync current time (seek)
      // Check if player has seekTo and if current time is valid
      const getCurrentTime =
        (globalYoutubePlayer as unknown as { getCurrentTime?: () => number })
          .getCurrentTime;
      if (
        typeof globalYoutubePlayer.seekTo === "function" &&
        currentTime > 0 &&
        typeof getCurrentTime === "function" &&
        Math.abs(getCurrentTime.call(globalYoutubePlayer) - currentTime) > 2 // Only seek if significantly different
      ) {
        // console.log(`syncPlayerState: Seeking to ${currentTime}s.`);
        globalYoutubePlayer.seekTo(currentTime, true);
      }

      setInitialSyncDone(true);
      // console.log("syncPlayerState: Sync completed.");
    } catch {
      /* (err) */
      // console.error("Error syncing player state:", err);
      // setInitialSyncDone(false); // Allow retry on error?
    } finally {
      // Use setTimeout to ensure seeking finishes before allowing events
      setTimeout(() => {
        ignoreEvents.current = false;
        setIsLoading(false);
      }, 500); // Delay might need adjustment
    }
  }, [
    currentTime,
    playing,
    // initialSyncDone, // Removed as per linter and analysis
    currentSong,
    isPlayerReady,
    // isMuted,         // Removed as per linter and analysis (used in commented out code)
    // volume,          // Removed as per linter and analysis (used in commented out code)
    setInitialSyncDone,
    setIsLoading,
  ]);

  // ---- ADD RELIABLE onReady HANDLER ----
  const handlePlayerReady = useCallback(() => {
    if (!playerRef.current) return;

    try {
      const player = playerRef.current.getInternalPlayer();
      if (player && typeof player.setVolume === "function") {
        globalYoutubePlayer = player as YouTubePlayerWithMethods;
        globalYoutubePlayer.setVolume(isMuted ? 0 : volume * 100);
        setIsPlayerReady(true);

        // Now sync state once the player is confirmed ready and referenced
        if (!initialSyncDone) {
          syncPlayerState();
        }
      } else {
        console.warn("Internal player or setVolume not available onReady");
        // Optionally try again after a short delay if needed
        // setTimeout(handlePlayerReady, 200);
      }
    } catch (error) {
      console.error("Error getting internal player onReady:", error);
    }
  }, [volume, isMuted, initialSyncDone, syncPlayerState]);

  // Initial sync on component mount
  useEffect(() => {
    syncPlayerState();
  }, [syncPlayerState]);

  // Effect to synchronize playing state with the player
  useEffect(() => {
    if (
      playerRef.current &&
      currentSong &&
      !initialSyncDone
    ) {
      // Maybe call syncPlayerState here too after a delay?
      // Or rely solely on onReady? Let's rely on onReady for now.
      // console.log("Effect triggered, initialSyncDone:", initialSyncDone);
    }
  }, [currentSong, initialSyncDone, syncPlayerState]);

  // Set up position tracking interval
  useEffect(() => {
    if (!playerRef.current) return;

    // Save current position function
    const saveCurrentPosition = () => {
      if (playerRef.current && playing) {
        const newTime = playerRef.current.getCurrentTime() || 0;
        if (Math.abs(newTime - currentTime) > 1) {
          setCurrentTime(newTime);
          // persistState({ currentTime: newTime }); // Persist during interval
        }
      }
    };

    // Set up an interval to periodically save the current playback position
    timeUpdateInterval.current = setInterval(() => {
      if (playing) {
        saveCurrentPosition();
      }
    }, 5000);

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
      // Ensure no state persistence happens in this specific cleanup
    };
    // Read currentTime here to avoid stale closures in saveCurrentPosition
  }, [playing, currentTime, setCurrentTime]);

  // --- Sync playback position on tab visibility change (best practice) ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && playerRef.current) {
        try {
          const current = playerRef.current.getCurrentTime?.() || 0;
          setPlayedSeconds(current);
          setCurrentTime(current);
        } catch {
          // Ignore errors if player not ready
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [playerRef, setPlayedSeconds, setCurrentTime]);

  // Handlers
  const handleNext = () => {
    if (queue.length <= 1) return;
    const nextIndex = (currentSongIndex + 1) % queue.length;
    setCurrentSongIndex(nextIndex);
    setPlaying(true);
    persistState({ currentSongIndex: nextIndex, currentTime: 0, isPlaying: true });
  };

  const handleProgress = (state: { playedSeconds: number }) => {
    setPlayedSeconds(state.playedSeconds);
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  // Add song handler
  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSongUrl.trim()) return;
    setIsLoading(true);
    try {
      // Extract YouTube ID and create Song object
      const videoId = getYoutubeId(newSongUrl);
      if (!videoId) throw new Error("Invalid YouTube URL");
      const seqId = queue.length > 0
        ? Math.max(...queue.map((s) => s.seqId)) + 1
        : 1;
      await addSong({
        url: newSongUrl,
        title: newSongTitle.trim() || `YouTube Song (${videoId})`,
        seqId,
      });
      setNewSongUrl("");
      setNewSongTitle("");
    } catch (err) {
      alert("Failed to add song: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      // Unmute
      setIsMuted(false);
      const newVolume = prevVolume > 0 ? prevVolume : 0.5;
      setVolume(newVolume);
      persistState({ volume: newVolume });

      // Also update the YouTube player volume directly
      if (
        globalYoutubePlayer &&
        typeof globalYoutubePlayer.setVolume === "function"
      ) {
        globalYoutubePlayer.setVolume(newVolume * 100);
      }
    } else {
      // Mute
      setPrevVolume(volume);
      setIsMuted(true);
      persistState({ volume });

      // Also update the YouTube player volume directly
      if (
        globalYoutubePlayer &&
        typeof globalYoutubePlayer.setVolume === "function"
      ) {
        globalYoutubePlayer.setVolume(0);
      }
    }
  };

  // Playlist management handlers (add, remove, rename, add video, etc.)
  const handleAddPlaylist = async (name: string) => {
    if (!name.trim()) return;
    if (playlists.some((pl) => pl.name === name.trim())) return;
    if (user) {
      // Add to Supabase
      await addPlaylist(user.id, name.trim());
      await fetchPlaylist();
    } else {
      // For guests, playlist will be handled by atom/localStorage in MusicPlayerPlaylist
    }
  };
  // const handleAddVideoToPlaylist = async (
  //   idx: number,
  //   url: string,
  //   title: string,
  // ) => {
  //   const id = getYoutubeId(url);
  //   if (!id) return;
  //   if (user && playlists[idx]?.id) {
  //     const newSongs = [
  //       ...playlists[idx].songs,
  //       {
  //         id,
  //         url,
  //         title: title || url,
  //         seqId: playlists[idx].songs.length + 1,
  //       },
  //     ];
  //     try {
  //       await setPlaylistSongs(
  //         playlists[idx].id,
  //         newSongs.map((s, i) => ({
  //           seq_id: i + 1,
  //           song_id: s.id,
  //           title: s.title,
  //           url: s.url,
  //         })),
  //       );
  //       await fetchAndSetPlaylists();
  //     } catch (err) {
  //       console.error(
  //         "Failed to save playlist songs:",
  //         err,
  //         JSON.stringify(err),
  //       );
  //       alert(
  //         typeof err === "string"
  //           ? err
  //           : err instanceof Error
  //           ? err.message
  //           : JSON.stringify(err),
  //       );
  //     }
  //   } else {
  //     // For guests, must add seqId
  //     const updated = playlists.map((pl, i) => {
  //       if (i === idx) {
  //         const nextSeqId = pl.songs.length > 0
  //           ? Math.max(...pl.songs.map((s) => s.seqId || 0)) + 1
  //           : 1;
  //         return {
  //           ...pl,
  //           songs: [
  //             ...pl.songs,
  //             {
  //               id,
  //               url,
  //               title: title || url,
  //               seqId: nextSeqId,
  //             },
  //           ],
  //         };
  //       }
  //       return pl;
  //     });
  //     savePlaylists(updated);
  //   }
  // };
  // const handleRemoveVideoFromPlaylist = async (
  //   plIdx: number,
  //   vidIdx: number,
  // ) => {
  //   if (user && playlists[plIdx]?.id) {
  //     const newSongs = playlists[plIdx].songs.filter((_, j) => j !== vidIdx);
  //     await setPlaylistSongs(
  //       playlists[plIdx].id,
  //       newSongs.map((s, i) => ({
  //         seq_id: i + 1,
  //         song_id: s.id,
  //         title: s.title,
  //         url: s.url,
  //       })),
  //     );
  //     await fetchAndSetPlaylists();
  //   } else {
  //     const updated = playlists.map((pl, i) =>
  //       i === plIdx
  //         ? { ...pl, songs: pl.songs.filter((_, j) => j !== vidIdx) }
  //         : pl
  //     );
  //     savePlaylists(updated);
  //   }
  // };
  // const moveVideoInPlaylist = async (
  //   plIdx: number,
  //   from: number,
  //   to: number,
  // ) => {
  //   if (from === to) return;
  //   if (user && playlists[plIdx]?.id) {
  //     const newSongs = [...playlists[plIdx].songs];
  //     const [moved] = newSongs.splice(from, 1);
  //     newSongs.splice(to, 0, moved);
  //     await setPlaylistSongs(
  //       playlists[plIdx].id,
  //       newSongs.map((s, i) => ({
  //         seq_id: i + 1,
  //         song_id: s.id,
  //         title: s.title,
  //         url: s.url,
  //       })),
  //     );
  //     await fetchAndSetPlaylists();
  //   } else {
  //     const updated = playlists.map((pl, i) => {
  //       if (i !== plIdx) return pl;
  //       const newSongs = [...pl.songs];
  //       const [moved] = newSongs.splice(from, 1);
  //       newSongs.splice(to, 0, moved);
  //       return { ...pl, songs: newSongs };
  //     });
  //     savePlaylists(updated);
  //   }
  // };

  const handlePrevious = () => {
    if (queue.length === 0) return;
    setCurrentSongIndex((prev) => (prev > 0 ? prev - 1 : queue.length - 1));
    setPlaying(true);
  };

  const windowRegistry = useAtomValue(windowRegistryAtom);
  const setWindowRegistry = useSetAtom(windowRegistryAtom);

  // Find the youtubePlayer window state
  const youtubeWindow = Object.values(windowRegistry).find((w) => w.appId === "youtubePlayer");
  const isMinimized = youtubeWindow?.isMinimized;

  if (!user) {
    return (
      <div className="p-4 text-center">
        Please sign in to use the music player.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Always-mounted YouTube player, styled for min/max */}
      <div
        className={
          isMinimized
            ? "fixed bottom-6 right-6 z-[9999] w-[300px] h-[220px] bg-black rounded shadow-lg border border-white/20 transition-all"
            : "w-full relative aspect-video bg-black"
        }
        style={{
          display: currentSong ? undefined : "none",
          pointerEvents: isMinimized ? "auto" : undefined,
        }}
        aria-hidden={!currentSong}
      >
        <MusicPlayerVideo
          currentSong={queue[currentSongIndex] || null}
          playing={playing}
          isPlayerReady={isPlayerReady}
          isMuted={isMuted}
          volume={volume}
          playerRef={playerRef}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onEnded={handleNext}
          onError={() => {}}
          onBuffer={() => {}}
          onBufferEnd={() => {}}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onReady={handlePlayerReady}
          showVideo={true}
        />
        {/* Controls overlay: show mini controls if minimized, else main controls */}
        {isMinimized ? (
          <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none">
            <div className="flex items-center justify-between px-2 py-1 cursor-grab bg-neutral-800 rounded-t pointer-events-auto" style={{ borderBottom: "1px solid #fff2" }}>
              <span className="text-xs text-white/80 select-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="12" y1="8" x2="12" y2="16" /></svg>
              </span>
              <span className="text-xs text-white/60 font-medium truncate max-w-[120px]">{currentSong?.title}</span>
              <button
                onClick={() => {
                  if (!youtubeWindow) return;
                  setWindowRegistry((prev) => ({
                    ...prev,
                    [youtubeWindow.id]: { ...youtubeWindow, isMinimized: false },
                  }));
                }}
                className="p-1 ml-2 rounded hover:bg-white/10 pointer-events-auto"
                aria-label="Maximize"
                title="Maximize"
              >
                <MoreVertical size={16} color="#fff" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-2 w-full mt-2 pointer-events-auto">
              <div className="flex items-center gap-2 w-full">
                <span className="text-xs text-white/70 min-w-[36px] text-right">{formatTime(playedSeconds)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={0.1}
                  value={playedSeconds}
                  onChange={e => { setPlayedSeconds(Number(e.target.value)); playerRef.current?.seekTo(Number(e.target.value), 'seconds'); }}
                  className="flex-1 accent-primary"
                  style={{ accentColor: '#fff' }}
                  aria-label="Seek video"
                />
                <span className="text-xs text-white/70 min-w-[36px]">{formatTime(duration)}</span>
              </div>
              <div className="flex items-center gap-2 w-full justify-center">
                <button onClick={() => setPlaying((p) => !p)} className="p-1 rounded hover:bg-white/10" aria-label={playing ? "Pause" : "Play"}>
                  {playing ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" />}
                </button>
                <button onClick={handlePrevious} className="p-1 rounded hover:bg-white/10" aria-label="Previous"><Rewind size={16} color="#fff" /></button>
                <button onClick={handleNext} className="p-1 rounded hover:bg-white/10" aria-label="Next"><FastForward size={16} color="#fff" /></button>
                <button onClick={toggleMute} className="p-1 rounded hover:bg-white/10" aria-label={isMuted ? "Unmute" : "Mute"}>
                  {isMuted ? <VolumeX size={16} color="#fff" /> : <Volume2 size={16} color="#fff" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={e => setVolume(Number(e.target.value))}
                  className="w-16 mx-1 accent-primary"
                  style={{ accentColor: "#fff" }}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
      {/* Main player UI, hidden when minimized */}
      {!isMinimized && (
        <>
          <div className="w-full flex flex-col items-center">
            <div className="w-full flex items-center justify-center gap-4 px-4 mt-4 mb-2">
              <button onClick={handlePrevious} className="p-2 rounded hover:bg-muted" aria-label="Previous"><Rewind size={22} /></button>
              <button onClick={() => setPlaying(!playing)} className="p-2 rounded bg-primary text-white hover:bg-primary/80" aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause size={28} /> : <Play size={28} />}</button>
              <button onClick={handleNext} className="p-2 rounded hover:bg-muted" aria-label="Next"><FastForward size={22} /></button>
              <button className="p-2 rounded hover:bg-muted" aria-label="More"><MoreVertical size={22} /></button>
            </div>
          </div>
          <MusicPlayerAddSongForm
            newSongUrl={newSongUrl}
            setNewSongUrl={setNewSongUrl}
            newSongTitle={newSongTitle}
            setNewSongTitle={setNewSongTitle}
            handleAddSong={handleAddSong}
            isLoading={isLoading}
            playlists={playlists || []}
            onAddToPlaylist={handleAddToPlaylist}
          />
          <MusicPlayerCurrentSong
            currentSong={queue[currentSongIndex] || null}
            playedSeconds={playedSeconds}
            duration={duration}
            formatTime={formatTime}
          />
          <div className="font-semibold text-center mt-2 mb-1">Queue</div>
          <MusicPlayerPlaylist
            playlists={playlists || []}
            onAddPlaylist={handleAddPlaylist}
          />
        </>
      )}
    </div>
  );
};

export default MusicPlayer;
