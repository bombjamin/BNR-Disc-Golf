import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InteractiveCourseMap } from "@/components/interactive-course-map";

interface CourseMapEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameType?: "front9" | "back9" | "full18";
}

export function CourseMapEditorModal({ isOpen, onClose, gameType = "full18" }: CourseMapEditorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Course Map - Position Holes</DialogTitle>
        </DialogHeader>
        <InteractiveCourseMap 
          gameType={gameType}
          editMode={true}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}