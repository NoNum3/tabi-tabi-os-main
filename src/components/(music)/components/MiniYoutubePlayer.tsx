import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
    currentSongAtom,
    nextSongAtom,
    playingAtom,
    playlistAtom,
    previousSongAtom,
    volumeAtom,
} from "@/atoms/musicPlayerAtom";
import { windowRegistryAtom } from "@/atoms/windowAtoms";
import { MusicPlayerVideo } from "./MusicPlayerVideo";
import {
    Pause,
    Play,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
} from "lucide-react";
import YouTubePlayer from "react-player/youtube";

export const MiniYoutubePlayer: React.FC = () => {
    const currentSong = useAtomValue(currentSongAtom);
    const [playing, setPlaying] = useAtom(playingAtom);
    const playNext = useSetAtom(nextSongAtom);
    const playPrev = useSetAtom(previousSongAtom);
    const [volume, setVolume] = useAtom(volumeAtom);
    const playlist = useAtomValue(playlistAtom);
    const windowRegistry = useAtomValue(windowRegistryAtom);
    // Show only if YouTube Player is minimized
    const isYoutubeMinimized = Object.values(windowRegistry).some(
        (w) => w.appId === "youtubePlayer" && w.isMinimized,
    );

    // Draggable logic
    const miniRef = useRef<HTMLDivElement>(null);
    const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
    const [dragging, setDragging] = useState(false);
    const [start, setStart] = useState<{ x: number; y: number }>({
        x: 0,
        y: 0,
    });
    const [startPos, setStartPos] = useState<{ x: number; y: number }>({
        x: 0,
        y: 0,
    });

    // Default position: bottom-right
    const defaultX = 24;
    const defaultY = 24;
    const width = 300;
    const height = 180 + 40; // video + controls

    const playerRef = useRef<YouTubePlayer>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragging) return;
            let newX = startPos.x + (e.clientX - start.x);
            let newY = startPos.y + (e.clientY - start.y);
            // Clamp to viewport
            newX = Math.max(0, Math.min(window.innerWidth - width, newX));
            newY = Math.max(0, Math.min(window.innerHeight - height, newY));
            setDrag({ x: newX, y: newY });
        };
        const handleMouseUp = () => setDragging(false);
        if (dragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging, start, startPos, height]);

    if (!isYoutubeMinimized || !currentSong) return null;

    const posX = drag ? drag.x : window.innerWidth - width - defaultX;
    const posY = drag ? drag.y : window.innerHeight - height - defaultY;

    return createPortal(
        <div
            ref={miniRef}
            style={{
                position: "fixed",
                left: posX,
                top: posY,
                zIndex: 9999,
                width,
                background: "#18181b",
                borderRadius: 10,
                boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
                border: "1.5px solid #fff2",
                padding: 0,
                userSelect: "none",
                transition: dragging ? "none" : "left 0.2s, top 0.2s",
            }}
        >
            {/* Drag handle bar */}
            <div
                className="flex items-center justify-between px-2 py-1 cursor-grab bg-neutral-800 rounded-t"
                style={{ borderBottom: "1px solid #fff2" }}
                onMouseDown={(e) => {
                    setDragging(true);
                    setStart({ x: e.clientX, y: e.clientY });
                    setStartPos({
                        x: drag ? drag.x : posX,
                        y: drag ? drag.y : posY,
                    });
                }}
            >
                <span className="text-xs text-white/80 select-none">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                    </svg>
                </span>
                <span className="text-xs text-white/60 font-medium truncate max-w-[180px]">
                    {currentSong.title}
                </span>
                <span className="w-4" />
            </div>
            <div className="flex flex-col items-center p-2">
                <div className="w-full aspect-video rounded overflow-hidden bg-black">
                    <MusicPlayerVideo
                        currentSong={currentSong}
                        playing={playing}
                        isPlayerReady={true}
                        isMuted={volume === 0}
                        volume={volume}
                        playerRef={playerRef}
                        onProgress={() => {}}
                        onDuration={() => {}}
                        onEnded={playNext}
                        onError={() => {}}
                        onBuffer={() => {}}
                        onBufferEnd={() => {}}
                        onPlay={() => setPlaying(true)}
                        onPause={() => setPlaying(false)}
                        onReady={() => {}}
                        showVideo={true}
                    />
                </div>
                <div className="flex items-center gap-2 mt-2 w-full justify-center">
                    <button
                        onClick={() => setPlaying((p) => !p)}
                        className="p-1 rounded hover:bg-white/10"
                        aria-label={playing ? "Pause" : "Play"}
                    >
                        {playing
                            ? <Pause size={18} color="#fff" />
                            : <Play size={18} color="#fff" />}
                    </button>
                    <button
                        onClick={playPrev}
                        className="p-1 rounded hover:bg-white/10"
                        aria-label="Previous"
                        disabled={playlist.length <= 1}
                    >
                        <SkipBack size={16} color="#fff" />
                    </button>
                    <button
                        onClick={playNext}
                        className="p-1 rounded hover:bg-white/10"
                        aria-label="Next"
                        disabled={playlist.length <= 1}
                    >
                        <SkipForward size={16} color="#fff" />
                    </button>
                    <button
                        onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
                        className="p-1 rounded hover:bg-white/10"
                        aria-label={volume === 0 ? "Unmute" : "Mute"}
                    >
                        {volume === 0
                            ? <VolumeX size={16} color="#fff" />
                            : <Volume2 size={16} color="#fff" />}
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-16 mx-1 accent-primary"
                        style={{ accentColor: "#fff" }}
                    />
                </div>
            </div>
        </div>,
        document.body,
    );
};
