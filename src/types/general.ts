import { FileEntry } from "@tauri-apps/api/fs";

export type Photo = {
  key: string;
  src: string;
};

export type Directory = {
  name: string;
  path: string;
  fileCount?: number;
  files?: FileEntry[];
};
