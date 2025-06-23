import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import Welcome from "@/pages/welcome";
import Home from "@/pages/home";
import Game from "@/pages/game";
import Games from "@/pages/games";
import Leaderboard from "@/pages/leaderboard";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const [hasActiveGame, setHasActiveGame] = useState(false);
  const [gameInfo, setGameInfo] = useState<any>(null);

  useEffect(() => {
    const storedGameInfo = localStorage.getItem("currentGame");
    if (storedGameInfo) {
      const parsed = JSON.parse(storedGameInfo);
      setGameInfo(parsed);
      setHasActiveGame(true);
    } else {
      setGameInfo(null);
      setHasActiveGame(false);
    }
  }, [location]);

  const handleGameCreated = (gameCode: string, gameId: number, playerId: number) => {
    console.log("Game created callback:", { gameCode, gameId, playerId });
    setHasActiveGame(true);
    setTimeout(() => {
      navigate("/game");
    }, 100);
  };

  const handleGameJoined = (gameCode: string, gameId: number, playerId: number) => {
    console.log("Game joined, navigating to game page:", { gameCode, gameId, playerId });
    setHasActiveGame(true);
    setTimeout(() => {
      navigate("/game");
    }, 100);
  };

  const handleNavigate = (path: string) => {
    if (!hasActiveGame && (path === "/game" || path === "/leaderboard")) {
      navigate("/");
      return;
    }
    navigate(path);
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-golf-green mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show welcome screen if user is not authenticated
  if (!user) {
    return <Welcome />;
  }

  // Show main app once authenticated
  return (
    <div className="min-h-screen bg-muted pb-20">
      <Header 
        gameId={gameInfo?.gameId}
        playerId={gameInfo?.playerId}
        currentHole={gameInfo?.currentHole}
      />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Switch>
          <Route path="/">
            <Home 
              onGameCreated={handleGameCreated}
              onGameJoined={handleGameJoined}
            />
          </Route>
          <Route path="/game">
            <Game />
          </Route>
          <Route path="/games">
            <Games />
          </Route>
          <Route path="/leaderboard">
            <Leaderboard />
          </Route>
          <Route path="/profile">
            <Profile />
          </Route>
          <Route path="/admin">
            <Admin />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>

      <BottomNavigation onNavigate={handleNavigate} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;