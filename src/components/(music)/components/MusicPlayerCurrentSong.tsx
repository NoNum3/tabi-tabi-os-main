import React from "react";
import { Song } from "../types/Song";

interface MusicPlayerCurrentSongProps {
    currentSong: Song | null;
    playedSeconds: number;
    duration: number;
    formatTime: (seconds: number) => string;
}

export const MusicPlayerCurrentSong: React.FC<MusicPlayerCurrentSongProps> = ({
    currentSong,
    playedSeconds,
    duration,
    formatTime,
}) => (
    <div className="p-3 bg-muted border-b border-border min-h-[60px]">
        {currentSong
            ? (
                <div>
                    <p className="text-sm font-semibold text-foreground truncate">
                        {currentSong.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {formatTime(playedSeconds)} / {formatTime(duration)}
                    </p>
                </div>
            )
            : (
                <p className="text-sm text-muted-foreground">
                    Playlist empty. Add a YouTube URL.
                </p>
            )}
    </div>
);
