/**
 * Game Submission Utilities
 *
 * This module provides a standardized system for saving game submissions
 * that handles both common fields (required for all games) and game-specific data.
 */

import { recordGameSubmissionData } from "../firebase/new-database-utils.js";

/**
 * Common submission fields that every game should save
 */
export const COMMON_SUBMISSION_FIELDS = {
  // User identification
  userName: null,
  userEmail: null,

  // Game completion status
  completed: true,
  submittedAt: null,

  // Scoring and performance
  score: 0,
  time: "0s",
  hintsUsed: 0,
  instructionsUsed: 0,

  // Optional common fields
  timeSpent: 0, // in milliseconds
};

/**
 * Game-specific submission schemas
 * Each game can define what additional fields it needs to save
 */
export const GAME_SUBMISSION_SCHEMAS = {
  "building-blocks": {
    answer: null, // Final answer submitted
    gridState: null, // Current state of the grid as string
  },

  "number-code": {
    mistakes: 0, // Number of mistakes made (0-3, 3 = failed)
  },

  "order-chaos": {
    wins: 0, // Number of rounds won
    losses: 0, // Number of rounds lost
    rounds: [], // Array of round results
    movesCount: 0, // Total number of moves made across all rounds
  },

  "pattern-solver": {
    roundsWon: 0, // Number of rounds won (0-3)
    rounds: [], // Array of round results with detailed information
    mistakesCount: 0, // Total mistakes across all rounds
    hintsUsed: 0, // Number of hints used (0-3)
  },

  "investigation-mystery": {
    rounds: [], // Array of mini-game results with detailed information
    totalRounds: 5, // Total number of mini-games
    roundsCompleted: 0, // Number of completed mini-games
    roundsWon: 0, // Number of successfully completed mini-games
    totalHintsUsed: 0, // Total hints used across all mini-games
    totalTimeSpent: 0, // Total time spent across all mini-games
  },

  "logic-grid": {
    correctPlacements: 0, // Number of correctly placed checkmarks
    wrongPlacements: 0, // Number of incorrectly placed checkmarks
    totalPossible: 0, // Total number of checkmarks placed
    accuracy: 0, // Percentage of correct placements
    correctCells: [], // Correct checkmarks: [{leftItem, topItem, status, expected}]
    wrongCells: [], // Wrong checkmarks: [{leftItem, topItem, status, expected}]
  },

  "pattern-matrix": {
    practiceRounds: [], // Practice round results: [{round: 1, userAnswer: [0,0,0,1,0,0,0,0], correctAnswer: [0,0,0,1,0,0,0,0], isCorrect: true}]
    mainRounds: [], // Main round results: [{round: 1, userAnswer: [0,0,0,1,0,0,0,0], correctAnswer: [0,0,0,1,0,0,0,0], isCorrect: true}]
    practiceCorrect: 0, // Number of practice rounds solved correctly
    mainCorrect: 0, // Number of main rounds solved correctly
    wrongInRound: "", // Comma-separated list of round numbers where player answered incorrectly (e.g., "4,7")
    accuracy: 0, // Overall accuracy percentage
    timeSpent: 0, // Total time spent on all rounds
    averageTimePerRound: 0, // Average time per round
    hintsUsed: 0, // Number of hints used (if any)
    completed: false, // Whether all rounds were completed
  },

  "the-keeper": {
    moves: 0, // Total number of moves made in the successful attempt
    attempts: 0, // Number of attempts before winning (1 = won on first try)
    gameWon: true, // Always true since we only submit when player wins
    timeSpent: 0, // Total time spent on the final successful attempt
    hintsUsed: 0, // Number of hints used (0 or 1)
    completed: true, // Always true since we only submit when player wins
    // Note: Score will be calculated after round ends based on ranking (attempts primary, moves secondary)
    // Rankings: 1st=10pts, 2nd=8pts, 3rd=6pts, 4th=4pts, 5th=3pts, 6th=2pts, 7th=1pt
  },

  sos: {
    rounds: [], // Array of round results: [{round: 1, playerScore: 5, aiScore: 3, winner: "player", boardState: "..."}]
    totalPlayerScore: 0, // Total player score across all 3 rounds
    totalAiScore: 0, // Total AI score across all 3 rounds
    playerWins: 0, // Number of rounds won by player (0-3)
    aiWins: 0, // Number of rounds won by AI (0-3)
    ties: 0, // Number of tied rounds (0-3)
    gameWinner: "", // "player", "ai", or "tie"
    timeSpent: 0, // Total time spent on all rounds
    hintsUsed: 0, // Number of hints used (0 or 1)
    completed: false, // Whether all 3 rounds were completed
  },

  triads: {
    rounds: [], // Array of round results: [{round: 1, moves: 15, triadsFound: 4, maxTriads: 4, completed: true}]
    totalMoves: 0, // Total moves across all rounds
    totalTriadsFound: 0, // Total triads found across all rounds
    roundsCompleted: 0, // Number of rounds completed (0-3)
    totalPossibleTriads: 12, // Total possible triads across all rounds (3 rounds × 4 triads each)
    accuracy: 0, // Percentage of triads found (totalTriadsFound / totalPossibleTriads)
    timeSpent: 0, // Total time spent on all rounds
    hintsUsed: 0, // Number of hints used (0 or 1)
    completed: false, // Whether all 3 rounds were completed
  },
};

