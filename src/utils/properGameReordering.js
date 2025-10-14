/**
 * Proper Game Reordering Utility
 *
 * This utility handles game reordering correctly by:
 * 1. Creating new documents with correct IDs
 * 2. Migrating all data (submissions, etc.)
 * 3. Deleting old documents
 * 4. Ensuring no ID mismatches occur
 */

import {
  getGame,
  getGameSubmissions,
  createGame,
  deleteGame,
  recordGameSubmissionData,
} from "../firebase/new-database-utils.js";

/**
 * Properly reorder games in a season
 * This prevents the ID mismatch issue by handling document IDs correctly
 *
 * @param {string} seasonName - The season name
 * @param {Array} gamesInNewOrder - Games in their new order
 * @returns {Promise<Object>} - Result of the reordering operation
 */
export const properlyReorderGames = async (seasonName, gamesInNewOrder) => {
  try {
    console.log(
      `🔄 Properly reordering ${gamesInNewOrder.length} games in season: ${seasonName}`
    );

    const results = [];

    // Process each game in the new order
    for (let index = 0; index < gamesInNewOrder.length; index++) {
      const game = gamesInNewOrder[index];
      const newRoundNumber = index + 1;
      const baseGameId = game.gameId.replace(/\d+$/, ""); // Remove existing round number
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

      // Get all submissions from the current document
      let existingSubmissions = [];
      try {
        existingSubmissions = await getGameSubmissions(seasonName, game.id);
        console.log(
          `📦 Found ${existingSubmissions.length} submissions to migrate`
        );
      } catch (error) {
        console.log(
          `⚠️ Could not get submissions from ${game.id}:`,
          error.message
        );
      }

      // Check if target document already exists
      const existingTargetGame = await getGame(seasonName, newGameId);

      if (existingTargetGame) {
        console.log(
          `⚠️ Target document ${newGameId} already exists, merging data...`
        );

        // Merge submissions that don't already exist
        const targetSubmissions = await getGameSubmissions(
          seasonName,
          newGameId
        );
        console.log(
          `📦 Target document has ${targetSubmissions.length} existing submissions`
        );

        for (const submission of existingSubmissions) {
          const existsInTarget = targetSubmissions.some(
            (targetSub) =>
              (targetSub.userId || targetSub.id) ===
              (submission.userId || submission.id)
          );

          if (!existsInTarget) {
            try {
              await recordGameSubmissionData(
                seasonName,
                newGameId,
                submission.userId || submission.id,
                submission
              );
              console.log(
                `📦 Migrated submission for user: ${submission.userId || submission.id}`
              );
            } catch (error) {
              console.error(
                `❌ Failed to migrate submission for user ${submission.userId || submission.id}:`,
                error
              );
            }
          } else {
            console.log(
              `⏭️ Skipping submission for user ${submission.userId || submission.id} (already exists)`
            );
          }
        }

        // Update the existing target document with new round number
        const { updateGame } = await import(
          "../firebase/new-database-utils.js"
        );
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
          gameId: newGameId,
          roundNumber: newRoundNumber,
          config: {
            ...game.config,
            gameId: newGameId,
          },
          updatedAt: new Date(),
        };

        try {
          await createGame(seasonName, newGameData);
          console.log(`✅ Created new game document: ${newGameId}`);

          // Migrate submissions to the new document
          for (const submission of existingSubmissions) {
            try {
              await recordGameSubmissionData(
                seasonName,
                newGameId,
                submission.userId || submission.id,
                submission
              );
              console.log(
                `📦 Migrated submission for user: ${submission.userId || submission.id}`
              );
            } catch (error) {
              console.error(
                `❌ Failed to migrate submission for user ${submission.userId || submission.id}:`,
                error
              );
            }
          }
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
    console.error("❌ Error properly reordering games:", error);
    return {
      success: false,
      message: error.message,
      results: [],
    };
  }
};

/**
 * Check if games need reordering (have ID mismatches)
 * @param {string} seasonName - The season name
 * @returns {Promise<Array>} - Games that need reordering
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
    console.error("❌ Error checking games needing reordering:", error);
    throw error;
  }
};
