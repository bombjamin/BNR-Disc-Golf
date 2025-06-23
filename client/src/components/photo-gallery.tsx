import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Photo } from "@shared/schema";

interface PhotoGalleryProps {
  gameId?: number;
  title?: string;
  showGameInfo?: boolean;
  className?: string;
}

export function PhotoGallery({ gameId, title = "Photo Gallery", showGameInfo = false, className = "" }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: gameId ? ['/api/photos/game', gameId] : ['/api/photos'],
    queryFn: async () => {
      const url = gameId ? `/api/photos/game/${gameId}` : '/api/photos';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch photos');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg text-dark-green">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (photos.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg text-dark-green">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No photos yet</p>
            <p className="text-sm">Upload your first photo using the camera icon!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg text-dark-green">{title}</span>
            <Badge variant="secondary">{photos.length} photos</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {photos.slice(0, 6).map((photo: Photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="aspect-square cursor-pointer rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
              >
                <img
                  src={`/uploads/${photo.fileName}`}
                  alt={photo.originalName}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          {photos.length > 6 && (
            <p className="text-center text-sm text-gray-500 mt-3">
              +{photos.length - 6} more photos
            </p>
          )}
        </CardContent>
      </Card>

      {/* Photo Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Photo Details</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={`/uploads/${selectedPhoto.fileName}`}
                  alt={selectedPhoto.originalName}
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="space-y-1">
                  <p><strong>Uploaded:</strong> {format(new Date(selectedPhoto.createdAt), 'PPp')}</p>
                  {selectedPhoto.hole && (
                    <p><strong>Hole:</strong> {selectedPhoto.hole}</p>
                  )}
                  {showGameInfo && (
                    <p><strong>Game:</strong> {selectedPhoto.gameId}</p>
                  )}
                </div>
                <Badge variant="outline">
                  {(selectedPhoto.fileSize / 1024 / 1024).toFixed(1)} MB
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface GamePhotoSummaryProps {
  gameId: number;
  className?: string;
}

export function GamePhotoSummary({ gameId, className = "" }: GamePhotoSummaryProps) {
  const { data: photos = [] } = useQuery({
    queryKey: ['/api/photos/game', gameId],
    queryFn: async () => {
      const response = await fetch(`/api/photos/game/${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch photos');
      return response.json();
    },
  });

  if (photos.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg text-dark-green">
          Game Photos
          <Badge variant="secondary" className="ml-2">{photos.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {photos.slice(0, 8).map((photo: Photo) => (
            <div key={photo.id} className="aspect-square rounded-lg overflow-hidden">
              <img
                src={`/uploads/${photo.fileName}`}
                alt={photo.originalName}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        {photos.length > 8 && (
          <p className="text-center text-sm text-gray-500 mt-3">
            +{photos.length - 8} more photos from this game
          </p>
        )}
      </CardContent>
    </Card>
  );
}