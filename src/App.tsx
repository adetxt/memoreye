import { FileEntry } from "@tauri-apps/api/fs";
import { useState } from "react";
import { EmptyState } from "./components/EmptyState";
import { Gallery, LayoutType } from "./components/Gallery";
import { Navbar } from "./components/Navbar";
import { FolderTabs } from "./components/FolderTabs";
import { FolderStructure } from "./components/OpenDirectoryButton";

function App() {
  const [selected, setSelected] = useState<FileEntry[]>([]);
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('masonry');
  const [folderStructure, setFolderStructure] = useState<FolderStructure[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');

  const handleDirectorySelect = (files: FileEntry[], folders: FolderStructure[]) => {
    setSelected(files);
    setFolderStructure(folders);
    // Auto-select the first folder if available
    if (folders.length > 0) {
      setSelectedFolder(folders[0].folderPath);
    } else {
      setSelectedFolder('');
    }
  };

  const handleFolderSelect = (folderPath: string) => {
    setSelectedFolder(folderPath);
  };

  // Filter files based on selected folder
  const filteredFiles = selectedFolder && folderStructure.length > 0
    ? folderStructure.find(folder => folder.folderPath === selectedFolder)?.files || []
    : selected;

  // If no files in selected folder but there are files in other folders, show all files
  const displayFiles = filteredFiles.length === 0 && selected.length > 0 ? selected : filteredFiles;

  return (
    <div className="bg-gray-100 min-h-screen">
      {(selected.length > 0 || folderStructure.length > 0) && (
        <Navbar 
          onSelect={handleDirectorySelect} 
          hasImages={selected.length > 0 || folderStructure.length > 0}
          currentLayout={currentLayout}
          onLayoutChange={setCurrentLayout}
        />
      )}
      {(selected.length > 0 || folderStructure.length > 0) && (
        <div>
          <FolderTabs
            folders={folderStructure}
            selectedFolder={selectedFolder}
            onFolderSelect={handleFolderSelect}
          />
          <Gallery 
            entries={displayFiles} 
            layout={currentLayout}
          />
        </div>
      )}
      {selected.length === 0 && folderStructure.length === 0 && (
        <div className="flex flex-col items-center justify-center h-screen">
          <EmptyState onSelect={handleDirectorySelect} />
        </div>
      )}
    </div>
  );
}

export default App;
