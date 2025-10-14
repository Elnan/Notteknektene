import {
  getCurrentSeason,
  createSeason,
  createGame,
} from "../firebase/new-database-utils.js";
import { games as defaultGames } from "./gamesConfig.js";

/**
 * Create an active season for testing if none exists
 */
export const createActiveSeasonForTesting = async () => {
  console.log("🔍 Checking for active season...");

  try {
    // Check if there's already an active season
    const existingSeason = await getCurrentSeason();

    if (existingSeason) {
      console.log(`✅ Active season found: ${existingSeason.name}`);
      return existingSeason;
    }

    console.log("❌ No active season found. Creating one for testing...");

    // Create a test season
    const seasonData = {
      name: "TestSeason2024",
      seasonNumber: 999,
      isActive: true,
      currentRound: 1,
      totalRounds: 10,
      description: "Test season for The Keeper game",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(), // 70 days
      maxParticipants: 50,
      testMode: true,
    };

    await createSeason(seasonData);
    console.log(`✅ Created test season: ${seasonData.name}`);

    // Add The Keeper as the first game (round 1)
    const theKeeperGame = {
      gameId: "the-keeper1", // Round 1
      roundNumber: 1,
      status: "current",
      isActive: true,
      config: {
        difficulty: "medium",
        timeLimit: 300,
        gameId: "the-keeper1",
      },
    };

    await createGame(seasonData.name, theKeeperGame);
    console.log("✅ Added The Keeper game to season");

    return seasonData;
  } catch (error) {
    console.error("❌ Error creating active season:", error);
    throw error;
  }
};

/**
 * Check current season status
 */
export const checkSeasonStatus = async () => {
  console.log("🔍 Checking season status...");

  try {
    const season = await getCurrentSeason();

    if (!season) {
      console.log("❌ No active season found");
      return null;
    }

    console.log(`✅ Active season: ${season.name}`);
    console.log(`   Season ID: ${season.id}`);
    console.log(`   Current round: ${season.currentRound}`);
    console.log(`   Total rounds: ${season.totalRounds}`);
    console.log(`   Is active: ${season.isActive}`);

    return season;
  } catch (error) {
    console.error("❌ Error checking season status:", error);
    return null;
  }
};

// Make functions available globally for testing
if (typeof window !== "undefined") {
  window.createActiveSeasonForTesting = createActiveSeasonForTesting;
  window.checkSeasonStatus = checkSeasonStatus;
}
