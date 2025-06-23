import React, { useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { isNativePlatform, takePicture, selectFromGallery } from '@/lib/capacitor';

interface MobilePhotoUploadProps {
  gameId: number;
  playerId: number;
  hole: number;
  onUploadSuccess?: () => void;
}

export function MobilePhotoUpload({ gameId, playerId, hole, onUploadSuccess }: MobilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleCameraCapture = async () => {
    if (!isNativePlatform()) {
      toast({
        title: "Camera not available",
        description: "Camera access is only available on mobile devices.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const image = await takePicture();
      await uploadPhoto(image.webPath!);
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Camera Error",
        description: "Failed to take photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGallerySelect = async () => {
    if (!isNativePlatform()) {
      // Fallback to web file input
      handleWebFileUpload();
      return;
    }

    try {
      setIsUploading(true);
      const image = await selectFromGallery();
      await uploadPhoto(image.webPath!);
    } catch (error) {
      console.error('Gallery error:', error);
      toast({
        title: "Gallery Error",
        description: "Failed to select photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleWebFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          await uploadPhoto(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const uploadPhoto = async (imageData: string) => {
    try {
      setIsUploading(true);
      
      // Convert data URL to blob if needed
      let formData = new FormData();
      
      if (imageData.startsWith('data:')) {
        const response = await fetch(imageData);
        const blob = await response.blob();
        formData.append('photo', blob, `hole-${hole}-${Date.now()}.jpg`);
      } else {
        // For native file paths, we'll need to handle differently
        const response = await fetch(imageData);
        const blob = await response.blob();
        formData.append('photo', blob, `hole-${hole}-${Date.now()}.jpg`);
      }
      
      formData.append('gameId', gameId.toString());
      formData.append('playerId', playerId.toString());
      formData.append('hole', hole.toString());

      const uploadResponse = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      toast({
        title: "Photo uploaded!",
        description: `Photo for hole ${hole} has been uploaded successfully.`,
      });

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Upload Photo - Hole {hole}</h3>
        
        <div className="flex flex-col space-y-2">
          {isNativePlatform() && (
            <Button
              onClick={handleCameraCapture}
              disabled={isUploading}
              className="flex items-center justify-center space-x-2"
            >
              <Camera className="w-4 h-4" />
              <span>Take Photo</span>
            </Button>
          )}
          
          <Button
            onClick={handleGallerySelect}
            disabled={isUploading}
            variant="outline"
            className="flex items-center justify-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Choose from {isNativePlatform() ? 'Gallery' : 'Files'}</span>
          </Button>
        </div>
        
        {isUploading && (
          <div className="text-center text-sm text-muted-foreground">
            Uploading photo...
          </div>
        )}
      </div>
    </Card>
  );
}