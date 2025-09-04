import { FC, useState, useRef, useEffect, useCallback } from "react";
import { TbX, TbZoomIn, TbZoomOut, TbZoomReset } from "react-icons/tb";
import { LoadedImage } from "../utils/utils";

type ZoomableDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  image: LoadedImage | null;
  fileName?: string;
};

export const ZoomableDialog: FC<ZoomableDialogProps> = ({
  isOpen,
  onClose,
  image,
  fileName,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialScale, setInitialScale] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate fit-to-screen scale and reset when dialog opens
  useEffect(() => {
    if (isOpen && image && containerRef.current) {
      const container = containerRef.current;
      const containerWidth = container.clientWidth - 100; // Account for padding
      const containerHeight = container.clientHeight - 150; // Account for header and padding
      
      const scaleX = containerWidth / image.size.width;
      const scaleY = containerHeight / image.size.height;
      const fitScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%
      
      setInitialScale(fitScale);
      setScale(fitScale);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, image]);

  // Handle zoom
  const handleZoom = useCallback((delta: number, clientX?: number, clientY?: number) => {
    if (!containerRef.current || !imageRef.current) return;

    const minScale = Math.min(initialScale, 0.1);
    const newScale = Math.max(minScale, Math.min(5, scale + delta));
    
    if (clientX !== undefined && clientY !== undefined) {
      // Zoom towards mouse position
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const mouseX = clientX - rect.left - centerX;
      const mouseY = clientY - rect.top - centerY;
      
      const scaleRatio = newScale / scale;
      setPosition(prev => ({
        x: prev.x - mouseX * (scaleRatio - 1),
        y: prev.y - mouseY * (scaleRatio - 1),
      }));
    }
    
    setScale(newScale);
  }, [scale, initialScale]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta, e.clientX, e.clientY);
  }, [handleZoom]);

  // Handle mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= initialScale) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [scale, position, initialScale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse events for better drag experience
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          handleZoom(0.2);
          break;
        case '-':
          handleZoom(-0.2);
          break;
        case '0':
          setScale(initialScale);
          setPosition({ x: 0, y: 0 });
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, handleZoom]);

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="text-white">
          <h2 className="text-lg font-semibold truncate max-w-md">
            {fileName || 'Image'}
          </h2>
          <p className="text-sm text-gray-300">
            {image.size.width} × {image.size.height} • {Math.round(scale * 100)}%
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom(0.2)}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            title="Zoom In (+)"
          >
            <TbZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleZoom(-0.2)}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            title="Zoom Out (-)"
          >
            <TbZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setScale(initialScale);
              setPosition({ x: 0, y: 0 });
            }}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            title="Reset Zoom (0)"
          >
            <TbZoomReset className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            title="Close (Esc)"
          >
            <TbX className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className={`w-full h-full flex items-center justify-center overflow-hidden ${
          scale > initialScale ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={image.original.src}
          alt={fileName || 'Zoomable image'}
          className="max-w-none select-none"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            transformOrigin: 'center center',
          }}
          draggable={false}
        />
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-lg">
        <p>Scroll to zoom • Drag to pan • Press Esc to close</p>
      </div>
    </div>
  );
};