import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BlockTypeDropdownValue } from "@/apps/notepad/types/richTextTypes";
import { useI18n } from '@/locales/client';

interface ToolbarBlockTypeSelectProps {
  blockType: BlockTypeDropdownValue;
  onBlockTypeChange: (newBlockType: BlockTypeDropdownValue) => void;
}

export const ToolbarBlockTypeSelect: React.FC<ToolbarBlockTypeSelectProps> = ({
  blockType,
  onBlockTypeChange,
}) => {
  const t = useI18n();

  return (
    <Select value={blockType} onValueChange={onBlockTypeChange}>
      <SelectTrigger className="w-[150px] h-8 text-xs px-2 mr-1">
        <SelectValue placeholder={t('notepad.blockType', { count: 1 })} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="paragraph" className="text-xs">
          {t('notepad.paragraph', { count: 1 })}
        </SelectItem>
        <SelectItem value="h1" className="text-xs">
          {t('notepad.heading1', { count: 1 })}
        </SelectItem>
        <SelectItem value="h2" className="text-xs">
          {t('notepad.heading2', { count: 1 })}
        </SelectItem>
        <SelectItem value="h3" className="text-xs">
          {t('notepad.heading3', { count: 1 })}
        </SelectItem>
        <SelectItem value="bullet" className="text-xs">
          {t('notepad.bullet', { count: 1 })}
        </SelectItem>
        <SelectItem value="number" className="text-xs">
          {t('notepad.number', { count: 1 })}
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
