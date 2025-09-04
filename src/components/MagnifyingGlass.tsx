import { FC, useState, useRef, useCallback } from "react";
import { LoadedImage } from "../utils/utils";

type MagnifyingGlassProps = {
  image: LoadedImage;
  children: React.ReactNode;
  magnification?: number;
  glassSize?: number;
};

export const MagnifyingGlass: FC<MagnifyingGlassProps> = ({
  image,
  children,
  magnification = 1,
  glassSize = 200,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [currentMagnification, setCurrentMagnification] = useState(magnification);
  const [isZooming, setIsZooming] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomTimeoutRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Mouse position relative to the container
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    // Find the actual image element within the container
    const imageElement = containerRef.current.querySelector('img');
    if (!imageElement) return;
    
    const imageRect = imageElement.getBoundingClientRect();
    
    // Mouse position relative to the image
    const imageMouseX = e.clientX - imageRect.left;
    const imageMouseY = e.clientY - imageRect.top;
    
    // Only track if mouse is over the image
    if (imageMouseX >= 0 && imageMouseX <= imageRect.width && 
        imageMouseY >= 0 && imageMouseY <= imageRect.height) {
      
      // Calculate the position for the magnified view
      const imageScaleX = image.size.width / imageRect.width;
      const imageScaleY = image.size.height / imageRect.height;
      
      const sourceX = imageMouseX * imageScaleX;
      const sourceY = imageMouseY * imageScaleY;
      
      setMousePosition({ x: mouseX, y: mouseY });
      setImagePosition({ x: sourceX, y: sourceY });
    }
  }, [image.size]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isHovering) return;
    
    e.preventDefault();
    
    // Calculate zoom delta based on wheel direction
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newMagnification = Math.max(1, Math.min(8, currentMagnification + delta));
    
    setCurrentMagnification(newMagnification);
    setIsZooming(true);
    
    // Clear existing timeout
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }
    
    // Hide zoom feedback after 1 second of no scrolling
    zoomTimeoutRef.current = window.setTimeout(() => {
      setIsZooming(false);
    }, 1000);
  }, [isHovering, currentMagnification]);

  // Calculate magnifying glass position - keep it within container bounds
  const containerWidth = containerRef.current?.clientWidth || 0;
  const containerHeight = containerRef.current?.clientHeight || 0;
  
  let glassX = mousePosition.x + 20; // Offset from cursor
  let glassY = mousePosition.y - glassSize / 2;
  
  // Adjust position to keep glass within bounds
  if (glassX + glassSize > containerWidth - 20) {
    glassX = mousePosition.x - glassSize - 20; // Show on left side
  }
  if (glassY < 20) {
    glassY = 20;
  }
  if (glassY + glassSize > containerHeight - 20) {
    glassY = containerHeight - glassSize - 20;
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    >
      {children}
      
      {/* Magnifying Glass */}
      {isHovering && (
        <>
          {/* Crosshair */}
          <div
            className="absolute pointer-events-none z-20"
            style={{
              left: mousePosition.x - 10,
              top: mousePosition.y - 10,
              width: 20,
              height: 20,
            }}
          >
            <div className="w-full h-0.5 bg-red-500 absolute top-1/2 transform -translate-y-1/2 opacity-80" />
            <div className="h-full w-0.5 bg-red-500 absolute left-1/2 transform -translate-x-1/2 opacity-80" />
          </div>
          
          {/* Magnifying Glass */}
          <div
            className="absolute pointer-events-none z-30 border-4 border-white shadow-xl rounded-full overflow-hidden bg-white"
            style={{
              left: glassX,
              top: glassY,
              width: glassSize,
              height: glassSize,
            }}
          >
            {/* Magnified Image */}
              <div
                 className="w-full h-full overflow-hidden relative"
                 style={{
                   backgroundImage: `url(${image.original.src})`,
                   backgroundSize: `${image.size.width * currentMagnification * 0.6}px ${image.size.height * currentMagnification * 0.6}px`,
                  backgroundPosition: `-${imagePosition.x * currentMagnification * 0.6 - glassSize / 2}px -${imagePosition.y * currentMagnification * 0.6 - glassSize / 2}px`,
                   backgroundRepeat: 'no-repeat',
                 }}
               >
               {/* Glass border effect */}
               <div className="absolute inset-0 rounded-full border-2 border-gray-300 opacity-30" />
             </div>
             
             {/* Magnification indicator */}
             <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded-full font-medium">
               {currentMagnification.toFixed(1)}×
             </div>
          </div>
          
          {/* Hover area indicator */}
           <div
             className="absolute pointer-events-none z-10 border-2 border-red-500 border-dashed opacity-60"
             style={{
               left: mousePosition.x - 30,
               top: mousePosition.y - 30,
               width: 60,
               height: 60,
               borderRadius: '4px',
             }}
           />
         </>
       )}
       
       {/* Zoom level feedback indicator */}
       {isZooming && (
         <div className="absolute top-4 left-4 bg-black bg-opacity-90 text-white px-4 py-2 rounded-lg shadow-lg z-40 pointer-events-none">
           <div className="flex items-center gap-2">
             <span className="text-sm font-medium">Zoom:</span>
             <span className="text-lg font-bold">{currentMagnification.toFixed(1)}×</span>
           </div>
           <div className="text-xs text-gray-300 mt-1">Scroll to adjust (1× - 8×)</div>
         </div>
       )}
    </div>
  );
};