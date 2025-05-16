"use client";

import React from "react";
import { useRichTextToolbarState } from "@/apps/notepad/hooks/useRichTextToolbarState";
import { ToolbarActionButtons } from "@/apps/notepad/toolbar/ToolbarActionButtons";
import { ToolbarBlockTypeSelect } from "@/apps/notepad/toolbar/ToolbarBlockTypeSelect"; 
import { ToolbarFontSelect } from "@/apps/notepad/toolbar/ToolbarFontSelect";
import { ToolbarFormatButtons } from "@/apps/notepad/toolbar/ToolbarFormatButtons";
import { ToolbarAlignButtons } from "@/apps/notepad/toolbar/ToolbarAlignButtons";
import { ToolbarListButtons } from "@/apps/notepad/toolbar/ToolbarListButtons";
import { playSound } from "@/infrastructure/lib/utils";
import { ElementFormatType, TextFormatType } from "lexical";
import type { BlockTypeDropdownValue } from "@/apps/notepad/types/richTextTypes";

export const RichTextToolbar: React.FC = () => {
  const {
    editor,
    isBold,
    isItalic,
    isUnderline,
    textAlign,
    blockType,
    fontSize,
    fontFamily,
    copySuccess,
    formatText,
    formatElement,
    formatBulletList,
    formatNumberedList,
    onFontSizeChange,
    onFontFamilyChange,
    onBlockTypeChange,
    handleSave,
    handleCopy,
  } = useRichTextToolbarState();

  // Wrap handlers with sound effects
  const handleFontSizeChange = (value: string) => {
    playSound("/sounds/click.mp3");
    onFontSizeChange(value);
  };

  const handleFontFamilyChange = (value: string) => {
    playSound("/sounds/click.mp3");
    onFontFamilyChange(value);
  };

  const handleBlockTypeChange = (value: BlockTypeDropdownValue) => {
    playSound("/sounds/click.mp3");
    onBlockTypeChange(value);
  };

  const handleFormatText = (format: TextFormatType) => {
    playSound("/sounds/click.mp3");
    formatText(format);
  };

  const handleFormatElement = (format: ElementFormatType) => {
    playSound("/sounds/click.mp3");
    formatElement(format);
  };

  const handleFormatBulletList = () => {
    playSound("/sounds/click.mp3");
    formatBulletList();
  };

  const handleFormatNumberedList = () => {
    playSound("/sounds/click.mp3");
    formatNumberedList();
  };

  const handleSaveWithSound = () => {
    playSound("/sounds/click.mp3");
    handleSave();
  };

  const handleCopyWithSound = () => {
    playSound("/sounds/click.mp3");
    handleCopy();
  };

  return (
    <div className="flex flex-wrap items-center p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 gap-1 shadow-sm">
      <ToolbarFontSelect
        fontFamily={fontFamily}
        onFontFamilyChange={handleFontFamilyChange}
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
      />

      <ToolbarBlockTypeSelect
        blockType={blockType}
        onBlockTypeChange={handleBlockTypeChange}
      />

      <ToolbarFormatButtons
        formatText={handleFormatText}
        isBold={isBold}
        isItalic={isItalic}
        isUnderline={isUnderline}
      />

      <ToolbarAlignButtons
        formatElement={handleFormatElement}
        textAlign={textAlign}
      />

      <ToolbarListButtons
        formatBulletList={handleFormatBulletList}
        formatNumberedList={handleFormatNumberedList}
        blockType={blockType}
      />
      <ToolbarActionButtons
        editor={editor}
        handleSave={handleSaveWithSound}
        handleCopy={handleCopyWithSound}
        copySuccess={copySuccess}
      />
    </div>
  );
};
