import { FC, useState, useEffect, useRef } from "react";
import { LoadedImage, ThumbnailSize } from "../utils/utils";

type PhotoCardProps = {
  loadedImage: LoadedImage;
  size?: ThumbnailSize;
  className?: string;
  onClick?: () => void;
};

export const PhotoCard: FC<PhotoCardProps> = ({
  loadedImage,
  size = "medium",
  className = "",
  onClick,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px", // Start loading 50px before entering viewport
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Handle image load
  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const thumbnailSrc = loadedImage.thumbnails[size];
  const aspectRatio = loadedImage.aspectRatio;

  return (
    <div
      ref={containerRef}
      className={`bg-white rounded-lg overflow-hidden shadow-md mb-4 transition-all duration-300 hover:shadow-lg cursor-pointer ${className}`}
      onClick={onClick}
      style={{
        aspectRatio: aspectRatio.toString(),
      }}
    >
      <div className="relative w-full h-full">
        {/* Blur placeholder - always visible until main image loads */}
        <div
          className={`absolute inset-0 bg-gray-200 transition-opacity duration-500 ${
            isLoaded ? "opacity-0" : "opacity-100"
          }`}
          style={{
            backgroundImage: `url(${loadedImage.thumbnails.small})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(10px) brightness(0.9)",
            transform: "scale(1.1)", // Slightly larger to hide blur edges
          }}
        />

        {/* Main thumbnail image */}
        {isInView && (
          <img
            ref={imgRef}
            src={thumbnailSrc}
            alt="Photo"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={handleImageLoad}
            loading="lazy"
            decoding="async"
          />
        )}

        {/* Loading indicator */}
        {!isLoaded && isInView && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200" />
      </div>
    </div>
  );
};

// Legacy PhotoCard for backward compatibility
export const LegacyPhotoCard: FC<{ image: HTMLImageElement }> = ({ image }) => {
  return (
    <div className="bg-white rounded overflow-hidden shadow-md mb-4">
      {image && (
        <img
          src={image.src}
          alt="Photo"
          className="w-full max-h-80 object-cover"
        />
      )}
    </div>
  );
};
