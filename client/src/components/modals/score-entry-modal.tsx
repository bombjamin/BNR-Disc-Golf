import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getScoreBgColor, getScoreColor, formatScore } from "@/lib/utils";
import { Plus, Minus, RotateCcw, Target } from "lucide-react";
import { type EnterScore, type GameWithPlayers } from "@shared/schema";

interface ScoreEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: number;
  playerId: number;
  hole: number;
  par: number;
}

export function ScoreEntryModal({ 
  open, 
  onOpenChange, 
  gameId, 
  playerId, 
  hole, 
  par 
}: ScoreEntryModalProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [tallyCount, setTallyCount] = useState<number>(0);
  const [customScore, setCustomScore] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("tally");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch game data to get player information
  const { data: game } = useQuery<GameWithPlayers>({
    queryKey: [`/api/games/${gameId}`],
    enabled: open, // Only fetch when modal is open
  });

  const currentPlayer = game?.players.find(p => p.id === playerId);

  const enterScoreMutation = useMutation({
    mutationFn: async (data: EnterScore) => {
      const response = await apiRequest("POST", "/api/scores", data);
      return response.json();
    },
    onSuccess: (score) => {
      toast({
        title: "Score Entered!",
        description: `${selectedScore} strokes recorded for hole ${hole}`,
      });
      
      // Invalidate game query to refresh the scorecard
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      
      onOpenChange(false);
      setSelectedScore(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to enter score",
        variant: "destructive",
      });
    },
  });

  const confirmScoreMutation = useMutation({
    mutationFn: async (scoreId: number) => {
      const response = await apiRequest("PATCH", `/api/scores/${scoreId}/confirm`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
    },
  });

  // Reset state when modal opens/closes
  const resetState = () => {
    setSelectedScore(null);
    setTallyCount(0);
    setCustomScore("");
    setActiveTab("tally");
  };

  // Reset state when hole changes (new modal opens)
  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open, hole]);

  // Handle tally functions
  const incrementTally = () => {
    const newCount = tallyCount + 1;
    setTallyCount(newCount);
    setSelectedScore(newCount);
  };

  const decrementTally = () => {
    if (tallyCount > 0) {
      const newCount = tallyCount - 1;
      setTallyCount(newCount);
      setSelectedScore(newCount);
    }
  };

  const resetTally = () => {
    setTallyCount(0);
    setSelectedScore(null);
  };

  // Handle custom score input
  const handleCustomScoreChange = (value: string) => {
    setCustomScore(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setSelectedScore(numValue);
    } else {
      setSelectedScore(null);
    }
  };

  // Handle quick score selection
  const handleScoreSelect = (score: number) => {
    setSelectedScore(score);
    setActiveTab("quick");
  };

  const handleConfirmScore = () => {
    if (selectedScore) {
      enterScoreMutation.mutate({
        gameId,
        playerId,
        hole,
        strokes: selectedScore,
      });
    }
  };

  // Get current score details for display
  const getScoreDetails = (score: number) => {
    const diff = score - par;
    let label = "";
    if (diff <= -3) label = "Albatross";
    else if (diff === -2) label = "Eagle";
    else if (diff === -1) label = "Birdie";
    else if (diff === 0) label = "Par";
    else if (diff === 1) label = "Bogey";
    else if (diff === 2) label = "Double Bogey";
    else if (diff === 3) label = "Triple Bogey";
    else label = `+${diff}`;
    
    return { label, formatted: formatScore(score, par) };
  };

  const scoreButtons = Array.from({ length: 8 }, (_, i) => {
    const score = i + 1;
    return {
      score,
      color: getScoreBgColor(score, par),
      label: score === 8 ? "8+" : score.toString()
    };
  });

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) resetState();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="text-center">
            <DialogTitle className="text-xl font-semibold text-dark-green mb-2">
              {currentPlayer ? `Enter Score for ${currentPlayer.name}` : "Enter Score"}
            </DialogTitle>
            <div className="flex items-center justify-center gap-4 text-gray-600">
              <span>Hole {hole}</span>
              <Badge variant="outline" className="font-semibold">
                <Target className="w-3 h-3 mr-1" />
                Par {par}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tally">Tally Throws</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
            <TabsTrigger value="quick">Quick Select</TabsTrigger>
          </TabsList>

          {/* Tally Tab */}
          <TabsContent value="tally" className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Track each throw as you play
              </p>
              
              {/* Tally Counter */}
              <div className="bg-golf-bg p-6 rounded-xl mb-6">
                <div className="text-sm text-gray-600 mb-2">Current Throws</div>
                <div className={`text-6xl font-bold mb-4 ${tallyCount > 0 ? getScoreColor(tallyCount, par) : 'text-gray-400'}`}>
                  {tallyCount || 0}
                </div>
                
                {tallyCount > 0 && (
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-sm">
                      {getScoreDetails(tallyCount).label}
                    </Badge>
                    <div className="text-lg font-semibold text-gray-700">
                      {getScoreDetails(tallyCount).formatted}
                    </div>
                  </div>
                )}
              </div>

              {/* Tally Controls */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <Button
                  onClick={decrementTally}
                  disabled={tallyCount === 0}
                  variant="outline"
                  size="lg"
                  className="w-16 h-16 rounded-full"
                >
                  <Minus className="w-6 h-6" />
                </Button>
                
                <Button
                  onClick={incrementTally}
                  size="lg"
                  className="px-6 h-16 rounded-xl bg-golf-green hover:bg-dark-green text-white font-bold text-lg flex items-center gap-2"
                >
                  <Plus className="w-6 h-6" />
                  Throw
                </Button>
                
                <Button
                  onClick={resetTally}
                  disabled={tallyCount === 0}
                  variant="outline"
                  size="lg"
                  className="w-16 h-16 rounded-full"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Custom Input Tab */}
          <TabsContent value="custom" className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Enter your total score manually
              </p>
              
              <div className="space-y-4">
                <Input
                  type="number"
                  min="0"
                  max="15"
                  value={customScore}
                  onChange={(e) => handleCustomScoreChange(e.target.value)}
                  placeholder="Enter score..."
                  className="text-center text-2xl font-bold h-16 rounded-xl"
                />
                
                {selectedScore !== null && activeTab === "custom" && (
                  <div className="bg-golf-bg p-4 rounded-xl">
                    <div className={`text-3xl font-bold mb-2 ${getScoreColor(selectedScore, par)}`}>
                      {selectedScore}
                    </div>
                    <Badge variant="secondary" className="mb-2">
                      {getScoreDetails(selectedScore).label}
                    </Badge>
                    <div className="text-lg font-semibold text-gray-700">
                      {getScoreDetails(selectedScore).formatted}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Quick Select Tab */}
          <TabsContent value="quick" className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Quick score selection
              </p>
              
              {/* Score Buttons */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {scoreButtons.map(({ score, color, label }) => (
                  <Button
                    key={score}
                    onClick={() => handleScoreSelect(score)}
                    className={`
                      ${selectedScore === score && activeTab === "quick" ? 'ring-4 ring-golf-green' : ''} 
                      ${color} text-white font-bold py-4 rounded-xl text-xl h-16
                    `}
                    variant="default"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Selected Score Display - Only show when score is selected and not in tally mode */}
        {selectedScore !== null && activeTab !== "tally" && (
          <div className="bg-golf-bg p-4 rounded-xl text-center">
            <div className="text-sm text-gray-600 mb-1">Final Score</div>
            <div className={`text-3xl font-bold mb-2 ${getScoreColor(selectedScore, par)}`}>
              {selectedScore}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary">
                {getScoreDetails(selectedScore).label}
              </Badge>
              <span className="text-lg font-semibold text-gray-700">
                {getScoreDetails(selectedScore).formatted}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons - Show when score is selected */}
        {selectedScore !== null && (
          <div className="flex space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmScore}
              disabled={selectedScore === null || enterScoreMutation.isPending}
              className="flex-1 bg-golf-green hover:bg-dark-green text-white font-semibold py-3 px-6 rounded-xl"
            >
              {enterScoreMutation.isPending ? "Saving..." : "Confirm Score"}
            </Button>
          </div>
        )}

        {/* Cancel button when no score selected */}
        {selectedScore === null && (
          <div className="flex justify-center pt-4">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl"
            >
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
