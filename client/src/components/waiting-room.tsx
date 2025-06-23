import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Play, Copy, UserPlus, Crown, X, Edit3, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { generateAvatarColor, getInitials } from "@/lib/utils";
import { PhotoUpload } from "@/components/photo-upload";
import { PlayerAvatar } from "@/components/player-avatar";
import { type GameWithPlayers, COURSE_CONFIG } from "@shared/schema";

interface WaitingRoomProps {
  gameId: number;
  currentPlayerId: number;
  onGameStart: () => void;
  onGameCancel: () => void;
}

export function WaitingRoom({ gameId, currentPlayerId, onGameStart, onGameCancel }: WaitingRoomProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sessionId } = useAuth();
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState("");
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");

  const { data: game, isLoading, error } = useQuery<GameWithPlayers>({
    queryKey: [`/api/games/${gameId}`],
    refetchInterval: 2000, // Poll every 2 seconds for new players
    retry: (failureCount, error: any) => {
      // If the game is not found (404), don't retry
      if (error?.message?.includes('404') || error?.status === 404) {
        return false;
      }
      return failureCount < 3;
    }
  });

  const startGameMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/games/${gameId}/start`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Game Started!",
        description: "Let's play disc golf!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      onGameStart();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start game",
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
        description: "The waiting room has been closed",
      });
      onGameCancel();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel game",
        variant: "destructive",
      });
    },
  });

  const addLocalPlayerMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!sessionId) return;
      const response = await apiRequest(
        "POST", 
        `/api/games/${gameId}/players/local`, 
        { name },
        { Authorization: `Bearer ${sessionId}` }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Local Player Added",
        description: "Player has been added to the game",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      setIsAddingPlayer(false);
      setNewPlayerName("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add local player",
        variant: "destructive",
      });
    },
  });

  const updatePlayerNameMutation = useMutation({
    mutationFn: async ({ playerId, name }: { playerId: number; name: string }) => {
      if (!sessionId) return;
      const response = await apiRequest(
        "PATCH", 
        `/api/players/${playerId}/name`, 
        { name },
        { Authorization: `Bearer ${sessionId}` }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Player Name Updated",
        description: "Player name has been updated",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update player name",
        variant: "destructive",
      });
    },
  });

  const removePlayerMutation = useMutation({
    mutationFn: async (playerId: number) => {
      if (!sessionId) return;
      const response = await apiRequest(
        "DELETE", 
        `/api/players/${playerId}`, 
        undefined,
        { Authorization: `Bearer ${sessionId}` }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Player Removed",
        description: "Player has been removed from the game",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove player",
        variant: "destructive",
      });
    },
  });

  const handleStartEdit = (playerId: number, currentName: string) => {
    setEditingPlayerId(playerId);
    setEditingPlayerName(currentName);
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
    setEditingPlayerName("");
  };

  const handleSaveEdit = () => {
    if (editingPlayerId && editingPlayerName.trim()) {
      updatePlayerNameMutation.mutate({
        playerId: editingPlayerId,
        name: editingPlayerName.trim()
      });
      handleCancelEdit();
    }
  };

  const handleRemovePlayer = (playerId: number) => {
    removePlayerMutation.mutate(playerId);
  };

  const handleStartAddPlayer = () => {
    if (!game) return;
    const playerCount = game.players.length;
    const defaultName = `Player ${playerCount + 1}`;
    setNewPlayerName(defaultName);
    setIsAddingPlayer(true);
  };

  const handleCancelAddPlayer = () => {
    setIsAddingPlayer(false);
    setNewPlayerName("");
  };

  const handleSaveNewPlayer = () => {
    if (newPlayerName.trim()) {
      addLocalPlayerMutation.mutate(newPlayerName.trim());
    }
  };

  const handleCopyCode = async () => {
    if (!game) return;
    
    try {
      await navigator.clipboard.writeText(game.code);
      toast({
        title: "Copied!",
        description: "Game code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy the code manually",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!game) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my disc golf game!",
          text: `Join my disc golf game at Bar None Ranch with code: ${game.code}`,
        });
      } catch (error) {
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

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
              <h1 className="text-2xl font-bold text-red-700">Session Ended</h1>
              <p className="text-red-600">
                Host has ended the session. The waiting room has been closed.
              </p>
              <Button 
                onClick={() => {
                  onGameCancel();
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
        <div className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-6 bg-gray-200 rounded mb-2"></div>
          <div className="h-6 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const courseConfig = COURSE_CONFIG[game.courseType as keyof typeof COURSE_CONFIG];
  const currentPlayer = game.players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost || false;
  const hasMinimumPlayers = game.players.length >= 1; // Allow single player for testing

  // If game is already playing, redirect to game
  if (game.status === "playing") {
    onGameStart();
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Waiting Room Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-dark-green mb-2">Waiting Room</h1>
        <p className="text-gray-600 text-sm">Game will start once the host is ready</p>
      </div>

      {/* Game Code Header - Mobile Optimized */}
      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-gray-600 text-xs font-medium">Share this code with players:</p>
              <div className="bg-white border-2 border-gray-200 text-dark-green text-3xl font-bold tracking-[0.2em] font-mono py-3 px-4 rounded-lg">
                {game.code}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleCopyCode}
                variant="outline"
                size="sm"
                className="flex-1 border-gray-300 hover:bg-gray-50 text-xs py-2"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy Code
              </Button>
              <Button
                onClick={handleShare}
                size="sm"
                className="flex-1 bg-disc-orange hover:bg-orange-600 text-white text-xs py-2"
              >
                <UserPlus className="w-3 h-3 mr-1" />
                Share Game
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Stats - Compact Mobile Layout */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-golf-green">{game.players.length}</div>
            <div className="text-xs text-gray-600">Players</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-golf-green">{courseConfig.holes}</div>
            <div className="text-xs text-gray-600">Holes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-golf-green">
              {courseConfig.pars.reduce((sum, par) => sum + par, 0)}
            </div>
            <div className="text-xs text-gray-600">Par</div>
          </CardContent>
        </Card>
      </div>

      {/* Players List - Compact Mobile Layout */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-dark-green flex items-center text-sm">
            <Users className="w-4 h-4 mr-2" />
            Players in Game ({game.players.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {game.players.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Waiting for players to join...</p>
            </div>
          ) : (
            game.players.map((player, index) => {
              const isCurrentPlayer = player.id === currentPlayerId;
              const isEditing = editingPlayerId === player.id;
              const canEdit = isHost && player.isLocal && !player.isHost;
              const canRemove = isHost && !player.isHost;

              return (
                <div 
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    isCurrentPlayer ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center flex-1">
                    <div className="flex items-center justify-center w-6 h-6 bg-golf-green text-white text-xs font-bold rounded-full mr-2">
                      {index + 1}
                    </div>
                    <PlayerAvatar player={player} size="sm" className="mr-2" />
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editingPlayerName}
                            onChange={(e) => setEditingPlayerName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="text-sm h-8"
                            placeholder="Player name"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            className="h-8 px-2 bg-green-600 hover:bg-green-700"
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="h-8 px-2"
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-dark-green text-sm">
                            {player.name}
                            {isCurrentPlayer && <span className="text-blue-600 ml-1">(You)</span>}
                          </div>
                          <div className="text-xs text-gray-500">
                            Joined {new Date(player.joinedAt).toLocaleTimeString()}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {player.isHost && (
                      <Badge className="bg-golf-green text-white text-xs px-2 py-1">
                        <Crown className="w-3 h-3 mr-1" />
                        Host
                      </Badge>
                    )}
                    
                    {/* Edit and Remove buttons for host */}
                    {!isEditing && (
                      <div className="flex items-center space-x-1">
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(player.id, player.name)}
                            className="h-8 w-8 p-0 hover:bg-blue-100"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        )}
                        {canRemove && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Player</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove "{player.name}" from the game?
                                  {!player.isLocal && " They will be redirected to the home screen."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemovePlayer(player.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove Player
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Host Actions - Add Local Player */}
      {isHost && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-gray-600 mb-3 text-sm">
                You can add local players that you'll manage during the game
              </p>
              {isAddingPlayer ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveNewPlayer();
                        if (e.key === 'Escape') handleCancelAddPlayer();
                      }}
                      className="text-sm"
                      placeholder="Enter player name"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveNewPlayer}
                      disabled={!newPlayerName.trim() || addLocalPlayerMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white px-3"
                    >
                      {addLocalPlayerMutation.isPending ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      ) : (
                        "✓"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelAddPlayer}
                      disabled={addLocalPlayerMutation.isPending}
                      className="px-3"
                    >
                      ✕
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Press Enter to add or Escape to cancel</p>
                </div>
              ) : (
                <Button
                  onClick={handleStartAddPlayer}
                  variant="outline"
                  className="w-full border-golf-green text-golf-green hover:bg-golf-green hover:text-white py-3 px-6 rounded-lg"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Player
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Host Controls - Mobile Optimized */}
      {isHost && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-gray-600 mb-3 text-sm">
                {hasMinimumPlayers 
                  ? "Ready to start the game? Players can only join in the waiting room."
                  : "Waiting for more players to join..."
                }
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => startGameMutation.mutate()}
                  disabled={!hasMinimumPlayers || startGameMutation.isPending}
                  className="w-full bg-golf-green hover:bg-dark-green text-white font-semibold py-3 px-6 rounded-lg"
                >
                  {startGameMutation.isPending ? (
                    "Starting Game..."
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Game
                    </>
                  )}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={cancelGameMutation.isPending}
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 py-3 px-6 rounded-lg"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel Game
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Game</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this game? This will close the waiting room and remove all players. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Game</AlertDialogCancel>
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-Host Message */}
      {!isHost && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-center text-yellow-800">
              <Crown className="w-5 h-5 mx-auto mb-2" />
              <p className="text-sm">
                Waiting for {game.players.find(p => p.isHost)?.name || "the host"} to start the game...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}