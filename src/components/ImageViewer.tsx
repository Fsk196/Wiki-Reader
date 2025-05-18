import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt, isOpen, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    
    // Extract filename from URL or use alt text
    const urlFilename = src.split('/').pop()?.split('?')[0];
    const filename = urlFilename || (alt ? `${alt.replace(/[^a-zA-Z0-9]/g, '-')}` : 'image');
    
    // Determine file extension
    let extension = 'jpg'; // Default
    if (urlFilename) {
      const match = urlFilename.match(/\.(jpe?g|png|gif|svg|webp)$/i);
      if (match) extension = match[1].toLowerCase();
    }
    
    link.download = `${filename}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    // Show error state
    alert("Failed to load image. Please try again later.");
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-[95vw] max-h-[95vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-black/50 text-white">
          <div className="text-sm truncate max-w-[60%]">
            {alt}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            <button 
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
            <button 
              onClick={handleRotate}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              title="Rotate image"
            >
              <RotateCw size={18} />
            </button>
            <button 
              onClick={handleDownload}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              title="Download image"
            >
              <Download size={18} />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors ml-2"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="overflow-auto p-4 flex items-center justify-center" 
             style={{ maxHeight: '95vh', minHeight: '200px', minWidth: '200px' }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          <img 
            src={src} 
            alt={alt}
            onLoad={handleImageLoad}
            onError={handleError}
            className="transition-all duration-200 ease-in-out object-contain"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;