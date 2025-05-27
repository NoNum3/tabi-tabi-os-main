import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from '@/locales/client';

interface MusicPlayerAddSongFormProps {
    newSongUrl: string;
    setNewSongUrl: (url: string) => void;
    newSongTitle: string;
    setNewSongTitle: (title: string) => void;
    handleAddSong: (e: React.FormEvent) => void;
    isLoading: boolean;
    playlists: { name: string }[];
    onAddToPlaylist: (playlist: string) => void;
}

export const MusicPlayerAddSongForm: React.FC<MusicPlayerAddSongFormProps> = ({
    newSongUrl,
    setNewSongUrl,
    newSongTitle,
    setNewSongTitle,
    handleAddSong,
    isLoading,
    playlists,
    onAddToPlaylist,
}) => {
    const [showModal, setShowModal] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState("queue");
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const t = useI18n();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowModal(true);
    };

    const handleConfirm = () => {
        if (selectedPlaylist === "queue") {
            handleAddSong({ preventDefault: () => {} } as React.FormEvent);
        } else if (selectedPlaylist === "new") {
            onAddToPlaylist(newPlaylistName);
        } else {
            onAddToPlaylist(selectedPlaylist);
        }
        setShowModal(false);
        setNewSongUrl("");
        setNewSongTitle("");
        setNewPlaylistName("");
        setSelectedPlaylist("queue");
    };

    return (
        <>
            <form
                onSubmit={handleSubmit}
                className="p-2 border-b border-border bg-muted flex gap-2"
            >
                <input
                    type="text"
                    value={newSongUrl}
                    onChange={(e) => setNewSongUrl(e.target.value)}
                    placeholder={t('music.pasteAnyYouTubeURLHere', { count: 1 })}
                    className="flex-grow p-2 rounded bg-input text-foreground placeholder:text-muted-foreground border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <input
                    type="text"
                    value={newSongTitle}
                    onChange={(e) => setNewSongTitle(e.target.value)}
                    placeholder={t('music.titleOptional', { count: 1 })}
                    className="flex-grow p-2 rounded bg-input text-foreground placeholder:text-muted-foreground border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button
                    type="submit"
                    disabled={isLoading || !newSongUrl.trim()}
                >
                    {t('music.addToQueueOrPlaylist', { count: 1 })}
                </Button>
            </form>
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-background p-6 rounded shadow-lg w-[320px]">
                        <h3 className="font-bold mb-2">Add to...</h3>
                        <div className="flex flex-col gap-2 mb-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="playlist"
                                    value="queue"
                                    checked={selectedPlaylist === "queue"}
                                    onChange={() =>
                                        setSelectedPlaylist("queue")}
                                />
                                Queue (default)
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="playlist"
                                    value="new"
                                    checked={selectedPlaylist === "new"}
                                    onChange={() => setSelectedPlaylist("new")}
                                />
                                New Playlist
                                {selectedPlaylist === "new" && (
                                    <input
                                        type="text"
                                        value={newPlaylistName}
                                        onChange={(e) =>
                                            setNewPlaylistName(e.target.value)}
                                        placeholder="Playlist name"
                                        className="ml-2 px-2 py-1 rounded border text-xs bg-muted"
                                    />
                                )}
                            </label>
                            {playlists.map((pl, idx) => (
                                <label
                                    key={pl.name + idx}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="radio"
                                        name="playlist"
                                        value={pl.name}
                                        checked={selectedPlaylist === pl.name}
                                        onChange={() =>
                                            setSelectedPlaylist(pl.name)}
                                    />
                                    {pl.name}
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowModal(false)}
                            >
                                {t('music.cancel', { count: 1 })}
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={selectedPlaylist === "new" &&
                                    !newPlaylistName.trim()}
                            >
                                {t('music.confirm', { count: 1 })}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
