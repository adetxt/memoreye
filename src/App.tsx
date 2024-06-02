import { FileEntry } from "@tauri-apps/api/fs";
import { useState } from "react";
import { EmptyState } from "./components/EmptyState";
import { Gallery } from "./components/Gallery";
import { Navbar } from "./components/Navbar";

function App() {
  const [selected, setSelected] = useState<FileEntry[]>([]);

  return (
    <div className="bg-gray-100">
      {selected.length > 0 && <Navbar onSelect={setSelected} />}
      {selected.length > 0 && (
        <div>
          <Gallery entries={selected} />
        </div>
      )}
      {selected.length === 0 && (
        <div className="flex flex-col items-center justify-center h-screen">
          <EmptyState onSelect={setSelected} />
        </div>
      )}
    </div>
  );
}

export default App;
