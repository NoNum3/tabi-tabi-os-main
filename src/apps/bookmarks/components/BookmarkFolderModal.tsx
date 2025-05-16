import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSetAtom, useAtom } from "jotai";
import { addFolderAtom, updateFolderAtom, foldersLoadingAtom, foldersErrorAtom } from "@/apps/bookmarks/hooks/useFolders";
import { WritableAtom } from "jotai";
import type { Folder } from "@/apps/bookmarks/types/bookmarkTypes";

export const BookmarkFolderModal = ({ open, onClose, folder }: {
  open: boolean;
  onClose: () => void;
  folder?: Folder | null;
}) => {
  const isEdit = !!folder;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const setAddFolder = useSetAtom(addFolderAtom);
  const setUpdateFolder = useSetAtom(updateFolderAtom);
  const [loading] = useAtom(foldersLoadingAtom);
  const [error, setError] = useAtom(foldersErrorAtom as WritableAtom<string | null, [string | null], void>);

  useEffect(() => {
    if (folder) {
      setName(folder.name || "");
      setDescription(folder.description || "");
      setSymbol(folder.symbol || "");
      setColor(folder.color || "");
    } else {
      setName("");
      setDescription("");
      setSymbol("");
      setColor("");
    }
    setError(null);
  }, [folder, open, setError]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Folder name is required.");
      return;
    }
    const data = {
      name: name.trim(),
      description: description.trim() || null,
      parent_id: null as string | null,
      symbol: symbol || null,
      color: color || null,
    };
    if (isEdit && folder) {
      await setUpdateFolder({ ...folder, ...data });
    } else {
      await setAddFolder(data);
    }
    if (!foldersErrorAtom) {
      onClose();
    }
  };

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="bg-card rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">{isEdit ? "Edit Folder" : "Add Folder"}</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Folder Name</span>
            <Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Work" required aria-label="Folder name" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Description</span>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe this folder (optional)" rows={2} aria-label="Folder description" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Symbol (emoji)</span>
            <Input type="text" value={symbol} onChange={e => setSymbol(e.target.value)} maxLength={2} placeholder="e.g. 📁" aria-label="Folder symbol" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Color</span>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} aria-label="Folder color" className="w-10 h-8 p-0 border-none bg-transparent" />
          </label>
          {error && <div className="text-red-500 text-sm" role="alert">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose} aria-label="Cancel" disabled={loading}>Cancel</Button>
            <Button type="submit" variant="default" aria-label={isEdit ? "Save changes" : "Add folder"} disabled={loading}>{loading ? "Saving..." : isEdit ? "Save" : "Add"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 