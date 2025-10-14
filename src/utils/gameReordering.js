/**
 * Game Reordering Utility
 *
 * This utility handles game reordering correctly by:
 * 1. Creating new documents with correct IDs
 * 2. Updating round numbers for existing games
 * 3. Deleting old documents when needed
 * 4. Ensuring no ID mismatches occur
 */

import {
  getGame,
  createGame,
  deleteGame,
  updateGame,
} from "../firebase/new-database-utils.js";

/**
 * Reorder games in a season with correct document IDs
 * This prevents the ID mismatch issue by handling document IDs correctly
 *
 * @param {string} seasonName - The season name
 * @param {Array} gamesInNewOrder - Games in their new order
 * @returns {Promise<Object>} - Result of the reordering operation
 */
export const reorderGames = async (seasonName, gamesInNewOrder) => {
  try {
    console.log(
      `🔄 Reordering ${gamesInNewOrder.length} games in season: ${seasonName}`
    );

    const results = [];

    // Process each game in the new order
    for (let index = 0; index < gamesInNewOrder.length; index++) {
      const game = gamesInNewOrder[index];
      const newRoundNumber = index + 1;

      // Determine the correct game ID based on the base game ID
      const baseGameId =
        game.baseGameId ||
        game.gameId.replace(/\d+$/, "").replace(/-temp-\d+$/, "");
      const newGameId = `${baseGameId}${newRoundNumber}`;

      console.log(
        `🔧 Processing game: ${game.gameId} -> ${newGameId} (round ${newRoundNumber})`
      );

      // Skip if the game is already in the correct position
      if (game.gameId === newGameId && game.roundNumber === newRoundNumber) {
        console.log(
          `⏭️ Game ${game.gameId} is already in correct position, skipping`
        );
        results.push({
          success: true,
          gameId: game.gameId,
          message: "Already correct",
        });
        continue;
      }

      // For new seasons, there should be no submissions to migrate
      // This is just for setting up the initial game order

      // Check if target document already exists
      const existingTargetGame = await getGame(seasonName, newGameId);

      if (existingTargetGame) {
        console.log(
          `⚠️ Target document ${newGameId} already exists, updating round number...`
        );

        // Update the existing target document with new round number
        await updateGame(seasonName, newGameId, {
          roundNumber: newRoundNumber,
          updatedAt: new Date(),
        });

        console.log(
          `✅ Updated existing document ${newGameId} with round ${newRoundNumber}`
        );
      } else {
        // Create new document with correct ID
        const newGameData = {
          ...game,
          id: newGameId, // Set the document ID explicitly
          gameId: newGameId, // Ensure gameId field is also correct
          roundNumber: newRoundNumber,
          status: newRoundNumber === 1 ? "current" : "upcoming",
          isActive: newRoundNumber === 1,
          config: {
            ...game.config,
            gameId: newGameId,
          },
          updatedAt: new Date(),
        };

        try {
          await createGame(seasonName, newGameData);
          console.log(`✅ Created new game document: ${newGameId}`);
        } catch (error) {
          console.error(
            `❌ Failed to create new game document ${newGameId}:`,
            error
          );
          results.push({
            success: false,
            gameId: game.gameId,
            message: error.message,
          });
          continue;
        }
      }

      // Delete the old document if it's different from the target
      if (game.id !== newGameId) {
        try {
          // Check if the old document still exists before trying to delete it
          const oldGame = await getGame(seasonName, game.id);

          if (oldGame) {
            // Add delay to prevent Firebase rate limiting
            await new Promise((resolve) => setTimeout(resolve, 1000));

            await deleteGame(seasonName, game.id);
            console.log(`🗑️ Deleted old game document: ${game.id}`);
          } else {
            console.log(
              `⏭️ Old document ${game.id} no longer exists, skipping deletion`
            );
          }
        } catch (error) {
          console.log(
            `⏭️ Could not delete old document ${game.id}:`,
            error.message
          );
        }
      } else {
        console.log(`⏭️ Skipping deletion (source and target are the same)`);
      }

      results.push({
        success: true,
        gameId: newGameId,
        message: "Successfully reordered",
      });
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(
      `✅ Successfully reordered ${successCount}/${results.length} games`
    );

    return {
      success: true,
      message: `Successfully reordered ${successCount}/${results.length} games`,
      results: results,
    };
  } catch (error) {
    console.error("❌ Error reordering games:", error);
    return {
      success: false,
      message: error.message,
      results: [],
    };
  }
};

/**
 * Checks for games that need reordering (where gameId field doesn't match expected based on roundNumber)
 * @param {string} seasonName - The name of the season to check.
 * @returns {Promise<Array>} - An array of games that need reordering.
 */
export const checkGamesNeedingReordering = async (seasonName) => {
  try {
    const { getSeasonGamesList } = await import(
      "../firebase/new-database-utils.js"
    );
    const games = await getSeasonGamesList(seasonName);

    const gamesNeedingReordering = games.filter((game) => {
      const expectedGameId = game.gameId.replace(/\d+$/, "") + game.roundNumber;
      return game.gameId !== expectedGameId;
    });

    console.log(
      `🔍 Found ${gamesNeedingReordering.length} games needing reordering in season ${seasonName}`
    );

    return gamesNeedingReordering;
  } catch (error) {
    console.error("Error checking games needing reordering:", error);
    throw error;
  }
};
