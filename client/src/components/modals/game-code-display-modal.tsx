import { useState } from "react";
import { Copy, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface GameCodeDisplayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameCode: string;
  onContinue: () => void;
}

export function GameCodeDisplayModal({ 
  open, 
  onOpenChange, 
  gameCode, 
  onContinue 
}: GameCodeDisplayModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
    const [, navigate] = useLocation();

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(gameCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Game code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy the code manually",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my disc golf game!",
          text: `Join my disc golf game at Bar None Ranch with code: ${gameCode}`,
        });
      } catch (error) {
        // User cancelled or share failed
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-dark-green text-center">
            Game Created Successfully!
          </DialogTitle>
          <DialogDescription className="text-center">
            Share this code with your friends to join the game.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Share this code with your friends to join the game
            </p>

            <Card className="bg-golf-green">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-sm text-white opacity-90 mb-2">Game Code</div>
                  <div className="text-4xl font-bold text-white tracking-widest font-mono">
                    {gameCode}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleCopyCode}
              variant="secondary"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </>
              )}
            </Button>

            <Button
              onClick={handleShare}
              variant="secondary"
              className="flex-1 bg-disc-orange hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          <Button
            onClick={() => {
              onContinue();
              onOpenChange(false);
                navigate(`/game/${gameCode}`);
            }}
            className="w-full bg-golf-green hover:bg-dark-green text-white font-semibold py-3 px-6 rounded-xl"
          >
            Start Playing
          </Button>

          <div className="text-center text-sm text-gray-500">
            Players can join anytime during the game
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}