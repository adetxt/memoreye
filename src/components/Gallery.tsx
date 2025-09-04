import { FileEntry } from "@tauri-apps/api/fs";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { FC, useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  TbArrowBigLeftFilled,
  TbArrowBigRightFilled,
  TbCircleX,
} from "react-icons/tb";
import Masonry from "react-masonry-css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { 
  loadImageWithThumbnails, 
  LoadedImage, 
  getCachedImage, 
  setCachedImage,
  validateImageExtension 
} from "../utils/utils";
import { PhotoCard } from "./PhotoCard";
import { ZoomableDialog } from "./ZoomableDialog";
import { MagnifyingGlass } from "./MagnifyingGlass";

const breakpoints = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1,
};

export type LayoutType = 'masonry' | 'list';

type GalleryProps = {
  entries: FileEntry[];
  layout?: LayoutType;
};

export const Gallery: FC<GalleryProps> = ({ entries, layout = 'masonry' }) => {
  const [openLightbox, setOpenLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [openZoomDialog, setOpenZoomDialog] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  const [loadingErrors, setLoadingErrors] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [loadedPhotos, setLoadedPhotos] = useState<LoadedImage[]>([]);
  const parentRef = useRef<HTMLDivElement>(null);

  // Filter valid image files
  const validImageEntries = useMemo(() => {
    return entries.filter(entry => 
      validateImageExtension(entry.path as string)
    );
  }, [entries]);

  useEffect(() => {
    if (validImageEntries.length > 0) {
      selectDir();
    }
  }, [validImageEntries]);

  // Auto-select first loaded image for list layout
  useEffect(() => {
    if (layout === 'list' && loadedPhotos.length > 0) {
      const firstLoadedIndex = loadedPhotos.findIndex(photo => photo !== null);
      if (firstLoadedIndex !== -1 && (loadedPhotos[selectedImageIndex] === null || loadedPhotos[selectedImageIndex] === undefined)) {
        setSelectedImageIndex(firstLoadedIndex);
      }
    }
  }, [loadedPhotos, layout, selectedImageIndex]);

  // Note: Virtualization removed in favor of masonry layout with intersection observer optimization

  const selectDir = useCallback(async () => {
    // Reset state immediately when starting new directory load
    setIsLoadingDirectory(true);
    setLoadedPhotos(new Array(validImageEntries.length).fill(null));
    setLoadingProgress(0);
    setLoadingErrors([]);
    setSelectedImageIndex(0);

    try {
      // Process images one by one for incremental progress updates
      for (let index = 0; index < validImageEntries.length; index++) {
        const entry = validImageEntries[index];
        const url = convertFileSrc(entry.path as string);
        
        try {
          console.log(`Loading image ${index + 1}/${validImageEntries.length}:`, entry.path);
          console.log('Converted URL:', url);
          
          // Check cache first
          let cachedImage = getCachedImage(url);
          let loadedImage: LoadedImage;
          
          if (cachedImage) {
            loadedImage = cachedImage;
          } else {
            loadedImage = await loadImageWithThumbnails(url);
            setCachedImage(url, loadedImage);
          }
          
          // Update loaded photos array at specific index
          setLoadedPhotos(prev => {
            const newArray = [...prev];
            newArray[index] = loadedImage;
            return newArray;
          });
          
        } catch (error) {
          console.error(`Failed to load image: ${entry.path}`, error);
          setLoadingErrors(prev => [...prev, entry.path as string]);
        }
        
        // Update progress incrementally
        setLoadingProgress(index + 1);
        
        // Small delay to allow UI updates and prevent blocking
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    } finally {
      setIsLoadingDirectory(false);
    }
  }, [validImageEntries]);

  // Preload adjacent images for better UX
  const preloadAdjacentImages = useCallback((currentIndex: number) => {
    const preloadRange = 2;
    for (let i = Math.max(0, currentIndex - preloadRange); 
         i <= Math.min(loadedPhotos.length - 1, currentIndex + preloadRange); 
         i++) {
      if (i !== currentIndex && loadedPhotos[i]) {
        // Preload large thumbnail for lightbox
        const img = new Image();
        img.src = loadedPhotos[i].thumbnails.large;
      }
    }
  }, [loadedPhotos]);

  // Track if we're currently loading
  const isLoading = isLoadingDirectory || (loadingProgress < validImageEntries.length && validImageEntries.length > 0);
  
  // Convert LoadedImages to lightbox slides format
  const lightboxSlides = useMemo(() => {
    return loadedPhotos
      .filter(photo => photo !== null)
      .map(photo => ({
        src: photo.thumbnails.large,
        width: photo.size.width,
        height: photo.size.height,
        alt: "Photo",
      }));
  }, [loadedPhotos]);

  // Extract filename from path
  const getFileName = useCallback((path: string | undefined) => {
    if (!path) return 'Unknown';
    return path.split('/').pop()?.split('\\').pop() || 'Unknown';
  }, []);

  // Handle photo click - different behavior for different layouts
  const handlePhotoClick = useCallback((index: number) => {
    if (layout === 'masonry') {
      setOpenLightbox(true);
      setLightboxIndex(index);
      preloadAdjacentImages(index);
    } else {
      // List layout - open zoomable dialog
      setSelectedImageIndex(index);
      setOpenZoomDialog(true);
    }
  }, [layout, preloadAdjacentImages]);

  // Handle preview click in list layout
  const handlePreviewClick = useCallback(() => {
    if (layout === 'list') {
      setOpenZoomDialog(true);
    }
  }, [layout]);

  return (
    <>
      {/* Loading progress indicator - always show when loading */}
      {isLoading && (
        <div className="container mx-auto px-4 py-2">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${validImageEntries.length > 0 ? (loadingProgress / validImageEntries.length) * 100 : 0}%` 
              }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-gray-600">
              Loading images... {loadingProgress}/{validImageEntries.length}
            </p>
            {loadingErrors.length > 0 && (
              <p className="text-sm text-red-500">
                {loadingErrors.length} failed
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error summary after loading completes */}
      {!isLoading && loadingErrors.length > 0 && (
        <div className="container mx-auto px-4 py-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              ⚠️ Failed to load {loadingErrors.length} image{loadingErrors.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* No images message */}
      {!isLoading && validImageEntries.length === 0 && (
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Images Found</h3>
            <p className="text-gray-500">
              This directory doesn't contain any supported image files.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Supported formats: JPG, JPEG, PNG, GIF, BMP, WEBP
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6" ref={parentRef}>
        {validImageEntries.length > 0 && layout === 'masonry' ? (
          <Masonry
            breakpointCols={breakpoints}
            className="flex -ml-4 w-auto"
            columnClassName="pl-4 bg-clip-padding"
          >
            {loadedPhotos.map((photo, index) => {
              if (!photo) return null;
              
              return (
                <PhotoCard
                  key={`photo-${index}`}
                  loadedImage={photo}
                  size="medium"
                  onClick={() => handlePhotoClick(index)}
                  className="transition-transform hover:scale-105"
                />
              );
            })}
          </Masonry>
        ) : validImageEntries.length > 0 ? (
          <div className="flex h-[calc(100vh-150px)] gap-6">
            {/* Main image display on the left - bigger preview */}
            <div className="flex-1 flex flex-col bg-gray-900 rounded-lg overflow-hidden">
              {/* Image info header */}
              {loadedPhotos[selectedImageIndex] && validImageEntries[selectedImageIndex] && (
                <div className="bg-gray-800 text-white p-4 border-b border-gray-700">
                  <h2 className="text-lg font-semibold truncate">
                    {getFileName(validImageEntries[selectedImageIndex]?.path)}
                  </h2>
                  <p className="text-sm text-gray-300">
                    {loadedPhotos[selectedImageIndex].size.width} × {loadedPhotos[selectedImageIndex].size.height}
                  </p>
                </div>
              )}
              
              {/* Image preview with magnifying glass */}
              <div className="flex-1 flex items-center justify-center p-4">
                {loadedPhotos[selectedImageIndex] ? (
                  <MagnifyingGlass 
                    image={loadedPhotos[selectedImageIndex]} 
                    magnification={1}
                    glassSize={200}
                  >
                    <img
                      src={loadedPhotos[selectedImageIndex].thumbnails.large}
                      alt="Selected photo"
                      className="max-w-full max-h-full object-contain cursor-pointer rounded-lg shadow-lg"
                      onClick={handlePreviewClick}
                    />
                  </MagnifyingGlass>
                ) : (
                  <div className="text-gray-400 text-xl">Select an image to preview</div>
                )}
              </div>
            </div>
            
            {/* Thumbnail list on the right */}
            <div className="w-96 bg-gray-50 rounded-lg overflow-hidden shadow-lg">
              <div className="p-4 border-b bg-white">
                <h3 className="font-semibold text-gray-800">
                  Images ({loadedPhotos.filter(p => p !== null).length})
                </h3>
              </div>
              <div className="h-full overflow-y-auto p-3 space-y-3">
                {loadedPhotos.map((photo, index) => {
                  if (!photo) return null;
                  
                  const fileName = getFileName(validImageEntries[index]?.path);
                  
                  return (
                    <div
                      key={`thumb-${index}`}
                      className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all ${
                        selectedImageIndex === index
                          ? 'bg-blue-100 border-2 border-blue-500 shadow-md'
                          : 'bg-white hover:bg-gray-100 border-2 border-transparent hover:shadow-md'
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img
                        src={photo.thumbnails.small}
                        alt={`Thumbnail of ${fileName}`}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate mb-1" title={fileName}>
                          {fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {photo.size.width} × {photo.size.height}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {(photo.size.width * photo.size.height / 1000000).toFixed(1)}MP
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      
      <Lightbox
        open={openLightbox}
        index={lightboxIndex}
        render={{
          iconPrev: () => (
            <TbArrowBigLeftFilled className="w-8 h-8 text-gray-800 hover:text-gray-600" />
          ),
          iconNext: () => (
            <TbArrowBigRightFilled className="w-8 h-8 text-gray-800 hover:text-gray-600" />
          ),
          iconClose: () => (
            <TbCircleX className="w-9 h-9 text-red-500 hover:text-red-400" />
          ),
        }}
        close={() => setOpenLightbox(false)}
        slides={lightboxSlides}
        carousel={{
          finite: true,
          preload: 2, // Preload 2 images ahead
        }}
        animation={{
          fade: 300,
          swipe: 500,
        }}
      />
      
      {/* Zoomable Dialog for List Layout */}
      <ZoomableDialog
        isOpen={openZoomDialog}
        onClose={() => setOpenZoomDialog(false)}
        image={loadedPhotos[selectedImageIndex]}
        fileName={validImageEntries[selectedImageIndex] && loadedPhotos[selectedImageIndex] ? getFileName(validImageEntries[selectedImageIndex]?.path) : undefined}
      />
    </>
  );
};
