/**
 * Round Table Manager
 *
 * This module handles the automatic creation of round tables when games are completed,
 * either due to deadline expiration or manual game release.
 */

import {
  checkAndCompleteExpiredGames,
  createRoundTable,
  getRoundTable,
  getSeasonRoundTables,
} from "../firebase/new-database-utils.js";

/**
 * Initialize the round table manager
 * This should be called when the app starts to set up automatic deadline checking
 */
export const initializeRoundTableManager = () => {
  console.log("🔄 Initializing Round Table Manager");

  // Check for expired games every 5 minutes
  const checkInterval = setInterval(
    async () => {
      try {
        await checkForExpiredGames();
      } catch (error) {
        console.error("Error in round table manager check:", error);
      }
    },
    5 * 60 * 1000
  ); // 5 minutes

  // Don't check immediately - wait for authentication
  // checkForExpiredGames();

  return () => {
    clearInterval(checkInterval);
    console.log("🔄 Round Table Manager stopped");
  };
};

/**
 * Check for expired games in the current season and create round tables
 */
export const checkForExpiredGames = async () => {
  try {
    // Check if user is authenticated before making Firebase calls
    const { getAuth } = await import("firebase/auth");
    const { notteknekteneAuth } = await import(
      "../firebase/firebase-config-notteknektene.js"
    );
    const auth = getAuth(notteknekteneAuth.app);

    if (!auth.currentUser) {
      console.log("ℹ️ No authenticated user, skipping expired game check");
      return;
    }

    // Get current season
    const { getCurrentSeason } = await import(
      "../firebase/new-database-utils.js"
    );
    const currentSeason = await getCurrentSeason();

    console.log("🔍 RoundTableManager - Current season:", currentSeason);

    if (!currentSeason) {
      console.log("ℹ️ No active season found, skipping expired game check");
      return;
    }

    console.log(`🔍 Checking for expired games in season: ${currentSeason.id}`);

    // Check and complete expired games
    const completedGames = await checkAndCompleteExpiredGames(currentSeason.id);

    if (completedGames.length > 0) {
      console.log(
        `✅ Completed ${completedGames.length} expired games and created round tables`
      );

      // Optionally trigger UI updates or notifications
      window.dispatchEvent(
        new CustomEvent("roundTablesUpdated", {
          detail: { completedGames },
        })
      );
    }
  } catch (error) {
    console.error("Error checking for expired games:", error);
  }
};

/**
 * Manually create a round table for a specific round
 * Useful for testing or manual round table creation
 */
export const manuallyCreateRoundTable = async (roundNumber) => {
  try {
    const { getCurrentSeason } = await import(
      "../firebase/new-database-utils.js"
    );
    const currentSeason = await getCurrentSeason();

    if (!currentSeason) {
      throw new Error("No active season found");
    }

    console.log(`🔧 Manually creating round table for round ${roundNumber}`);

    // Check if round table already exists
    const existingRoundTable = await getRoundTable(
      currentSeason.id,
      roundNumber
    );
    if (existingRoundTable) {
      console.log(`ℹ️ Round table for round ${roundNumber} already exists`);
      return existingRoundTable;
    }

    // Create the round table
    const roundTable = await createRoundTable(currentSeason.id, roundNumber);

    console.log(`✅ Round table created for round ${roundNumber}`);
    return roundTable;
  } catch (error) {
    console.error(
      `Error manually creating round table for round ${roundNumber}:`,
      error
    );
    throw error;
  }
};

/**
 * Get all round tables for the current season
 */
export const getCurrentSeasonRoundTables = async () => {
  try {
    const { getCurrentSeason } = await import(
      "../firebase/new-database-utils.js"
    );
    const currentSeason = await getCurrentSeason();

    if (!currentSeason) {
      return [];
    }

    return await getSeasonRoundTables(currentSeason.id);
  } catch (error) {
    console.error("Error getting current season round tables:", error);
    return [];
  }
};

/**
 * Check if a round table exists for a specific round
 */
export const doesRoundTableExist = async (roundNumber) => {
  try {
    const { getCurrentSeason } = await import(
      "../firebase/new-database-utils.js"
    );
    const currentSeason = await getCurrentSeason();

    if (!currentSeason) {
      return false;
    }

    const roundTable = await getRoundTable(currentSeason.id, roundNumber);
    return !!roundTable;
  } catch (error) {
    console.error(
      `Error checking if round table exists for round ${roundNumber}:`,
      error
    );
    return false;
  }
};

/**
 * Get the latest round table (most recent round)
 */
export const getLatestRoundTable = async () => {
  try {
    const roundTables = await getCurrentSeasonRoundTables();

    if (roundTables.length === 0) {
      return null;
    }

    // Sort by round number descending and return the first one
    return roundTables.sort((a, b) => b.roundNumber - a.roundNumber)[0];
  } catch (error) {
    console.error("Error getting latest round table:", error);
    return null;
  }
};

// Export functions for use in other modules
export {
  checkAndCompleteExpiredGames,
  createRoundTable,
  getRoundTable,
  getSeasonRoundTables,
};
