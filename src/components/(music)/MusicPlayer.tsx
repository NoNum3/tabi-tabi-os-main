"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import ReactPlayer from "react-player/youtube";
import {
  // Check, // unused
  // Pause, // unused
  // Pencil, // unused
  // Play, // unused
  // SkipBack, // unused
  // SkipForward, // unused
  // Trash2, // unused
  // Video, // unused
  Volume2,
  VolumeX,
  // X, // unused
} from "lucide-react";
// import { cn } from "@/lib/utils"; // unused
import {
  addPlaylist,
  getUserPlaylists,
  setPlaylistSongs,
} from "@/lib/supabaseMusic";

import {
  addSongAtom,
  currentSongIndexAtom,
  currentTimeAtom,
  fetchPlaylistAtom,
  getYoutubeId,
  persistMusicPlayerState,
  playingAtom,
  playlistAtom,
  volumeAtom,
} from "../../atoms/musicPlayerAtom";
// import { Button } from "@/components/ui/button"; // unused
import { Slider } from "@/components/ui/slider";
import { userAtom } from "@/atoms/authAtoms";
import { MusicPlayerAddSongForm } from "./components/MusicPlayerAddSongForm";
import { MusicPlayerCurrentSong } from "./components/MusicPlayerCurrentSong";
import { MusicPlayerPlaylist } from "./components/MusicPlayerPlaylist";
import { MusicPlayerVideo } from "./components/MusicPlayerVideo";
import { Song } from "./types/Song";

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
      } catch (e) {
        console.error("Error stopping YouTube playback on page unload:", e);
      }
    }
  });
}

// Minimal Playlist type definition
interface Playlist {
  id: string;
  name: string;
  songs: Song[];
}

