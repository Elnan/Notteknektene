/**
 * Season Creation Utility
 *
 * This utility ensures that seasons are created with correct document IDs
 * and prevents ID mismatches from the start.
 */

import {
  createSeason,
  createGame,
  getSeasonGamesList,
} from "../firebase/new-database-utils.js";

/**
 * Create a new season with correct game document IDs
 * @param {Object} seasonData - The season data
 * @param {Array} games - Array of game objects to add
 * @returns {Promise<Object>} - The created season
 */
export const createSeasonWithGames = async (seasonData, games = []) => {
  try {
    console.log(`🏗️ Creating season: ${seasonData.name}`);

    // Create the season
    await createSeason(seasonData);
    console.log(`✅ Season created: ${seasonData.name}`);

    // Add games with proper document IDs
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const roundNumber = i + 1;
      const properGameId = `${game.id}${roundNumber}`;

      const properGameData = {
        id: properGameId, // Explicit document ID
        gameId: properGameId, // Field value matches document ID
        roundNumber: roundNumber,
        status: i === 0 ? "current" : "upcoming",
        isActive: i === 0,
        config: {
          ...game.config,
          gameId: properGameId, // Config also has correct ID
          difficulty: game.difficulty?.toLowerCase() || "medium",
          timeLimit: 300,
        },
      };

      await createGame(seasonData.name, properGameData);
      console.log(`✅ Added game: ${properGameId} (Round ${roundNumber})`);
    }

    console.log(`🎉 Proper season created successfully: ${seasonData.name}`);
    return seasonData;
  } catch (error) {
    console.error("❌ Error creating proper season:", error);
    throw error;
  }
};

/**
 * Add a game to an existing season without assigning round number
 * Round numbers will be assigned during the final reordering
 * @param {string} seasonName - The season name
 * @param {Object} game - The game to add
 * @returns {Promise<Object>} - The created game
 */
export const addGameToSeason = async (seasonName, game) => {
  try {
    // Use the clean game ID without any temp or numbers
    const cleanGameId = game.id;

    const gameData = {
      id: cleanGameId, // Clean document ID
      gameId: cleanGameId, // Clean field value
      roundNumber: null, // No round number yet
      status: "pending", // Pending until final order
      isActive: false,
      config: {
        ...game.config,
        gameId: cleanGameId, // Clean config ID
        difficulty: game.difficulty?.toLowerCase() || "medium",
        timeLimit: 300,
      },
      baseGameId: game.id, // Store the base game ID for later use
    };

    await createGame(seasonName, gameData);
    console.log(`✅ Added game to season: ${game.name} (pending order)`);

    return gameData;
  } catch (error) {
    console.error("❌ Error adding game to season:", error);
    throw error;
  }
};

/**
 * Verify that a season has no ID mismatches
 * @param {string} seasonName - The season name to check
 * @returns {Promise<Object>} - Verification result
 */
export const verifySeasonIntegrity = async (seasonName) => {
  try {
    const games = await getSeasonGamesList(seasonName);
    const mismatches = games.filter((game) => game.id !== game.gameId);

    if (mismatches.length === 0) {
      console.log(`✅ Season ${seasonName} has no ID mismatches`);
      return { success: true, mismatches: [] };
    } else {
      console.log(
        `⚠️ Season ${seasonName} has ${mismatches.length} ID mismatches:`
      );
      mismatches.forEach((game) => {
        console.log(
          `  - Document ID: "${game.id}" vs Game ID: "${game.gameId}"`
        );
      });
      return { success: false, mismatches };
    }
  } catch (error) {
    console.error("❌ Error verifying season integrity:", error);
    return { success: false, error: error.message };
  }
};
