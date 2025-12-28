/**
 * Cloud Functions for Notteknektene
 *
 * This file contains scheduled functions that run server-side
 * to automatically complete games and generate round tables when deadlines expire.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// Pattern Matrix helper functions (for calculating scores from gameState)
const PATTERN_MATRIX_MAIN_ROUNDS = [
  { missing: [1, 1, 0, 1, 0, 0, 0, 0] }, // Round 0
  { missing: [0, 0, 0, 0, 0, 2, 2, 0] }, // Round 1
  { missing: [2, 2, 2, 0, 0, 0, 0, 0] }, // Round 2
  { missing: [0, 0, 0, 0, 0, 2, 2, 0] }, // Round 3
  { missing: [1, 2, 1, 2, 0, 2, 2, 0] }, // Round 4
  { missing: [0, 0, 1, 0, 2, 0, 0, 0] }, // Round 5
  { missing: [0, 2, 2, 2, 0, 1, 0, 0] }, // Round 6
  { missing: [0, 1, 2, 0, 1, 0, 1, 2] }, // Round 7
  { missing: [1, 2, 1, 2, 2, 0, 2, 1] }, // Round 8
  { missing: [2, 0, 0, 2, 0, 1, 0, 0] }, // Round 9
];

const PATTERN_MATRIX_PRACTICE_ROUNDS = [
  { missing: [2, 2, 2, 0, 0, 0, 0, 0] }, // Practice 0
  { missing: [0, 0, 0, 0, 0, 2, 2, 0] }, // Practice 1
];

function generatePattern(round, isPractice = false) {
  if (isPractice && round >= 0 && round < PATTERN_MATRIX_PRACTICE_ROUNDS.length) {
    return PATTERN_MATRIX_PRACTICE_ROUNDS[round];
  }
  if (!isPractice && round >= 0 && round < PATTERN_MATRIX_MAIN_ROUNDS.length) {
    return PATTERN_MATRIX_MAIN_ROUNDS[round];
  }
  return { missing: [] };
}

function checkSolution(playerInput, correct) {
  return (
    Array.isArray(playerInput) &&
    Array.isArray(correct) &&
    playerInput.length === correct.length &&
    playerInput.every((v, i) => v === correct[i])
  );
}

/**
 * Get the current active season
 */
