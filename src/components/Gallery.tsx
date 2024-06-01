import { useVirtualizer } from "@tanstack/react-virtual";
import { FileEntry } from "@tauri-apps/api/fs";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { FC, useEffect, useRef, useState } from "react";
import Masonry from "react-masonry-css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { loadImage } from "../utils/utils";
import { PhotoCard } from "./PhotoCard";

const breakpoints = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1,
};

type GalleryProps = {
  entries: FileEntry[];
};

export const Gallery: FC<GalleryProps> = ({ entries }) => {
  const [photosCount, setPhotosCount] = useState(0);
  const [openLightbox, setOpenLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [loadedPhotos, setLoadedPhotos] = useState<HTMLImageElement[]>([]);
  const parentRef = useRef();

  useEffect(() => {
    if (entries.length > 0) {
      selectDir();
    }
  }, [entries]);

  const rowVirtualizer = useVirtualizer({
    count: photosCount,
    getScrollElement: () => parentRef.current as any,
    estimateSize: (idx) => {
      return loadedPhotos[idx]?.height ?? 0;
    },
  });

  const selectDir = async () => {
    setPhotosCount(entries.length);
    setLoadedPhotos([]);

    for (let i = 0; i < entries.length; i++) {
      loadImage(convertFileSrc(entries[i].path as string), (img) => {
        setLoadedPhotos((prev) => [...prev, img]);
      });
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-6" ref={parentRef as any}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-semibold">Photos</h1>
        </div>
        <Masonry
          breakpointCols={breakpoints}
          className="flex -ml-4 w-auto"
          columnClassName="pl-4 bg-clip-padding"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => (
            <button
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              onClick={() => {
                setOpenLightbox(true);
                setLightboxIndex(virtualItem.index);
              }}
            >
              <PhotoCard image={loadedPhotos[virtualItem.index]} />
            </button>
          ))}
        </Masonry>
      </div>
      <Lightbox
        open={openLightbox}
        index={lightboxIndex}
        close={() => setOpenLightbox(false)}
        slides={loadedPhotos}
      />
    </>
  );
};
