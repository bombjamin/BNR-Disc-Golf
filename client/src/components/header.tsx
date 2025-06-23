import { Target, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoUpload } from "@/components/photo-upload";

interface HeaderProps {
  onMenuClick?: () => void;
  gameId?: number;
  playerId?: number;
  currentHole?: number;
}

export function Header({ onMenuClick, gameId, playerId, currentHole }: HeaderProps) {
  return (
    <header className="bg-golf-green text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Bar None Ranch</h1>
              <p className="text-sm opacity-90">Disc Golf Scoring</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {gameId && playerId && (
              <div className="text-white">
                <PhotoUpload 
                  gameId={gameId}
                  playerId={playerId}
                  currentHole={currentHole}
                  size="sm"
                />
              </div>
            )}
            {onMenuClick && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onMenuClick}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <Menu className="w-6 h-6" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