async function getCurrentSeason() {
  try {
    const seasonsRef = db.collection("seasons");
    const snapshot = await seasonsRef.where("isActive", "==", true).get();

    if (snapshot.empty) {
      console.log("No active season found");
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error getting current season:", error);
    throw error;
  }
}

/**
 * Get all games for a season
 */
async function getSeasonGamesList(seasonName) {
  try {
    const gamesRef = db
      .collection("seasons")
      .doc(seasonName)
      .collection("games");
    const snapshot = await gamesRef.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting season games list:", error);
    throw error;
  }
}

/**
 * Update a game document
 */
async function updateGame(seasonName, gameId, updates) {
  try {
    const gameRef = db
      .collection("seasons")
      .doc(seasonName)
      .collection("games")
      .doc(gameId);
    await gameRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating game:", error);
    throw error;
  }
}

/**
 * Get all submissions for a specific game
 */
async function getGameSubmissions(seasonName, gameId) {
  try {
    const usersRef = db
      .collection("seasons")
      .doc(seasonName)
      .collection("games")
      .doc(gameId)
      .collection("users");
    const usersSnapshot = await usersRef.get();

    const submissions = usersSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((user) => {
        // Include users who have either completed the game or have submission data
        return user.completed || user.submittedAt || user.score !== undefined;
      });

    console.log(`Found ${submissions.length} submissions for game ${gameId}`);
    return submissions;
  } catch (error) {
    console.error("Error getting game submissions:", error);
    throw error;
  }
}

/**
 * Get all participants in a season
 */
async function getSeasonParticipantsList(seasonName) {
  try {
    const participantsRef = db
      .collection("seasons")
      .doc(seasonName)
      .collection("participants");
    const participantsSnapshot = await participantsRef.get();
    return participantsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting season participants:", error);
    throw error;
  }
}

/**
 * Get all users from the users collection
 */
async function getAllUsers() {
  try {
    const usersCollection = db.collection("users");
    const usersSnapshot = await usersCollection.get();
    return usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
}

/**
 * Get game display name
 */
function getGameDisplayName(gameId) {
  const gameNames = {
    "building-blocks": "Building Blocks",
    "number-code": "Number Code",
    "order-chaos": "Order & Chaos",
    "pattern-solver": "Pattern Solver",
    "investigation-mystery": "Investigation Mystery",
    "logic-grid": "Logic Grid",
    "pattern-matrix": "Pattern Matrix",
    "the-keeper": "The Keeper",
    sos: "S.O.S",
    triads: "TRIADS",
  };

  // Extract base game name by removing round number suffix (e.g., "sos7" -> "sos")
  const baseGameId = gameId.replace(/\d+$/, "");

  return (
    gameNames[baseGameId] ||
    baseGameId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

/**
 * Get game-specific data from submission
 */
function getGameSpecificData(gameId, submission) {
  // Strip number suffix from game ID (e.g., "building-blocks1" -> "building-blocks")
  const baseGameId = gameId?.replace(/\d+$/, "") || "";

  let gameData;
  switch (baseGameId) {
    case "building-blocks":
      gameData = {
        hintsUsed: submission.hintsUsed || 0,
        instructionsUsed: submission.instructionsUsed || 0,
        answer: submission.answer || "N/A",
        gridState: submission.gridState,
      };
      break;
    case "number-code":
      gameData = {
        hintsUsed: submission.hintsUsed || 0,
        instructionsUsed: submission.instructionsUsed || 0,
        mistakes: submission.mistakes || 0,
      };
      break;
    case "order-chaos":
      gameData = {
        hintsUsed: submission.hintsUsed || 0,
        wins: submission.wins || 0,
        losses: submission.losses || 0,
        totalRounds: (submission.wins || 0) + (submission.losses || 0),
        rounds: submission.rounds,
      };
      break;
    case "pattern-solver":
      gameData = {
        hintsUsed: submission.hintsUsed || 0,
        instructionsUsed: submission.instructionsUsed || 0,
        roundsWon: submission.roundsWon || 0,
        mistakes: submission.mistakesCount || submission.mistakes || 0,
        rounds: submission.rounds,
      };
      break;
    case "investigation-mystery":
      gameData = {
        hintsUsed: submission.totalHintsUsed || submission.hintsUsed || 0,
        instructionsUsed: submission.instructionsUsed || 0,
        roundsWon: submission.roundsWon || 0,
        roundsCompleted: submission.roundsCompleted || 0,
        totalRounds: submission.totalRounds || 5,
        rounds: submission.rounds,
      };
      break;
    case "logic-grid":
      gameData = {
        hintsUsed: submission.hintsUsed || 0,
        accuracy: submission.accuracy || 0,
        correctPlacements: submission.correctPlacements || 0,
        wrongPlacements: submission.wrongPlacements || 0,
        totalPossible: submission.totalPossible || 0,
        correctCells: submission.correctCells || [],
        wrongCells: submission.wrongCells || [],
      };
      break;
    case "pattern-matrix":
      // Check if calculated fields exist, if not calculate from gameState
      // Also check if fields are null or if accuracy/mainCorrect are 0 but we have gameState data
      const hasCalculatedFields =
        submission.mainCorrect !== undefined &&
        submission.mainCorrect !== null &&
        submission.accuracy !== undefined &&
        submission.accuracy !== null;
      
      if (!hasCalculatedFields && submission.gameState?.mainAnswers) {
        // Calculate fields from gameState.mainAnswers
        const mainAnswers = submission.gameState.mainAnswers || [];
        const practiceAnswers = submission.gameState.practiceAnswers || [];
        const timeSpent = submission.timeSpent || submission.gameState.timeSpent || 0;

        // Process main rounds
        const mainRounds = [];
        let mainCorrect = 0;

        for (let i = 0; i < mainAnswers.length; i++) {
          const userAnswer = mainAnswers[i];
          if (userAnswer) {
            // Convert object answers to arrays if needed
            const normalizedAnswer = Array.isArray(userAnswer)
              ? userAnswer
              : userAnswer && typeof userAnswer === "object"
                ? Object.values(userAnswer)
                : null;

            if (normalizedAnswer && normalizedAnswer.length === 8) {
              try {
                const mainPattern = generatePattern(i, false);
                const isCorrect = checkSolution(
                  normalizedAnswer,
                  mainPattern.missing
                );

                mainRounds.push({
                  round: i + 1,
                  userAnswer: normalizedAnswer.join(","),
                  correctAnswer: mainPattern.missing.join(","),
                  isCorrect: isCorrect,
                });

                if (isCorrect) mainCorrect++;
              } catch (error) {
                console.warn(`Error processing round ${i + 1}:`, error);
              }
            }
          }
        }

        // Process practice rounds
        const practiceRounds = [];
        let practiceCorrect = 0;

        for (let i = 0; i < practiceAnswers.length; i++) {
          const userAnswer = practiceAnswers[i];
          if (userAnswer) {
            const normalizedAnswer = Array.isArray(userAnswer)
              ? userAnswer
              : userAnswer && typeof userAnswer === "object"
                ? Object.values(userAnswer)
                : null;

            if (normalizedAnswer && normalizedAnswer.length === 8) {
              try {
                const practicePattern = generatePattern(i, true);
                const isCorrect = checkSolution(
                  normalizedAnswer,
                  practicePattern.missing
                );

                practiceRounds.push({
                  round: i + 1,
                  userAnswer: normalizedAnswer.join(","),
                  correctAnswer: practicePattern.missing.join(","),
                  isCorrect: isCorrect,
                });

                if (isCorrect) practiceCorrect++;
              } catch (error) {
                console.warn(`Error processing practice round ${i + 1}:`, error);
              }
            }
          }
        }

        // Calculate totals
        const totalCorrect = practiceCorrect + mainCorrect;
        const totalRounds = practiceRounds.length + mainRounds.length;
        const accuracy = totalRounds > 0 ? (totalCorrect / totalRounds) * 100 : 0;
        // Convert milliseconds to seconds for averageTimePerRound
        const averageTimePerRoundMs =
          totalRounds > 0 ? timeSpent / totalRounds : 0;
        const averageTimePerRoundSeconds = Math.round(averageTimePerRoundMs / 1000);

        gameData = {
          hintsUsed: submission.hintsUsed || 0,
          accuracy: Math.round(accuracy * 100) / 100,
          mainCorrect: mainCorrect,
          averageTimePerRound: averageTimePerRoundSeconds,
          practiceCorrect: practiceCorrect,
          practiceRounds: practiceRounds,
          mainRounds: mainRounds,
        };
      } else {
        // Use existing calculated fields
        // Convert averageTimePerRound from milliseconds to seconds if needed
        // (values > 1000 are likely milliseconds, normal round times are < 1000 seconds)
        let averageTimePerRound = submission.averageTimePerRound || 0;
        if (averageTimePerRound > 1000) {
          averageTimePerRound = Math.round(averageTimePerRound / 1000);
        }
        
        gameData = {
          hintsUsed: submission.hintsUsed || 0,
          accuracy: submission.accuracy || 0,
          mainCorrect: submission.mainCorrect || 0,
          averageTimePerRound: averageTimePerRound,
          practiceCorrect: submission.practiceCorrect || 0,
          practiceRounds:
            typeof submission.practiceRounds === "string"
              ? JSON.parse(submission.practiceRounds)
              : submission.practiceRounds || [],
          mainRounds:
            typeof submission.mainRounds === "string"
              ? JSON.parse(submission.mainRounds)
              : submission.mainRounds || [],
        };
      }
      break;
    case "the-keeper":
      gameData = {
        hintsUsed: submission.hintsUsed || 0,
        instructionsUsed: submission.instructionsUsed || 0,
        attempts: submission.attempts || 1,
        moves: submission.moves || 0,
        gameWon: submission.gameWon || true,
      };
      break;
    case "sos":
      gameData = {
        hintsUsed: submission.hintsUsed || 0,
        instructionsUsed: submission.instructionsUsed || 0,
        playerWins: submission.playerWins || 0,
        totalPlayerScore: submission.totalPlayerScore || 0,
        totalAiScore: submission.totalAiScore || 0,
        rounds: submission.rounds || [],
      };
      break;
    case "triads":
      gameData = {
        hintsUsed: submission.hintsUsed || 0,
        roundsCompleted: submission.roundsCompleted || 0,
        accuracy: submission.accuracy || 0,
        totalTriadsFound: submission.totalTriadsFound || 0,
        totalMoves: submission.totalMoves || 0,
        rounds: submission.rounds || [],
      };
      break;
    default:
      console.warn(`⚠️ Unknown game ID: ${gameId}, base: ${baseGameId}`);
      gameData = {};
  }

  return gameData;
}

/**
 * Get the ranking comparator function for a specific game
 */
function getGameRankingComparator(gameId) {
  const baseGameId = gameId?.replace(/\d+$/, "") || "";

  switch (baseGameId) {
    case "building-blocks":
      // score, hintsUsed, instructionsUsed, submittedAt, answer
      return (a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        if (a.hintsUsed !== b.hintsUsed) return a.hintsUsed - b.hintsUsed;
        if (a.instructionsUsed !== b.instructionsUsed)
          return a.instructionsUsed - b.instructionsUsed;
        const aTime =
          a.submittedAt?.toMillis?.() ||
          (a.submittedAt?.seconds ? a.submittedAt.seconds * 1000 : 0);
        const bTime =
          b.submittedAt?.toMillis?.() ||
          (b.submittedAt?.seconds ? b.submittedAt.seconds * 1000 : 0);
        if (aTime && bTime) return aTime - bTime;
        return 0;
      };

    case "number-code":
      // score, hintsUsed, instructionsUsed, mistakes, submittedAt
      return (a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        if (a.hintsUsed !== b.hintsUsed) return a.hintsUsed - b.hintsUsed;
        if (a.instructionsUsed !== b.instructionsUsed)
          return a.instructionsUsed - b.instructionsUsed;
        if (a.mistakes !== b.mistakes) return a.mistakes - b.mistakes;
        const aTime =
          a.submittedAt?.toMillis?.() ||
          (a.submittedAt?.seconds ? a.submittedAt.seconds * 1000 : 0);
        const bTime =
          b.submittedAt?.toMillis?.() ||
          (b.submittedAt?.seconds ? b.submittedAt.seconds * 1000 : 0);
        if (aTime && bTime) return aTime - bTime;
        return 0;
      };

    case "order-chaos":
      // score, hintsUsed, wins, losses, submittedAt
      return (a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        if (a.hintsUsed !== b.hintsUsed) return a.hintsUsed - b.hintsUsed;
        if (a.wins !== b.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        const aTime =
          a.submittedAt?.toMillis?.() ||
          (a.submittedAt?.seconds ? a.submittedAt.seconds * 1000 : 0);
        const bTime =
          b.submittedAt?.toMillis?.() ||
          (b.submittedAt?.seconds ? b.submittedAt.seconds * 1000 : 0);
        if (aTime && bTime) return aTime - bTime;
        return 0;
      };

    case "pattern-solver":
      // score, hintsUsed, instructionsUsed, roundsWon, mistakesCount, submittedAt
      return (a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        if (a.hintsUsed !== b.hintsUsed) return a.hintsUsed - b.hintsUsed;
        if (a.instructionsUsed !== b.instructionsUsed)
          return a.instructionsUsed - b.instructionsUsed;
        if (a.roundsWon !== b.roundsWon) return b.roundsWon - a.roundsWon;
        if (a.mistakes !== b.mistakes) return a.mistakes - b.mistakes;
        const aTime =
          a.submittedAt?.toMillis?.() ||
          (a.submittedAt?.seconds ? a.submittedAt.seconds * 1000 : 0);
        const bTime =
          b.submittedAt?.toMillis?.() ||
          (b.submittedAt?.seconds ? b.submittedAt.seconds * 1000 : 0);
        if (aTime && bTime) return aTime - bTime;
        return 0;
      };

    case "investigation-mystery":
      // score, hintsUsed, instructionsUsed, roundsWon, roundsCompleted, submittedAt
      return (a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        if (a.hintsUsed !== b.hintsUsed) return a.hintsUsed - b.hintsUsed;
        if (a.instructionsUsed !== b.instructionsUsed)
          return a.instructionsUsed - b.instructionsUsed;
        if (a.roundsWon !== b.roundsWon) return b.roundsWon - a.roundsWon;
        if (a.roundsCompleted !== b.roundsCompleted)
          return b.roundsCompleted - a.roundsCompleted;
        const aTime =
          a.submittedAt?.toMillis?.() ||
          (a.submittedAt?.seconds ? a.submittedAt.seconds * 1000 : 0);
        const bTime =
          b.submittedAt?.toMillis?.() ||
          (b.submittedAt?.seconds ? b.submittedAt.seconds * 1000 : 0);
        if (aTime && bTime) return aTime - bTime;
        return 0;
      };

    case "logic-grid":
      // score, hintsUsed, accuracy, correctPlacements, submittedAt
      return (a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        if (a.hintsUsed !== b.hintsUsed) return a.hintsUsed - b.hintsUsed;
        if (a.accuracy !== b.accuracy) return b.accuracy - a.accuracy;
        if (a.correctPlacements !== b.correctPlacements)
          return b.correctPlacements - a.correctPlacements;
        const aTime =
          a.submittedAt?.toMillis?.() ||
          (a.submittedAt?.seconds ? a.submittedAt.seconds * 1000 : 0);
        const bTime =
          b.submittedAt?.toMillis?.() ||
          (b.submittedAt?.seconds ? b.submittedAt.seconds * 1000 : 0);
        if (aTime && bTime) return aTime - bTime;
        return 0;
      };

    case "pattern-matrix":
      return (a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        if (a.hintsUsed !== b.hintsUsed) return a.hintsUsed - b.hintsUsed;
        if (a.accuracy !== b.accuracy) return b.accuracy - a.accuracy;
        if (a.mainCorrect !== b.mainCorrect)
          return b.mainCorrect - a.mainCorrect;
        if (a.averageTimePerRound !== b.averageTimePerRound)
          return a.averageTimePerRound - b.averageTimePerRound;
        const aTime =
          a.submittedAt?.toMillis?.() ||
          (a.submittedAt?.seconds ? a.submittedAt.seconds * 1000 : 0);
        const bTime =
          b.submittedAt?.toMillis?.() ||
          (b.submittedAt?.seconds ? b.submittedAt.seconds * 1000 : 0);
        if (aTime && bTime) return aTime - bTime;
        return 0;
      };

    case "the-keeper":
      // For The Keeper, rank by attempts first, then moves, then hints/instructions, then submission time
      return (a, b) => {
        // Primary: Fewer attempts is better
        if (a.attempts !== b.attempts) return a.attempts - b.attempts;
        // Secondary: Fewer moves is better
        if (a.moves !== b.moves) return a.moves - b.moves;
        // Tertiary: Fewer hints is better
        if (a.hintsUsed !== b.hintsUsed) return a.hintsUsed - b.hintsUsed;
        // Quaternary: Fewer instructions is better
        if (a.instructionsUsed !== b.instructionsUsed)
          return a.instructionsUsed - b.instructionsUsed;
        // Final tiebreaker: Earlier submission
        const aTime =
          a.submittedAt?.toMillis?.() ||
          (a.submittedAt?.seconds ? a.submittedAt.seconds * 1000 : 0);
        const bTime =
          b.submittedAt?.toMillis?.() ||
          (b.submittedAt?.seconds ? b.submittedAt.seconds * 1000 : 0);
        if (aTime && bTime) return aTime - bTime;
        return 0;
      };

    case "sos":
      // playerWins, score, totalAiScore (lower is better), submittedAt
      return (a, b) => {
        if (a.playerWins !== b.playerWins) return b.playerWins - a.playerWins;
        if (a.score !== b.score) return b.score - a.score;
        if (a.totalAiScore !== b.totalAiScore)
          return a.totalAiScore - b.totalAiScore;
        const aTime =
          a.submittedAt?.toMillis?.() ||
          (a.submittedAt?.seconds ? a.submittedAt.seconds * 1000 : 0);
        const bTime =
          b.submittedAt?.toMillis?.() ||
          (b.submittedAt?.seconds ? b.submittedAt.seconds * 1000 : 0);
        if (aTime && bTime) return aTime - bTime;
        return 0;
      };

    case "triads":
      // score, hintsUsed, roundsCompleted, accuracy, totalTriadsFound, totalMoves, submittedAt
      return (a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        if (a.hintsUsed !== b.hintsUsed) return a.hintsUsed - b.hintsUsed;
        if (a.roundsCompleted !== b.roundsCompleted)
          return b.roundsCompleted - a.roundsCompleted;
        if (a.accuracy !== b.accuracy) return b.accuracy - a.accuracy;
        if (a.totalTriadsFound !== b.totalTriadsFound)
          return b.totalTriadsFound - a.totalTriadsFound;
        if (a.totalMoves !== b.totalMoves) return a.totalMoves - b.totalMoves;
        const aTime =
          a.submittedAt?.toMillis?.() ||
          (a.submittedAt?.seconds ? a.submittedAt.seconds * 1000 : 0);
        const bTime =
          b.submittedAt?.toMillis?.() ||
          (b.submittedAt?.seconds ? b.submittedAt.seconds * 1000 : 0);
        if (aTime && bTime) return aTime - bTime;
        return 0;
      };

    default:
      // Default ranking: score, then submittedAt
      return (a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        const aTime =
          a.submittedAt?.toMillis?.() ||
          (a.submittedAt?.seconds ? a.submittedAt.seconds * 1000 : 0);
        const bTime =
          b.submittedAt?.toMillis?.() ||
          (b.submittedAt?.seconds ? b.submittedAt.seconds * 1000 : 0);
        if (aTime && bTime) return aTime - bTime;
        return 0;
      };
  }
}

/**
 * Calculate average time from array of time strings
 */
function calculateAverageTime(times) {
  // Convert times to seconds for calculation
  const timeInSeconds = times.map((time) => {
    if (typeof time === "string") {
      // Parse "2m 15s" format
      const match = time.match(
        /(?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?/
      );
      if (match) {
        const [, days = 0, hours = 0, minutes = 0, seconds = 0] = match;
        return (
          parseInt(days) * 86400 +
          parseInt(hours) * 3600 +
          parseInt(minutes) * 60 +
          parseInt(seconds)
        );
      }
    }
    return 0;
  });

  const avgSeconds =
    timeInSeconds.reduce((a, b) => a + b, 0) / timeInSeconds.length;

  // Convert back to readable format
  const days = Math.floor(avgSeconds / 86400);
  const hours = Math.floor((avgSeconds % 86400) / 3600);
  const minutes = Math.floor((avgSeconds % 3600) / 60);
  const seconds = Math.floor(avgSeconds % 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * Calculate round summary statistics
 */
function calculateRoundSummary(participants) {
  if (participants.length === 0) {
    return {
      totalParticipants: 0,
      averageScore: 0,
      bestScore: 0,
      worstScore: 0,
      averageTime: "N/A",
    };
  }

  const scores = participants
    .map((p) => p.score)
    .filter((s) => s !== undefined);
  const times = participants.map((p) => p.time).filter((t) => t !== "N/A");

  return {
    totalParticipants: participants.length,
    averageScore:
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
          10
        : 0,
    bestScore: Math.max(...scores, 0),
    worstScore: Math.min(...scores, 0),
    averageTime: times.length > 0 ? calculateAverageTime(times) : "N/A",
  };
}

/**
 * Update total scores for all participants when a round is completed
 */
async function updateTotalScores(seasonName, roundNumber, participants) {
  try {
    console.log(
      `📊 Updating total scores for round ${roundNumber} in season ${seasonName}`
    );

    // Get all season participants to ensure everyone gets a score
    const allSeasonParticipants = await getSeasonParticipantsList(seasonName);

    // Create a map of participants who actually submitted for quick lookup
    const submittedParticipants = new Map();
    participants.forEach((participant) => {
      submittedParticipants.set(participant.userId, participant.score);
    });

    const batch = db.batch();

    // Update scores for ALL season participants
    for (const seasonParticipant of allSeasonParticipants) {
      const participantName =
        seasonParticipant.userName ||
        seasonParticipant.name ||
        seasonParticipant.displayName;
      if (!participantName) {
        continue;
      }

      // Get the score for this participant (0 if they didn't submit)
      const roundScore =
        submittedParticipants.get(seasonParticipant.userId) || 0;

      // Get or create total scores document for this participant
      const totalScoresRef = db
        .collection("seasons")
        .doc(seasonName)
        .collection("totalScores")
        .doc(seasonParticipant.userId);

      const totalScoresDoc = await totalScoresRef.get();

      let scores = [];
      if (totalScoresDoc.exists()) {
        scores = totalScoresDoc.data().scores || [];
      }

      // Ensure the scores array is long enough for the current round
      while (scores.length < roundNumber) {
        scores.push(0); // Fill with 0 for completed rounds
      }

      // Update the score for this round (0-indexed, so roundNumber - 1)
      scores[roundNumber - 1] = roundScore;

      // Calculate total score
      const totalScore = scores.reduce((sum, score) => sum + score, 0);

      // Update the document
      batch.set(
        totalScoresRef,
        {
          scores: scores,
          totalScore: totalScore,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    // Commit all updates
    await batch.commit();

    console.log(
      `✅ Updated total scores for ${allSeasonParticipants.length} participants`
    );
  } catch (error) {
    console.error("Error updating total scores:", error);
    throw error;
  }
}

/**
 * Create a round table for a specific round
 * Full implementation with game-specific ranking logic
 */
async function createRoundTable(seasonName, roundNumber) {
  try {
    console.log(
      `🚀🚀🚀 CREATING ROUND TABLE FOR ROUND ${roundNumber} ` +
        `IN SEASON ${seasonName} 🚀🚀🚀`
    );

    // Get the game for this round
    const games = await getSeasonGamesList(seasonName);
    const game = games.find((g) => g.roundNumber === roundNumber);

    if (!game) {
      throw new Error(`Game for round ${roundNumber} not found`);
    }

    // Get all submissions for this game (using gameId, not game.id)
    const submissions = await getGameSubmissions(seasonName, game.gameId);

    // Get season participants for defensive filtering
    const seasonParticipants = await getSeasonParticipantsList(seasonName);
    const participantUserIds = new Set(
      seasonParticipants.map((p) => p.userId || p.id)
    );

    // Get user avatars for round table participants
    const allUsers = await getAllUsers();
    const userAvatars = {};
    allUsers.forEach((user) => {
      if (user.displayName && user.avatar) {
        userAvatars[user.id] = user.avatar;
      }
    });

    // Transform submissions into participant data, filtering out non-participants
    const participants = submissions
      .filter((submission) => {
        // Only include submissions from users who are season participants
        const userId = submission.userId || submission.id;
        return participantUserIds.has(userId);
      })
      .map((submission) => {
        // Get the base game ID to determine the correct hints field
        const baseGameId = game.gameId?.replace(/\d+$/, "") || "";
        let hintsUsed = submission.hintsUsed || 0;

        // For investigation mystery, use totalHintsUsed instead
        if (baseGameId === "investigation-mystery") {
          hintsUsed = submission.totalHintsUsed || submission.hintsUsed || 0;
        }

        const userId = submission.userId || submission.id;
        const assignedAvatar =
          userAvatars[userId] || "male_avatar_portrait_man.png";
        return {
          userId: userId,
          userName: submission.userName,
          userEmail: submission.userEmail,
          avatar: assignedAvatar,
          score: submission.score || 0, // This will be updated after ranking
          time: submission.time || "N/A",
          hintsUsed: hintsUsed,
          instructionsUsed: submission.instructionsUsed || 0,
          answer: submission.answer || "N/A",
          submittedAt: submission.submittedAt,
          completed: submission.completed || false,
          // Game-specific data
          ...getGameSpecificData(game.gameId, submission),
        };
      })
      .sort((a, b) => {
        // Sort by game-specific ranking criteria
        return getGameRankingComparator(game.gameId)(a, b);
      })
      .map((participant, index) => {
        // Calculate score based on game type
        let finalScore = participant.score; // Default to original score

        // Only Pattern Matrix and The Keeper use ranking-based points
        const baseGameId = game.gameId?.replace(/\d+$/, "");
        if (baseGameId === "pattern-matrix" || baseGameId === "the-keeper") {
          // Ranking-based points: 1st=10, 2nd=8, 3rd=6, 4th=4, 5th=3, 6th=2, 7th=1
          finalScore = [10, 8, 6, 4, 3, 2, 1][index] || 0;
        }
        // All other games keep their original scoring system

        return {
          ...participant,
          rank: index + 1,
          score: finalScore,
        };
      });

    console.log(`📊 Created participants data:`, participants.length);
    if (participants.length > 0) {
      console.log(
        `👤 Sample participant fields:`,
        Object.keys(participants[0])
      );
    }

    // Calculate summary statistics
    const summary = calculateRoundSummary(participants);

    // Create round table document
    const roundTableRef = db
      .collection("seasons")
      .doc(seasonName)
      .collection("roundTables")
      .doc(`round-${roundNumber}`);

    const roundTableData = {
      roundNumber,
      gameId: game.gameId,
      gameName: getGameDisplayName(game.gameId),
      startDate: game.createdAt,
      endDate: admin.firestore.Timestamp.now(),
      isVisible: true,
      participants,
      summary,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await roundTableRef.set(roundTableData);

    console.log(
      `✅ Round table created for round ${roundNumber} ` +
        `with ${participants.length} participants`
    );

    // Update total scores for all participants
    await updateTotalScores(seasonName, roundNumber, participants);

    return roundTableData;
  } catch (error) {
    console.error("Error creating round table:", error);
    throw error;
  }
}

/**
 * Complete a game and create its round table when deadline expires
 */
async function completeGameAndCreateRoundTable(seasonName, roundNumber) {
  try {
    console.log(
      `⏰ Auto-completing game for round ${roundNumber} ` +
        `in season ${seasonName} due to deadline`
    );

    const games = await getSeasonGamesList(seasonName);
    const game = games.find((g) => g.roundNumber === roundNumber);

    if (!game) {
      throw new Error(`Game for round ${roundNumber} not found`);
    }

    if (game.status === "completed") {
      console.log(`Game for round ${roundNumber} is already completed`);
      return null;
    }

    // Set the game to completed status
    await updateGame(seasonName, game.id, {
      status: "completed",
      isActive: false,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create the round table
    const roundTable = await createRoundTable(seasonName, roundNumber);

    console.log(
      `✅ Game ${roundNumber} auto-completed and round table created`
    );
    return roundTable;
  } catch (error) {
    console.error(
      `Error auto-completing game for round ${roundNumber}:`,
      error
    );
    throw error;
  }
}

/**
 * Release the next game in the sequence
 */
async function releaseNextGame(seasonName) {
  try {
    const games = await getSeasonGamesList(seasonName);
    const currentGame = games.find((g) => g.isActive === true);

    let nextGame = null;
    if (currentGame) {
      // Normal path: find game with roundNumber + 1
      nextGame = games.find(
        (g) => g.roundNumber === currentGame.roundNumber + 1
      );
    } else {
      // Recovery path: no active game (e.g., just auto-completed)
      const upcoming = games
        .filter((g) => g.status === "upcoming" && g.isActive !== true)
        .sort((a, b) => a.roundNumber - b.roundNumber);
      if (upcoming.length > 0) {
        nextGame = upcoming[0];
      }
    }

    if (!nextGame) {
      console.log("No more games to release");
      return;
    }

    // First, deactivate all other games and mark previous "current" games as "completed"
    const allGames = await getSeasonGamesList(seasonName);
    const batch = db.batch();

    for (const game of allGames) {
      if (game.id !== nextGame.id) {
        const gameRef = db
          .collection("seasons")
          .doc(seasonName)
          .collection("games")
          .doc(game.id);
        const updates = { isActive: false };
        // If the game was previously "current", mark it as "completed"
        if (game.status === "current") {
          updates.status = "completed";
        }
        batch.update(gameRef, updates);
      }
    }

    await batch.commit();

    // Release the game
    await updateGame(seasonName, nextGame.id, {
      status: "current",
      isActive: true,
      releasedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update season current round
    const seasonRef = db.collection("seasons").doc(seasonName);
    await seasonRef.update({
      currentRound: nextGame.roundNumber,
    });

    // Set deadline for the newly released game to the upcoming Sunday 23:59
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7;
    const nextSunday = new Date(now);
    if (daysUntilSunday === 0) {
      // Today is Sunday, check if it's before 23:59
      if (
        now.getHours() < 23 ||
        (now.getHours() === 23 && now.getMinutes() < 59)
      ) {
        nextSunday.setHours(23, 59, 59, 999);
      } else {
        nextSunday.setDate(nextSunday.getDate() + 7);
        nextSunday.setHours(23, 59, 59, 999);
      }
    } else {
      nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
      nextSunday.setHours(23, 59, 59, 999);
    }

    await updateGame(seasonName, nextGame.id, {
      deadline: admin.firestore.Timestamp.fromDate(nextSunday),
    });

    console.log(
      `Set deadline for ${nextGame.gameId} (round ${nextGame.roundNumber}) ` +
        `to ${nextSunday.toISOString()}`
    );

    console.log(`Released game: ${nextGame.id}`);
  } catch (error) {
    console.error("Error releasing next game:", error);
    throw error;
  }
}

/**
 * Check if a game should be automatically completed due to deadline
 */
async function checkAndCompleteExpiredGames(seasonName) {
  try {
    console.log(`🔍 Checking for expired games in season ${seasonName}`);

    const games = await getSeasonGamesList(seasonName);
    const now = new Date();
    const completedGames = [];

    for (const game of games) {
      if (game.status === "current") {
        let deadline = null;
        let isTestDeadline = false;

        // Check for test deadline first (for testing purposes)
        if (game.testDeadline) {
          const td = game.testDeadline;
          deadline = td?.toDate ? td.toDate() : new Date(td);
          isTestDeadline = true;
        } else if (game.deadline) {
          const dl = game.deadline;
          deadline = dl?.toDate ? dl.toDate() : new Date(dl);
        }

        if (deadline && !isNaN(deadline.getTime()) && now > deadline) {
          console.log(
            `⏰ Game ${game.gameId} (round ${game.roundNumber}) ` +
              `${isTestDeadline ? "test " : ""}deadline has expired`
          );

          try {
            const roundTable = await completeGameAndCreateRoundTable(
              seasonName,
              game.roundNumber
            );
            if (roundTable) {
              completedGames.push(roundTable);
            }
          } catch (error) {
            console.error(
              `Failed to complete expired game ${game.gameId}:`,
              error
            );
          }
        }
      }
    }

    if (completedGames.length > 0) {
      console.log(`✅ Completed ${completedGames.length} expired games`);
    } else {
      console.log(`ℹ️ No expired games found`);
    }

    return completedGames;
  } catch (error) {
    console.error("Error checking for expired games:", error);
    throw error;
  }
}

/**
 * Scheduled function that runs every minute to check for expired games
 * This ensures games are completed and round tables are generated automatically
 * when deadlines expire (Sunday 23:59)
 */
exports.checkExpiredGames = functions.pubsub
  .schedule("every 1 minutes")
  .timeZone("Europe/Oslo")
  .onRun(async (context) => {
    console.log("⏰ Running scheduled check for expired games");

    try {
      // Get current season
      const season = await getCurrentSeason();

      if (!season) {
        console.log("ℹ️ No active season found, skipping check");
        return null;
      }

      console.log(`🔍 Checking for expired games in season: ${season.id}`);

      // Check and complete expired games
      const completedGames = await checkAndCompleteExpiredGames(season.id);

      if (completedGames.length > 0) {
        console.log(
          `✅ Completed ${completedGames.length} expired games ` +
            `and created round tables`
        );

        // After completing expired games, release the next game
        try {
          await releaseNextGame(season.id);
          console.log("🎮 Released next game after completing expired games");
        } catch (error) {
          console.error(
            "Error releasing next game after completing expired games:",
            error
          );
        }
      }

      return null;
    } catch (error) {
      console.error("Error in scheduled function:", error);
      // Don't throw - we don't want to retry immediately
      return null;
    }
  });
