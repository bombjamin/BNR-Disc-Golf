import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Image, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface SatelliteUploadProps {
  onUploadComplete?: (paths: {
    originalPath: string;
    optimizedPath: string;
    thumbnailPath: string;
  }) => void;
}

export function SatelliteUpload({ onUploadComplete }: SatelliteUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if satellite image already exists
  const { data: existingImage } = useQuery<{
    originalPath: string;
    optimizedPath: string;
    thumbnailPath: string;
  }>({
    queryKey: ['/api/satellite-image'],
    retry: false,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('satelliteImage', file);

      const response = await fetch('/api/upload-satellite', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Complete!",
        description: "Satellite image has been processed and is ready to use.",
      });
      onUploadComplete?.(data);
      queryClient.invalidateQueries({ queryKey: ['/api/satellite-image'] });
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, or WebP image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 500MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadProgress(10);
    uploadMutation.mutate(file);
  };

  if (existingImage) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800">
                Satellite Image Ready
              </h3>
              <p className="text-green-700">
                Your course satellite image has been uploaded and processed successfully.
              </p>
            </div>
            <div className="flex-shrink-0">
              <img 
                src={existingImage?.thumbnailPath} 
                alt="Course thumbnail"
                className="w-16 h-16 rounded-lg object-cover border-2 border-green-300"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Image className="w-5 h-5 mr-2" />
          Upload Satellite Image
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-golf-green bg-green-50'
              : 'border-gray-300 hover:border-golf-green hover:bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploadMutation.isPending}
          />

          {uploadMutation.isPending ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golf-green mx-auto"></div>
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Processing satellite image...
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  This may take a few minutes for large files
                </p>
                {uploadProgress > 0 && (
                  <div className="mt-3">
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Upload your course satellite image
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag and drop your image here, or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Supports JPEG, PNG, WebP • Max 500MB
                </p>
              </div>
              <Button
                variant="outline"
                className="border-golf-green text-golf-green hover:bg-golf-green hover:text-white"
              >
                Choose File
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Image Processing Info</p>
              <p className="text-blue-700 mt-1">
                Your satellite image will be automatically optimized for web display and 
                thumbnails will be generated for faster loading.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}