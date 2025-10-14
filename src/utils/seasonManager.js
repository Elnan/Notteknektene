import {
  getCurrentSeason,
  getMostRecentSeason,
  getSeasonGamesList,
  getCurrentActiveGameData,
  releaseGame,
  updateSeason,
  updateGame,
} from "../firebase/new-database-utils.js";
import { games as defaultGames } from "./gamesConfig.js";

/**
 * Get current season information
 */
export const getCurrentSeasonInfo = async () => {
  try {
    const season = await getCurrentSeason();
    return season;
  } catch (error) {
    console.error("Error getting current season info:", error);
    return null;
  }
};

/**
 * Get all games for the current season
 */
export const getSeasonGames = async () => {
  try {
    // First try to get the active season
    let season = await getCurrentSeason();

    // If no active season, get the most recent season (could be completed)
    if (!season) {
      season = await getMostRecentSeason();
    }

    if (!season) {
      console.warn("No season found, returning default games");
      return defaultGames.map((game, index) => ({
        ...game,
        roundNumber: index + 1,
        status: index === 0 ? "current" : "upcoming",
        isActive: index === 0,
      }));
    }

    const games = await getSeasonGamesList(season.id);

    // If season is completed, make all games accessible but none live
    if (season.isCompleted) {
      console.log(
        "🏁 Season is completed - making all games accessible but none live"
      );
      return games.map((game) => ({
        ...game,
        status: "completed", // All games are completed
        isActive: false, // No games are live
      }));
    }

    return games;
  } catch (error) {
    console.error("Error getting season games:", error);
    return defaultGames.map((game, index) => ({
      ...game,
      roundNumber: index + 1,
      status: index === 0 ? "current" : "upcoming",
      isActive: index === 0,
    }));
  }
};

/**
 * Get the currently active game
 */
export const getCurrentActiveGame = async () => {
  try {
    const season = await getCurrentSeason();
    if (!season) {
      console.warn("No active season found");
      return null;
    }

    const activeGame = await getCurrentActiveGameData(season.id);
    return activeGame;
  } catch (error) {
    console.error("Error getting current active game:", error);
    return null;
  }
};

/**
 * Check if a new game should be released
 */
export const shouldReleaseNewGame = async () => {
  try {
    const season = await getCurrentSeason();
    if (!season) return false;

    const activeGame = await getCurrentActiveGameData(season.id);
    if (!activeGame) return false;

    // Check if it's time to release the next game
    const now = new Date();
    const lastRelease = activeGame.releasedAt?.toDate() || new Date();
    const daysSinceRelease = (now - lastRelease) / (1000 * 60 * 60 * 24);

    // Release new game every 7 days
    return daysSinceRelease >= 7;
  } catch (error) {
    console.error("Error checking if should release new game:", error);
    return false;
  }
};

/**
 * Release the next game in the sequence
 */
export const releaseNextGame = async () => {
  try {
    const season = await getCurrentSeason();
    if (!season) {
      console.error("No active season found");
      return;
    }

    const games = await getSeasonGamesList(season.id);
    const currentGame = games.find((g) => g.isActive);

    if (!currentGame) {
      console.error("No current active game found");
      return;
    }

    const nextGame = games.find(
      (g) => g.roundNumber === currentGame.roundNumber + 1
    );
    if (!nextGame) {
      console.log("No more games to release");
      return;
    }

    // Release the next game
    await releaseGame(season.id, nextGame.id);

    // Update season current round
    await updateSeason(season.id, {
      currentRound: nextGame.roundNumber,
    });

    console.log(`Released game: ${nextGame.id}`);
  } catch (error) {
    console.error("Error releasing next game:", error);
  }
};

/**
 * Manually release a specific game
 */
