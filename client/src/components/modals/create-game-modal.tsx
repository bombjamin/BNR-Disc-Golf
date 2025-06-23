import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { createGameSchema, type CreateGame } from "@shared/schema";


interface CreateGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGameCreated: (gameCode: string, gameId: number, playerId: number) => void;
}

export function CreateGameModal({ open, onOpenChange, onGameCreated }: CreateGameModalProps) {
  const { toast } = useToast();
  const { user, sessionId } = useAuth();
  const queryClient = useQueryClient();

  const userName = user?.isGuest 
    ? user.firstName 
    : user ? `${user.firstName} ${user.lastName}`.trim() 
    : "";

  const form = useForm<CreateGame>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      hostName: userName,
      courseType: "full18",
    },
  });

  const createGameMutation = useMutation({
    mutationFn: async (data: CreateGame) => {
      const headers = sessionId ? { Authorization: `Bearer ${sessionId}` } : undefined;
      const response = await apiRequest("POST", "/api/games", data, headers);
      return response.json();
    },
    onSuccess: async (game) => {
      try {
        console.log("Game created successfully:", game);

        // Retry logic to fetch the game with players
        let gameWithPlayers;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts) {
          try {
            const gameResponse = await apiRequest("GET", `/api/games/${game.id}`);
            gameWithPlayers = await gameResponse.json();
            
            // Check if the host player exists
            if (gameWithPlayers.players?.some((p: any) => p.isHost)) {
              break;
            }
            
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 200 * attempts)); // Exponential backoff
            }
          } catch (error) {
            attempts++;
            if (attempts >= maxAttempts) {
              throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 200 * attempts));
          }
        }
        console.log("Game with players:", gameWithPlayers);

        const hostPlayer = gameWithPlayers.players?.find((p: any) => p.isHost);

        if (!hostPlayer) {
          console.error("Host player not found. Available players:", gameWithPlayers.players);
          throw new Error("Host player not found in created game");
        }

        // Store game info in localStorage for the host
        const gameInfo = {
          gameId: game.id,
          playerId: hostPlayer.id,
          playerName: form.getValues("hostName"),
          gameCode: game.code,
        };

        console.log("Storing game info:", gameInfo);
        localStorage.setItem("currentGame", JSON.stringify(gameInfo));

        // Verify storage
        const stored = localStorage.getItem("currentGame");
        console.log("Verified stored game info:", stored);

        toast({
          title: "Game Created!",
          description: `Game ${game.code} has been created successfully`,
        });

        // Close modal first
        onOpenChange(false);
        form.reset();

        // Invalidate games query to refresh any lists
        queryClient.invalidateQueries({ queryKey: ["/api/games"] });

        // Call the callback to navigate properly through the app
        console.log("Calling onGameCreated callback with:", game.code, game.id, hostPlayer.id);
        onGameCreated(game.code, game.id, hostPlayer.id);
      } catch (error) {
        console.error("Error in game creation success handler:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Game created but failed to set up properly. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create game",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateGame) => {
    createGameMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-dark-green">
            Create New Game
          </DialogTitle>
          <DialogDescription>
            Set up a new disc golf game and invite players to join.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="hostName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Your Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      readOnly
                      tabIndex={-1}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Course Selection
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-golf-green focus:border-transparent">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="full18">Full 18 Holes</SelectItem>
                      <SelectItem value="front9">Front 9 Only</SelectItem>
                      <SelectItem value="back9">Back 9 Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={createGameMutation.isPending}
              className="w-full bg-golf-green hover:bg-dark-green text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
            >
              {createGameMutation.isPending ? "Creating..." : "Start Game"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}