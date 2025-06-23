import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Map } from "lucide-react";

interface CourseMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameType?: "front9" | "back9" | "full18";
  currentHole?: number;
}

export function CourseMapModal({ isOpen, onClose, gameType = "full18", currentHole }: CourseMapModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bar None Ranch Course Map</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <Map className="w-16 h-16 text-gray-400 mb-6" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h3>
          <p className="text-gray-600 text-center max-w-md">
            We're working on an interactive satellite course map that will show all 18 holes 
            with precise positioning on the Bar None Ranch terrain.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}