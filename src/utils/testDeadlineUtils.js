/**
 * Test utilities for setting game deadlines
 * These functions are for testing the automatic game update system
 */

import {
  getCurrentSeason,
  getSeasonGamesList,
  updateGame,
} from "../firebase/new-database-utils.js";
import { serverTimestamp } from "firebase/firestore";

/**
 * Set a test deadline for the current active game
 * @param {number} minutesFromNow - Minutes from now to set the deadline
 */
export const setTestDeadline = async (minutesFromNow = 5) => {
  try {
    console.log(
      `🧪 Setting test deadline for ${minutesFromNow} minutes from now`
    );

    // Get current season
    const season = await getCurrentSeason();
    if (!season) {
      throw new Error("No active season found");
    }

    // Get all games in the season
    const games = await getSeasonGamesList(season.id);

    // Find the currently active game
    const activeGame = games.find(
      (game) => game.isActive && game.status === "current"
    );
    if (!activeGame) {
      throw new Error("No active game found");
    }

    console.log(
      `🎮 Found active game: ${activeGame.gameId} (Round ${activeGame.roundNumber})`
    );

    // Calculate the test deadline
    const now = new Date();
    const testDeadline = new Date(now.getTime() + minutesFromNow * 60 * 1000);

    console.log(`⏰ Setting deadline to: ${testDeadline.toLocaleString()}`);

    // Update the game with the test deadline
    await updateGame(season.id, activeGame.id, {
      deadline: serverTimestamp(),
      testDeadline: testDeadline, // Store as regular date for testing
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Test deadline set successfully!`);
    console.log(
      `🕐 Game will expire in ${minutesFromNow} minutes at ${testDeadline.toLocaleString()}`
    );

    return {
      gameId: activeGame.gameId,
      roundNumber: activeGame.roundNumber,
      deadline: testDeadline,
      minutesFromNow,
    };
  } catch (error) {
    console.error("❌ Error setting test deadline:", error);
    throw error;
  }
};

/**
 * Clear test deadline and restore normal deadline
 */
export const clearTestDeadline = async () => {
  try {
    console.log("🧪 Clearing test deadline");

    const season = await getCurrentSeason();
    if (!season) {
      throw new Error("No active season found");
    }

    const games = await getSeasonGamesList(season.id);
    const activeGame = games.find(
      (game) => game.isActive && game.status === "current"
    );

    if (!activeGame) {
      throw new Error("No active game found");
    }

    // Remove test deadline fields
    await updateGame(season.id, activeGame.id, {
      testDeadline: null,
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Test deadline cleared");
  } catch (error) {
    console.error("❌ Error clearing test deadline:", error);
    throw error;
  }
};

/**
 * Manually trigger the expired game check (for testing)
 */
export const triggerExpiredGameCheck = async () => {
  try {
    console.log("🧪 Manually triggering expired game check");

    const { checkForExpiredGames } = await import("./roundTableManager.js");
    const result = await checkForExpiredGames();

    console.log("✅ Expired game check completed:", result);
    return result;
  } catch (error) {
    console.error("❌ Error triggering expired game check:", error);
    throw error;
  }
};

/**
 * Get current game status and deadline info
 */
export const getCurrentGameStatus = async () => {
  try {
    const season = await getCurrentSeason();
    if (!season) {
      throw new Error("No active season found");
    }

    const games = await getSeasonGamesList(season.id);
    const activeGame = games.find(
      (game) => game.isActive && game.status === "current"
    );

    if (!activeGame) {
      return { error: "No active game found" };
    }

    const now = new Date();
    let deadline = null;
    let isExpired = false;
    let timeRemaining = null;

    if (activeGame.deadline) {
      deadline = activeGame.deadline.toDate
        ? activeGame.deadline.toDate()
        : new Date(activeGame.deadline);
      isExpired = now > deadline;
      timeRemaining = deadline - now;
    }

    if (activeGame.testDeadline) {
      const testDl = activeGame.testDeadline;
      const parsedTestDeadline = testDl?.toDate
        ? testDl.toDate()
        : new Date(testDl);
      if (!isNaN(parsedTestDeadline)) {
        deadline = parsedTestDeadline;
        isExpired = now > deadline;
        timeRemaining = deadline - now;
      }
    }

    return {
      gameId: activeGame.gameId,
      roundNumber: activeGame.roundNumber,
      status: activeGame.status,
      isActive: activeGame.isActive,
      deadline: deadline,
      isExpired: isExpired,
      timeRemaining: timeRemaining,
      timeRemainingMinutes: timeRemaining
        ? Math.ceil(timeRemaining / (1000 * 60))
        : null,
    };
  } catch (error) {
    console.error("❌ Error getting current game status:", error);
    throw error;
  }
};

// Make functions available globally for console testing
if (typeof window !== "undefined") {
  window.setTestDeadline = setTestDeadline;
  window.clearTestDeadline = clearTestDeadline;
  window.triggerExpiredGameCheck = triggerExpiredGameCheck;
  window.getCurrentGameStatus = getCurrentGameStatus;
}
