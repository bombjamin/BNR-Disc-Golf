import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { joinGameSchema, type JoinGame } from "@shared/schema";

interface JoinGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGameJoined: (gameCode: string, gameId: number, playerId: number) => void;
}

export function JoinGameModal({ open, onOpenChange, onGameJoined }: JoinGameModalProps) {
  const { toast } = useToast();
  const { user, sessionId } = useAuth();
  const [, setLocation] = useLocation();

  const userName = user?.isGuest 
    ? user.firstName 
    : user ? `${user.firstName} ${user.lastName}`.trim() 
    : "";

  const form = useForm<JoinGame>({
    resolver: zodResolver(joinGameSchema),
    defaultValues: {
      name: userName,
      code: "",
    },
  });

  const joinGameMutation = useMutation({
    mutationFn: async (data: JoinGame) => {
      const headers = sessionId ? { Authorization: `Bearer ${sessionId}` } : undefined;
      const response = await apiRequest("POST", "/api/games/join", data, headers);
      return response.json();
    },
    onSuccess: (result) => {
      console.log("Join game result:", result);

      if (!result.game || !result.player) {
        console.error("Invalid join game response structure:", result);
        toast({
          title: "Error",
          description: "Invalid response from server. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Joined Game!",
        description: `Welcome to game ${result.game.code}`,
      });

      // Store game info in localStorage
      const gameInfo = {
        gameId: result.game.id,
        playerId: result.player.id,
        playerName: form.getValues("name"),
        gameCode: result.game.code,
      };

      console.log("Storing join game info:", gameInfo);
      localStorage.setItem("currentGame", JSON.stringify(gameInfo));

      onGameJoined(result.game.code, result.game.id, result.player.id);
      onOpenChange(false);
      form.reset();
      setLocation("/game");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join game",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JoinGame) => {
    console.log("Join form submitted with data:", data);
    joinGameMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-dark-green">
            Join Game
          </DialogTitle>
          <DialogDescription>
            Enter your name and the game code to join an existing game.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
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
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Game Code
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-golf-green focus:border-transparent text-center text-2xl font-bold tracking-widest uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={joinGameMutation.isPending}
              className="w-full bg-disc-orange hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
            >
              {joinGameMutation.isPending ? "Joining..." : "Join Game"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}