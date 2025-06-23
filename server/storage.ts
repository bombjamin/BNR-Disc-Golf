import { 
  users,
  verificationCodes,
  userSessions,
  games, 
  players, 
  scores, 
  photos,
  courseTourVideos,
  type User,
  type VerificationCode,
  type UserSession,
  type Game, 
  type Player, 
  type Score, 
  type Photo,
  type CourseTourVideo,
  type InsertUser,
  type InsertVerificationCode,
  type InsertGame, 
  type InsertPlayer, 
  type InsertScore,
  type InsertPhoto,
  type InsertCourseTourVideo,
  type GameWithPlayers,
  type RegisterUser,
  type CreateGame,
  type JoinGame,
  type EnterScore
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, gt, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  createUser(data: InsertUser): Promise<User>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  getUserById(userId: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;
  updateUserProfilePicture(userId: number, profilePicture: string | null): Promise<void>;
  updateUserRole(userId: number, role: string): Promise<void>;
  deleteUser(userId: number): Promise<void>;
  
  // Verification code operations
  createVerificationCode(data: InsertVerificationCode): Promise<VerificationCode>;
  getValidVerificationCode(phoneNumber: string, code: string, type: string): Promise<VerificationCode | undefined>;
  markVerificationCodeUsed(codeId: number): Promise<void>;
  cleanupExpiredCodes(): Promise<void>;
  
  // Session operations
  createSession(userId: number, sessionId: string, expiresAt: Date): Promise<UserSession>;
  getSessionById(sessionId: string): Promise<UserSession | undefined>;
  deleteSession(sessionId: string): Promise<void>;
  deleteUserSessions(userId: number): Promise<void>;
  
  // Game operations
  createGame(data: CreateGame, hostUserId?: number | null): Promise<Game>;
  getGameByCode(code: string): Promise<Game | undefined>;
  getGameWithPlayers(gameId: number): Promise<GameWithPlayers | undefined>;
  getAllGames(): Promise<GameWithPlayers[]>;
  getCompletedGames(): Promise<GameWithPlayers[]>;
  getCompletedGamesByUserId(userId: number): Promise<GameWithPlayers[]>;
  updateGameHole(gameId: number, hole: number): Promise<void>;
  updateGameStatus(gameId: number, status: string): Promise<void>;
  
  // Player operations
  addPlayerToGame(data: InsertPlayer): Promise<Player>;
  addLocalPlayerToGame(gameId: number, name: string): Promise<Player>;
  updatePlayerName(playerId: number, name: string): Promise<void>;
  updatePlayerProfilePicture(playerId: number, profilePicture: string | null): Promise<void>;
  removePlayerFromGame(playerId: number): Promise<void>;
  getPlayersInGame(gameId: number): Promise<Player[]>;
  getPlayerById(playerId: number): Promise<Player | undefined>;
  
  // Score operations
  enterScore(data: InsertScore): Promise<Score>;
  confirmScore(scoreId: number): Promise<void>;
  getScoresForGame(gameId: number): Promise<Score[]>;
  getScoresForPlayer(playerId: number): Promise<Score[]>;
  getScoreForPlayerHole(playerId: number, hole: number): Promise<Score | undefined>;
  
  // Photo operations
  createPhoto(data: InsertPhoto): Promise<Photo>;
  getPhotosForGame(gameId: number): Promise<Photo[]>;
  getAllPhotos(): Promise<Photo[]>;
  deletePhoto(photoId: number): Promise<void>;
  
  // Course tour video operations
  createCourseTourVideo(data: InsertCourseTourVideo): Promise<CourseTourVideo>;
  getActiveCourseTourVideo(): Promise<CourseTourVideo | undefined>;
  getAllCourseTourVideos(): Promise<CourseTourVideo[]>;
  setActiveCourseTourVideo(videoId: number): Promise<void>;
  deleteCourseTourVideo(videoId: number): Promise<void>;
  
  // Utility
  generateGameCode(): string;
  deleteExpiredGames(): Promise<number>;
  deleteGame(gameId: number): Promise<void>;
  deleteAllGames(): Promise<number>;
}



export class DatabaseStorage implements IStorage {
  // User operations
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user || undefined;
  }

  async getUserById(userId: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }

  async updateUserProfilePicture(userId: number, profilePicture: string | null): Promise<void> {
    await db.update(users).set({ profilePicture }).where(eq(users.id, userId));
  }

  async updateUserRole(userId: number, role: string): Promise<void> {
    await db.update(users).set({ role }).where(eq(users.id, userId));
  }

  async deleteUser(userId: number): Promise<void> {
    // Delete in order to maintain referential integrity
    // First delete all photos by this user
    await db.delete(photos).where(eq(photos.playerId, userId));
    
    // Delete all scores by this user
    await db.delete(scores).where(eq(scores.playerId, userId));
    
    // Delete all players records for this user
    await db.delete(players).where(eq(players.userId, userId));
    
    // Delete all verification codes for this user
    const user = await this.getUserById(userId);
    if (user) {
      await db.delete(verificationCodes).where(eq(verificationCodes.phoneNumber, user.phoneNumber));
    }
    
    // Delete all sessions for this user
    await db.delete(userSessions).where(eq(userSessions.userId, userId));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  // Verification code operations
  async createVerificationCode(data: InsertVerificationCode): Promise<VerificationCode> {
    const [code] = await db.insert(verificationCodes).values(data).returning();
    return code;
  }

  async getValidVerificationCode(phoneNumber: string, code: string, type: string): Promise<VerificationCode | undefined> {
    const [verificationCode] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.phoneNumber, phoneNumber),
          eq(verificationCodes.code, code),
          eq(verificationCodes.type, type),
          eq(verificationCodes.used, false),
          sql`expires_at > NOW()`
        )
      )
      .orderBy(desc(verificationCodes.createdAt));
    return verificationCode || undefined;
  }

  async markVerificationCodeUsed(codeId: number): Promise<void> {
    await db.update(verificationCodes).set({ used: true }).where(eq(verificationCodes.id, codeId));
  }

  async cleanupExpiredCodes(): Promise<void> {
    await db.delete(verificationCodes).where(sql`expires_at < NOW()`);
  }

  // Session operations
  async createSession(userId: number, sessionId: string, expiresAt: Date): Promise<UserSession> {
    const [session] = await db
      .insert(userSessions)
      .values({ id: sessionId, userId, expiresAt })
      .returning();
    return session;
  }

  async getSessionById(sessionId: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.id, sessionId));
    return session || undefined;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.id, sessionId));
  }

  async deleteUserSessions(userId: number): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.userId, userId));
  }

  generateGameCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createGame(data: CreateGame, hostUserId?: number | null): Promise<Game> {
    let code = this.generateGameCode();
    
    // Ensure unique code
    let existingGame = await db.select().from(games).where(eq(games.code, code)).limit(1);
    while (existingGame.length > 0) {
      code = this.generateGameCode();
      existingGame = await db.select().from(games).where(eq(games.code, code)).limit(1);
    }

    const [game] = await db
      .insert(games)
      .values({
        code,
        hostName: data.hostName,
        courseType: data.courseType,
        currentHole: 1,
        status: "waiting",
      })
      .returning();
    
    // Add host as first player
    await this.addPlayerToGame({
      gameId: game.id,
      name: data.hostName,
      userId: hostUserId || null,
      isHost: true,
    });

    return game;
  }

  async getGameByCode(code: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.code, code)).limit(1);
    return game || undefined;
  }

  async getGameWithPlayers(gameId: number): Promise<GameWithPlayers | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
    if (!game) return undefined;

    // Get players with their profile pictures
    const playersQuery = await db
      .select({
        id: players.id,
        gameId: players.gameId,
        name: players.name,
        userId: players.userId,
        isHost: players.isHost,
        isLocal: players.isLocal,
        joinedAt: players.joinedAt,
        profilePicture: users.profilePicture,
        localProfilePicture: players.profilePicture,
      })
      .from(players)
      .leftJoin(users, eq(players.userId, users.id))
      .where(eq(players.gameId, gameId));

    // Convert null to undefined for profilePicture and use local profile picture for local players
    const playersWithPictures: Player[] = playersQuery.map(player => ({
      id: player.id,
      gameId: player.gameId,
      name: player.name,
      userId: player.userId,
      isHost: player.isHost,
      isLocal: player.isLocal,
      joinedAt: player.joinedAt,
      profilePicture: player.isLocal 
        ? player.localProfilePicture || null
        : player.profilePicture || null,
    }));

    const gameScores = await db.select().from(scores).where(eq(scores.gameId, gameId));
    const gamePhotos = await db.select().from(photos).where(eq(photos.gameId, gameId));

    return {
      ...game,
      players: playersWithPictures,
      scores: gameScores,
      photos: gamePhotos,
    };
  }

  async getAllGames(): Promise<GameWithPlayers[]> {
    const allGames = await db.select().from(games).orderBy(desc(games.createdAt));
    
    const gamesWithData = await Promise.all(
      allGames.map(async (game) => {
        // Get players with their profile pictures
        const playersQuery = await db
          .select({
            id: players.id,
            gameId: players.gameId,
            name: players.name,
            userId: players.userId,
            isHost: players.isHost,
            joinedAt: players.joinedAt,
            profilePicture: users.profilePicture,
          })
          .from(players)
          .leftJoin(users, eq(players.userId, users.id))
          .where(eq(players.gameId, game.id));

        // Add isLocal field and fix profilePicture type
        const playersWithPictures: Player[] = playersQuery.map(player => ({
          ...player,
          profilePicture: player.profilePicture || null,
          isLocal: player.userId === null,
        }));

        const gameScores = await db.select().from(scores).where(eq(scores.gameId, game.id));
        const gamePhotos = await db.select().from(photos).where(eq(photos.gameId, game.id));
        
        return {
          ...game,
          players: playersWithPictures,
          scores: gameScores,
          photos: gamePhotos,
        };
      })
    );

    return gamesWithData;
  }

  async getCompletedGames(): Promise<GameWithPlayers[]> {
    const completedGames = await db.select().from(games).where(eq(games.status, "completed"));
    
    const gamesWithData = await Promise.all(
      completedGames.map(async (game) => {
        // Get players with their profile pictures
        const playersQuery = await db
          .select({
            id: players.id,
            gameId: players.gameId,
            name: players.name,
            userId: players.userId,
            isHost: players.isHost,
            joinedAt: players.joinedAt,
            profilePicture: users.profilePicture,
          })
          .from(players)
          .leftJoin(users, eq(players.userId, users.id))
          .where(eq(players.gameId, game.id));

        // Add isLocal field and fix profilePicture type
        const playersWithPictures: Player[] = playersQuery.map(player => ({
          ...player,
          profilePicture: player.profilePicture || null,
          isLocal: player.userId === null,
        }));

        const gameScores = await db.select().from(scores).where(eq(scores.gameId, game.id));
        const gamePhotos = await db.select().from(photos).where(eq(photos.gameId, game.id));
        
        return {
          ...game,
          players: playersWithPictures,
          scores: gameScores,
          photos: gamePhotos,
        };
      })
    );

    // Sort by creation date, most recent first
    return gamesWithData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getCompletedGamesByUserId(userId: number): Promise<GameWithPlayers[]> {
    const userPlayerGames = await db
      .select({ gameId: players.gameId })
      .from(players)
      .where(eq(players.userId, userId));
    
    const gameIds = userPlayerGames.map(p => p.gameId);
    if (gameIds.length === 0) return [];

    const completedGames = await db
      .select()
      .from(games)
      .where(and(eq(games.status, "completed")));
    
    const userCompletedGames = completedGames.filter(game => gameIds.includes(game.id));
    
    const gamesWithData = await Promise.all(
      userCompletedGames.map(async (game) => {
        // Get players with their profile pictures
        const playersQuery = await db
          .select({
            id: players.id,
            gameId: players.gameId,
            name: players.name,
            userId: players.userId,
            isHost: players.isHost,
            joinedAt: players.joinedAt,
            profilePicture: users.profilePicture,
          })
          .from(players)
          .leftJoin(users, eq(players.userId, users.id))
          .where(eq(players.gameId, game.id));

        // Add isLocal field and fix profilePicture type
        const playersWithPictures: Player[] = playersQuery.map(player => ({
          ...player,
          profilePicture: player.profilePicture || null,
          isLocal: player.userId === null,
        }));

        const gameScores = await db.select().from(scores).where(eq(scores.gameId, game.id));
        const gamePhotos = await db.select().from(photos).where(eq(photos.gameId, game.id));
        
        return {
          ...game,
          players: playersWithPictures,
          scores: gameScores,
          photos: gamePhotos,
        };
      })
    );

    // Sort by creation date, most recent first
    return gamesWithData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateGameHole(gameId: number, hole: number): Promise<void> {
    await db.update(games).set({ currentHole: hole }).where(eq(games.id, gameId));
  }

  async updateGameStatus(gameId: number, status: string): Promise<void> {
    await db.update(games).set({ status }).where(eq(games.id, gameId));
  }

  async addPlayerToGame(data: InsertPlayer): Promise<Player> {
    const [player] = await db
      .insert(players)
      .values({
        gameId: data.gameId,
        name: data.name,
        userId: data.userId || null,
        isHost: data.isHost ?? false,
        isLocal: data.isLocal ?? false,
        profilePicture: data.profilePicture || null,
      })
      .returning();

    return player;
  }

  async addLocalPlayerToGame(gameId: number, name: string): Promise<Player> {
    const [player] = await db
      .insert(players)
      .values({
        gameId,
        name,
        userId: null,
        isHost: false,
        isLocal: true,
        profilePicture: null,
      })
      .returning();

    return player;
  }

  async updatePlayerName(playerId: number, name: string): Promise<void> {
    await db
      .update(players)
      .set({ name })
      .where(eq(players.id, playerId));
  }

  async updatePlayerProfilePicture(playerId: number, profilePicture: string | null): Promise<void> {
    await db
      .update(players)
      .set({ profilePicture })
      .where(eq(players.id, playerId));
  }

  async removePlayerFromGame(playerId: number): Promise<void> {
    // First remove all scores for this player
    await db.delete(scores).where(eq(scores.playerId, playerId));
    // Then remove the player
    await db.delete(players).where(eq(players.id, playerId));
  }

  async getPlayersInGame(gameId: number): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.gameId, gameId));
  }

  async getPlayerById(playerId: number): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
    return player || undefined;
  }

  async enterScore(data: InsertScore): Promise<Score> {
    // Check if score already exists for this player and hole
    const existingScores = await db
      .select()
      .from(scores)
      .where(and(eq(scores.playerId, data.playerId), eq(scores.hole, data.hole)))
      .limit(1);
    
    const existingScore = existingScores[0];

    if (existingScore) {
      // Update existing score and automatically confirm it
      const [updatedScore] = await db
        .update(scores)
        .set({ 
          strokes: data.strokes, 
          confirmed: true,
        })
        .where(eq(scores.id, existingScore.id))
        .returning();
      return updatedScore;
    } else {
      // Create new score and automatically confirm it
      const [score] = await db
        .insert(scores)
        .values({
          gameId: data.gameId,
          playerId: data.playerId,
          hole: data.hole,
          strokes: data.strokes,
          confirmed: true,
        })
        .returning();

      return score;
    }
  }

  async confirmScore(scoreId: number): Promise<void> {
    await db.update(scores).set({ confirmed: true }).where(eq(scores.id, scoreId));
  }

  async getScoresForGame(gameId: number): Promise<Score[]> {
    return await db.select().from(scores).where(eq(scores.gameId, gameId));
  }

  async getScoresForPlayer(playerId: number): Promise<Score[]> {
    return await db.select().from(scores).where(eq(scores.playerId, playerId));
  }

  async getScoreForPlayerHole(playerId: number, hole: number): Promise<Score | undefined> {
    const scoreResults = await db
      .select()
      .from(scores)
      .where(and(eq(scores.playerId, playerId), eq(scores.hole, hole)))
      .limit(1);
    return scoreResults[0] || undefined;
  }

  // Photo operations
  async createPhoto(data: InsertPhoto): Promise<Photo> {
    const [photo] = await db.insert(photos).values(data).returning();
    return photo;
  }

  async getPhotosForGame(gameId: number): Promise<Photo[]> {
    return await db.select().from(photos).where(eq(photos.gameId, gameId)).orderBy(desc(photos.createdAt));
  }

  async getAllPhotos(): Promise<Photo[]> {
    return await db.select().from(photos).orderBy(desc(photos.createdAt));
  }

  async deletePhoto(photoId: number): Promise<void> {
    await db.delete(photos).where(eq(photos.id, photoId));
  }

  async deleteExpiredGames(): Promise<number> {
    // Calculate cutoff time (5 hours ago)
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
    
    // Find expired games (not completed and older than 5 hours)
    const expiredGames = await db
      .select({ id: games.id })
      .from(games)
      .where(
        and(
          lt(games.createdAt, fiveHoursAgo),
          sql`${games.status} != 'completed'`
        )
      );

    if (expiredGames.length === 0) {
      return 0;
    }

    const expiredGameIds = expiredGames.map(g => g.id);

    // Delete related data first (due to foreign key constraints)
    for (const gameId of expiredGameIds) {
      await db.delete(photos).where(eq(photos.gameId, gameId));
      await db.delete(scores).where(eq(scores.gameId, gameId));
      await db.delete(players).where(eq(players.gameId, gameId));
      await db.delete(games).where(eq(games.id, gameId));
    }

    return expiredGameIds.length;
  }

  async deleteGame(gameId: number): Promise<void> {
    // Delete related data first (due to foreign key constraints)
    await db.delete(photos).where(eq(photos.gameId, gameId));
    await db.delete(scores).where(eq(scores.gameId, gameId));
    await db.delete(players).where(eq(players.gameId, gameId));
    await db.delete(games).where(eq(games.id, gameId));
  }

  async deleteAllGames(): Promise<number> {
    // Get all game IDs first
    const allGames = await db.select({ id: games.id }).from(games);
    const gameIds = allGames.map(g => g.id);

    if (gameIds.length === 0) {
      return 0;
    }

    // Delete related data first (due to foreign key constraints)
    await db.delete(photos);
    await db.delete(scores);
    await db.delete(players);
    await db.delete(games);

    return gameIds.length;
  }

  // Course tour video operations
  async createCourseTourVideo(data: InsertCourseTourVideo): Promise<CourseTourVideo> {
    const [video] = await db
      .insert(courseTourVideos)
      .values(data)
      .returning();
    return video;
  }

  async getActiveCourseTourVideo(): Promise<CourseTourVideo | undefined> {
    const [video] = await db
      .select()
      .from(courseTourVideos)
      .where(eq(courseTourVideos.isActive, true))
      .orderBy(desc(courseTourVideos.createdAt))
      .limit(1);
    return video;
  }

  async getAllCourseTourVideos(): Promise<CourseTourVideo[]> {
    return await db
      .select()
      .from(courseTourVideos)
      .orderBy(desc(courseTourVideos.createdAt));
  }

  async setActiveCourseTourVideo(videoId: number): Promise<void> {
    // First, deactivate all videos
    await db
      .update(courseTourVideos)
      .set({ isActive: false });
    
    // Then activate the selected video
    await db
      .update(courseTourVideos)
      .set({ isActive: true })
      .where(eq(courseTourVideos.id, videoId));
  }

  async deleteCourseTourVideo(videoId: number): Promise<void> {
    await db
      .delete(courseTourVideos)
      .where(eq(courseTourVideos.id, videoId));
  }
}

export const storage = new DatabaseStorage();
