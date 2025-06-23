import { storage } from "./storage";

let cleanupInterval: NodeJS.Timeout | null = null;

export function startCleanupScheduler() {
  // Run cleanup every hour
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
  
  console.log("Starting game cleanup scheduler...");
  
  // Run initial cleanup
  runCleanup();
  
  // Schedule periodic cleanup
  cleanupInterval = setInterval(runCleanup, CLEANUP_INTERVAL);
}

export function stopCleanupScheduler() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log("Game cleanup scheduler stopped");
  }
}

async function runCleanup() {
  try {
    console.log("Running game cleanup check...");
    const deletedCount = await storage.deleteExpiredGames();
    if (deletedCount > 0) {
      console.log(`✓ Cleaned up ${deletedCount} expired games (older than 5 hours)`);
    } else {
      console.log("✓ No expired games found to cleanup");
    }
  } catch (error) {
    console.error("✗ Error during game cleanup:", error);
  }
}