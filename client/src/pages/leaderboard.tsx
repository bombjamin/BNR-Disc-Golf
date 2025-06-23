import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Users, ArrowLeft, Target, ChevronDown, ChevronUp } from "lucide-react";
import { formatScore, getScoreBgColor } from "@/lib/utils";
import { GameWithPlayers, COURSE_CONFIG } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/player-avatar";

interface GameResultsProps {
  game: GameWithPlayers;
  onClose: () => void;
}

function GameResults({ game, onClose }: GameResultsProps) {
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onClose} className="flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
        <Badge variant="secondary" className="text-sm">
          {game.courseType === "front9" ? "Front 9" : game.courseType === "back9" ? "Back 9" : "Full 18"}
        </Badge>
      </div>

      {/* Game Info */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-dark-green">Game Results</h2>
            <p className="text-gray-600">Code: {game.code}</p>
            <p className="text-sm text-gray-500">
              Completed on {new Date(game.createdAt).toLocaleDateString('en-US', {
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
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Final Leaderboard */}
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
                  className="flex items-center justify-between p-4 rounded-xl border bg-white cursor-pointer hover:shadow-md hover:bg-gray-50 transition-all"
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

export default function Leaderboard() {
  const [selectedGame, setSelectedGame] = useState<GameWithPlayers | null>(null);

  const { data: completedGames, isLoading } = useQuery<GameWithPlayers[]>({
    queryKey: ["/api/games/completed"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-100 rounded-xl">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-6 bg-gray-200 rounded w-8 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (selectedGame) {
    return <GameResults game={selectedGame} onClose={() => setSelectedGame(null)} />;
  }

  const formatGameDateTime = (date: string | Date) => {
    const gameDate = typeof date === 'string' ? new Date(date) : date;
    return {
      date: gameDate.toLocaleDateString('en-US', {
        timeZone: 'America/Chicago',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: gameDate.toLocaleTimeString('en-US', {
        timeZone: 'America/Chicago',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  return (
    <div className="space-y-6">
      <Card className="border border-gray-100 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-dark-green flex items-center justify-center">
            <Trophy className="w-6 h-6 mr-2" />
            Past Games
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!completedGames || completedGames.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No completed games yet</p>
              <p className="text-sm text-gray-500">Games will appear here after they're finished!</p>
            </div>
          ) : (
            completedGames.map((game) => {
              const { date, time } = formatGameDateTime(game.createdAt);
              
              return (
                <Card 
                  key={game.id} 
                  className="cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200"
                  onClick={() => setSelectedGame(game)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-golf-green rounded-full">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Game {game.code}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 space-x-4">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {date} at {time} CT
                            </div>
                            <div className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {game.players.length} players
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge variant="secondary" className="mb-2">
                          {game.courseType === "front9" ? "Front 9" : 
                           game.courseType === "back9" ? "Back 9" : "Full 18"}
                        </Badge>
                        <p className="text-xs text-gray-500">Click to view results</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}