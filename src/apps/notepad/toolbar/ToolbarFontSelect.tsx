import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fontFamilies, fontSizes } from "@/apps/notepad/constants/richTextConstants";
import { useI18n } from '@/locales/client';

interface ToolbarFontSelectProps {
  fontFamily: string;
  onFontFamilyChange: (newFamily: string) => void;
  fontSize: string;
  onFontSizeChange: (newSize: string) => void;
}

export const ToolbarFontSelect: React.FC<ToolbarFontSelectProps> = ({
  fontFamily,
  onFontFamilyChange,
  fontSize,
  onFontSizeChange,
}) => {
  const t = useI18n();

  return (
    <div className="flex items-center">
      {/* Font Family Dropdown */}
      <Select value={fontFamily} onValueChange={onFontFamilyChange}>
        <SelectTrigger className="w-[150px] h-8 text-xs px-2 mr-1" aria-label={t('notepad.fontFamily', { count: 1 })}>
          <SelectValue placeholder="Font Family" />
        </SelectTrigger>
        <SelectContent>
          {fontFamilies.map((family) => (
            <SelectItem
              key={family}
              value={family}
              className="text-xs"
              style={{ fontFamily: family }}
            >
              {family}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Font Size Dropdown */}
      <Select value={fontSize} onValueChange={onFontSizeChange}>
        <SelectTrigger className="w-[70px] h-8 text-xs px-2 mr-2 border-r border-gray-200 dark:border-gray-700 pr-3" aria-label={t('notepad.fontSize', { count: 1 })}>
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          {fontSizes.map((size) => (
            <SelectItem key={size} value={size} className="text-xs">
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
