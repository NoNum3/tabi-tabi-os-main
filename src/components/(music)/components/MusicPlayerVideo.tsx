import React, { useRef } from "react";
import YouTubePlayer from "react-player/youtube";
import { Song } from "../types/Song";

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
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div
            ref={containerRef}
            className={showVideo
                ? "bg-black w-full aspect-video h-auto relative"
                : "bg-black w-full h-0 overflow-hidden relative"}
        >
            {currentSong && (
                <YouTubePlayer
                    ref={playerRef}
                    url={currentSong.url}
                    playing={playing && isPlayerReady}
                    controls={true}
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
        </div>
    );
};
