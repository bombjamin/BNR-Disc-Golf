import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Edit3, ChevronLeft, ChevronRight, Map, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateAvatarColor, getInitials, getScoreBgColor, getScoreColor } from "@/lib/utils";
import { PlayerAvatar } from "@/components/player-avatar";
import { PhotoUpload } from "@/components/photo-upload";
import { GamePhotoSummary } from "@/components/photo-gallery";
import { type GameWithPlayers, type Player, type Score, COURSE_CONFIG } from "@shared/schema";
import { CourseMapModal } from "@/components/modals/course-map-modal";
import { HolePreviewModal } from "@/components/modals/hole-preview-modal";

interface ScorecardProps {
  gameId: number;
  currentPlayerId: number;
  onEnterScore: (playerId?: number) => void;
  onGameCancel?: () => void;
}

export function Scorecard({ gameId, currentPlayerId, onEnterScore, onGameCancel }: ScorecardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [courseMapOpen, setCourseMapOpen] = useState(false);
  const [holePreviewOpen, setHolePreviewOpen] = useState(false);

  const { data: game, isLoading, error } = useQuery<GameWithPlayers>({
    queryKey: [`/api/games/${gameId}`],
    refetchInterval: 3000, // Poll every 3 seconds for updates
    retry: (failureCount, error: any) => {
      // If the game is not found (404), don't retry
      if (error?.message?.includes('404') || error?.status === 404) {
        return false;
      }
      return failureCount < 3;
    }
  });

  const nextHoleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/games/${gameId}/next-hole`);
      return response.json();
    },
    onSuccess: (result) => {
      if (result.gameCompleted) {
        toast({
          title: "Game Complete!",
          description: "All holes have been completed. Check the leaderboard!",
        });
      } else {
        toast({
          title: "Next Hole",
          description: `Advanced to hole ${result.nextHole}`,
        });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Cannot Advance",
        description: error.message || "All players must confirm their scores first",
        variant: "destructive",
      });
    },
  });

  const cancelGameMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/games/${gameId}/cancel`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Game Cancelled",
        description: "The game has been ended and all players have been notified",
      });
      if (onGameCancel) {
        onGameCancel();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel game",
        variant: "destructive",
      });
    },
  });

  // Handle game cancellation (404 error means game was deleted)
  if (error && ((error as any)?.status === 404 || (error as any)?.message?.includes('404') || (error as any)?.message?.includes('Game not found'))) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center mb-4">
                <X className="w-12 h-12 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-red-700">Game Cancelled</h1>
              <p className="text-red-600">
                The host has cancelled this game. All progress has been ended.
              </p>
              <Button 
                onClick={() => {
                  if (onGameCancel) {
                    onGameCancel();
                  }
                }}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !game) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-lg animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const courseConfig = COURSE_CONFIG[game.courseType as keyof typeof COURSE_CONFIG];
  const currentHole = game.currentHole;
  const currentPar = courseConfig.pars[currentHole - 1] || 3;
  
  // Get current player first
  const currentPlayer = game.players.find(p => p.id === currentPlayerId);
  
  // Get scores for current hole
  const currentHoleScores = game.scores.filter(s => s.hole === currentHole);
  
  // Check if all players have entered scores for current hole (no need for confirmation)
  const allPlayersHaveScores = game.players.every(player => 
    currentHoleScores.some(score => score.playerId === player.id)
  );

  // Only host can advance the game
  const isHost = currentPlayer?.isHost || false;
  const canAdvance = isHost && allPlayersHaveScores && currentHole < courseConfig.holes;
  const isGameComplete = currentHole >= courseConfig.holes && allPlayersHaveScores;

  const getPlayerScore = (player: Player, hole: number): Score | undefined => {
    return game.scores.find(s => s.playerId === player.id && s.hole === hole);
  };

  const getPlayerTotal = (player: Player): number => {
    return game.scores
      .filter(s => s.playerId === player.id)
      .reduce((sum, score) => sum + score.strokes, 0);
  };
  const currentPlayerScore = getPlayerScore(currentPlayer!, currentHole);

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-dark-green">
                Game: {game.code}
              </h2>
              <p className="text-sm text-gray-600">
                Hole {currentHole} of {courseConfig.holes}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Players</div>
              <div className="text-xl font-bold text-golf-green">
                {game.players.length}
              </div>
            </div>
          </div>

          {/* Hole Navigation */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {Array.from({ length: courseConfig.holes }, (_, i) => i + 1).map(hole => (
              <Button
                key={hole}
                variant={hole === currentHole ? "default" : "secondary"}
                size="sm"
                className={`
                  flex-shrink-0 w-10 h-10 rounded-lg font-semibold text-sm
                  ${hole === currentHole 
                    ? 'bg-golf-green text-white' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }
                `}
              >
                {hole}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Hole Info */}
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-2xl font-bold text-dark-green mb-2">
            Hole {currentHole}
          </h3>
          <div className="text-center mb-3">
            <h4 className="text-lg font-semibold text-gray-700">
              {courseConfig.nicknames ? courseConfig.nicknames[currentHole - 1] : `Hole ${currentHole}`}
            </h4>
          </div>
          <div className="flex justify-center space-x-8 mb-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Par</div>
              <div className="text-xl font-bold text-golf-green">{currentPar}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Distance</div>
              <div className="text-xl font-bold text-golf-green">
                {courseConfig.distances ? `${courseConfig.distances[currentHole - 1]}ft` : 'N/A'}
              </div>
            </div>
          </div>
          
          {/* Course Map Actions */}
          <div className="flex justify-center space-x-3 mb-4">
            <Button
              onClick={() => setHolePreviewOpen(true)}
              variant="outline"
              size="sm"
              className="px-4 py-2 border-golf-green text-golf-green hover:bg-golf-green hover:text-white"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Hole
            </Button>
            <Button
              onClick={() => setCourseMapOpen(true)}
              variant="outline"
              size="sm"
              className="px-4 py-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
            >
              <Map className="w-4 h-4 mr-2" />
              Course Map
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scorecard */}
      <Card>
        <CardHeader className="bg-golf-green text-white">
          <CardTitle className="font-semibold flex items-center">
            <Edit3 className="w-5 h-5 mr-2" />
            Scorecard - Hole {currentHole}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-golf-bg">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Player</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Score</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Total</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {game.players.map((player) => {
                  const playerScore = getPlayerScore(player, currentHole);
                  const isCurrentPlayer = player.id === currentPlayerId;
                  const avatarColor = generateAvatarColor(player.name);

                  return (
                    <tr 
                      key={player.id} 
                      className={`hover:bg-gray-50 ${isCurrentPlayer ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <PlayerAvatar 
                            player={player}
                            size="sm"
                            className="mr-3"
                          />
                          <span className="font-medium text-dark-green">
                            {player.name}{isCurrentPlayer ? ' (You)' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {playerScore ? (
                          <div className="space-y-1">
                            <Button
                              size="sm"
                              className={`${getScoreBgColor(playerScore.strokes, currentPar)} text-white font-semibold py-2 px-4 rounded-lg min-w-[60px]`}
                            >
                              {playerScore.strokes}
                            </Button>
                            <div className={`text-xs font-medium ${getScoreColor(playerScore.strokes, currentPar)}`}>
                              {(() => {
                                const diff = playerScore.strokes - currentPar;
                                if (diff <= -3) return "Albatross";
                                if (diff === -2) return "Eagle";
                                if (diff === -1) return "Birdie";
                                if (diff === 0) return "Par";
                                if (diff === 1) return "Bogey";
                                if (diff === 2) return "Double";
                                if (diff === 3) return "Triple";
                                return `+${diff}`;
                              })()}
                            </div>
                          </div>
                        ) : isCurrentPlayer ? (
                          <Button
                            onClick={() => onEnterScore(currentPlayerId)}
                            className="bg-golf-green hover:bg-dark-green text-white font-semibold py-2 px-4 rounded-lg min-w-[60px]"
                          >
                            Enter
                          </Button>
                        ) : (isHost && player.isLocal) ? (
                          <Button
                            onClick={() => onEnterScore(player.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg min-w-[60px]"
                          >
                            Enter
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg min-w-[60px]"
                            disabled
                          >
                            -
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-dark-green">
                        {getPlayerTotal(player)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {playerScore ? (
                          <Badge className="bg-emerald-500 text-white">
                            <Check className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        ) : isCurrentPlayer ? (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Edit3 className="w-3 h-3 mr-1" />
                            Your Turn
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            <Clock className="w-3 h-3 mr-1" />
                            Waiting
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - Host Only */}
      {isHost && (
        <div className="space-y-4">
          {/* Main Navigation Buttons */}
          <div className="flex space-x-4">
            <Button
              variant="secondary"
              disabled={currentHole <= 1}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous Hole
            </Button>
            
            {isGameComplete ? (
              <Button
                onClick={() => nextHoleMutation.mutate()}
                disabled={nextHoleMutation.isPending}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl"
              >
                {nextHoleMutation.isPending ? "Finishing..." : "Complete Game"}
              </Button>
            ) : (
              <Button
                onClick={() => nextHoleMutation.mutate()}
                disabled={!canAdvance || nextHoleMutation.isPending}
                className="flex-1 bg-golf-green hover:bg-dark-green text-white font-semibold py-3 px-6 rounded-xl"
              >
                {nextHoleMutation.isPending ? "Advancing..." : "Next Hole"}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>

          {/* Cancel Game Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={cancelGameMutation.isPending}
                className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 py-3 px-6 rounded-xl"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Game
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm mx-4">
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Game</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel this game? This will end the current game and notify all players. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Playing</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => cancelGameMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={cancelGameMutation.isPending}
                >
                  {cancelGameMutation.isPending ? "Cancelling..." : "Cancel Game"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Status Messages */}
      {!isHost && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-blue-600 mr-2" />
              <p className="text-blue-800 text-sm font-medium">
                {!getPlayerScore(currentPlayer!, currentHole) 
                  ? "Enter your score for this hole to continue"
                  : allPlayersHaveScores 
                    ? isGameComplete
                      ? "Game complete! Waiting for host to view results."
                      : "Waiting for host to advance to the next hole"
                    : "Waiting for other players to enter their scores"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isHost && !allPlayersHaveScores && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800 text-sm">
                Waiting for all players to enter their scores before advancing to the next hole.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isHost && allPlayersHaveScores && isGameComplete && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-800 text-sm font-medium">
                Game complete! Click "View Results" to see the final leaderboard.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* End of Game Photo Display */}
      {isGameComplete && (
        <GamePhotoSummary gameId={gameId} className="mt-6" />
      )}

      {/* Course Map Modal */}
      <CourseMapModal
        isOpen={courseMapOpen}
        onClose={() => setCourseMapOpen(false)}
        gameType={game.courseType as "front9" | "back9" | "full18"}
        currentHole={currentHole}
      />

      {/* Hole Preview Modal */}
      <HolePreviewModal
        isOpen={holePreviewOpen}
        onClose={() => setHolePreviewOpen(false)}
        holeNumber={currentHole}
        courseType={game.courseType as "front9" | "back9" | "full18"}
        onStartHole={() => {
          setHolePreviewOpen(false);
          onEnterScore();
        }}
      />
    </div>
  );
}
