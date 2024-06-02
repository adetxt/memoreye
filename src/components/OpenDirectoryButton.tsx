import { open } from "@tauri-apps/api/dialog";
import { BaseDirectory, FileEntry, readDir } from "@tauri-apps/api/fs";
import { FC } from "react";
import { validateImageExtension } from "../utils/utils";

export type OpenDirectoryButtonProps = {
  onSelect: (files: FileEntry[]) => void;
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

    const entries = await readDir(res as string, {
      dir: BaseDirectory.AppCache,
      recursive: true,
    });

    const filteredFiles = entries.filter((file) =>
      validateImageExtension(file.name as string)
    );

    onSelect(filteredFiles);
  };

  return (
    <button className="btn btn-neutral" onClick={selectDir}>
      Select Directory
    </button>
  );
};
