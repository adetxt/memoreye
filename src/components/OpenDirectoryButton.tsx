import { open } from "@tauri-apps/api/dialog";
import { FileEntry, readDir } from "@tauri-apps/api/fs";
import { FC } from "react";
import { validateImageExtension } from "../utils/utils";

export type FolderStructure = {
  folderName: string;
  folderPath: string;
  files: FileEntry[];
};

export type OpenDirectoryButtonProps = {
  onSelect: (files: FileEntry[], folderStructure: FolderStructure[]) => void;
};

export const OpenDirectoryButton: FC<OpenDirectoryButtonProps> = ({
  onSelect,
}) => {
  const selectDir = async () => {
    const res = await open({
      directory: true,
    });

    if (!res) {
      return null;
    }

    const rootPath = res as string;
    
    // Step 1: Read the selected directory (non-recursive first)
    const rootEntries = await readDir(rootPath, { recursive: false });
    
    // Step 2: Find subdirectories
    const subdirectories = rootEntries.filter(entry => entry.children !== undefined);
    
    console.log('Root directory:', rootPath);
    console.log('Subdirectories found:', subdirectories.map(d => d.name));
    
    const folderStructure: FolderStructure[] = [];
    const allFiles: FileEntry[] = [];
    
    // Check root directory for images
    const rootImages = rootEntries.filter(entry => 
      entry.children === undefined && validateImageExtension(entry.name as string)
    );
    
    if (rootImages.length > 0) {
      folderStructure.push({
        folderName: 'Root',
        folderPath: rootPath,
        files: rootImages
      });
      allFiles.push(...rootImages);
    }
    
    // Step 3 & 4: Check each subdirectory for images
    for (const subdir of subdirectories) {
      try {
        const subdirPath = subdir.path as string;
        const subdirEntries = await readDir(subdirPath, { recursive: true });
        
        // Filter for images in this subdirectory
         const subdirImages = subdirEntries.filter(entry => 
           validateImageExtension(entry.name as string)
         );
         
         console.log(`Subdirectory ${subdir.name}:`, subdirImages.length, 'images');
         if (subdirImages.length > 0) {
           console.log('Sample image paths:', subdirImages.slice(0, 3).map(img => img.path));
         }
        
        // Only add to folder structure if it has images
        if (subdirImages.length > 0) {
          folderStructure.push({
            folderName: subdir.name as string,
            folderPath: subdirPath,
            files: subdirImages
          });
          allFiles.push(...subdirImages);
        }
      } catch (error) {
        console.warn(`Failed to read subdirectory ${subdir.name}:`, error);
      }
    }
    
    // Sort folder structure
    folderStructure.sort((a, b) => {
      if (a.folderName === 'Root') return -1;
      if (b.folderName === 'Root') return 1;
      return a.folderName.localeCompare(b.folderName);
    });
    
    console.log('Final folder structure:', folderStructure);
    console.log('Total images found:', allFiles.length);
    
    onSelect(allFiles, folderStructure);
  };

  return (
    <button className="btn btn-neutral" onClick={selectDir}>
      Select Directory
    </button>
  );
};
