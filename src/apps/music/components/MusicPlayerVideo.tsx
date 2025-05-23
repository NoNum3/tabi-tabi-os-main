import React, { useState, useEffect, useRef } from "react";
import YouTubePlayer from "react-player/youtube";
import { Song } from "@/apps/music/types/Song";
import { Rewind, Pause, Play, FastForward, VolumeX, Volume2, Fullscreen, Captions } from "lucide-react";

interface MusicPlayerVideoProps {
    currentSong: Song | null;
    playing: boolean;
    isPlayerReady: boolean;
    isMuted: boolean;
    volume: number;
    playerRef: React.RefObject<YouTubePlayer | null>;
    onProgress: (state: { playedSeconds: number }) => void;
    onDuration: (duration: number) => void;
    onEnded: () => void;
    onError: (e: unknown) => void;
    onBuffer: () => void;
    onBufferEnd: () => void;
    onPlay: () => void;
    onPause: () => void;
    onReady: () => void;
    showVideo: boolean;
    containerRef?: React.RefObject<HTMLDivElement>;
    isFullscreen?: boolean;
    playedSeconds?: number;
    duration?: number;
    onSeek?: (value: number) => void;
    onTogglePlay?: () => void;
    onPrev?: () => void;
    onNext?: () => void;
    onToggleMute?: () => void;
    onToggleFullscreen?: () => void;
    setVolume?: (v: number) => void;
    availableResolutions?: string[];
    currentResolution?: string;
    onChangeResolution?: (res: string) => void;
    subtitlesEnabled?: boolean;
    onToggleSubtitles?: () => void;
}

export const MusicPlayerVideo: React.FC<MusicPlayerVideoProps> = ({
    currentSong,
    playing,
    isPlayerReady,
    isMuted,
    volume,
    playerRef,
    onProgress,
    onDuration,
    onEnded,
    onError,
    onBuffer,
    onBufferEnd,
    onPlay,
    onPause,
    onReady,
    showVideo,
    containerRef,
    isFullscreen,
    playedSeconds = 0,
    duration = 0,
    onSeek,
    onTogglePlay,
    onPrev,
    onNext,
    onToggleMute,
    onToggleFullscreen,
    setVolume,
    availableResolutions = ["auto", "1080p", "720p", "480p", "360p"],
    currentResolution = "auto",
    onChangeResolution,
    subtitlesEnabled = false,
    onToggleSubtitles,
}) => {
    const [showControls, setShowControls] = useState(true);
    const hideTimeout = useRef<NodeJS.Timeout | null>(null);

    // Auto-hide controls after 2.5s of inactivity in fullscreen
    useEffect(() => {
        if (!isFullscreen) {
            setShowControls(true);
            return;
        }
        if (showControls) {
            if (hideTimeout.current) clearTimeout(hideTimeout.current);
            hideTimeout.current = setTimeout(() => setShowControls(false), 2500);
        }
        return () => {
            if (hideTimeout.current) clearTimeout(hideTimeout.current);
        };
    }, [showControls, isFullscreen]);

    const handleMouseMove = () => {
        if (isFullscreen) setShowControls(true);
    };

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

    return (
        <div
            ref={containerRef}
            className={showVideo
                ? "bg-black w-full aspect-video h-auto relative"
                : "bg-black w-full h-0 overflow-hidden relative"}
            tabIndex={0}
            aria-label="YouTube video player"
            role="region"
            onMouseMove={handleMouseMove}
        >
            {/* Custom controls will be rendered here by parent */}
            {currentSong && (
                <YouTubePlayer
                    ref={playerRef}
                    url={currentSong.url}
                    playing={playing && isPlayerReady}
                    controls={false}
                    volume={isMuted ? 0 : volume}
                    muted={isMuted}
                    width="100%"
                    height="100%"
                    onProgress={onProgress}
                    onDuration={onDuration}
                    onEnded={onEnded}
                    onError={onError}
                    onBuffer={onBuffer}
                    onBufferEnd={onBufferEnd}
                    onPlay={onPlay}
                    onPause={onPause}
                    onReady={onReady}
                />
            )}
            {/* Overlay controls: always rendered when showVideo, in both fullscreen and windowed mode */}
            {showVideo && (
                <>
                    {/* Invisible hover/tap area at the bottom for desktop/mobile */}
                    <div
                        className="absolute left-0 bottom-0 w-full h-10 z-[9999]"
                        style={{ background: 'transparent', touchAction: 'manipulation' }}
                        aria-label="Show player controls"
                        tabIndex={0}
                        onMouseEnter={() => setShowControls(true)}
                        onTouchStart={() => setShowControls(true)}
                    />
                    <div
                        className={`absolute left-0 bottom-0 w-full z-[10000] bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col items-center transition-opacity duration-200 ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                        style={{ pointerEvents: showControls ? 'auto' : 'none' }}
                    >
                        <div className="flex items-center gap-2 w-full max-w-2xl mx-auto">
                            <span className="text-xs text-white/70 min-w-[36px] text-right">{formatTime(playedSeconds)}</span>
                            <input
                                type="range"
                                min={0}
                                max={duration || 1}
                                step={0.1}
                                value={playedSeconds}
                                onChange={e => onSeek && onSeek(Number(e.target.value))}
                                className="flex-1 accent-primary"
                                style={{ accentColor: '#fff' }}
                                aria-label="Seek video"
                            />
                            <span className="text-xs text-white/70 min-w-[36px]">{formatTime(duration)}</span>
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-3">
                            <button onClick={onPrev} className="p-2 rounded hover:bg-muted" aria-label="Previous"><Rewind size={22} /></button>
                            <button onClick={onTogglePlay} className="p-2 rounded bg-primary text-white hover:bg-primary/80" aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause size={28} /> : <Play size={28} />}</button>
                            <button onClick={onNext} className="p-2 rounded hover:bg-muted" aria-label="Next"><FastForward size={22} /></button>
                            <button onClick={onToggleMute} className="p-2 rounded hover:bg-muted" aria-label={isMuted ? "Unmute" : "Mute"}>
                                {isMuted ? <VolumeX size={16} color="#fff" /> : <Volume2 size={16} color="#fff" />}
                            </button>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={volume}
                                onChange={e => setVolume && setVolume(Number(e.target.value))}
                                className="w-16 mx-1 accent-primary"
                                style={{ accentColor: "#fff" }}
                                aria-label="Volume"
                            />
                            {/* Subtitles toggle */}
                            <button
                                onClick={onToggleSubtitles}
                                className={`p-2 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary ${subtitlesEnabled ? 'bg-primary text-white' : ''}`}
                                aria-label={subtitlesEnabled ? "Disable Subtitles" : "Enable Subtitles"}
                                tabIndex={0}
                            >
                                <Captions size={22} />
                            </button>
                            {/* Resolution dropdown */}
                            <label htmlFor="resolution-select" className="sr-only">Video Resolution</label>
                            <select
                                id="resolution-select"
                                value={currentResolution}
                                onChange={e => onChangeResolution && onChangeResolution(e.target.value)}
                                className="p-2 rounded bg-background border border-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                aria-label="Select video resolution"
                                tabIndex={0}
                            >
                                {availableResolutions.map(res => (
                                    <option key={res} value={res}>{res}</option>
                                ))}
                            </select>
                            <button onClick={onToggleFullscreen} className="p-2 rounded hover:bg-muted" aria-label="Exit Fullscreen"><Fullscreen size={22} /></button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
