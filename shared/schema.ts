import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("jedi"), // "emperor", "jedi_master", "jedi"
  profilePicture: text("profile_picture"), // URL/path to profile picture
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// SMS verification codes table
export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  code: text("code").notNull(),
  type: text("type").notNull(), // "register", "login", "password_reset"
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User sessions table
export const userSessions = pgTable("user_sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  hostName: text("host_name").notNull(),
  courseType: text("course_type").notNull(), // "front9", "back9", "full18"
  currentHole: integer("current_hole").notNull().default(1),
  status: text("status").notNull().default("waiting"), // "waiting", "playing", "completed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  name: text("name").notNull(),
  userId: integer("user_id"), // null for guest players
  isHost: boolean("is_host").notNull().default(false),
  isLocal: boolean("is_local").notNull().default(false), // true for local players managed by host
  profilePicture: text("profile_picture"), // URL/path to profile picture for local players
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  playerId: integer("player_id").notNull(),
  hole: integer("hole").notNull(),
  strokes: integer("strokes").notNull(),
  confirmed: boolean("confirmed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  playerId: integer("player_id").notNull(),
  hole: integer("hole"), // null if taken in lobby/waiting room
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Course tour videos table
export const courseTourVideos = pgTable("course_tour_videos", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  isActive: boolean("is_active").notNull().default(false),
  uploadedBy: integer("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  phoneNumber: true,
  password: true,
}).extend({
  role: z.string().optional(),
  profilePicture: z.string().optional(),
});

export const insertVerificationCodeSchema = createInsertSchema(verificationCodes).pick({
  phoneNumber: true,
  code: true,
  type: true,
  expiresAt: true,
});

export const insertGameSchema = createInsertSchema(games).pick({
  hostName: true,
  courseType: true,
});

export const insertPlayerSchema = createInsertSchema(players).pick({
  gameId: true,
  name: true,
  userId: true,
  isHost: true,
  isLocal: true,
  profilePicture: true,
});

export const insertScoreSchema = createInsertSchema(scores).pick({
  gameId: true,
  playerId: true,
  hole: true,
  strokes: true,
});

export const insertPhotoSchema = createInsertSchema(photos).pick({
  gameId: true,
  playerId: true,
  hole: true,
  fileName: true,
  originalName: true,
  fileSize: true,
  mimeType: true,
});

export const insertCourseTourVideoSchema = createInsertSchema(courseTourVideos).pick({
  fileName: true,
  filePath: true,
  originalName: true,
  fileSize: true,
  uploadedBy: true,
});

// Extended schemas with validation
export const registerSchema = insertUserSchema.extend({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginPhoneSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
});

export const loginPasswordSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  password: z.string().min(1, "Password is required"),
});

export const verifyCodeSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  code: z.string().length(6, "Verification code must be 6 digits"),
  type: z.enum(["register", "login", "password_reset"]),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const resetPasswordSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  code: z.string().length(6, "Verification code must be 6 digits"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const guestLoginSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
});

export const createGameSchema = insertGameSchema.extend({
  hostName: z.string().min(1, "Host name is required").max(50),
  courseType: z.enum(["front9", "back9", "full18"]),
});

export const joinGameSchema = z.object({
  code: z.string().length(6, "Game code must be 6 characters"),
  name: z.string().min(1, "Player name is required").max(50),
});

export const addLocalPlayerSchema = z.object({
  gameId: z.number().min(1),
  name: z.string().min(1, "Player name is required").max(50),
});

export const enterScoreSchema = insertScoreSchema.extend({
  strokes: z.number().min(0).max(15),
});

export const uploadPhotoSchema = z.object({
  gameId: z.number().min(1),
  playerId: z.number().min(1),
  hole: z.number().min(1).max(18).optional(),
});

// Types
export type User = typeof users.$inferSelect & {
  isGuest?: boolean;
};
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;
export type Game = typeof games.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Score = typeof scores.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type CourseTourVideo = typeof courseTourVideos.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type InsertCourseTourVideo = z.infer<typeof insertCourseTourVideoSchema>;

export type RegisterUser = z.infer<typeof registerSchema>;
export type LoginPhone = z.infer<typeof loginPhoneSchema>;
export type LoginPassword = z.infer<typeof loginPasswordSchema>;
export type VerifyCode = z.infer<typeof verifyCodeSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type GuestLogin = z.infer<typeof guestLoginSchema>;
export type CreateGame = z.infer<typeof createGameSchema>;
export type JoinGame = z.infer<typeof joinGameSchema>;
export type EnterScore = z.infer<typeof enterScoreSchema>;
export type UploadPhoto = z.infer<typeof uploadPhotoSchema>;

// Game with related data
export type GameWithPlayers = Game & {
  players: Player[];
  scores: Score[];
  photos: Photo[];
};

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  players: many(players),
  sessions: many(userSessions),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  players: many(players),
  scores: many(scores),
  photos: many(photos),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  game: one(games, {
    fields: [players.gameId],
    references: [games.id],
  }),
  user: one(users, {
    fields: [players.userId],
    references: [users.id],
  }),
  scores: many(scores),
  photos: many(photos),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
  game: one(games, {
    fields: [scores.gameId],
    references: [games.id],
  }),
  player: one(players, {
    fields: [scores.playerId],
    references: [players.id],
  }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  game: one(games, {
    fields: [photos.gameId],
    references: [games.id],
  }),
  player: one(players, {
    fields: [photos.playerId],
    references: [players.id],
  }),
}));

export const courseTourVideosRelations = relations(courseTourVideos, ({ one }) => ({
  uploader: one(users, {
    fields: [courseTourVideos.uploadedBy],
    references: [users.id],
  }),
}));

export const COURSE_CONFIG = {
  front9: { 
    holes: 9, 
    pars: [3, 3, 4, 2, 3, 3, 3, 3, 3],
    distances: [190, 355, 455, 130, 190, 190, 165, 150, 220],
    nicknames: [
      "Downhill Drive",
      "Crosswind Challenge", 
      "Across the Pasture",
      "Threading the Needle",
      "Tree-ohi",
      "Round the Bend",
      "Back to the Bush",
      "Drive the Line",
      "Through the V"
    ]
  },
  back9: { 
    holes: 9, 
    pars: [3, 2, 3, 3, 3, 3, 4, 3, 5],
    distances: [234, 93, 321, 195, 213, 306, 423, 294, 675],
    nicknames: [
      "Sunset",
      "Stiletto",
      "Tunnel Vision", 
      "Lucky",
      "Lost",
      "The Damn Hole",
      "The Big Show",
      "Found",
      "Coming Home"
    ]
  },
  full18: { 
    holes: 18, 
    pars: [3, 3, 4, 2, 3, 3, 3, 3, 3, 3, 2, 3, 3, 3, 3, 4, 3, 5],
    distances: [190, 355, 455, 130, 190, 190, 165, 150, 220, 234, 93, 321, 195, 213, 306, 423, 294, 675],
    nicknames: [
      "Downhill Drive",
      "Crosswind Challenge", 
      "Across the Pasture",
      "Threading the Needle",
      "Tree-ohi",
      "Round the Bend",
      "Back to the Bush",
      "Drive the Line",
      "Through the V",
      "Sunset",
      "Stiletto",
      "Tunnel Vision", 
      "Lucky",
      "Lost",
      "The Damn Hole",
      "The Big Show",
      "Found",
      "Coming Home"
    ]
  },
};