/**
 * Validate submission data against the game's schema
 * @param {string} gameId - The game identifier
 * @param {Object} submissionData - The data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateSubmissionData = (gameId, submissionData) => {
  const errors = [];

  // Check required common fields
  const requiredCommonFields = ["userName", "userEmail", "completed", "score"];
  for (const field of requiredCommonFields) {
    if (submissionData[field] === undefined || submissionData[field] === null) {
      errors.push(`Missing required common field: ${field}`);
    }
  }

  // Check game-specific schema if it exists
  const gameSchema = GAME_SUBMISSION_SCHEMAS[gameId];
  if (gameSchema) {
    for (const [field, defaultValue] of Object.entries(gameSchema)) {
      if (submissionData[field] === undefined) {
        errors.push(`Missing game-specific field: ${field}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Prepare submission data with common fields and game-specific data
 * @param {string} gameId - The game identifier
 * @param {Object} gameData - Raw game data from the game component
 * @param {Object} userData - User information
 * @param {Object} options - Additional options
 * @returns {Object} - Prepared submission data
 */
export const prepareSubmissionData = (
  gameId,
  gameData,
  userData,
  options = {}
) => {
  const { timeSpent = 0, autoSave = false } = options;

  // Start with common fields
  const submissionData = {
    // User identification
    userName: userData.userName || userData.displayName || "Unknown User",
    userEmail: userData.userEmail || userData.email || "",

    // Game completion status
    completed: true,
    submittedAt: new Date(),

    // Scoring and performance
    score: gameData.score || gameData.points || 0,
    time: gameData.time || formatTime(timeSpent),
    hintsUsed: gameData.hintsUsed || gameData.hintUsed ? 1 : 0,
    instructionsUsed: gameData.instructionsUsed ? 1 : 0,

    // Optional common fields
    timeSpent: timeSpent,
  };

  // Add game-specific data
  const gameSchema = GAME_SUBMISSION_SCHEMAS[gameId];
  if (gameSchema) {
    for (const [field, defaultValue] of Object.entries(gameSchema)) {
      if (gameData[field] !== undefined) {
        submissionData[field] = gameData[field];
      } else if (defaultValue !== null) {
        submissionData[field] = defaultValue;
      }
    }
  }

  // Include any additional data from gameData that's not in the schema
  // This allows for future extensibility
  for (const [key, value] of Object.entries(gameData)) {
    if (!submissionData.hasOwnProperty(key)) {
      submissionData[key] = value;
    }
  }

  return submissionData;
};

/**
 * Save a game submission to the database
 * @param {string} seasonId - The season identifier
 * @param {string} gameId - The game identifier
 * @param {string} userId - The user identifier
 * @param {Object} gameData - Raw game data from the game component
 * @param {Object} userData - User information
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Result of the save operation
 */
export const saveGameSubmission = async (
  seasonId,
  gameId,
  userId,
  gameData,
  userData,
  options = {}
) => {
  try {
    // Prepare the submission data
    const submissionData = prepareSubmissionData(
      gameId,
      gameData,
      userData,
      options
    );

    // Validate the submission data
    const validation = validateSubmissionData(gameId, submissionData);
    if (!validation.isValid) {
      throw new Error(
        `Invalid submission data: ${validation.errors.join(", ")}`
      );
    }

    // Save to database
    await recordGameSubmissionData(seasonId, gameId, userId, submissionData);

    console.log(`✅ Game submission saved for ${gameId}:`, submissionData);

    return {
      success: true,
      submissionData,
    };
  } catch (error) {
    console.error(`❌ Failed to save game submission for ${gameId}:`, error);
    throw error;
  }
};

/**
 * Format time from milliseconds to readable format
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (milliseconds) => {
  if (!milliseconds || milliseconds < 1000) {
    return "0s";
  }

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${seconds}s`;
};

/**
 * Get game-specific submission fields for a given game
 * @param {string} gameId - The game identifier
 * @returns {Object} - Game-specific fields schema
 */
export const getGameSubmissionSchema = (gameId) => {
  return GAME_SUBMISSION_SCHEMAS[gameId] || {};
};

/**
 * Check if a game has a specific submission field
 * @param {string} gameId - The game identifier
 * @param {string} fieldName - The field name to check
 * @returns {boolean} - Whether the field exists for this game
 */
export const hasGameSubmissionField = (gameId, fieldName) => {
  const schema = GAME_SUBMISSION_SCHEMAS[gameId];
  return schema && schema.hasOwnProperty(fieldName);
};

/**
 * Get all available game IDs that have submission schemas
 * @returns {string[]} - Array of game IDs
 */
export const getSupportedGameIds = () => {
  return Object.keys(GAME_SUBMISSION_SCHEMAS);
};
