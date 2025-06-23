import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import bnrVideoCoverPath from "@assets/BNR video cover photo _1749492792717.jpg";

// Utility function to detect iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

interface ActiveVideo {
  id: number;
  fileName: string;
  originalName: string;
  videoUrl: string;
  createdAt: string;
}

export function VideoPlayerModal({ isOpen, onClose, title = "Bar None Ranch Course Tour" }: VideoPlayerModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch active course tour video
  const { data: activeVideo, isLoading, error } = useQuery<ActiveVideo>({
    queryKey: ["/api/course-tour-video"],
    enabled: isOpen,
    retry: 1,
  });

  // Set iOS-specific attributes for inline playback and handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (video && activeVideo) {
      if (isIOS()) {
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('playsinline', '');
      }

      // Reset error state when new video loads
      setVideoError(null);

      // Add error handling
      const handleError = (e: Event) => {
        console.error('Video error occurred:', e);
        const target = e.target as HTMLVideoElement;
        if (target && target.error) {
          switch (target.error.code) {
            case 1:
              setVideoError('Video loading was aborted');
              break;
            case 2:
              setVideoError('Network error occurred while loading video');
              break;
            case 3:
              setVideoError('Video format not supported');
              break;
            case 4:
              setVideoError('Video source not available');
              break;
            default:
              setVideoError('An unknown video error occurred');
          }
        }
      };

      const handleLoadStart = () => {
        console.log('Video loading started');
        setVideoError(null);
      };

      const handleCanPlay = () => {
        console.log('Video can start playing');
      };

      video.addEventListener('error', handleError);
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('canplay', handleCanPlay);

      return () => {
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [activeVideo]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black border-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Video player for Bar None Ranch golf course tour
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          {/* Video Container */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {activeVideo && !isLoading && !videoError ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                src={activeVideo.videoUrl}
                controls
                muted={isMuted}
                poster={bnrVideoCoverPath}
                playsInline
                preload="metadata"
                crossOrigin="anonymous"
              />
            ) : (
              // Loading, error, or no video state
              <div 
                className="w-full h-full bg-cover bg-center flex items-center justify-center"
                style={{
                  backgroundImage: `url('${bnrVideoCoverPath}')`
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-50" />
                <div className="relative text-white text-center">
                  <div className="text-6xl mb-4">🎥</div>
                  {isLoading ? (
                    <>
                      <h3 className="text-xl font-semibold mb-2">Loading Course Tour...</h3>
                      <p className="text-gray-300">Please wait while we load the video.</p>
                    </>
                  ) : videoError ? (
                    <>
                      <h3 className="text-xl font-semibold mb-2 text-red-400">Video Error</h3>
                      <p className="text-gray-300 mb-4">{videoError}</p>
                      <button 
                        onClick={() => {
                          setVideoError(null);
                          if (videoRef.current) {
                            videoRef.current.load();
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
                      >
                        Try Again
                      </button>
                    </>
                  ) : error ? (
                    <>
                      <h3 className="text-xl font-semibold mb-2 text-red-400">Network Error</h3>
                      <p className="text-gray-300">Failed to load course tour video.</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold mb-2">No Course Tour Available</h3>
                      <p className="text-gray-300">No course tour video has been uploaded yet.</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Close Button */}
            {activeVideo && !isLoading && (
              <div className="absolute top-4 right-4 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-black/50 p-2 bg-black/30 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}