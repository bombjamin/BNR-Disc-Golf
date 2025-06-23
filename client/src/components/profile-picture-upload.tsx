import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Camera, Upload, X, Move, ZoomIn, RotateCw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface ProfilePictureUploadProps {
  currentPicture?: string;
  userName: string;
  size?: "sm" | "md" | "lg";
  onUploadComplete?: (path: string) => void;
}

interface ImagePosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export function ProfilePictureUpload({ 
  currentPicture, 
  userName, 
  size = "md",
  onUploadComplete 
}: ProfilePictureUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imagePosition, setImagePosition] = useState<ImagePosition>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { sessionId } = useAuth();
  const queryClient = useQueryClient();

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };

  const uploadMutation = useMutation({
    mutationFn: async (fileToUpload: File) => {
      if (!sessionId) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('profilePicture', fileToUpload);

      // Use native fetch for file uploads to preserve FormData format
      const response = await fetch('/api/auth/profile-picture', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload profile picture');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setIsUploading(false);
      setShowCropDialog(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      onUploadComplete?.(data.profilePicture);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCroppedImage = useCallback(async (): Promise<File> => {
    const canvas = canvasRef.current;
    const image = cropImageRef.current;
    
    if (!canvas || !image || !selectedFile) {
      throw new Error('Missing required elements');
    }

    // Wait for image to be fully loaded
    await new Promise((resolve) => {
      if (image.complete) {
        resolve(void 0);
      } else {
        image.onload = () => resolve(void 0);
      }
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Set canvas size to 300x300 for the final profile picture
    canvas.width = 300;
    canvas.height = 300;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 300, 300);

    // Save context
    ctx.save();

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(150, 150, 150, 0, Math.PI * 2);
    ctx.clip();

    // Get the current transform from the preview image style
    const imageStyle = window.getComputedStyle(image);
    const transform = imageStyle.transform;
    
    // Apply the exact same transform to the canvas that's used in the preview
    if (transform && transform !== 'none') {
      // Parse the transform matrix and apply it to canvas
      const matrix = new DOMMatrix(transform);
      ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e + 150, matrix.f + 150);
    } else {
      // Fallback: manually apply transformations to match preview
      ctx.translate(150 + imagePosition.x, 150 + imagePosition.y);
      ctx.rotate((imagePosition.rotation * Math.PI) / 180);
      ctx.scale(imagePosition.scale, imagePosition.scale);
    }

    // Calculate the size to draw the image to match the preview
    const previewContainer = image.parentElement;
    if (!previewContainer) {
      throw new Error('Could not find preview container');
    }

    const containerRect = previewContainer.getBoundingClientRect();
    const size = Math.min(containerRect.width, containerRect.height);
    
    // Calculate how to draw the image to fill the container like in CSS object-cover
    const imageAspect = image.naturalWidth / image.naturalHeight;
    const containerAspect = 1; // Square container
    
    let sourceX = 0, sourceY = 0, sourceWidth = image.naturalWidth, sourceHeight = image.naturalHeight;
    
    if (imageAspect > containerAspect) {
      // Image is wider than container - crop sides
      sourceWidth = image.naturalHeight * containerAspect;
      sourceX = (image.naturalWidth - sourceWidth) / 2;
    } else {
      // Image is taller than container - crop top/bottom
      sourceHeight = image.naturalWidth / containerAspect;
      sourceY = (image.naturalHeight - sourceHeight) / 2;
    }

    // Draw the cropped image at the correct size
    const drawSize = 300; // Full canvas size
    ctx.drawImage(
      image,
      sourceX, sourceY, sourceWidth, sourceHeight,
      -drawSize / 2, -drawSize / 2, drawSize, drawSize
    );

    // Restore context
    ctx.restore();

    // Convert canvas to blob and then to file
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `profile-${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(file);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/jpeg', 0.9);
    });
  }, [imagePosition, selectedFile]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Set file and create preview URL
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowCropDialog(true);
    
    // Reset image position
    setImagePosition({
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setImagePosition(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - imagePosition.x, y: touch.clientY - imagePosition.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    setImagePosition(prev => ({
      ...prev,
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    }));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      console.log('Starting image processing...');
      
      const croppedFile = await createCroppedImage();
      console.log('Cropped file created:', croppedFile.name, croppedFile.size, 'bytes');
      uploadMutation.mutate(croppedFile);
    } catch (error) {
      console.error('Image processing error:', error);
      setIsUploading(false);
      toast({
        title: "Processing failed",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setShowCropDialog(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className={sizeClasses[size]}>
            <AvatarImage src={currentPicture} alt={userName} />
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          
          <Button
            size="sm"
            variant="secondary"
            className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="w-4 h-4 mr-2" />
          Change Picture
        </Button>
      </div>

      {/* iOS-style Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile Picture</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Crop Area */}
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
              {previewUrl && (
                <>
                  {/* Image */}
                  <img
                    ref={cropImageRef}
                    src={previewUrl}
                    alt="Crop preview"
                    className="absolute inset-0 w-full h-full object-cover cursor-move select-none"
                    style={{
                      transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imagePosition.scale}) rotate(${imagePosition.rotation}deg)`,
                      transformOrigin: 'center'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    draggable={false}
                  />
                  
                  {/* Circular Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="relative w-full h-full">
                      {/* Dark overlay with circular cutout */}
                      <div 
                        className="absolute inset-0 bg-black bg-opacity-50"
                        style={{
                          clipPath: 'polygon(0% 0%, 0% 100%, 50% 100%, 50% 50%, 50% 50%, 50% 100%, 100% 100%, 100% 0%)',
                          mask: 'radial-gradient(circle at center, transparent 40%, black 42%)'
                        }}
                      />
                      
                      {/* Circular border */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 border-2 border-white border-opacity-80 rounded-full pointer-events-none" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* Scale Control */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ZoomIn className="w-4 h-4" />
                  <span className="text-sm font-medium">Zoom</span>
                </div>
                <Slider
                  value={[imagePosition.scale]}
                  onValueChange={(value) => setImagePosition(prev => ({ ...prev, scale: value[0] }))}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Rotation Control */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4" />
                  <span className="text-sm font-medium">Rotate</span>
                </div>
                <Slider
                  value={[imagePosition.rotation]}
                  onValueChange={(value) => setImagePosition(prev => ({ ...prev, rotation: value[0] }))}
                  min={-180}
                  max={180}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Position Hint */}
              <div className="text-center text-sm text-gray-500">
                <Move className="w-4 h-4 inline mr-1" />
                Drag the image to reposition
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isUploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 bg-golf-green hover:bg-golf-green/90"
              >
                {isUploading ? "Processing..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}