/**
 * Fix Game ID Mismatch Utility
 *
 * This utility fixes the issue where game document IDs don't match their gameId fields
 * after reordering games in the season management interface.
 */

import {
  getSeasonGamesList,
  createGame,
  deleteGame,
  getGameSubmissions,
  recordGameSubmissionData,
} from "../firebase/new-database-utils.js";

/**
 * Fix game ID mismatches for a season
 * @param {string} seasonName - The season name to fix
 */
export const fixGameIdMismatches = async (seasonName) => {
  try {
    console.log(`🔧 Fixing game ID mismatches for season: ${seasonName}`);

    const games = await getSeasonGamesList(seasonName);
    console.log(`📋 Found ${games.length} total games in season`);

    const gamesNeedingFix = [];

    // Find games where document ID doesn't match gameId
    for (const game of games) {
      console.log(
        `🔍 Checking game: document ID "${game.id}" vs gameId "${game.gameId}"`
      );
      if (game.id !== game.gameId) {
        gamesNeedingFix.push(game);
        console.log(
          `⚠️ Found mismatch: document ID "${game.id}" vs gameId "${game.gameId}"`
        );
      }
    }

    if (gamesNeedingFix.length === 0) {
      console.log("✅ No game ID mismatches found");
      return { success: true, message: "No mismatches found." };
    }

    console.log(`🔄 Fixing ${gamesNeedingFix.length} games...`);

    // Fix each game
    for (const game of gamesNeedingFix) {
      console.log(`🔧 Fixing game: ${game.id} -> ${game.gameId}`);

      // Get existing submissions from the old document ID
      let existingSubmissions = [];
      try {
        existingSubmissions = await getGameSubmissions(seasonName, game.id);
        console.log(
          `📦 Found ${existingSubmissions.length} submissions to migrate`
        );
      } catch (error) {
        console.log(
          `⚠️ Could not get submissions from old document ${game.id}:`,
          error.message
        );
        console.log(`📦 Proceeding with 0 submissions to migrate`);
      }

      // Check if the target document already exists
      const { getGame } = await import("../firebase/new-database-utils.js");
      const existingTargetGame = await getGame(seasonName, game.gameId);

      if (existingTargetGame) {
        console.log(
          `⚠️ Target document ${game.gameId} already exists, merging data...`
        );

        // If target exists, we need to merge the submissions
        const targetSubmissions = await getGameSubmissions(
          seasonName,
          game.gameId
        );
        console.log(
          `📦 Target document has ${targetSubmissions.length} existing submissions`
        );

        // Migrate submissions that don't already exist in target
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
                game.gameId,
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
              `⏭️ Skipping submission for user ${submission.userId || submission.id} (already exists in target)`
            );
          }
        }
      } else {
        // Create new game document with correct ID
        const newGameData = {
          ...game,
          gameId: game.gameId, // Use the correct gameId
          config: {
            ...game.config,
            gameId: game.gameId,
          },
          updatedAt: new Date(),
        };

        try {
          // Create the new game document
          await createGame(seasonName, newGameData);
          console.log(`✅ Created new game document: ${game.gameId}`);

          // Migrate submissions to the new document
          for (const submission of existingSubmissions) {
            try {
              await recordGameSubmissionData(
                seasonName,
                game.gameId, // Use the correct gameId
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
            `❌ Failed to create new game document ${game.gameId}:`,
            error
          );
          // Continue with next game instead of failing completely
          continue;
        }
      }

      // Only delete the old document if it's different from the target
      if (game.id !== game.gameId) {
        try {
          // Check if the old document still exists before trying to delete it
          const { getGame } = await import("../firebase/new-database-utils.js");
          const oldGame = await getGame(seasonName, game.id);

          if (oldGame) {
            // Add a small delay to prevent Firebase rate limiting
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
            `⏭️ Could not delete old document ${game.id} (may not exist):`,
            error.message
          );
        }
      } else {
        console.log(`⏭️ Skipping deletion (source and target are the same)`);
      }
    }

    console.log(
      `✅ Successfully fixed ${gamesNeedingFix.length} game ID mismatches`
    );
    return {
      success: true,
      message: `Fixed ${gamesNeedingFix.length} mismatches.`,
    };
  } catch (error) {
    console.error("❌ Error fixing game ID mismatches:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Check for game ID mismatches in a season
 * @param {string} seasonName - The season name to check
 * @returns {Promise<Array>} - Array of games with mismatches
 */
export const checkGameIdMismatches = async (seasonName) => {
  try {
    const games = await getSeasonGamesList(seasonName);
    const mismatches = games.filter((game) => game.id !== game.gameId);

    console.log(
      `🔍 Found ${mismatches.length} game ID mismatches in season ${seasonName}`
    );
    mismatches.forEach((game) => {
      console.log(`  - Document ID: "${game.id}" vs Game ID: "${game.gameId}"`);
    });

    return mismatches;
  } catch (error) {
    console.error("❌ Error checking game ID mismatches:", error);
    throw error;
  }
};

/**
 * Fix all seasons with game ID mismatches
 */
export const fixAllSeasonMismatches = async () => {
  try {
    console.log("🔧 Checking all seasons for game ID mismatches...");

    // This would need to be implemented to get all seasons
    // For now, you can call this function manually for specific seasons
    console.log(
      "⚠️ Manual fix required - call fixGameIdMismatches() for each season"
    );
  } catch (error) {
    console.error("❌ Error fixing all season mismatches:", error);
    throw error;
  }
};
