import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video, Trash2, CheckCircle, Clock, FileVideo } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface CourseTourVideo {
  id: number;
  fileName: string;
  originalName: string;
  fileSize: number;
  isActive: boolean;
  uploadedBy: number;
  createdAt: string;
}

interface CourseTourVideoManagerProps {
  userRole: string;
}

export function CourseTourVideoManager({ userRole }: CourseTourVideoManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sessionId } = useAuth();

  // Only emperors can manage videos
  const isEmperor = userRole === 'emperor';

  // Fetch all videos
  const { data: videos = [], isLoading } = useQuery<CourseTourVideo[]>({
    queryKey: ["/api/admin/course-tour-videos"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/course-tour-videos", undefined, {
        Authorization: `Bearer ${sessionId}`,
      });
      return res.json();
    },
    enabled: isEmperor && !!sessionId,
  });

  // Upload video mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('video', file);

      setUploading(true);
      setUploadProgress(0);

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          setUploading(false);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(JSON.parse(xhr.responseText).message || 'Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          setUploading(false);
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', '/api/admin/course-tour-video');
        xhr.setRequestHeader('Authorization', `Bearer ${sessionId}`);
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-tour-videos"] });
      toast({
        title: "Video Uploaded",
        description: "Course tour video uploaded successfully.",
      });
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      setUploading(false);
      setUploadProgress(0);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload video",
        variant: "destructive",
      });
    },
  });

  // Activate video mutation
  const activateMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const res = await apiRequest("PATCH", `/api/admin/course-tour-video/${videoId}/activate`, undefined, {
        Authorization: `Bearer ${sessionId}`,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-tour-videos"] });
      toast({
        title: "Video Activated",
        description: "Course tour video is now active.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Activation Failed",
        description: error.message || "Failed to activate video",
        variant: "destructive",
      });
    },
  });

  // Delete video mutation
  const deleteMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/course-tour-video/${videoId}`, undefined, {
        Authorization: `Bearer ${sessionId}`,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-tour-videos"] });
      toast({
        title: "Video Deleted",
        description: "Course tour video deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete video",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'video/mp4') {
      toast({
        title: "Invalid File Type",
        description: "Only MP4 files are allowed.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5GB limit)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 5GB.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const activeVideo = videos.find(video => video.isActive);

  if (!isEmperor) {
    return (
      <Alert>
        <AlertDescription>
          Only Emperors can manage course tour videos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Course Tour Video Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Active Video */}
        {activeVideo && (
          <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Current Active Video
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    {activeVideo.originalName}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                Active
              </Badge>
            </div>
            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
              Size: {formatFileSize(activeVideo.fileSize)} • 
              Uploaded {formatDistanceToNow(new Date(activeVideo.createdAt), { addSuffix: true })}
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <FileVideo className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Upload Course Tour Video</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload MP4 files up to 5GB. Only one video can be active at a time.
          </p>
          
          {uploading ? (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-gray-600">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4"
                onChange={handleFileSelect}
                className="hidden"
                id="video-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mx-auto"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose MP4 File
              </Button>
            </>
          )}
        </div>

        {/* Video List */}
        {isLoading ? (
          <div className="text-center py-4">
            <div className="text-sm text-gray-600">Loading videos...</div>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-sm text-gray-600">No videos uploaded yet.</div>
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="font-medium">All Videos</h4>
            {videos.map((video) => (
              <div
                key={video.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{video.originalName}</p>
                    <p className="text-xs text-gray-600">
                      {formatFileSize(video.fileSize)} • 
                      Uploaded {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {video.isActive ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => activateMutation.mutate(video.id)}
                      disabled={activateMutation.isPending}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      Activate
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm(`Delete "${video.originalName}"?`)) {
                        deleteMutation.mutate(video.id);
                      }
                    }}
                    disabled={deleteMutation.isPending || (video.isActive && videos.length === 1)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <Alert>
          <AlertDescription className="text-xs">
            <strong>Note:</strong> Videos cannot be deleted if they are the only active video. 
            Upload a replacement video first, then activate it before deleting the old one.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}