export const manuallyReleaseGame = async (roundNumber) => {
  try {
    console.log(`🔧 Manually releasing game for round ${roundNumber}`);

    const season = await getCurrentSeason();
    if (!season) {
      console.error("No active season found");
      return;
    }

    const games = await getSeasonGamesList(season.id);
    console.log(`🔧 Found ${games.length} games in season`);

    // Log all games for debugging
    games.forEach((game) => {
      console.log(
        `  - ${game.gameId} (doc ID: ${game.id}): round=${game.roundNumber}, status=${game.status}, active=${game.isActive}`
      );
    });

    const targetGame = games.find((g) => g.roundNumber === roundNumber);

    if (!targetGame) {
      console.error(`Game with round ${roundNumber} not found`);
      console.log(
        "Available rounds:",
        games.map((g) => g.roundNumber).sort((a, b) => a - b)
      );
      return;
    }

    console.log(
      `🔧 Target game found: ${targetGame.gameId} (doc ID: ${targetGame.id})`
    );

    // Create round tables for all completed games before releasing the new one
    const { createRoundTable } = await import(
      "../firebase/new-database-utils.js"
    );

    for (const game of games) {
      if (game.roundNumber < roundNumber && game.status !== "completed") {
        console.log(
          `🔧 Setting ${game.gameId} to completed and creating round table`
        );

        // Set game to completed
        await updateGame(season.id, game.id, {
          status: "completed",
          isActive: false,
        });

        // Create round table for the completed game
        try {
          await createRoundTable(season.id, game.roundNumber);
          console.log(`✅ Round table created for round ${game.roundNumber}`);
        } catch (error) {
          console.error(
            `❌ Failed to create round table for round ${game.roundNumber}:`,
            error
          );
        }
      }
    }

    // Set all future games to upcoming status
    const batch = []; // Initialize batch here
    games.forEach((game) => {
      if (game.roundNumber > roundNumber && game.status !== "upcoming") {
        console.log(`🔧 Setting ${game.gameId} to upcoming`);
        batch.push(
          updateGame(season.id, game.id, {
            status: "upcoming",
            isActive: false,
          })
        );
      }
    });

    // Execute all status updates
    if (batch.length > 0) {
      await Promise.all(batch);
    }

    // Release the target game using the document ID (not gameId)
    console.log(`🔧 Releasing game with document ID: ${targetGame.id}`);
    await releaseGame(season.id, targetGame.id);

    // Update season current round
    await updateSeason(season.id, {
      currentRound: roundNumber,
    });

    console.log(
      `✅ Manually released game: ${targetGame.gameId} (doc ID: ${targetGame.id})`
    );
  } catch (error) {
    console.error("Error manually releasing game:", error);
  }
};

/**
 * Update game status
 */
export const updateGameStatus = async (roundNumber, status) => {
  try {
    const season = await getCurrentSeason();
    if (!season) {
      console.error("No active season found");
      return;
    }

    const games = await getSeasonGamesList(season.id);
    const targetGame = games.find((g) => g.roundNumber === roundNumber);

    if (!targetGame) {
      console.error(`Game with round ${roundNumber} not found`);
      return;
    }

    await updateGame(season.id, targetGame.id, { status });
    console.log(`Updated game ${targetGame.id} status to: ${status}`);
  } catch (error) {
    console.error("Error updating game status:", error);
  }
};

/**
 * Get next Monday date for scheduling
 */
export const getNextMonday = () => {
  const now = new Date();
  const daysUntilMonday = (8 - now.getDay()) % 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
};

/**
 * Initialize a new season
 */
export const initializeNewSeason = async (seasonData, games = defaultGames) => {
  try {
    const { initializeSeason } = await import(
      "../firebase/new-database-utils.js"
    );

    // Prepare games data with round number format
    const preparedGames = games.map((game, index) => {
      const roundNumber = index + 1;
      // Create game ID with round number format (e.g., "pattern-solver4")
      const gameIdWithRound = `${game.id}${roundNumber}`;

      return {
        gameId: gameIdWithRound,
        roundNumber: roundNumber,
        status: index === 0 ? "current" : "upcoming",
        isActive: index === 0,
        config: {
          ...game.config,
          gameId: gameIdWithRound, // Ensure config has the correct gameId
        },
      };
    });

    await initializeSeason(seasonData, preparedGames);
    console.log(`Initialized new season: ${seasonData.name}`);
  } catch (error) {
    console.error("Error initializing new season:", error);
    throw error;
  }
};

/**
 * Fix database state (migration helper)
 */
export const fixDatabaseState = async () => {
  try {
    const { migrateToNewStructure, verifyMigration } = await import(
      "../firebase/migration-script.js"
    );

    console.log("Starting database fix...");
    await migrateToNewStructure("SeasonTest");
    await verifyMigration("SeasonTest");
    console.log("Database fix completed!");
  } catch (error) {
    console.error("Error fixing database state:", error);
    throw error;
  }
};
