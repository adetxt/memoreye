import { FileEntry } from "@tauri-apps/api/fs";
import { FC } from "react";
import { TbGridDots, TbList } from "react-icons/tb";
import { OpenDirectoryButton, FolderStructure } from "./OpenDirectoryButton";
import { LayoutType } from "./Gallery";

type NavbarProps = {
  onSelect: (files: FileEntry[], folderStructure: FolderStructure[]) => void;
  hasImages?: boolean;
  currentLayout?: LayoutType;
  onLayoutChange?: (layout: LayoutType) => void;
};

export const Navbar: FC<NavbarProps> = ({ 
  onSelect, 
  hasImages = false, 
  currentLayout = 'masonry', 
  onLayoutChange 
}) => {
  return (
    <div className="w-full py-3 px-3 flex items-center justify-between">
      <OpenDirectoryButton onSelect={onSelect} />
      
      {hasImages && onLayoutChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-2">Layout:</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onLayoutChange('masonry')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                currentLayout === 'masonry'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Masonry Grid"
            >
              <TbGridDots className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => onLayoutChange('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                currentLayout === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="List View"
            >
              <TbList className="w-4 h-4" />
              List
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
