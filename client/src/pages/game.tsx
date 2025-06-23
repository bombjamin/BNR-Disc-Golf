import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Trophy, Calendar, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scorecard } from "@/components/scorecard";
import { ScoreEntryModal } from "@/components/modals/score-entry-modal";
import { WaitingRoom } from "@/components/waiting-room";
import { PlayerAvatar } from "@/components/player-avatar";
import { ShareResults } from "@/components/share-results";
import { formatScore, getScoreBgColor } from "@/lib/utils";
import { type GameWithPlayers, COURSE_CONFIG } from "@shared/schema";

export default function Game() {
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  const [scoringPlayerId, setScoringPlayerId] = useState<number | null>(null);
  const [gameInfo, setGameInfo] = useState<{
    gameId: number;
    playerId: number;
    playerName: string;
    gameCode: string;
  } | null>(null);
  useEffect(() => {

    // First try URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');
    const gameCode = urlParams.get('code');
    const playerId = urlParams.get('player');
    
    if (gameId && gameCode && playerId) {
      const gameInfo = {
        gameId: parseInt(gameId),
        playerId: parseInt(playerId),
        playerName: "Player",
        gameCode: gameCode
      };
      console.log("Loading game from URL params:", gameInfo);
      setGameInfo(gameInfo);
      // Also store in localStorage for future use
      localStorage.setItem("currentGame", JSON.stringify(gameInfo));
      return;
    }

    // Fallback to localStorage
    const stored = localStorage.getItem("currentGame");
    console.log("Loading game from localStorage:", stored);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.gameId && parsed.playerId && parsed.gameCode) {
          setGameInfo(parsed);
        }
      } catch (error) {
        console.error("Failed to parse game info:", error);
        localStorage.removeItem("currentGame");
      }
    }
  }, []);

  const { data: game, isLoading, error } = useQuery<GameWithPlayers>({
    queryKey: [`/api/games/${gameInfo?.gameId}`],
    enabled: !!gameInfo?.gameId,
    refetchInterval: 3000,
  });

  console.log("Current state:", { gameInfo, game, isLoading, error });

  if (!gameInfo) {
    console.log("No gameInfo found, showing no active game message");
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <h1 className="text-2xl font-bold text-gray-900">No Active Game</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Create or join a game to start playing!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !game) {
    console.log("Loading state:", { isLoading, hasGame: !!game, gameInfo });
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-lg animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Game query error:", error);
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Game Error</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Failed to load game data. Please try refreshing or creating a new game.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!game) {
    console.log("Game data is null/undefined");
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
  const currentPar = courseConfig.pars[game.currentHole - 1] || 3;

  // Show waiting room if game hasn't started yet
  if (game.status === "waiting") {
    return (
      <WaitingRoom
        gameId={gameInfo.gameId}
        currentPlayerId={gameInfo.playerId}
        onGameStart={() => {
          // Game will automatically refresh and show scorecard
        }}
        onGameCancel={() => {
          // Clear game info and redirect to home
          localStorage.removeItem("currentGame");
          setGameInfo(null);
          window.location.href = "/";
        }}
      />
    );
  }

  // Show final results if game is completed
  if (game.status === "completed") {
    const courseConfig = COURSE_CONFIG[game.courseType as keyof typeof COURSE_CONFIG];
    
    // Calculate final leaderboard
    const leaderboard = game.players.map(player => {
      const playerScores = game.scores.filter(s => s.playerId === player.id);
      const totalStrokes = playerScores.reduce((sum, score) => sum + score.strokes, 0);
      const holesCompleted = playerScores.length;
      
      // Calculate score relative to par for completed holes
      let totalPar = 0;
      for (let i = 0; i < holesCompleted; i++) {
        totalPar += courseConfig.pars[i] || 3;
      }
      
      const relativeToPar = totalStrokes - totalPar;

      return {
        player,
        totalStrokes,
        holesCompleted,
        relativeToPar,
      };
    }).sort((a, b) => {
      if (a.relativeToPar === b.relativeToPar) {
        return a.totalStrokes - b.totalStrokes;
      }
      return a.relativeToPar - b.relativeToPar;
    });

    const getPositionColor = (position: number): string => {
      switch (position) {
        case 1: return "bg-yellow-500";
        case 2: return "bg-gray-400";
        case 3: return "bg-amber-600";
        default: return "bg-golf-green";
      }
    };

    return (
      <div className="space-y-6">
        {/* Game Completed Header */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
              <h1 className="text-2xl font-bold text-dark-green">Game Complete!</h1>
              <p className="text-gray-600">Game Code: {game.code}</p>
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(game.createdAt).toLocaleDateString('en-US', {
                    timeZone: 'America/Chicago',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })} at {new Date(game.createdAt).toLocaleTimeString('en-US', {
                    timeZone: 'America/Chicago',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })} CT
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {game.players.length} players
                </div>
              </div>
              <Badge variant="secondary" className="mt-2">
                {game.courseType === "front9" ? "Front 9" : 
                 game.courseType === "back9" ? "Back 9" : "Full 18"}
              </Badge>
              
              {/* Share Results Button */}
              <div className="mt-4">
                <ShareResults
                  game={game}
                  leaderboard={leaderboard}
                  courseDisplayName={game.courseType === "front9" ? "Front 9" : 
                                   game.courseType === "back9" ? "Back 9" : "Full 18"}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Standings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Final Standings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaderboard.map((entry, index) => {
              const position = index + 1;
              const isCurrentPlayer = entry.player.id === gameInfo.playerId;
              const positionColor = getPositionColor(position);
              const isExpanded = expandedPlayer === entry.player.id;
              const playerScores = game.scores.filter(s => s.playerId === entry.player.id);

              const toggleExpanded = () => {
                setExpandedPlayer(isExpanded ? null : entry.player.id);
              };

              return (
                <div key={entry.player.id} className="space-y-2">
                  <div
                    onClick={toggleExpanded}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                      isCurrentPlayer 
                        ? "bg-blue-50 border-blue-200 shadow-md" 
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${positionColor}`}>
                        {position <= 3 ? (
                          <Trophy className="w-4 h-4 text-white" />
                        ) : (
                          <span className="text-white font-bold text-sm">{position}</span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        <PlayerAvatar player={entry.player} size="md" />
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 flex items-center">
                            {entry.player.name}
                            {entry.player.isHost && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                Host
                              </span>
                            )}
                            {isCurrentPlayer && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                You
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-gray-500">Click to view hole details</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          {entry.totalStrokes}
                        </div>
                        <div className={`text-sm font-medium ${
                          entry.relativeToPar < 0 
                            ? "text-green-600" 
                            : entry.relativeToPar > 0 
                            ? "text-red-600" 
                            : "text-gray-600"
                        }`}>
                          {formatScore(entry.totalStrokes, entry.totalStrokes - entry.relativeToPar)}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded hole-by-hole details */}
                  {isExpanded && (
                    <div className="ml-12 mr-4 p-4 bg-gray-50 rounded-lg border">
                      <h5 className="font-semibold text-gray-800 mb-3">Hole-by-Hole Breakdown</h5>
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: courseConfig.holes }, (_, i) => {
                          const holeNumber = i + 1;
                          const holePar = courseConfig.pars[i];
                          const holeScore = playerScores.find(s => s.hole === holeNumber);
                          const holeName = courseConfig.nicknames[i];
                          
                          return (
                            <div key={holeNumber} className="text-center p-2 bg-white rounded border">
                              <div className="text-xs font-medium text-gray-600 mb-1">
                                Hole {holeNumber}
                              </div>
                              <div className="text-xs text-gray-500 mb-2 truncate" title={holeName}>
                                {holeName}
                              </div>
                              <div className="flex items-center justify-center space-x-2">
                                <div className="text-xs text-gray-500">
                                  Par {holePar}
                                </div>
                                {holeScore ? (
                                  <div className={`px-2 py-1 rounded text-xs font-semibold text-white ${getScoreBgColor(holeScore.strokes, holePar)}`}>
                                    {holeScore.strokes}
                                  </div>
                                ) : (
                                  <div className="px-2 py-1 rounded text-xs bg-gray-200 text-gray-500">
                                    -
                                  </div>
                                )}
                              </div>
                              {holeScore && (
                                <div className={`text-xs mt-1 font-medium ${
                                  holeScore.strokes < holePar 
                                    ? "text-green-600" 
                                    : holeScore.strokes > holePar 
                                    ? "text-red-600" 
                                    : "text-gray-600"
                                }`}>
                                  {holeScore.strokes === holePar ? "Par" :
                                   holeScore.strokes === holePar - 1 ? "Birdie" :
                                   holeScore.strokes === holePar - 2 ? "Eagle" :
                                   holeScore.strokes === holePar + 1 ? "Bogey" :
                                   holeScore.strokes === holePar + 2 ? "Double" :
                                   holeScore.strokes < holePar ? `${holePar - holeScore.strokes} under` :
                                   `${holeScore.strokes - holePar} over`}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show scorecard if game is playing
  return (
    <div className="space-y-6">
      <Scorecard
        gameId={gameInfo.gameId}
        currentPlayerId={gameInfo.playerId}
        onEnterScore={(playerId) => {
          setScoringPlayerId(playerId || gameInfo.playerId);
          setScoreModalOpen(true);
        }}
        onGameCancel={() => {
          // Clear game info and redirect to home
          localStorage.removeItem("currentGame");
          setGameInfo(null);
          window.location.href = "/";
        }}
      />

      <ScoreEntryModal
        open={scoreModalOpen}
        onOpenChange={(open) => {
          setScoreModalOpen(open);
          if (!open) {
            setScoringPlayerId(null);
          }
        }}
        gameId={gameInfo.gameId}
        playerId={scoringPlayerId || gameInfo.playerId}
        hole={game.currentHole}
        par={currentPar}
      />
    </div>
  );
}
