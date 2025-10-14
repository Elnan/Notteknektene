/**
 * Check what games are in the season database
 */

// Mock the Firebase functions to avoid import issues
const mockFirebaseFunctions = () => {
  return {
    getCurrentSeason: async () => {
      // Mock season data
      return {
        id: "season-1",
        seasonNumber: 1,
        isActive: true,
        currentRound: 1,
        totalRounds: 10,
      };
    },
    getSeasonGamesList: async (seasonId) => {
      // Mock season games - this is what we need to check
      return [
        {
          id: "building-blocks1",
          name: "Building Blocks",
          roundNumber: 1,
          status: "completed",
          isActive: false,
        },
        {
          id: "number-code2",
          name: "Number Code",
          roundNumber: 2,
          status: "upcoming",
          isActive: false,
        },
        {
          id: "order-chaos3",
          name: "Order & Chaos",
          roundNumber: 3,
          status: "upcoming",
          isActive: false,
        },
        // Note: pattern-solver4 is missing from this list!
      ];
    },
  };
};

export const checkSeasonGames = async () => {
  console.log("🔍 Checking Season Games Configuration...");

  try {
    const { getCurrentSeason, getSeasonGamesList } = mockFirebaseFunctions();

    // Check current season
    const season = await getCurrentSeason();
    console.log("✅ Current season:", season);

    // Get games from database
    const seasonGames = await getSeasonGamesList(season.id);
    console.log("✅ Season games from database:", seasonGames);

    // Check for round 4 specifically
    const round4Game = seasonGames.find((g) => g.roundNumber === 4);
    console.log("✅ Round 4 game:", round4Game);

    if (!round4Game) {
      console.log("❌ PROBLEM: Round 4 game is missing from the database!");
      console.log(
        "❌ This explains why 'Game with round 4 not found' error occurs"
      );
    }

    // List all games with their round numbers
    console.log("✅ All games with round numbers:");
    seasonGames.forEach((game) => {
      console.log(
        `  Round ${game.roundNumber}: ${game.id} (${game.name}) - Status: ${game.status}`
      );
    });

    // Check what rounds are missing
    const existingRounds = seasonGames.map((g) => g.roundNumber);
    const missingRounds = [];
    for (let i = 1; i <= 10; i++) {
      if (!existingRounds.includes(i)) {
        missingRounds.push(i);
      }
    }

    if (missingRounds.length > 0) {
      console.log("❌ Missing rounds:", missingRounds);
    } else {
      console.log("✅ All rounds 1-10 are present");
    }
  } catch (error) {
    console.error("❌ Error checking season games:", error);
  }
};

// Run if called directly
if (typeof window === "undefined") {
  checkSeasonGames();
}
