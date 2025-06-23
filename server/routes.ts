import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { 
  createGameSchema, 
  joinGameSchema, 
  enterScoreSchema, 
  registerSchema,
  loginPhoneSchema,
  loginPasswordSchema,
  verifyCodeSchema,
  changePasswordSchema,
  resetPasswordSchema,
  guestLoginSchema,
  uploadPhotoSchema,
  insertCourseTourVideoSchema,
  addLocalPlayerSchema,
  COURSE_CONFIG 
} from "@shared/schema";
import { z } from "zod";
import * as auth from "./auth";
import { photoUpload, ensureUploadsDirectory } from "./photo-handler";
import { profilePictureUpload, ensureProfilePicturesDirectory, processProfilePicture, getProfilePictureUrl } from "./profile-picture-handler";
import { videoUpload, ensureVideosDirectory, getVideoUrl, deleteVideoFile } from "./video-handler";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Ensure uploads directory exists
  ensureUploadsDirectory();
  ensureProfilePicturesDirectory();
  ensureVideosDirectory();
  
  // Authentication middleware to check session
  async function requireAuth(req: any, res: any, next: any) {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (!sessionId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await auth.getCurrentUser(sessionId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    req.user = user;
    req.sessionId = sessionId;
    next();
  }

  // Guest session middleware (optional auth)
  async function optionalAuth(req: any, res: any, next: any) {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
      const user = await auth.getCurrentUser(sessionId);
      if (user) {
        req.user = user;
        req.sessionId = sessionId;
      }
    }
    next();
  }

  // Jedi Master/Emperor authentication middleware
  async function requireAdmin(req: any, res: any, next: any) {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (!sessionId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await auth.getCurrentUser(sessionId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    if (user.role !== 'jedi_master' && user.role !== 'emperor') {
      return res.status(403).json({ message: 'Jedi Master or Emperor access required' });
    }

    req.user = user;
    req.sessionId = sessionId;
    next();
  }

  // Emperor-only authentication middleware
  async function requireEmperor(req: any, res: any, next: any) {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (!sessionId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await auth.getCurrentUser(sessionId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    if (user.role !== 'emperor') {
      return res.status(403).json({ message: 'Emperor access required' });
    }

    req.user = user;
    req.sessionId = sessionId;
    next();
  }

  // Authentication Routes

  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const result = await auth.registerUser(data);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(400).json({ message: (error as Error).message });
      }
    }
  });

  // Verify registration
  app.post("/api/auth/verify", async (req, res) => {
    try {
      const data = verifyCodeSchema.parse(req.body);
      const result = await auth.verifyRegistration(data);
      res.json({ user: result.user, sessionId: result.sessionId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(400).json({ message: (error as Error).message });
      }
    }
  });

  // Send login code via SMS
  app.post("/api/auth/login/code", async (req, res) => {
    try {
      const data = loginPhoneSchema.parse(req.body);
      const result = await auth.sendLoginCode(data);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(400).json({ message: (error as Error).message });
      }
    }
  });

  // Verify login code
  app.post("/api/auth/login/verify", async (req, res) => {
    try {
      const data = verifyCodeSchema.parse(req.body);
      const result = await auth.verifyLogin(data);
      res.json({ user: result.user, sessionId: result.sessionId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(400).json({ message: (error as Error).message });
      }
    }
  });

  // Login with password
  app.post("/api/auth/login/password", async (req, res) => {
    try {
      const data = loginPasswordSchema.parse(req.body);
      const result = await auth.loginWithPassword(data);
      res.json({ user: result.user, sessionId: result.sessionId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(400).json({ message: (error as Error).message });
      }
    }
  });

  // Guest login (temporary session without account)
  app.post("/api/auth/guest", async (req, res) => {
    try {
      const data = guestLoginSchema.parse(req.body);
      const sessionId = auth.generateSessionId();
      
      // Create a guest user object (not stored in database)
      const guestUser = {
        id: 0,
        firstName: data.name,
        lastName: '',
        phoneNumber: '',
        password: '',
        role: 'jedi',
        profilePicture: null,
        isVerified: false,
        createdAt: new Date(),
        isGuest: true
      };

      res.json({ user: guestUser, sessionId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(400).json({ message: (error as Error).message });
      }
    }
  });

  // Get current user
  app.get("/api/auth/user", optionalAuth, async (req: any, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Change password
  app.post("/api/auth/change-password", requireAuth, async (req: any, res) => {
    try {
      const data = changePasswordSchema.parse(req.body);
      const result = await auth.changePassword(req.user.id, data);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(400).json({ message: (error as Error).message });
      }
    }
  });

  // Send password reset code
  app.post("/api/auth/password-reset/code", async (req, res) => {
    try {
      const data = loginPhoneSchema.parse(req.body);
      const result = await auth.sendPasswordResetCode(data);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(400).json({ message: (error as Error).message });
      }
    }
  });

  // Reset password with code
  app.post("/api/auth/password-reset/verify", async (req, res) => {
    try {
      const data = resetPasswordSchema.parse(req.body);
      const result = await auth.resetPassword(data);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(400).json({ message: (error as Error).message });
      }
    }
  });

  // Logout
  app.post("/api/auth/logout", requireAuth, async (req: any, res) => {
    try {
      const result = await auth.logout(req.sessionId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  // Get user's games (all games where user participated)
  app.get("/api/auth/games", requireAuth, async (req: any, res) => {
    try {
      const allGames = await storage.getAllGames();
      const userGames = allGames.filter(game => 
        game.players.some(player => player.userId === req.user.id)
      );
      res.json(userGames);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user games" });
    }
  });

  // Get user's completed games only
  app.get("/api/auth/games/completed", requireAuth, async (req: any, res) => {
    try {
      const completedGames = await storage.getCompletedGamesByUserId(req.user.id);
      res.json(completedGames);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user completed games" });
    }
  });

  // Upload profile picture
  app.post("/api/auth/profile-picture", requireAuth, (req: any, res, next) => {
    console.log('Profile picture upload request received');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);
    
    profilePictureUpload.single('profilePicture')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ message: err.message });
      }
      
      console.log('File uploaded:', req.file ? req.file.filename : 'no file');
      console.log('Body:', req.body);
      next();
    });
  }, async (req: any, res) => {
    try {
      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log('Processing file:', req.file.path);
      
      // Process and optimize the image
      const optimizedPath = await processProfilePicture(req.file.path);
      const filename = path.basename(optimizedPath);
      const profilePictureUrl = getProfilePictureUrl(filename);

      // Update user's profile picture in database
      await storage.updateUserProfilePicture(req.user.id, profilePictureUrl);

      res.json({ 
        message: "Profile picture updated successfully",
        profilePicture: profilePictureUrl
      });
    } catch (error) {
      console.error('Profile picture upload error:', error);
      res.status(500).json({ message: "Failed to upload profile picture" });
    }
  });

  // Game Routes

  // Create a new game
  app.post("/api/games", optionalAuth, async (req: any, res) => {
    try {
      const data = createGameSchema.parse(req.body);
      const game = await storage.createGame(data, req.user?.id || null);
      res.json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create game" });
      }
    }
  });

  // Get all games (for public viewing)
  app.get("/api/games/all", async (req, res) => {
    try {
      const allGames = await storage.getAllGames();
      res.json(allGames);
    } catch (error) {
      res.status(500).json({ message: "Failed to get all games" });
    }
  });

  // Get completed games for leaderboard (must be before parameterized route)
  app.get("/api/games/completed", async (req, res) => {
    try {
      const completedGames = await storage.getCompletedGames();
      res.json(completedGames);
    } catch (error) {
      res.status(500).json({ message: "Failed to get completed games" });
    }
  });

  // Manual cleanup endpoint for expired games
  app.post("/api/games/cleanup", async (req, res) => {
    try {
      const deletedCount = await storage.deleteExpiredGames();
      res.json({ 
        message: "Cleanup completed successfully", 
        deletedGames: deletedCount 
      });
    } catch (error) {
      console.error("Manual cleanup error:", error);
      res.status(500).json({ message: "Failed to cleanup expired games" });
    }
  });

  // Delete a specific game (Admin only)
  app.delete("/api/admin/games/:gameId", requireAdmin, async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      await storage.deleteGame(gameId);
      res.json({ message: "Game deleted successfully" });
    } catch (error) {
      console.error("Delete game error:", error);
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  // Delete all games (Admin only)
  app.delete("/api/admin/games", requireAdmin, async (req, res) => {
    try {
      const deletedCount = await storage.deleteAllGames();
      res.json({ 
        message: "All games deleted successfully", 
        deletedGames: deletedCount 
      });
    } catch (error) {
      console.error("Delete all games error:", error);
      res.status(500).json({ message: "Failed to delete all games" });
    }
  });

  // Add a local player to a game (host only)
  app.post("/api/games/:gameId/players/local", requireAuth, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const { name } = addLocalPlayerSchema.parse({ gameId, ...req.body });
      
      // Verify the game exists and user is the host
      const game = await storage.getGameWithPlayers(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const hostPlayer = game.players.find(p => p.userId === req.user.id && p.isHost);
      if (!hostPlayer) {
        return res.status(403).json({ message: "Only the host can add local players" });
      }

      if (game.status !== "waiting") {
        return res.status(400).json({ message: "Can only add players in the waiting room" });
      }

      // Check if player name already exists in the game
      if (game.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        return res.status(400).json({ message: "Player name already exists in this game" });
      }

      const player = await storage.addLocalPlayerToGame(gameId, name);
      res.json(player);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Add local player error:", error);
        res.status(500).json({ message: "Failed to add local player" });
      }
    }
  });

  // Update local player name (host only)
  app.patch("/api/players/:playerId/name", requireAuth, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: "Name is required" });
      }

      // Verify the player exists and is a local player
      const player = await storage.getPlayerById(playerId);
      if (!player || !player.isLocal) {
        return res.status(404).json({ message: "Local player not found" });
      }

      // Verify the game exists and user is the host
      const game = await storage.getGameWithPlayers(player.gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const hostPlayer = game.players.find(p => p.userId === req.user.id && p.isHost);
      if (!hostPlayer) {
        return res.status(403).json({ message: "Only the host can update local player names" });
      }

      // Check if new name conflicts with existing players
      if (game.players.some(p => p.id !== playerId && p.name.toLowerCase() === name.toLowerCase())) {
        return res.status(400).json({ message: "Player name already exists in this game" });
      }

      await storage.updatePlayerName(playerId, name.trim());
      res.json({ message: "Player name updated successfully" });
    } catch (error) {
      console.error("Update player name error:", error);
      res.status(500).json({ message: "Failed to update player name" });
    }
  });

  // Update local player profile picture (host only)
  app.post("/api/players/:playerId/profile-picture", requireAuth, (req: any, res, next) => {
    profilePictureUpload.single('profilePicture')(req, res, (err) => {
      if (err) {
        console.error('Local player profile picture multer error:', err);
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      // Verify the player exists and is a local player
      const player = await storage.getPlayerById(playerId);
      if (!player || !player.isLocal) {
        return res.status(404).json({ message: "Local player not found" });
      }

      // Verify the game exists and user is the host
      const game = await storage.getGameWithPlayers(player.gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const hostPlayer = game.players.find(p => p.userId === req.user.id && p.isHost);
      if (!hostPlayer) {
        return res.status(403).json({ message: "Only the host can update local player profile pictures" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Process and optimize the image
      const optimizedPath = await processProfilePicture(req.file.path);
      const filename = path.basename(optimizedPath);
      const profilePictureUrl = getProfilePictureUrl(filename);

      // Update local player's profile picture in database
      await storage.updatePlayerProfilePicture(playerId, profilePictureUrl);

      res.json({ 
        message: "Profile picture updated successfully",
        profilePicture: profilePictureUrl
      });
    } catch (error) {
      console.error('Local player profile picture upload error:', error);
      res.status(500).json({ message: "Failed to upload profile picture" });
    }
  });

  // Remove player from game (host only)
  app.delete("/api/players/:playerId", requireAuth, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      // Get player details before removal
      const player = await storage.getPlayerById(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      // Verify the game exists and user is the host
      const game = await storage.getGameWithPlayers(player.gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const hostPlayer = game.players.find(p => p.userId === req.user.id && p.isHost);
      if (!hostPlayer) {
        return res.status(403).json({ message: "Only the host can remove players" });
      }

      if (game.status !== "waiting") {
        return res.status(400).json({ message: "Can only remove players in the waiting room" });
      }

      // Cannot remove the host
      if (player.isHost) {
        return res.status(400).json({ message: "Cannot remove the host from the game" });
      }

      await storage.removePlayerFromGame(playerId);
      res.json({ 
        message: "Player removed successfully",
        removedPlayer: player
      });
    } catch (error) {
      console.error("Remove player error:", error);
      res.status(500).json({ message: "Failed to remove player" });
    }
  });

  // Join a game
  app.post("/api/games/join", optionalAuth, async (req: any, res) => {
    try {
      const data = joinGameSchema.parse(req.body);
      
      const game = await storage.getGameByCode(data.code);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.status !== "waiting") {
        return res.status(400).json({ message: "Game has already started. Players can only join in the waiting room." });
      }

      // Check if player name already exists in the game
      const existingPlayers = await storage.getPlayersInGame(game.id);
      if (existingPlayers.some(p => p.name.toLowerCase() === data.name.toLowerCase())) {
        return res.status(400).json({ message: "Player name already exists in this game" });
      }

      const player = await storage.addPlayerToGame({
        gameId: game.id,
        name: data.name,
        userId: req.user?.id || null, // Include userId if authenticated
        isHost: false,
      });

      res.json({ game, player });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to join game" });
      }
    }
  });

  // Get game details with players and scores
  app.get("/api/games/:gameId", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const gameWithPlayers = await storage.getGameWithPlayers(gameId);
      if (!gameWithPlayers) {
        return res.status(404).json({ message: "Game not found" });
      }

      res.json(gameWithPlayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get game details" });
    }
  });

  // Enter/update score for a hole
  app.post("/api/scores", async (req, res) => {
    try {
      const data = enterScoreSchema.parse(req.body);
      
      // Verify player exists and is in the game
      const player = await storage.getPlayerById(data.playerId);
      if (!player || player.gameId !== data.gameId) {
        return res.status(404).json({ message: "Player not found in this game" });
      }

      // Verify game exists and hole is valid
      const game = await storage.getGameWithPlayers(data.gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const courseConfig = COURSE_CONFIG[game.courseType as keyof typeof COURSE_CONFIG];
      if (data.hole < 1 || data.hole > courseConfig.holes) {
        return res.status(400).json({ message: "Invalid hole number" });
      }

      const score = await storage.enterScore(data);
      res.json(score);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to enter score" });
      }
    }
  });

  // Confirm score
  app.patch("/api/scores/:scoreId/confirm", async (req, res) => {
    try {
      const scoreId = parseInt(req.params.scoreId);
      if (isNaN(scoreId)) {
        return res.status(400).json({ message: "Invalid score ID" });
      }

      await storage.confirmScore(scoreId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to confirm score" });
    }
  });

  // Advance to next hole (if all players have confirmed current hole)
  app.post("/api/games/:gameId/next-hole", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const gameWithPlayers = await storage.getGameWithPlayers(gameId);
      if (!gameWithPlayers) {
        return res.status(404).json({ message: "Game not found" });
      }

      const currentHole = gameWithPlayers.currentHole;
      const players = gameWithPlayers.players;
      const scores = gameWithPlayers.scores;

      // Check if all players have entered scores for current hole
      const currentHoleScores = scores.filter(s => s.hole === currentHole);
      const playersWithScores = currentHoleScores.length;

      if (playersWithScores !== players.length) {
        return res.status(400).json({ 
          message: "All players must enter their scores before advancing" 
        });
      }

      const courseConfig = COURSE_CONFIG[gameWithPlayers.courseType as keyof typeof COURSE_CONFIG];
      const nextHole = currentHole + 1;

      if (nextHole > courseConfig.holes) {
        // Game completed
        await storage.updateGameStatus(gameId, "completed");
        res.json({ gameCompleted: true });
      } else {
        // Advance to next hole
        await storage.updateGameHole(gameId, nextHole);
        await storage.updateGameStatus(gameId, "playing");
        res.json({ nextHole });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to advance to next hole" });
    }
  });



  // Get leaderboard for a game
  app.get("/api/games/:gameId/leaderboard", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const gameWithPlayers = await storage.getGameWithPlayers(gameId);
      if (!gameWithPlayers) {
        return res.status(404).json({ message: "Game not found" });
      }

      const courseConfig = COURSE_CONFIG[gameWithPlayers.courseType as keyof typeof COURSE_CONFIG];
      
      // Calculate leaderboard
      const leaderboard = gameWithPlayers.players.map(player => {
        const playerScores = gameWithPlayers.scores.filter(s => s.playerId === player.id);
        const totalStrokes = playerScores.reduce((sum, score) => sum + score.strokes, 0);
        const holesCompleted = playerScores.length;
        
        // Calculate score relative to par
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
      });

      // Sort by relative to par (ascending), then by total strokes
      leaderboard.sort((a, b) => {
        if (a.relativeToPar === b.relativeToPar) {
          return a.totalStrokes - b.totalStrokes;
        }
        return a.relativeToPar - b.relativeToPar;
      });

      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  // Cancel game (host only) - for waiting room and active games
  app.delete("/api/games/:gameId/cancel", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const game = await storage.getGameWithPlayers(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Allow canceling games in waiting or playing status (not completed)
      if (game.status === "completed") {
        return res.status(400).json({ message: "Cannot cancel completed games" });
      }

      // Delete the game and all associated data
      await storage.deleteGame(gameId);
      
      res.json({ message: "Game cancelled successfully" });
    } catch (error) {
      console.error("Cancel game error:", error);
      res.status(500).json({ message: "Failed to cancel game" });
    }
  });

  // Start game (host only)
  app.patch("/api/games/:gameId/start", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const gameWithPlayers = await storage.getGameWithPlayers(gameId);
      if (!gameWithPlayers) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (gameWithPlayers.status !== "waiting") {
        return res.status(400).json({ message: "Game has already started" });
      }

      // Update game status to playing
      await storage.updateGameStatus(gameId, "playing");
      res.json({ success: true, message: "Game started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start game" });
    }
  });

  // Get course configuration
  app.get("/api/course/:courseType", async (req, res) => {
    try {
      const courseType = req.params.courseType as keyof typeof COURSE_CONFIG;
      const config = COURSE_CONFIG[courseType];
      
      if (!config) {
        return res.status(404).json({ message: "Course type not found" });
      }

      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Failed to get course configuration" });
    }
  });

  // Photo upload route
  app.post("/api/photos/upload", photoUpload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No photo file provided" });
      }

      const { gameId, playerId, hole } = req.body;
      
      // Validate required fields
      const parsedGameId = parseInt(gameId);
      const parsedPlayerId = parseInt(playerId);
      const parsedHole = hole ? parseInt(hole) : null;
      
      if (isNaN(parsedGameId) || isNaN(parsedPlayerId)) {
        return res.status(400).json({ message: "Invalid gameId or playerId" });
      }

      // Verify player exists and is in the game
      const player = await storage.getPlayerById(parsedPlayerId);
      if (!player || player.gameId !== parsedGameId) {
        return res.status(404).json({ message: "Player not found in this game" });
      }

      // Create photo record
      const photo = await storage.createPhoto({
        gameId: parsedGameId,
        playerId: parsedPlayerId,
        hole: parsedHole,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      res.json(photo);
    } catch (error) {
      console.error("Photo upload error:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // Get all photos
  app.get("/api/photos", async (req, res) => {
    try {
      const photos = await storage.getAllPhotos();
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: "Failed to get photos" });
    }
  });

  // Get photos for a specific game
  app.get("/api/photos/game/:gameId", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const photos = await storage.getPhotosForGame(gameId);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: "Failed to get game photos" });
    }
  });

  // Delete photo
  app.delete("/api/photos/:photoId", async (req, res) => {
    try {
      const photoId = parseInt(req.params.photoId);
      if (isNaN(photoId)) {
        return res.status(400).json({ message: "Invalid photo ID" });
      }

      await storage.deletePhoto(photoId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // Process satellite image
  app.post("/api/process-satellite", async (req, res) => {
    try {
      const { googleDriveUrl } = req.body;
      if (!googleDriveUrl) {
        return res.status(400).json({ error: "Google Drive URL is required" });
      }

      const { processSatelliteImage } = await import("./image-processor.js");
      const imagePath = await processSatelliteImage(googleDriveUrl);
      
      res.json({ 
        success: true, 
        imagePath,
        message: "Satellite image processed successfully" 
      });
    } catch (error) {
      console.error("Error processing satellite image:", error);
      res.status(500).json({ 
        error: "Failed to process satellite image",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get hole coordinates
  app.get("/api/course/holes", async (req, res) => {
    try {
      const { HOLE_COORDINATES } = await import("./image-processor.js");
      res.json(HOLE_COORDINATES);
    } catch (error) {
      console.error('Failed to get hole coordinates:', error);
      res.status(500).json({ message: "Failed to get hole coordinates" });
    }
  });

  // Save hole coordinates
  app.post("/api/course/holes", (req, res) => {
    try {
      // In a real app, save to database
      // For now, update the in-memory coordinates
      const newCoordinates = req.body;
      
      // Update the image processor coordinates
      const imageProcessor = require("./image-processor");
      imageProcessor.HOLE_COORDINATES = newCoordinates;
      
      res.json({ success: true, message: "Hole coordinates updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save hole coordinates" });
    }
  });

  // Upload satellite image
  app.post("/api/upload-satellite", async (req, res) => {
    try {
      const { upload, processSatelliteImageUpload, setSatelliteImagePaths } = await import("./upload-handler.js");
      
      upload.single('satelliteImage')(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({ 
            error: "Upload failed", 
            details: err.message 
          });
        }

        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        try {
          const paths = await processSatelliteImageUpload(req.file.path);
          setSatelliteImagePaths(paths);
          
          res.json({
            success: true,
            message: "Satellite image uploaded and processed successfully",
            ...paths
          });
        } catch (processError) {
          res.status(500).json({
            error: "Failed to process image",
            details: processError instanceof Error ? processError.message : "Unknown error"
          });
        }
      });
    } catch (error) {
      res.status(500).json({ 
        error: "Upload handler not available",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get current satellite image paths
  app.get("/api/satellite-image", async (req, res) => {
    try {
      const { getSatelliteImagePaths, detectExistingSatelliteImages } = await import("./upload-handler.js");
      
      // Force detection of existing files
      const detectedPaths = detectExistingSatelliteImages();
      console.log('Detected satellite paths:', detectedPaths);
      
      const paths = getSatelliteImagePaths();
      
      if (paths) {
        res.json(paths);
      } else {
        res.status(404).json({ message: "No satellite image uploaded" });
      }
    } catch (error) {
      console.error('Satellite image API error:', error);
      res.status(500).json({ message: "Failed to get satellite image paths" });
    }
  });

  // Weather API endpoint
  app.get("/api/weather", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Weather API key not configured" });
      }

      console.log(`Making weather API call for coordinates: ${lat}, ${lon}`);
      
      // Get current weather
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
      const currentResponse = await fetch(currentUrl);
      
      if (!currentResponse.ok) {
        const errorText = await currentResponse.text();
        console.error(`Current weather API error: ${currentResponse.status} - ${errorText}`);
        throw new Error(`Current weather API error: ${currentResponse.status}`);
      }

      // Get forecast data
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
      const forecastResponse = await fetch(forecastUrl);
      
      if (!forecastResponse.ok) {
        const errorText = await forecastResponse.text();
        console.error(`Forecast API error: ${forecastResponse.status} - ${errorText}`);
        throw new Error(`Forecast API error: ${forecastResponse.status}`);
      }

      const currentWeather = await currentResponse.json();
      const forecastData = await forecastResponse.json();

      // Get UV Index from UV Index API and calculate current value based on solar position
      let uvIndex = 0;
      
      try {
        const uvUrl = `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`;
        const uvResponse = await fetch(uvUrl);
        
        if (uvResponse.ok) {
          const uvData = await uvResponse.json();
          const peakUV = uvData.value || 0;
          
          // Calculate current UV based on solar position
          const now = Date.now() / 1000;
          const sunrise = currentWeather.sys.sunrise;
          const sunset = currentWeather.sys.sunset;
          
          // Calculate solar noon (midpoint between sunrise and sunset)
          const solarNoon = (sunrise + sunset) / 2;
          
          // If it's night time, UV is 0
          if (now < sunrise || now > sunset) {
            uvIndex = 0;
          } else {
            // Calculate UV based on solar elevation angle approximation
            const dayLength = sunset - sunrise;
            const timeFromNoon = Math.abs(now - solarNoon);
            const maxTimeFromNoon = dayLength / 2;
            
            // Use cosine function to approximate solar elevation
            const solarElevationFactor = Math.cos((timeFromNoon / maxTimeFromNoon) * (Math.PI / 2));
            
            // Apply solar elevation factor to peak UV, with minimum threshold
            uvIndex = Math.max(0, peakUV * Math.pow(solarElevationFactor, 2));
            uvIndex = Math.round(uvIndex * 10) / 10; // Round to 1 decimal place
          }
          
          console.log(`Peak UV: ${peakUV}, Current UV: ${uvIndex} (Solar noon: ${new Date(solarNoon * 1000).toLocaleTimeString()})`);
        } else {
          console.log(`UV Index API not available (${uvResponse.status}), UV Index will be 0`);
        }
      } catch (error) {
        console.warn("UV Index API error:", error);
        uvIndex = 0;
      }
      
      // Transform the data to match our expected format
      const transformedData = {
        current: {
          temp: currentWeather.main.temp,
          feels_like: currentWeather.main.feels_like,
          humidity: currentWeather.main.humidity,
          uvi: uvIndex, // Real UV index from UV API
          visibility: currentWeather.visibility,
          wind_speed: currentWeather.wind.speed,
          wind_deg: currentWeather.wind.deg,
          sunrise: currentWeather.sys.sunrise,
          sunset: currentWeather.sys.sunset,
          weather: currentWeather.weather
        },
        hourly: forecastData.list.slice(0, 12).map((item: any) => ({
          dt: item.dt,
          temp: item.main.temp,
          feels_like: item.main.feels_like,
          humidity: item.main.humidity,
          pop: item.pop || 0,
          wind_speed: item.wind?.speed || 0,
          wind_deg: item.wind?.deg || 0,
          weather: item.weather
        })),
        daily: forecastData.list.filter((_: any, index: number) => index % 8 === 0).slice(0, 3).map((item: any) => ({
          dt: item.dt,
          temp: {
            day: item.main.temp,
            min: item.main.temp_min,
            max: item.main.temp_max
          },
          pop: item.pop || 0,
          uvi: uvIndex, // Use current UV index for daily forecast (best we can do with free tier)
          weather: item.weather
        })),
        location: {
          name: "Blanco",
          country: "TX",
          lat: lat,
          lon: lon
        }
      };

      console.log("Weather data fetched successfully");
      res.json(transformedData);
    } catch (error) {
      console.error("Weather API error:", error);
      res.status(500).json({ 
        error: "Failed to fetch weather data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Admin Routes
  
  // Get admin statistics
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allGames = await storage.getAllGames();
      const allPhotos = await storage.getAllPhotos();
      
      const activeGames = allGames.filter((game: any) => game.status === 'active').length;
      
      const stats = {
        totalUsers: allUsers.length,
        activeGames: activeGames,
        totalGames: allGames.length,
        totalPhotos: allPhotos.length
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Failed to get admin statistics" });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Get all games (admin only)
  app.get("/api/admin/games", requireAdmin, async (req, res) => {
    try {
      const games = await storage.getAllGames();
      res.json(games);
    } catch (error) {
      console.error("Admin games error:", error);
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  // Admin profile picture management
  app.post("/api/admin/users/:userId/profile-picture", requireAdmin, (req: any, res, next) => {
    profilePictureUpload.single('profilePicture')(req, res, (err) => {
      if (err) {
        console.error('Admin profile picture multer error:', err);
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Process and optimize the image
      const optimizedPath = await processProfilePicture(req.file.path);
      const filename = path.basename(optimizedPath);
      const profilePictureUrl = getProfilePictureUrl(filename);

      // Update user's profile picture in database
      await storage.updateUserProfilePicture(userId, profilePictureUrl);

      res.json({ 
        message: "Profile picture updated successfully",
        profilePicture: profilePictureUrl
      });
    } catch (error) {
      console.error('Admin profile picture upload error:', error);
      res.status(500).json({ message: "Failed to upload profile picture" });
    }
  });

  app.delete("/api/admin/users/:userId/profile-picture", requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Get current user to find their profile picture file
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete file if it exists
      if (user.profilePicture) {
        const filename = user.profilePicture.replace('/uploads/profiles/', '');
        const filePath = path.join(process.cwd(), 'uploads', 'profiles', filename);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Remove profile picture from database
      await storage.updateUserProfilePicture(userId, null);

      res.json({ message: "Profile picture deleted successfully" });
    } catch (error) {
      console.error('Admin profile picture delete error:', error);
      res.status(500).json({ message: "Failed to delete profile picture" });
    }
  });

  // Update user role (Emperor only)
  app.patch("/api/admin/users/:userId/role", requireEmperor, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { role } = req.body;

      if (!userId || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Validate role
      if (!role || !['jedi', 'jedi_master'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'jedi' or 'jedi_master'" });
      }

      // Get target user
      const targetUser = await storage.getUserById(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent changing emperor role
      if (targetUser.role === 'emperor') {
        return res.status(403).json({ message: "Cannot change Emperor role" });
      }

      // Update role
      await storage.updateUserRole(userId, role);

      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error('User role update error:', error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Delete user (Emperor only)
  app.delete("/api/admin/users/:userId", requireEmperor, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Get target user
      const targetUser = await storage.getUserById(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deleting emperor
      if (targetUser.role === 'emperor') {
        return res.status(403).json({ message: "Cannot delete Emperor" });
      }

      // Prevent self-deletion
      if (targetUser.id === req.user.id) {
        return res.status(403).json({ message: "Cannot delete yourself" });
      }

      // Delete user and all associated data
      await storage.deleteUser(userId);

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error('User deletion error:', error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // === Course Tour Video Management Routes ===

  // Upload course tour video (Emperor only)
  app.post("/api/admin/course-tour-video", requireEmperor, videoUpload.single('video'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No video file uploaded" });
      }

      // Create video record
      const video = await storage.createCourseTourVideo({
        fileName: req.file.filename,
        filePath: req.file.path,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        uploadedBy: req.user.id,
      });

      res.json(video);
    } catch (error: any) {
      console.error("Video upload error:", error);
      if (error?.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ message: "Only MP4 files are allowed" });
      }
      if (error?.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: "File size exceeds 5GB limit" });
      }
      res.status(500).json({ message: "Failed to upload video" });
    }
  });

  // Get all course tour videos (Admin only)
  app.get("/api/admin/course-tour-videos", requireAdmin, async (req, res) => {
    try {
      const videos = await storage.getAllCourseTourVideos();
      res.json(videos);
    } catch (error) {
      console.error("Get videos error:", error);
      res.status(500).json({ message: "Failed to get videos" });
    }
  });

  // Get active course tour video (public)
  app.get("/api/course-tour-video", async (req, res) => {
    try {
      const video = await storage.getActiveCourseTourVideo();
      if (video) {
        res.json({
          id: video.id,
          fileName: video.fileName,
          originalName: video.originalName,
          videoUrl: getVideoUrl(video.fileName),
          createdAt: video.createdAt,
        });
      } else {
        res.status(404).json({ message: "No active course tour video found" });
      }
    } catch (error) {
      console.error("Get active video error:", error);
      res.status(500).json({ message: "Failed to get active video" });
    }
  });

  // Set active course tour video (Emperor only)
  app.patch("/api/admin/course-tour-video/:videoId/activate", requireEmperor, async (req: any, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      if (isNaN(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
      }

      await storage.setActiveCourseTourVideo(videoId);
      res.json({ message: "Video activated successfully" });
    } catch (error) {
      console.error("Activate video error:", error);
      res.status(500).json({ message: "Failed to activate video" });
    }
  });

  // Delete course tour video (Emperor only)
  app.delete("/api/admin/course-tour-video/:videoId", requireEmperor, async (req: any, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      if (isNaN(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
      }

      // Get video info before deletion
      const videos = await storage.getAllCourseTourVideos();
      const video = videos.find(v => v.id === videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      // Check if this is the only video and it's active
      const activeVideo = await storage.getActiveCourseTourVideo();
      if (activeVideo && activeVideo.id === videoId && videos.length === 1) {
        return res.status(400).json({ message: "Cannot delete the only active video. Upload a replacement first." });
      }

      // Delete from database
      await storage.deleteCourseTourVideo(videoId);
      
      // Delete file from filesystem
      deleteVideoFile(video.filePath);

      res.json({ message: "Video deleted successfully" });
    } catch (error) {
      console.error("Delete video error:", error);
      res.status(500).json({ message: "Failed to delete video" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
