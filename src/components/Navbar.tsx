import { FileEntry } from "@tauri-apps/api/fs";
import { FC } from "react";
import { OpenDirectoryButton } from "./OpenDirectoryButton";

type NavbarProps = {
  onSelect: (files: FileEntry[]) => void;
};

export const Navbar: FC<NavbarProps> = ({ onSelect }) => {
  return (
    <div className="w-full py-3 px-3">
      <OpenDirectoryButton onSelect={onSelect} />
    </div>
  );
};