const MusicPlayer: React.FC = () => {
  const [user] = useAtom(userAtom);
  const [playlist] = useAtom(playlistAtom);
  const setPlaylist = useSetAtom(playlistAtom);
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
  const [seeking, setSeeking] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
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

  // Playlists state for AddSongForm
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistError, setPlaylistError] = useState<string | null>(null);

  // Helper to fetch playlists from Supabase
  const fetchAndSetPlaylists = useCallback(async () => {
    if (!user) return;
    try {
      const pls = await getUserPlaylists(user.id);
      console.log("Fetched playlists from Supabase:", pls);
      setPlaylists(
        pls.map((pl) => ({
          id: pl.id,
          name: pl.name,
          songs: (pl.songs || []).map((s) => ({
            id: s.song_id,
            url: s.url,
            title: s.title,
            seqId: s.seq_id,
          })),
        })),
      );
      setPlaylistError(null);
    } catch (err) {
      setPlaylistError("Failed to load playlists. Please try again.");
      console.error("Error fetching playlists:", err);
    }
  }, [user]);

  // Fetch playlists on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchAndSetPlaylists();
    } else {
      // fallback to localStorage for guests
      try {
        const raw = localStorage.getItem("ytPlaylists");
        setPlaylists(raw ? JSON.parse(raw) : []);
      } catch {
        setPlaylists([]);
      }
    }
  }, [user, fetchAndSetPlaylists]);

  // Helper to save playlists for guests
  const savePlaylists = (pls: Playlist[]) => {
    setPlaylists(pls);
    if (!user) {
      localStorage.setItem("ytPlaylists", JSON.stringify(pls));
    }
  };

  // Add song to playlist handler
  const handleAddToPlaylist = (playlistName: string) => {
    if (!newSongUrl.trim()) return;
    const videoId = getYoutubeId(newSongUrl);
    if (!videoId) return;
    const newSong = {
      id: videoId,
      url: newSongUrl,
      title: newSongTitle.trim() || `YouTube Song (${videoId})`,
    };
    // Check if playlist exists
    const idx = playlists.findIndex((pl) => pl.name === playlistName);
    if (idx === -1) {
      // Create new playlist (for guests, must have id and seqId)
      const newPl: Playlist = {
        id: `${Date.now()}-${Math.random()}`,
        name: playlistName,
        songs: [
          {
            ...newSong,
            seqId: 1,
          },
        ],
      };
      savePlaylists([...playlists, newPl]);
    } else {
      // Add to existing (for guests, must add seqId)
      const updated = playlists.map((pl, i) => {
        if (i === idx) {
          const nextSeqId = pl.songs.length > 0
            ? Math.max(...pl.songs.map((s) => s.seqId || 0)) + 1
            : 1;
          return {
            ...pl,
            songs: [
              ...pl.songs,
              {
                ...newSong,
                seqId: nextSeqId,
              },
            ],
          };
        }
        return pl;
      });
      savePlaylists(updated);
    }
    setNewSongUrl("");
    setNewSongTitle("");
  };

  // Initialize the playlist with sequential IDs if they don't exist
  useEffect(() => {
    if (playlist.length > 0 && !("seqId" in playlist[0])) {
      const updatedPlaylist = playlist.map((song, index) => ({
        ...song,
        seqId: index + 1,
      }));
      setPlaylist(updatedPlaylist);
    } else if (playlist.length === 0) {
      // Find the highest seqId to set the nextSeqId correctly
      // const maxId = Math.max(
      //   ...playlist.map((song) => ("seqId" in song ? (song as Song).seqId : 0)),
      // );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Current song - derived state
  const currentSong = playlist[currentSongIndex] || null;

  // Get the current song's sequential ID
  const currentSeqId = currentSong && "seqId" in currentSong
    ? (currentSong as Song).seqId
    : 0;

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
        } catch (e) {
          console.error("Error during cleanup:", e);
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
      } catch { // Removed unused 'error'
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
    } catch { // Removed unused 'err'
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
      if (playerRef.current && !seeking && playing) {
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
  }, [playing, currentTime, setCurrentTime, seeking]);

  // Handlers
  const handleNext = () => {
    if (playlist.length <= 1) return;

    // Find songs with higher seqId, sort by seqId, and take the first one
    const nextSongs = playlist
      .filter((song) => "seqId" in song && (song as Song).seqId > currentSeqId)
      .sort((a, b) => (a as Song).seqId - (b as Song).seqId);

    if (nextSongs.length > 0) {
      // Play the next song in sequence
      const nextSongIndex = playlist.findIndex(
        (song) =>
          "seqId" in song &&
          (song as Song).seqId === (nextSongs[0] as Song).seqId,
      );
      setCurrentSongIndex(nextSongIndex);
      persistState({ currentSongIndex: nextSongIndex, currentTime: 0 });
    } else {
      // Cycle back to the lowest seqId if at the end
      const firstSong = [...playlist].sort(
        (a, b) => (a as Song).seqId - (b as Song).seqId,
      )[0];

      const firstSongIndex = playlist.findIndex(
        (song) =>
          "seqId" in song && (song as Song).seqId === (firstSong as Song).seqId,
      );
      setCurrentSongIndex(firstSongIndex);
      persistState({ currentSongIndex: firstSongIndex, currentTime: 0 });
    }

    // Ensure it starts playing
    setPlaying(true);
    persistState({ isPlaying: true });
  };

  const handleProgress = (state: { playedSeconds: number }) => {
    if (!seeking) {
      setPlayedSeconds(state.playedSeconds);
    }
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
      const seqId = playlist.length > 0
        ? Math.max(...playlist.map((s) => s.seqId)) + 1
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

  const toggleVideoDisplay = () => {
    setShowVideo(!showVideo);
  };

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

  // Handlers for volume control
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    persistState({ volume: newVolume });

    // Also update the YouTube player volume directly
    if (
      globalYoutubePlayer &&
      typeof globalYoutubePlayer.setVolume === "function"
    ) {
      globalYoutubePlayer.setVolume(newVolume * 100);
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
      await fetchAndSetPlaylists();
    } else {
      // For guests, must have id
      const newPl: Playlist = {
        id: `${Date.now()}-${Math.random()}`,
        name: name.trim(),
        songs: [],
      };
      savePlaylists([...playlists, newPl]);
    }
  };
  const handleAddVideoToPlaylist = async (
    idx: number,
    url: string,
    title: string,
  ) => {
    const id = getYoutubeId(url);
    if (!id) return;
    if (user && playlists[idx]?.id) {
      const newSongs = [
        ...playlists[idx].songs,
        {
          id,
          url,
          title: title || url,
          seqId: playlists[idx].songs.length + 1,
        },
      ];
      try {
        await setPlaylistSongs(
          playlists[idx].id,
          newSongs.map((s, i) => ({
            seq_id: i + 1,
            song_id: s.id,
            title: s.title,
            url: s.url,
          })),
        );
        await fetchAndSetPlaylists();
      } catch (err) {
        console.error(
          "Failed to save playlist songs:",
          err,
          JSON.stringify(err),
        );
        alert(
          typeof err === "string"
            ? err
            : err instanceof Error
            ? err.message
            : JSON.stringify(err),
        );
      }
    } else {
      // For guests, must add seqId
      const updated = playlists.map((pl, i) => {
        if (i === idx) {
          const nextSeqId = pl.songs.length > 0
            ? Math.max(...pl.songs.map((s) => s.seqId || 0)) + 1
            : 1;
          return {
            ...pl,
            songs: [
              ...pl.songs,
              {
                id,
                url,
                title: title || url,
                seqId: nextSeqId,
              },
            ],
          };
        }
        return pl;
      });
      savePlaylists(updated);
    }
  };
  const handleRemoveVideoFromPlaylist = async (
    plIdx: number,
    vidIdx: number,
  ) => {
    if (user && playlists[plIdx]?.id) {
      const newSongs = playlists[plIdx].songs.filter((_, j) => j !== vidIdx);
      await setPlaylistSongs(
        playlists[plIdx].id,
        newSongs.map((s, i) => ({
          seq_id: i + 1,
          song_id: s.id,
          title: s.title,
          url: s.url,
        })),
      );
      await fetchAndSetPlaylists();
    } else {
      const updated = playlists.map((pl, i) =>
        i === plIdx
          ? { ...pl, songs: pl.songs.filter((_, j) => j !== vidIdx) }
          : pl
      );
      savePlaylists(updated);
    }
  };
  const moveVideoInPlaylist = async (
    plIdx: number,
    from: number,
    to: number,
  ) => {
    if (from === to) return;
    if (user && playlists[plIdx]?.id) {
      const newSongs = [...playlists[plIdx].songs];
      const [moved] = newSongs.splice(from, 1);
      newSongs.splice(to, 0, moved);
      await setPlaylistSongs(
        playlists[plIdx].id,
        newSongs.map((s, i) => ({
          seq_id: i + 1,
          song_id: s.id,
          title: s.title,
          url: s.url,
        })),
      );
      await fetchAndSetPlaylists();
    } else {
      const updated = playlists.map((pl, i) => {
        if (i !== plIdx) return pl;
        const newSongs = [...pl.songs];
        const [moved] = newSongs.splice(from, 1);
        newSongs.splice(to, 0, moved);
        return { ...pl, songs: newSongs };
      });
      savePlaylists(updated);
    }
  };

  if (!user) {
    return (
      <div className="p-4 text-center">
        Please sign in to use the music player.
      </div>
    );
  }

  if (playlistError) {
    return (
      <div className="p-4 text-center text-destructive">
        {playlistError}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="w-full flex flex-col items-center">
        <div className="w-full relative">
          <MusicPlayerVideo
            currentSong={playlist[currentSongIndex] || null}
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
            showVideo={showVideo}
          />
        </div>
        <div className="w-full flex items-center gap-2 px-4 mt-2">
          <span className="text-xs tabular-nums w-12 text-right">
            {formatTime(playedSeconds)}
          </span>
          <Slider
            min={0}
            max={duration}
            step={0.1}
            value={[playedSeconds]}
            onValueChange={([val]) => {
              setSeeking(true);
              setPlayedSeconds(val);
            }}
            onValueCommit={([val]) => {
              setSeeking(false);
              setCurrentTime(val);
              if (playerRef.current) playerRef.current.seekTo(val, "seconds");
            }}
            className="flex-grow"
          />
          <span className="text-xs tabular-nums w-12 text-left">
            {formatTime(duration)}
          </span>
        </div>
        <div className="w-full flex items-center gap-2 px-4 mt-2 mb-2">
          <button
            onClick={toggleMute}
            className="p-1 rounded hover:bg-muted"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[volume]}
            onValueChange={handleVolumeChange}
            className="w-32"
          />
          <button
            onClick={toggleVideoDisplay}
            className="ml-4 px-2 py-1 rounded bg-muted text-xs hover:bg-muted/80 border border-border"
          >
            {showVideo ? "Hide Video" : "Show Video"}
          </button>
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
        currentSong={playlist[currentSongIndex] || null}
        playedSeconds={playedSeconds}
        duration={duration}
        formatTime={formatTime}
      />
      <div className="font-semibold text-center mt-2 mb-1">Queue</div>
      <MusicPlayerPlaylist
        currentSongIndex={currentSongIndex}
        playlists={playlists || []}
        onAddPlaylist={handleAddPlaylist}
        onAddVideoToPlaylist={handleAddVideoToPlaylist}
        onRemoveVideoFromPlaylist={handleRemoveVideoFromPlaylist}
        onMoveVideoInPlaylist={moveVideoInPlaylist}
        savePlaylists={savePlaylists}
      />
    </div>
  );
};

export default MusicPlayer;
