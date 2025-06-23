import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { 
  GamepadIcon, 
  Clock, 
  Users, 
  Trophy, 
  Play, 
  Pause,
  Calendar,
  Target,
  Eye,
  UserCheck
} from "lucide-react";
import { GameWithPlayers } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface RecentGameState {
  gameInfo: any;
  game: GameWithPlayers | null;
  isLoading: boolean;
  error: string | null;
}

export default function Games() {
  const { user } = useAuth();
  const [recentGameState, setRecentGameState] = useState<RecentGameState>({
    gameInfo: null,
    game: null,
    isLoading: false,
    error: null
  });

  // Query for user's games
  const { data: userGames, isLoading: userGamesLoading } = useQuery<GameWithPlayers[]>({
    queryKey: ["/api/auth/games"],
    enabled: !!user,
  });

  // Query for all games (not just completed)
  const { data: allGames, isLoading: allGamesLoading } = useQuery<GameWithPlayers[]>({
    queryKey: ["/api/games/all"],
  });

  // Check for active game from localStorage and fetch details
  useEffect(() => {
    const checkForActiveGame = async () => {
      const storedGameInfo = localStorage.getItem("currentGame");
      if (!storedGameInfo) {
        setRecentGameState(prev => ({ ...prev, gameInfo: null, game: null }));
        return;
      }

      try {
        const gameInfo = JSON.parse(storedGameInfo);
        setRecentGameState(prev => ({ ...prev, gameInfo, isLoading: true }));

        const response = await fetch(`/api/games/${gameInfo.gameId}`);
        if (response.ok) {
          const gameData = await response.json();
          setRecentGameState(prev => ({ ...prev, game: gameData, isLoading: false }));
        } else {
          // Game doesn't exist anymore, clear localStorage
          localStorage.removeItem("currentGame");
          setRecentGameState(prev => ({ ...prev, gameInfo: null, game: null, isLoading: false }));
        }
      } catch (error) {
        console.error("Error fetching active game:", error);
        setRecentGameState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: "Failed to load active game" 
        }));
      }
    };

    checkForActiveGame();
  }, []);

  const formatGameDate = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      absolute: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      }) + ' ' + date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'playing': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCourseDisplayName = (courseType: string) => {
    switch (courseType) {
      case 'front9': return 'Front 9';
      case 'back9': return 'Back 9';
      case 'full18': return 'Full 18';
      default: return courseType;
    }
  };

  const navigateToGame = () => {
    window.location.href = '/game';
  };

  const viewGameResults = (game: GameWithPlayers) => {
    // Create fake game info to show the completed game results
    const gameInfo = {
      gameId: game.id,
      playerId: game.players[0].id, // Use any player ID
      playerName: game.players[0].name,
      gameCode: game.code
    };
    localStorage.setItem('currentGame', JSON.stringify(gameInfo));
    window.location.href = '/game';
  };

  // Helper function to calculate game results
  const calculateGameResults = (game: GameWithPlayers) => {
    const courseConfig = {
      front9: { holes: 9, pars: [3, 4, 4, 3, 5, 4, 3, 4, 4] },
      back9: { holes: 9, pars: [4, 3, 4, 5, 3, 4, 4, 3, 4] },
      full18: { holes: 18, pars: [3, 4, 4, 3, 5, 4, 3, 4, 4, 4, 3, 4, 5, 3, 4, 4, 3, 4] }
    };

    const config = courseConfig[game.courseType as keyof typeof courseConfig];
    if (!config) return null;

    const playerResults = game.players.map(player => {
      const playerScores = game.scores.filter(s => s.playerId === player.id);
      const totalStrokes = playerScores.reduce((sum, score) => sum + score.strokes, 0);
      const holesCompleted = playerScores.length;
      
      let totalPar = 0;
      for (let i = 0; i < holesCompleted; i++) {
        totalPar += config.pars[i] || 3;
      }
      
      const relativeToPar = totalStrokes - totalPar;
      
      return {
        player,
        totalStrokes,
        holesCompleted,
        relativeToPar,
        isCurrentUser: player.userId === user?.id
      };
    });

    // Sort by total strokes (ascending)
    playerResults.sort((a, b) => a.totalStrokes - b.totalStrokes);
    
    const winner = playerResults[0];
    const currentUserResult = playerResults.find(r => r.isCurrentUser);
    const currentUserPosition = playerResults.findIndex(r => r.isCurrentUser) + 1;

    return {
      winner,
      currentUserResult,
      currentUserPosition,
      totalPlayers: playerResults.length
    };
  };

  const formatRelativeToPar = (score: number) => {
    if (score === 0) return "Even";
    if (score > 0) return `+${score}`;
    return `${score}`;
  };

  const RecentGameCard = () => {
    if (recentGameState.isLoading) {
      return (
        <Card className="border border-golf-green/20 shadow-lg">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
              <div className="h-4 bg-gray-200 rounded mb-2 w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-36"></div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!recentGameState.gameInfo || !recentGameState.game) {
      return (
        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-6 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Game</h3>
            <p className="text-gray-500 mb-4">Start a new game or join an existing one to begin playing</p>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              <Play className="w-4 h-4 mr-2" />
              Start Playing
            </Button>
          </CardContent>
        </Card>
      );
    }

    const { game } = recentGameState;
    const isUserInGame = game.players.some(p => p.userId === user?.id);
    const userPlayer = game.players.find(p => p.userId === user?.id);
    const isCompleted = game.status === 'completed';
    const gameResults = isCompleted ? calculateGameResults(game) : null;

    // Format the game date
    const gameDate = new Date(game.createdAt);
    const formattedDate = gameDate.toLocaleDateString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedTime = gameDate.toLocaleTimeString('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return (
      <Card className="border border-golf-green shadow-lg bg-gradient-to-r from-golf-green/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GamepadIcon className="w-5 h-5 text-golf-green" />
              <span className="text-golf-green">
                {isCompleted ? 'Recent Game' : 'Current Game'}
              </span>
            </div>
            <Badge className={getStatusColor(game.status)}>
              {game.status === 'waiting' && <Clock className="w-3 h-3 mr-1" />}
              {game.status === 'playing' && <Play className="w-3 h-3 mr-1" />}
              {game.status === 'completed' && <Trophy className="w-3 h-3 mr-1" />}
              {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Show different info based on game status */}
            {isCompleted ? (
              <>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="font-semibold">{formattedTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Players</p>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">{game.players.length}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Course</p>
                  <p className="font-semibold">{getCourseDisplayName(game.courseType)}</p>
                </div>
                {gameResults?.currentUserResult && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Your Score</p>
                    <p className="font-semibold">
                      {gameResults.currentUserResult.totalStrokes} strokes ({formatRelativeToPar(gameResults.currentUserResult.relativeToPar)})
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Game Code</p>
                  <p className="font-mono text-lg font-bold text-golf-green">{game.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Course</p>
                  <p className="font-semibold">{getCourseDisplayName(game.courseType)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Hole</p>
                  <p className="font-semibold">Hole {game.currentHole}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Players</p>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">{game.players.length}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Show winner info for completed games */}
          {isCompleted && gameResults?.winner && gameResults.winner.player.userId !== user?.id && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 font-medium">
                <Trophy className="w-4 h-4 inline mr-1" />
                Winner: {gameResults.winner.player.name} ({formatRelativeToPar(gameResults.winner.relativeToPar)})
              </p>
            </div>
          )}
          
          {/* Show playing status for active games */}
          {isUserInGame && !isCompleted && (
            <div className="bg-golf-green/10 rounded-lg p-3 mb-4">
              <p className="text-sm text-golf-green font-medium mb-1">
                <UserCheck className="w-4 h-4 inline mr-1" />
                You're playing as: {userPlayer?.name}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {game.status !== 'completed' && (
              <Button onClick={navigateToGame} className="flex-1">
                {game.status === 'waiting' ? 'Join Waiting Room' : 'Continue Game'}
              </Button>
            )}
            {game.status === 'completed' && (
              <Button variant="outline" onClick={() => viewGameResults(game)} className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                View Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const GamesList = ({ games, emptyMessage }: { games?: GameWithPlayers[], emptyMessage: string }) => {
    if (!games || games.length === 0) {
      return (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {games.map((game) => {
          const { relative, absolute } = formatGameDate(game.createdAt);
          const isUserInGame = game.players.some(p => p.userId === user?.id);
          
          return (
            <Card 
              key={game.id} 
              className="cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200"
              onClick={() => viewGameResults(game)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm font-bold text-golf-green">
                        {game.code}
                      </span>
                      <Badge className={getStatusColor(game.status)} variant="outline">
                        {game.status}
                      </Badge>
                      {isUserInGame && (
                        <Badge variant="secondary" className="text-xs">
                          <UserCheck className="w-3 h-3 mr-1" />
                          You played
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {getCourseDisplayName(game.courseType)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {game.players.length} players
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {absolute}
                      </div>
                      <div className="text-gray-500">
                        {relative}
                      </div>
                    </div>

                    {game.hostName && (
                      <p className="text-xs text-gray-500 mt-1">
                        Hosted by {game.hostName}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-golf-green">
                      {game.currentHole > 1 ? `Hole ${game.currentHole}` : 'Starting'}
                    </div>
                    <p className="text-xs text-gray-500">Click to view</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Recent/Active Game Section */}
      <div>
        <h2 className="text-xl font-bold text-golf-green mb-4">Recent Activity</h2>
        <RecentGameCard />
      </div>

      {/* Games List Section */}
      <Card className="border border-gray-100 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-dark-green">
            <Trophy className="w-6 h-6" />
            Game History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="my-games" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-games">My Games</TabsTrigger>
              <TabsTrigger value="all-games">All Games</TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-games" className="mt-6">
              {userGamesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <GamesList 
                  games={userGames} 
                  emptyMessage="You haven't played any games yet. Create or join a game to get started!"
                />
              )}
            </TabsContent>
            
            <TabsContent value="all-games" className="mt-6">
              {allGamesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <GamesList 
                  games={allGames} 
                  emptyMessage="No games have been created yet. Create the first game to get started!"
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}