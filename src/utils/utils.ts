export const validateImageExtension = (src: string): boolean => {
  const extWhitelist = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "bmp",
    "tiff",
    "svg",
    "ico",
    "heic",
  ];

  const ext = src.split(".").pop()?.toLowerCase() ?? "";
  return extWhitelist.includes(ext);
};

// Thumbnail sizes for different use cases
export const THUMBNAIL_SIZES = {
  small: { width: 150, height: 150 },
  medium: { width: 300, height: 300 },
  large: { width: 600, height: 600 },
} as const;

export type ThumbnailSize = keyof typeof THUMBNAIL_SIZES;

// Enhanced image loading with thumbnail generation
export interface LoadedImage {
  original: HTMLImageElement;
  thumbnails: Record<ThumbnailSize, string>;
  aspectRatio: number;
  size: { width: number; height: number };
}

// Generate thumbnail using canvas
export const generateThumbnail = (
  img: HTMLImageElement,
  size: { width: number; height: number },
  quality: number = 0.8
): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Calculate dimensions maintaining aspect ratio
  const aspectRatio = img.width / img.height;
  let { width, height } = size;
  
  if (aspectRatio > 1) {
    height = width / aspectRatio;
  } else {
    width = height * aspectRatio;
  }
  
  canvas.width = width;
  canvas.height = height;
  
  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw and compress
  ctx.drawImage(img, 0, 0, width, height);
  
  // Convert to WebP if supported, fallback to JPEG
  const format = canvas.toDataURL('image/webp').startsWith('data:image/webp') 
    ? 'image/webp' 
    : 'image/jpeg';
  
  return canvas.toDataURL(format, quality);
};

// Generate blur placeholder for progressive loading
export const generateBlurPlaceholder = (img: HTMLImageElement): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Very small size for blur effect
  canvas.width = 20;
  canvas.height = 20;
  
  ctx.filter = 'blur(2px)';
  ctx.drawImage(img, 0, 0, 20, 20);
  
  return canvas.toDataURL('image/jpeg', 0.1);
};

// Enhanced image loader with thumbnails and persistent caching
export const loadImageWithThumbnails = async (
  url: string
): Promise<LoadedImage> => {
  // First check IndexedDB cache
  try {
    const { getCachedImageFromDB } = await import('./imageCache');
    const cachedData = await getCachedImageFromDB(url);
    
    if (cachedData) {
      // Create image element for the original
      const img = new Image();
      img.src = url;
      
      return {
        original: img,
        thumbnails: cachedData.thumbnails,
        aspectRatio: cachedData.aspectRatio,
        size: cachedData.size,
      };
    }
  } catch (error) {
    console.warn('IndexedDB cache unavailable, using memory cache only:', error);
  }

  // If not in cache, load and process the image
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = async () => {
      try {
        const thumbnails: Record<ThumbnailSize, string> = {
          small: generateThumbnail(img, THUMBNAIL_SIZES.small, 0.7),
          medium: generateThumbnail(img, THUMBNAIL_SIZES.medium, 0.8),
          large: generateThumbnail(img, THUMBNAIL_SIZES.large, 0.9),
        };
        
        const loadedImage: LoadedImage = {
          original: img,
          thumbnails,
          aspectRatio: img.width / img.height,
          size: { width: img.width, height: img.height },
        };
        
        // Cache to IndexedDB for future use
        try {
          const { setCachedImageToDB } = await import('./imageCache');
          await setCachedImageToDB(url, {
            thumbnails,
            aspectRatio: loadedImage.aspectRatio,
            size: loadedImage.size,
          });
        } catch (cacheError) {
          console.warn('Failed to cache image to IndexedDB:', cacheError);
        }
        
        resolve(loadedImage);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

// Legacy function for backward compatibility
export const loadImage = (url: string, cb: (img: HTMLImageElement) => void) => {
  const img = new Image();
  img.src = url;
  img.onload = () => {
    cb(img);
  };
};

// Image cache using Map for session storage
const imageCache = new Map<string, LoadedImage>();

export const getCachedImage = (url: string): LoadedImage | null => {
  return imageCache.get(url) || null;
};

export const setCachedImage = (url: string, image: LoadedImage): void => {
  imageCache.set(url, image);
};

export const clearImageCache = (): void => {
  imageCache.clear();
};
