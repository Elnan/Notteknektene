/**
 * Example usage of the new game submission system
 * This demonstrates how to use the standardized submission system
 */

import {
  saveGameSubmission,
  prepareSubmissionData,
  validateSubmissionData,
} from "./gameSubmissionUtils.js";

/**
 * Example: Building Blocks game completion
 */
export const exampleBuildingBlocksSubmission = async () => {
  const gameData = {
    score: 7,
    answer: "KREMLIN",
    gridState: "KEYHOLE|ARCHWAY|STEEPLE||TEMPLES||MANSION",
    timeSpent: 46000, // 46 seconds
    hintsUsed: 0,
    instructionsUsed: 0,
  };

  const userData = {
    userName: "Vidar",
    userEmail: "vidar@test.com",
  };

  try {
    const result = await saveGameSubmission(
      "SeasonTest",
      "building-blocks",
      "user-123",
      gameData,
      userData
    );

    console.log("✅ Building Blocks submission saved:", result.submissionData);
    return result;
  } catch (error) {
    console.error("❌ Submission failed:", error.message);
    throw error;
  }
};

/**
 * Example: Number Code game completion
 */
export const exampleNumberCodeSubmission = async () => {
  const gameData = {
    score: 5,
    answer: "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG",
    correctAnswers: 35,
    attempts: 3,
    filledState: "THE|QUICK|BROWN|FOX|JUMPS|OVER|THE|LAZY|DOG",
    timeSpent: 120000, // 2 minutes
    hintsUsed: 1,
    instructionsUsed: 0,
  };

  const userData = {
    userName: "Test User",
    userEmail: "test@example.com",
  };

  try {
    const result = await saveGameSubmission(
      "SeasonTest",
      "number-code",
      "user-456",
      gameData,
      userData
    );

    console.log("✅ Number Code submission saved:", result.submissionData);
    return result;
  } catch (error) {
    console.error("❌ Submission failed:", error.message);
    throw error;
  }
};

/**
 * Example: Order Chaos game completion
 */
export const exampleOrderChaosSubmission = async () => {
  const gameData = {
    score: 12,
    wins: 4,
    losses: 1,
    totalRounds: 5,
    rounds: [
      { round: 1, won: true, score: 3 },
      { round: 2, won: true, score: 2 },
      { round: 3, won: false, score: 0 },
      { round: 4, won: true, score: 4 },
      { round: 5, won: true, score: 3 },
    ],
    timeSpent: 180000, // 3 minutes
    hintsUsed: 0,
    instructionsUsed: 1,
  };

  const userData = {
    userName: "Player",
    userEmail: "player@example.com",
  };

  try {
    const result = await saveGameSubmission(
      "SeasonTest",
      "order-chaos",
      "user-789",
      gameData,
      userData
    );

    console.log("✅ Order Chaos submission saved:", result.submissionData);
    return result;
  } catch (error) {
    console.error("❌ Submission failed:", error.message);
    throw error;
  }
};

/**
 * Test data preparation without saving
 */
export const testDataPreparation = () => {
  const userData = {
    userName: "Test User",
    userEmail: "test@example.com",
  };

  const gameData = {
    score: 7,
    answer: "KREMLIN",
    gridState: "KEYHOLE|ARCHWAY|STEEPLE||TEMPLES||MANSION",
    timeSpent: 46000,
    hintsUsed: 0,
    instructionsUsed: 0,
  };

  const preparedData = prepareSubmissionData(
    "building-blocks",
    gameData,
    userData,
    { timeSpent: 46000 }
  );

  console.log("Prepared submission data:", preparedData);

  const validation = validateSubmissionData("building-blocks", preparedData);
  console.log("Validation result:", validation);

  return { preparedData, validation };
};
