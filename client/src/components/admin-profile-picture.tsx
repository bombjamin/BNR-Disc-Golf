import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Camera, Upload, Trash2, MoreVertical } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface AdminProfilePictureProps {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  size?: "sm" | "md" | "lg";
}

export function AdminProfilePicture({ user, size = "md" }: AdminProfilePictureProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { sessionId } = useAuth();
  const queryClient = useQueryClient();

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profilePicture', file);

      // Use native fetch for file uploads to preserve FormData format
      const response = await fetch(`/api/admin/users/${user.id}/profile-picture`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "DELETE",
        `/api/admin/users/${user.id}/profile-picture`,
        undefined,
        {
          Authorization: `Bearer ${sessionId}`,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Delete failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Profile picture deleted successfully",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete profile picture",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      uploadMutation.mutate(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    if (user.profilePicture) {
      deleteMutation.mutate();
    }
  };

  const initials = `${user.firstName[0]}${user.lastName[0]}`;

  return (
    <div className="relative">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="relative group cursor-pointer">
              <Avatar className={sizeClasses[size]}>
                <AvatarImage 
                  src={user.profilePicture || undefined} 
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <AvatarFallback className="bg-golf-green text-white font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all">
                <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
              <MoreVertical className="w-4 h-4 mr-2" />
              Manage Photo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Profile Picture</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage 
                  src={user.profilePicture || undefined} 
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <AvatarFallback className="bg-golf-green text-white text-xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center">
                <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
                <p className="text-sm text-gray-500">User ID: {user.id}</p>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <Button
                onClick={triggerFileInput}
                disabled={isUploading || uploadMutation.isPending}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {user.profilePicture ? 'Replace Photo' : 'Upload Photo'}
              </Button>

              {user.profilePicture && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Photo
                </Button>
              )}
            </div>

            {(isUploading || uploadMutation.isPending || deleteMutation.isPending) && (
              <div className="text-center text-sm text-gray-500">
                {uploadMutation.isPending && "Uploading..."}
                {deleteMutation.isPending && "Deleting..."}
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}