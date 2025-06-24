import React, { useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface MobilePhotoUploadProps {
  gameId: number;
  playerId: number;
  hole: number;
  onUploadSuccess?: () => void;
}

export function MobilePhotoUpload({ gameId, playerId, hole, onUploadSuccess }: MobilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Prefer rear camera on mobile
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await uploadPhoto(file);
      }
    };
    input.click();
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await uploadPhoto(file);
      }
    };
    input.click();
  };

  const uploadPhoto = async (file: File) => {
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('photo', file, `hole-${hole}-${Date.now()}.jpg`);
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
          <Button
            onClick={handleCameraCapture}
            disabled={isUploading}
            className="flex items-center justify-center space-x-2"
          >
            <Camera className="w-4 h-4" />
            <span>Take Photo</span>
          </Button>
          
          <Button
            onClick={handleFileUpload}
            disabled={isUploading}
            variant="outline"
            className="flex items-center justify-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Choose from Files</span>
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