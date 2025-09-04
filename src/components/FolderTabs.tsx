import { FC } from "react";
import { FolderStructure } from "./OpenDirectoryButton";

type FolderTabsProps = {
  folders: FolderStructure[];
  selectedFolder: string;
  onFolderSelect: (folderPath: string) => void;
};

export const FolderTabs: FC<FolderTabsProps> = ({
  folders,
  selectedFolder,
  onFolderSelect,
}) => {
  if (folders.length <= 1) {
    return null; // Don't show tabs if there's only one folder or no folders
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {folders.map((folder) => {
            const isSelected = selectedFolder === folder.folderPath;
            return (
              <button
                key={folder.folderPath}
                onClick={() => onFolderSelect(folder.folderPath)}
                className={`
                  flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200
                  ${
                    isSelected
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span>{folder.folderName}</span>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {folder.files.length}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};