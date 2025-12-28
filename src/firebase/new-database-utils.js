import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { notteknekteneDb } from "./firebase-config-notteknektene.js";
import { generatePattern, checkSolution } from "../tasks/season2/pattern-matrix/pattern-matrix-logic.js";

// ============================================================================
// SEASON MANAGEMENT
// ============================================================================

/**
 * Create a new season
 */
export const createSeason = async (seasonData) => {
  try {
    const seasonRef = doc(notteknekteneDb, "seasons", seasonData.name);
    await setDoc(seasonRef, {
      ...seasonData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return seasonRef;
  } catch (error) {
    console.error("Error creating season:", error);
    throw error;
  }
};

/**
 * Get a specific season
 */
export const getSeason = async (seasonName) => {
  try {
    const seasonRef = doc(notteknekteneDb, "seasons", seasonName);
    const seasonDoc = await getDoc(seasonRef);
    return seasonDoc.exists()
      ? { id: seasonDoc.id, ...seasonDoc.data() }
      : null;
  } catch (error) {
    console.error("Error getting season:", error);
    throw error;
  }
};

/**
 * Get all seasons
 */
export const getAllSeasons = async () => {
  try {
    const seasonsRef = collection(notteknekteneDb, "seasons");
    const seasonsSnapshot = await getDocs(seasonsRef);
    return seasonsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting all seasons:", error);
    throw error;
  }
};

/**
 * Get the current active season
 */
export const getCurrentSeason = async () => {
  try {
    const seasonsRef = collection(notteknekteneDb, "seasons");
    const q = query(seasonsRef, where("isActive", "==", true));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error getting current season:", error);
    throw error;
  }
};

/**
 * Get the most recent season (active or completed) for display purposes
 */
export const getMostRecentSeason = async () => {
  try {
    const seasonsRef = collection(notteknekteneDb, "seasons");
    const q = query(seasonsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error getting most recent season:", error);
    throw error;
  }
};

/**
 * Update season data
 */
export const updateSeason = async (seasonName, updates) => {
  try {
    const seasonRef = doc(notteknekteneDb, "seasons", seasonName);
    await updateDoc(seasonRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating season:", error);
    throw error;
  }
};

/**
 * Delete a season (and all its data)
 */
export const deleteSeason = async (seasonName) => {
  try {
    console.log(`Starting deletion of season: ${seasonName}`);

    // First, get all games in the season
    const gamesRef = collection(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games"
    );
    const gamesSnapshot = await getDocs(gamesRef);

    // For each game, delete all user submissions
    const gameDeletions = [];
    for (const gameDoc of gamesSnapshot.docs) {
      const gameId = gameDoc.id;
      console.log(`Deleting user submissions for game: ${gameId}`);

      // Delete all user submissions in this game
      const usersRef = collection(
        notteknekteneDb,
        "seasons",
        seasonName,
        "games",
        gameId,
        "users"
      );
      const usersSnapshot = await getDocs(usersRef);
      const userDeletions = usersSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(userDeletions);

      console.log(
        `Deleted ${usersSnapshot.docs.length} user submissions from game ${gameId}`
      );

      // Add game deletion to the list
      gameDeletions.push(deleteDoc(gameDoc.ref));
    }

    // Delete all games
    await Promise.all(gameDeletions);
    console.log(`Deleted ${gamesSnapshot.docs.length} games`);

    // Then, delete all participants in the season
    const participantsRef = collection(
      notteknekteneDb,
      "seasons",
      seasonName,
      "participants"
    );
    const participantsSnapshot = await getDocs(participantsRef);
    const participantDeletions = participantsSnapshot.docs.map((doc) =>
      deleteDoc(doc.ref)
    );
    await Promise.all(participantDeletions);
    console.log(`Deleted ${participantsSnapshot.docs.length} participants`);

    // Finally, delete the season document itself
    const seasonRef = doc(notteknekteneDb, "seasons", seasonName);
    await deleteDoc(seasonRef);
    console.log(`Deleted season document: ${seasonName}`);

    console.log(`✅ Season ${seasonName} completely deleted from database`);
  } catch (error) {
    console.error("Error deleting season:", error);
    throw error;
  }
};

// ============================================================================
// GAME MANAGEMENT
// ============================================================================

/**
 * Create a game in a season
 */
export const createGame = async (seasonName, gameData) => {
  try {
    // Use explicit document ID if provided, otherwise use gameId
    const documentId = gameData.id || gameData.gameId;
    const gameId = gameData.gameId;

    const gameRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games",
      documentId
    );

    const safeGameData = {
      ...gameData,
      gameId: gameId, // Use the provided gameId (should already be correct)
      config: {
        ...gameData.config,
        gameId: gameId, // Ensure config has the correct gameId with round number
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(gameRef, safeGameData);

    return gameRef;
  } catch (error) {
    console.error("Error creating game:", error);
    throw error;
  }
};

/**
 * Get a specific game in a season
 */
export const getGame = async (seasonName, gameId) => {
  try {
    const gameRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games",
      gameId
    );
    const gameDoc = await getDoc(gameRef);
    return gameDoc.exists() ? { id: gameDoc.id, ...gameDoc.data() } : null;
  } catch (error) {
    console.error("Error getting game:", error);
    throw error;
  }
};

/**
 * Get all games in a season
 */
export const getSeasonGamesList = async (seasonName) => {
  try {
    const gamesRef = collection(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games"
    );
    const gamesSnapshot = await getDocs(gamesRef);
    const games = gamesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by round number to ensure consistent order
    return games.sort((a, b) => a.roundNumber - b.roundNumber);
  } catch (error) {
    console.error("Error getting season games:", error);
    throw error;
  }
};

/**
 * Get the current active game in a season
 */
export const getCurrentActiveGameData = async (seasonName) => {
  try {
    const gamesRef = collection(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games"
    );
    const q = query(gamesRef, where("isActive", "==", true));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error getting current active game:", error);
    throw error;
  }
};

/**
 * Update game data
 */
export const updateGame = async (seasonName, gameId, updates) => {
  try {
    const gameRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games",
      gameId
    );
    await updateDoc(gameRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating game:", error);
    throw error;
  }
};

/**
 * Delete a game from a season
 */
export const deleteGame = async (seasonName, gameId) => {
  try {
    const gameRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games",
      gameId
    );
    await deleteDoc(gameRef);

    // After deleting, ensure only one game is active (the first one)
    await ensureSingleActiveGame(seasonName);
  } catch (error) {
    console.error("Error deleting game:", error);
    throw error;
  }
};

/**
 * Ensure only one game is active in a season (the first one)
 */
export const ensureSingleActiveGame = async (seasonName) => {
  try {
    const gamesRef = collection(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games"
    );
    const gamesSnapshot = await getDocs(gamesRef);
    const games = gamesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (games.length === 0) return;

    // Sort games by round number
    const sortedGames = games.sort((a, b) => a.roundNumber - b.roundNumber);

    // Deactivate all games first
    const batch = [];
    games.forEach((game) => {
      const gameRef = doc(
        notteknekteneDb,
        "seasons",
        seasonName,
        "games",
        game.id
      );
      batch.push(
        updateDoc(gameRef, {
          isActive: false,
          status: "upcoming",
          updatedAt: serverTimestamp(),
        })
      );
    });

    // Activate only the first game (round 1)
    const firstGame = sortedGames[0];
    const firstGameRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games",
      firstGame.id
    );
    batch.push(
      updateDoc(firstGameRef, {
        isActive: true,
        status: "current",
        updatedAt: serverTimestamp(),
      })
    );

    await Promise.all(batch);
    console.log(
      `Ensured only round ${firstGame.roundNumber} is active in season ${seasonName}`
    );
  } catch (error) {
    console.error("Error ensuring single active game:", error);
    throw error;
  }
};

/**
 * Release a game (set as active)
 */
export const releaseGame = async (seasonName, gameId) => {
  try {
    // First, deactivate all other games in the season
    const gamesRef = collection(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games"
    );
    const gamesSnapshot = await getDocs(gamesRef);

    const batch = [];
    gamesSnapshot.docs.forEach((gameDoc) => {
      const gameData = gameDoc.data();
      const gameRef = doc(
        notteknekteneDb,
        "seasons",
        seasonName,
        "games",
        gameDoc.id
      );
      
      // If this is not the game being released, deactivate it
      if (gameDoc.id !== gameId) {
        const updates = { isActive: false };
        // If the game was previously "current", mark it as "completed"
        if (gameData.status === "current") {
          updates.status = "completed";
        }
        batch.push(updateDoc(gameRef, updates));
      }
    });

    // Then activate the specified game
    const targetGameRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games",
      gameId
    );
    batch.push(
      updateDoc(targetGameRef, {
        isActive: true,
        status: "current",
        releasedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    await Promise.all(batch);
  } catch (error) {
    console.error("Error releasing game:", error);
    throw error;
  }
};

// ============================================================================
// USER SUBMISSIONS
// ============================================================================

/**
 * Record when a user opens a game
 */
export const recordGameOpening = async (seasonName, gameId, userData) => {
  try {
    const userRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games",
      gameId,
      "users",
      userData.userId
    );
    await setDoc(
      userRef,
      {
        ...userData,
        openedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error recording game opening:", error);
    throw error;
  }
};

/**
 * Record user submission for a game
 */
export const recordGameSubmissionData = async (
  seasonName,
  gameId,
  userId,
  userData
) => {
  try {
    console.log(
      `Recording submission for user ${userId} in game ${gameId}:`,
      userData
    );

    const userRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games",
      gameId,
      "users",
      userId
    );

    // Check if user already has a document for this game
    const existingDoc = await getDoc(userRef);

    if (existingDoc.exists() && existingDoc.data().completed) {
      console.warn(`User ${userId} has already completed game ${gameId}`);
      return;
    }

    // Use setDoc to completely replace the document with submission data
    await setDoc(userRef, {
      ...userData,
      submittedAt: serverTimestamp(),
      completed: true,
    });

    console.log(`✅ Successfully recorded submission for user ${userId}`);
  } catch (error) {
    console.error("Error recording game submission:", error);
    throw error;
  }
};

/**
 * Get user's submission for a specific game
 */
export const getUserGameSubmission = async (seasonName, gameId, userId) => {
  try {
    const userRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games",
      gameId,
      "users",
      userId
    );
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
  } catch (error) {
    console.error("Error getting user game submission:", error);
    throw error;
  }
};

/**
 * Get all users who opened a specific game
 */
export const getGameUsers = async (seasonName, gameId) => {
  try {
    const usersRef = collection(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games",
      gameId,
      "users"
    );
    const usersSnapshot = await getDocs(usersRef);
    return usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting game users:", error);
    throw error;
  }
};

/**
 * Get all completed submissions for a game
 */
export const getGameSubmissions = async (seasonName, gameId) => {
  try {
    const usersRef = collection(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games",
      gameId,
      "users"
    );
    // Get all users who have submitted data (either completed or have submission data)
    const usersSnapshot = await getDocs(usersRef);
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
};

// ============================================================================
// SEASON PARTICIPANTS
// ============================================================================

/**
 * Add a user as a participant in a season
 */
export const addSeasonParticipant = async (seasonName, userData) => {
  try {
    const participantRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "participants",
      userData.userId
    );
    await setDoc(participantRef, {
      ...userData,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding season participant:", error);
    throw error;
  }
};

/**
 * Get all participants in a season
 */
export const getSeasonParticipantsList = async (seasonName) => {
  try {
    const participantsRef = collection(
      notteknekteneDb,
      "seasons",
      seasonName,
      "participants"
    );
    const participantsSnapshot = await getDocs(participantsRef);
    return participantsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting season participants:", error);
    throw error;
  }
};

/**
 * Update participant data (e.g., total score, games played)
 */
export const updateSeasonParticipant = async (seasonName, userId, updates) => {
  try {
    const participantRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "participants",
      userId
    );
    await updateDoc(participantRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating season participant:", error);
    throw error;
  }
};

/**
 * Delete a participant from a season
 */
export const deleteSeasonParticipant = async (seasonName, userId) => {
  try {
    const participantRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "participants",
      userId
    );
    await deleteDoc(participantRef);
  } catch (error) {
    console.error("Error deleting season participant:", error);
    throw error;
  }
};

/**
 * Get participant's season summary
 */
export const getParticipantSeasonSummary = async (seasonName, userId) => {
  try {
    const participantRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "participants",
      userId
    );
    const participantDoc = await getDoc(participantRef);
    return participantDoc.exists()
      ? { id: participantDoc.id, ...participantDoc.data() }
      : null;
  } catch (error) {
    console.error("Error getting participant season summary:", error);
    throw error;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate user's total score for a season
 */
export const calculateUserSeasonScore = async (seasonName, userId) => {
  try {
    const games = await getSeasonGamesList(seasonName);
    let totalScore = 0;
    let gamesPlayed = 0;
    let gamesCompleted = 0;

    for (const game of games) {
      const submission = await getUserGameSubmission(
        seasonName,
        game.id,
        userId
      );
      if (submission?.openedAt) {
        gamesPlayed++;
        if (submission.completed && submission.score) {
          totalScore += submission.score;
          gamesCompleted++;
        }
      }
    }

    // Update participant record
    await updateSeasonParticipant(seasonName, userId, {
      totalScore,
      gamesPlayed,
      gamesCompleted,
    });

    return { totalScore, gamesPlayed, gamesCompleted };
  } catch (error) {
    console.error("Error calculating user season score:", error);
    throw error;
  }
};

/**
 * Get season leaderboard
 */
export const getSeasonLeaderboard = async (seasonName) => {
  try {
    const participants = await getSeasonParticipantsList(seasonName);
    return participants
      .filter((p) => p.participating)
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  } catch (error) {
    console.error("Error getting season leaderboard:", error);
    throw error;
  }
};

/**
 * Initialize a new season with games
 */
export const initializeSeason = async (seasonData, games) => {
  try {
    // Create season
    await createSeason(seasonData);

    // Create games
    for (const game of games) {
      await createGame(seasonData.name, game);
    }

    // Set first game as active
    if (games.length > 0) {
      const firstGameId = `${games[0].gameId}${games[0].roundNumber}`;
      await releaseGame(seasonData.name, firstGameId);
    }
  } catch (error) {
    console.error("Error initializing season:", error);
    throw error;
  }
};

// ============================================================================
// ROUND TABLE MANAGEMENT
// ============================================================================

/**
 * Create a round table for a completed game
 */
export const createRoundTable = async (seasonName, roundNumber) => {
  try {
    console.log(
      `🚀🚀🚀 CREATING ROUND TABLE FOR ROUND ${roundNumber} IN SEASON ${seasonName} 🚀🚀🚀`
    );

    // Get the game for this round
    const games = await getSeasonGamesList(seasonName);
    const game = games.find((g) => g.roundNumber === roundNumber);

    if (!game) {
      throw new Error(`Game for round ${roundNumber} not found`);
    }

    // Get all submissions for this game
    const submissions = await getGameSubmissions(seasonName, game.gameId);

    // Get season participants for defensive filtering
    const seasonParticipants = await getSeasonParticipantsList(seasonName);
    const participantUserIds = new Set(seasonParticipants.map((p) => p.userId));

    // Get user avatars for round table participants
    const { getAllUsers } = await import("./admin-firebase-utils.js");
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
          userId: userId, // Fix: use id as fallback
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
        // Extract base game ID (e.g., "the-keeper5" -> "the-keeper")
        const baseGameId = game.gameId?.replace(/\d+$/, "") || game.gameId;
        return getGameRankingComparator(baseGameId)(a, b);
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

    console.log(`📊 Created participants data:`, participants);
    if (participants.length > 0) {
      console.log(
        `👤 Sample participant fields:`,
        Object.keys(participants[0])
      );
      console.log(`🔍 Sample participant data:`, participants[0]);
    }

    // Calculate summary statistics
    const summary = calculateRoundSummary(participants);

    // Create round table document
    const roundTableRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "roundTables",
      `round-${roundNumber}`
    );

    const roundTableData = {
      roundNumber,
      gameId: game.gameId,
      gameName: getGameDisplayName(game.gameId),
      startDate: game.createdAt,
      endDate: new Date(),
      isVisible: true,
      participants,
      summary,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(roundTableRef, roundTableData);

    console.log(
      `✅ Round table created for round ${roundNumber} with ${participants.length} participants`
    );
    console.log(
      `📸📸📸 FINAL PARTICIPANT AVATARS 📸📸📸:`,
      participants.map((p) => ({ name: p.userName, avatar: p.avatar }))
    );

    // Update total scores for all participants
    await updateTotalScores(seasonName, roundNumber, participants);

    return roundTableData;
  } catch (error) {
    console.error("Error creating round table:", error);
    throw error;
  }
};

/**
 * Generate round table for a specific round without ending the season
 * This is useful for generating the final round table before ending the season
 */
export const generateRoundTableForRound = async (seasonName, roundNumber) => {
  try {
    console.log(
      `📊 Generating round table for round ${roundNumber} in season ${seasonName}`
    );

    // Check if round table already exists
    const existingRoundTable = await getRoundTable(seasonName, roundNumber);
    if (existingRoundTable) {
      console.log(`Round table for round ${roundNumber} already exists`);
      return {
        success: true,
        message: `Round table for round ${roundNumber} already exists`,
        roundTable: existingRoundTable,
      };
    }

    // Create the round table
    const roundTableData = await createRoundTable(seasonName, roundNumber);

    console.log(`✅ Round table generated for round ${roundNumber}`);
    return {
      success: true,
      message: `Round table for round ${roundNumber} generated successfully`,
      roundTable: roundTableData,
    };
  } catch (error) {
    console.error("Error generating round table:", error);
    throw error;
  }
};

/**
 * Update total scores for all participants when a round is completed
 * This function maintains the cumulative score table ("Sammenlagt")
 */
export const updateTotalScores = async (
  seasonName,
  roundNumber,
  participants
) => {
  try {
    console.log(
      `📊 Updating total scores for round ${roundNumber} in season ${seasonName}`
    );

    // Get all season participants to ensure everyone gets a score
    const allSeasonParticipants = await getSeasonParticipantsList(seasonName);
    console.log(
      `🔧 Found ${allSeasonParticipants.length} season participants:`,
      allSeasonParticipants.map((p) => p.userName || p.name || p.displayName)
    );

    const batch = writeBatch(notteknekteneDb);

    // Create a map of participants who actually submitted for quick lookup
    const submittedParticipants = new Map();
    participants.forEach((participant) => {
      submittedParticipants.set(participant.userId, participant.score);
    });
    console.log(
      `🔧 Submitted participants:`,
      Array.from(submittedParticipants.entries())
    );
    console.log(
      `🔧 Participant details:`,
      participants.map((p) => ({
        userId: p.userId,
        userName: p.userName,
        score: p.score,
      }))
    );

    // Update scores for ALL season participants
    console.log(
      `🔧 Starting to process ${allSeasonParticipants.length} season participants...`
    );
    for (const seasonParticipant of allSeasonParticipants) {
      const participantName =
        seasonParticipant.userName ||
        seasonParticipant.name ||
        seasonParticipant.displayName;
      if (!participantName) {
        console.log(`🔧 Skipping participant with no name:`, seasonParticipant);
        continue;
      }
      console.log(
        `🔧 Processing participant: ${participantName} (${seasonParticipant.userId})`
      );

      // Get the score for this participant (0 if they didn't submit)
      const roundScore =
        submittedParticipants.get(seasonParticipant.userId) || 0;
      console.log(
        `🔧 Looking up score for ${seasonParticipant.userId}: found ${roundScore}`
      );

      // Get or create total scores document for this participant
      const totalScoresRef = doc(
        notteknekteneDb,
        "seasons",
        seasonName,
        "totalScores",
        seasonParticipant.userId
      );

      const totalScoresDoc = await getDoc(totalScoresRef);

      let scores = [];
      if (totalScoresDoc.exists()) {
        scores = totalScoresDoc.data().scores || [];
      }

      console.log(
        `🔧 ${seasonParticipant.userId}: Before extension - Array length: ${scores.length}, Round: ${roundNumber}`
      );
      console.log(
        `🔧 ${seasonParticipant.userId}: Current scores: [${scores.join(", ")}]`
      );

      // Ensure the scores array is long enough for the current round
      // This is a safety mechanism to prevent array index errors
      // Only extend to the current round being updated (not future rounds)
      const originalLength = scores.length;
      while (scores.length < roundNumber) {
        scores.push(0); // Fill with 0 for completed rounds
      }

      if (scores.length > originalLength) {
        console.log(
          `🔧 ${seasonParticipant.userId}: Extended array from ${originalLength} to ${scores.length} elements for round ${roundNumber}`
        );
        console.log(
          `🔧 ${seasonParticipant.userId}: Extended scores: [${scores.join(", ")}]`
        );
      } else {
        console.log(
          `🔧 ${seasonParticipant.userId}: No extension needed - array already has ${scores.length} elements`
        );
      }

      // Additional safety check: ensure we don't overwrite existing scores
      // Only skip if there's a non-null, non-zero score (null means no score yet)
      if (
        scores[roundNumber - 1] !== undefined &&
        scores[roundNumber - 1] !== null &&
        scores[roundNumber - 1] !== 0
      ) {
        console.warn(
          `⚠️ Round ${roundNumber} already has a score (${scores[roundNumber - 1]}) for ${seasonParticipant.userId}. Skipping update to prevent overwrite.`
        );
        continue; // Skip this participant to avoid overwriting existing data
      }

      // Update the score for this round (roundNumber - 1 because array is 0-indexed)
      scores[roundNumber - 1] = roundScore;

      console.log(
        `🔧 ${seasonParticipant.userId}: After setting score - Array length: ${scores.length}, Round ${roundNumber} score: ${scores[roundNumber - 1]}`
      );
      console.log(
        `🔧 ${seasonParticipant.userId}: Final scores: [${scores.join(", ")}]`
      );

      // Calculate the total sum
      const totalSum = scores.reduce((sum, score) => sum + score, 0);

      // Update or create the total scores document
      batch.set(totalScoresRef, {
        name: participantName,
        userId: seasonParticipant.userId,
        scores: scores,
        sum: totalSum,
        updatedAt: serverTimestamp(),
      });

      // Also update the participant document with total score
      const participantRef = doc(
        notteknekteneDb,
        "seasons",
        seasonName,
        "participants",
        seasonParticipant.id
      );

      // Use setDoc with merge to update the totalScore field
      // This will create the document if it doesn't exist or update it if it does
      batch.set(
        participantRef,
        {
          totalScore: totalSum,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log(
        `📈 Updated ${seasonParticipant.userId}: Round ${roundNumber} = ${roundScore}, Total = ${totalSum}`
      );
    }

    await batch.commit();
    console.log(
      `✅ Total scores updated for round ${roundNumber} with ${allSeasonParticipants.length} total participants (${participants.length} submitted)`
    );
  } catch (error) {
    console.error("Error updating total scores:", error);
    throw error;
  }
};

/**
 * Get all total scores for a season (for the "Sammenlagt" table)
 */
export const getSeasonTotalScores = async (seasonName) => {
  try {
    const totalScoresRef = collection(
      notteknekteneDb,
      "seasons",
      seasonName,
      "totalScores"
    );

    const snapshot = await getDocs(totalScoresRef);

    const totalScores = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by total sum (descending)
    totalScores.sort((a, b) => (b.sum || 0) - (a.sum || 0));

    console.log(
      `📊 Retrieved total scores for ${totalScores.length} participants in season ${seasonName}`
    );
    return totalScores;
  } catch (error) {
    console.error("Error getting season total scores:", error);
    throw error;
  }
};

/**
 * Get a specific round table
 */
export const getRoundTable = async (seasonName, roundNumber) => {
  try {
    const roundTableRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "roundTables",
      `round-${roundNumber}`
    );

    const roundTableDoc = await getDoc(roundTableRef);
    return roundTableDoc.exists() ? roundTableDoc.data() : null;
  } catch (error) {
    console.error("Error getting round table:", error);
    throw error;
  }
};

/**
 * Get all round tables for a season
 */
export const getSeasonRoundTables = async (seasonName) => {
  try {
    const roundTablesRef = collection(
      notteknekteneDb,
      "seasons",
      seasonName,
      "roundTables"
    );

    const q = query(roundTablesRef, orderBy("roundNumber", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting season round tables:", error);
    throw error;
  }
};

/**
 * Update round table visibility
 */
export const updateRoundTableVisibility = async (
  seasonName,
  roundNumber,
  isVisible
) => {
  try {
    const roundTableRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "roundTables",
      `round-${roundNumber}`
    );

    await updateDoc(roundTableRef, {
      isVisible,
      updatedAt: serverTimestamp(),
    });

    console.log(
      `✅ Round table ${roundNumber} visibility updated to ${isVisible}`
    );
  } catch (error) {
    console.error("Error updating round table visibility:", error);
    throw error;
  }
};

/**
 * Automatically complete a game and create its round table when deadline expires
 * This function should be called by a scheduled task or when checking game deadlines
 */
export const completeGameAndCreateRoundTable = async (
  seasonName,
  roundNumber
) => {
  try {
    console.log(
      `⏰ Auto-completing game for round ${roundNumber} in season ${seasonName} due to deadline`
    );

    // Get the game for this round
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
      completedAt: serverTimestamp(),
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
};

/**
 * Check if a game should be automatically completed due to deadline
 * This function can be called periodically to check for expired games
 */
export const checkAndCompleteExpiredGames = async (seasonName) => {
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

        if (deadline && !isNaN(deadline) && now > deadline) {
          console.log(
            `⏰ Game ${game.gameId} (round ${game.roundNumber}) ${isTestDeadline ? "test " : ""}deadline has expired`
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
};

/**
 * Check if all games in a season are completed
 */
export const areAllSeasonGamesCompleted = async (seasonName) => {
  try {
    const games = await getSeasonGamesList(seasonName);

    if (games.length === 0) {
      return false; // No games in season
    }

    // Check if all games have status "completed"
    const allCompleted = games.every((game) => game.status === "completed");

    console.log(
      `🔍 Season ${seasonName} completion check: ${games.length} games, all completed: ${allCompleted}`
    );

    return allCompleted;
  } catch (error) {
    console.error("Error checking season completion:", error);
    throw error;
  }
};

/**
 * Manually complete a game and create its round table
 */
export const manuallyCompleteGame = async (seasonName, roundNumber) => {
  try {
    console.log(
      `🔧 Manually completing game for round ${roundNumber} in season ${seasonName}`
    );

    // Get the game for this round
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
      completedAt: serverTimestamp(),
    });

    // Create the round table
    const roundTable = await createRoundTable(seasonName, roundNumber);

    console.log(
      `✅ Game ${roundNumber} manually completed and round table created`
    );
    return roundTable;
  } catch (error) {
    console.error(
      `Error manually completing game for round ${roundNumber}:`,
      error
    );
    throw error;
  }
};

/**
 * Archive a season - create a comprehensive archive of all season data
 */
export const archiveSeason = async (seasonName) => {
  try {
    console.log(`📦 Starting comprehensive archive for season: ${seasonName}`);

    // Get all season data
    const season = await getSeason(seasonName);
    if (!season) {
      throw new Error(`Season ${seasonName} not found`);
    }

    const games = await getSeasonGamesList(seasonName);
    const participants = await getSeasonParticipantsList(seasonName);

    // Get all round tables
    const roundTables = [];
    for (const game of games) {
      if (game.status === "completed") {
        try {
          const roundTable = await getRoundTable(seasonName, game.roundNumber);
          if (roundTable) {
            roundTables.push(roundTable);
          }
        } catch (error) {
          console.warn(
            `Could not get round table for round ${game.roundNumber}:`,
            error
          );
        }
      }
    }

    // Get all user submissions for all games
    const allSubmissions = [];
    for (const game of games) {
      try {
        const submissions = await getGameSubmissions(seasonName, game.gameId);
        allSubmissions.push({
          gameId: game.id,
          roundNumber: game.roundNumber,
          submissions: submissions,
        });
      } catch (error) {
        console.warn(`Could not get submissions for game ${game.id}:`, error);
      }
    }

    // Helper function to remove undefined values
    const removeUndefinedValues = (obj) => {
      if (obj === null || obj === undefined) return null;
      if (typeof obj !== "object") return obj;
      if (Array.isArray(obj)) {
        return obj.map(removeUndefinedValues).filter((item) => item !== null);
      }
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = removeUndefinedValues(value);
        }
      }
      return cleaned;
    };

    // Create archive structure with undefined value filtering
    const archiveData = removeUndefinedValues({
      seasonMetadata: {
        ...season,
        archivedAt: serverTimestamp(),
        totalGames: games.length,
        totalParticipants: participants.length,
        totalSubmissions: allSubmissions.reduce(
          (sum, game) => sum + (game.submissions?.length || 0),
          0
        ),
      },
      games: games.map((game) => ({
        id: game.id || "",
        gameId: game.gameId || "",
        roundNumber: game.roundNumber || 0,
        status: game.status || "unknown",
        isActive: game.isActive || false,
        createdAt: game.createdAt || null,
        releasedAt: game.releasedAt || null,
        completedAt: game.completedAt || null,
        config: game.config || {},
      })),
      participants: participants.map((participant) => ({
        userId: participant.userId || "",
        userName: participant.userName || "",
        userEmail: participant.userEmail || "",
        participating: participant.participating || false,
        joinedAt: participant.joinedAt || null,
        totalScore: participant.totalScore || 0,
        gamesPlayed: participant.gamesPlayed || 0,
        gamesCompleted: participant.gamesCompleted || 0,
      })),
      roundTables: roundTables.map((table) => ({
        roundNumber: table.roundNumber || 0,
        gameId: table.gameId || "",
        gameName: table.gameName || "",
        startDate: table.startDate || null,
        endDate: table.endDate || null,
        participants: table.participants || [],
        summary: table.summary || "",
      })),
      submissions: allSubmissions.map((submission) => ({
        gameId: submission.gameId || "",
        roundNumber: submission.roundNumber || 0,
        submissions: submission.submissions || [],
      })),
      archiveInfo: {
        archivedAt: new Date().toISOString(),
        archiveVersion: "2.0",
        totalDataPoints:
          games.length +
          participants.length +
          roundTables.length +
          allSubmissions.length,
      },
    });

    // Log archive data for debugging
    console.log("📦 Archive data prepared:", {
      seasonMetadata: archiveData.seasonMetadata,
      gamesCount: archiveData.games?.length || 0,
      participantsCount: archiveData.participants?.length || 0,
      roundTablesCount: archiveData.roundTables?.length || 0,
      submissionsCount: archiveData.submissions?.length || 0,
    });

    // Store archive in Firebase
    const archiveRef = doc(notteknekteneDb, "seasonArchives", seasonName);
    await setDoc(archiveRef, archiveData);

    console.log(
      `✅ Season ${seasonName} archived successfully with ${archiveData.archiveInfo.totalDataPoints} data points`
    );

    return {
      success: true,
      message: `Season ${seasonName} archived successfully`,
      archiveData: {
        totalGames: games.length,
        totalParticipants: participants.length,
        totalRoundTables: roundTables.length,
        totalSubmissions: allSubmissions.reduce(
          (sum, game) => sum + game.submissions.length,
          0
        ),
      },
    };
  } catch (error) {
    console.error("Error archiving season:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    throw error;
  }
};

/**
 * Get archived season data
 */
export const getArchivedSeason = async (seasonName) => {
  try {
    const archiveRef = doc(notteknekteneDb, "seasonArchives", seasonName);
    const archiveDoc = await getDoc(archiveRef);

    if (!archiveDoc.exists()) {
      throw new Error(`Archive for season ${seasonName} not found`);
    }

    return archiveDoc.data();
  } catch (error) {
    console.error("Error getting archived season:", error);
    throw error;
  }
};

/**
 * Get all archived seasons
 */
export const getAllArchivedSeasons = async () => {
  try {
    const archivesRef = collection(notteknekteneDb, "seasonArchives");
    const archivesSnapshot = await getDocs(archivesRef);

    return archivesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting archived seasons:", error);
    throw error;
  }
};

/**
 * Get archived season summary (metadata only)
 */
export const getArchivedSeasonSummary = async (seasonName) => {
  try {
    const archive = await getArchivedSeason(seasonName);
    return {
      seasonName: archive.seasonMetadata.name,
      seasonNumber: archive.seasonMetadata.seasonNumber,
      totalGames: archive.seasonMetadata.totalGames,
      totalParticipants: archive.seasonMetadata.totalParticipants,
      totalSubmissions: archive.seasonMetadata.totalSubmissions,
      startDate: archive.seasonMetadata.startDate,
      endDate: archive.seasonMetadata.completedAt,
      archivedAt: archive.archiveInfo.archivedAt,
      archiveVersion: archive.archiveInfo.archiveVersion,
    };
  } catch (error) {
    console.error("Error getting archived season summary:", error);
    throw error;
  }
};

/**
 * Get archived season leaderboard
 */
export const getArchivedSeasonLeaderboard = async (seasonName) => {
  try {
    const archive = await getArchivedSeason(seasonName);

    // Calculate final scores for each participant
    const leaderboard = archive.participants
      .map((participant) => {
        // Find all submissions for this participant
        const participantSubmissions = [];
        archive.submissions.forEach((gameData) => {
          const userSubmission = gameData.submissions.find(
            (sub) => sub.userId === participant.userId
          );
          if (userSubmission) {
            participantSubmissions.push({
              roundNumber: gameData.roundNumber,
              score: userSubmission.score || 0,
              gameId: gameData.gameId,
            });
          }
        });

        const totalScore = participantSubmissions.reduce(
          (sum, sub) => sum + sub.score,
          0
        );

        return {
          userId: participant.userId,
          userName: participant.userName,
          totalScore: totalScore,
          gamesPlayed: participantSubmissions.length,
          gamesCompleted: participantSubmissions.filter((sub) => sub.score > 0)
            .length,
          submissions: participantSubmissions,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore);

    return leaderboard;
  } catch (error) {
    console.error("Error getting archived season leaderboard:", error);
    throw error;
  }
};

/**
 * Get archived season game results
 */
export const getArchivedSeasonGameResults = async (seasonName) => {
  try {
    const archive = await getArchivedSeason(seasonName);

    return archive.roundTables.map((table) => ({
      roundNumber: table.roundNumber,
      gameId: table.gameId,
      gameName: table.gameName,
      startDate: table.startDate,
      endDate: table.endDate,
      participants: table.participants,
      summary: table.summary,
    }));
  } catch (error) {
    console.error("Error getting archived season game results:", error);
    throw error;
  }
};

/**
 * Finish a season - mark as completed and generate final round table if needed
 * Now allows finishing even if not all games are marked as completed
 */
export const finishSeason = async (seasonName, forceComplete = false) => {
  try {
    console.log(`🏁 Finishing season: ${seasonName}`);

    // Get season data
    const season = await getSeason(seasonName);
    if (!season) {
      throw new Error(`Season ${seasonName} not found`);
    }

    // Get all games
    const games = await getSeasonGamesList(seasonName);
    if (games.length === 0) {
      throw new Error("Cannot finish season: no games found");
    }

    // Check if all games are completed (unless forcing)
    const allCompleted = await areAllSeasonGamesCompleted(seasonName);
    if (!allCompleted && !forceComplete) {
      // Show which games are not completed
      const incompleteGames = games.filter(
        (game) => game.status !== "completed"
      );
      const incompleteRounds = incompleteGames
        .map((g) => g.roundNumber)
        .join(", ");
      throw new Error(
        `Cannot finish season: games in rounds ${incompleteRounds} are not completed. Use forceComplete=true to finish anyway.`
      );
    }

    // If forcing completion, complete any remaining games
    if (!allCompleted && forceComplete) {
      console.log(`🔧 Force completing remaining games...`);
      const incompleteGames = games.filter(
        (game) => game.status !== "completed"
      );

      for (const game of incompleteGames) {
        try {
          await manuallyCompleteGame(seasonName, game.roundNumber);
        } catch (error) {
          console.error(`Failed to complete game ${game.roundNumber}:`, error);
        }
      }
    }

    // IMPORTANT: Set ALL games to completed and inactive when finishing the season
    console.log(
      `🔧 Setting all games to completed and inactive for finished season...`
    );
    const updatePromises = games.map(async (game) => {
      try {
        await updateGame(seasonName, game.id, {
          status: "completed",
          isActive: false,
        });
        console.log(`✅ Set game ${game.gameId} to completed and inactive`);
      } catch (error) {
        console.error(`Failed to set game ${game.gameId} to completed:`, error);
      }
    });

    await Promise.all(updatePromises);

    // Get the last game
    const lastGame = games[games.length - 1];

    // Archive the season before marking as completed
    console.log(`📦 Archiving season data for ${seasonName}...`);
    await archiveSeason(seasonName);

    // Mark season as completed
    await updateSeason(seasonName, {
      isActive: false,
      isCompleted: true,
      completedAt: serverTimestamp(),
      finalRoundNumber: lastGame.roundNumber,
    });

    console.log(`✅ Season ${seasonName} finished and archived successfully`);
    return {
      success: true,
      message: `Season ${seasonName} has been finished and archived successfully`,
      finalRoundNumber: lastGame.roundNumber,
      gamesCompleted: allCompleted
        ? "All games were already completed"
        : "Some games were force-completed",
    };
  } catch (error) {
    console.error("Error finishing season:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    throw error;
  }
};

// Helper functions
const getGameDisplayName = (gameId) => {
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
};

/**
 * Get the ranking comparator function for a specific game
 * Implements the priority-based ranking system specified by the user
 */
const getGameRankingComparator = (gameId) => {
  switch (gameId) {
    case "building-blocks":
      // score, hintsUsed, instructionsUsed, submittedAt, answer
      return (a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        if (a.hintsUsed !== b.hintsUsed) return a.hintsUsed - b.hintsUsed;
        if (a.instructionsUsed !== b.instructionsUsed)
          return a.instructionsUsed - b.instructionsUsed;
        if (a.submittedAt && b.submittedAt)
          return a.submittedAt.toDate() - b.submittedAt.toDate();
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
        if (a.submittedAt && b.submittedAt)
          return a.submittedAt.toDate() - b.submittedAt.toDate();
        return 0;
      };

    case "order-chaos":
      // score, hintsUsed, wins, losses, submittedAt
      return (a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        if (a.hintsUsed !== b.hintsUsed) return a.hintsUsed - b.hintsUsed;
        if (a.wins !== b.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        if (a.submittedAt && b.submittedAt)
          return a.submittedAt.toDate() - b.submittedAt.toDate();
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
        if (a.mistakesCount !== b.mistakesCount)
          return a.mistakesCount - b.mistakesCount;
        if (a.submittedAt && b.submittedAt)
          return a.submittedAt.toDate() - b.submittedAt.toDate();
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
        if (a.submittedAt && b.submittedAt)
          return a.submittedAt.toDate() - b.submittedAt.toDate();
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
        if (a.submittedAt && b.submittedAt)
          return a.submittedAt.toDate() - b.submittedAt.toDate();
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
        if (a.submittedAt && b.submittedAt)
          return a.submittedAt.toDate() - b.submittedAt.toDate();
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
        if (a.submittedAt && b.submittedAt)
          return a.submittedAt.toDate() - b.submittedAt.toDate();
        return 0;
      };

    case "sos":
      // playerWins, score, totalAiScore (lower is better), submittedAt
      return (a, b) => {
        if (a.playerWins !== b.playerWins) return b.playerWins - a.playerWins;
        if (a.score !== b.score) return b.score - a.score;
        if (a.totalAiScore !== b.totalAiScore)
          return a.totalAiScore - b.totalAiScore;
        if (a.submittedAt && b.submittedAt)
          return a.submittedAt.toDate() - b.submittedAt.toDate();
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
        if (a.submittedAt && b.submittedAt)
          return a.submittedAt.toDate() - b.submittedAt.toDate();
        return 0;
      };

    default:
      // Default ranking: score, then submittedAt
      return (a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        if (a.submittedAt && b.submittedAt)
          return a.submittedAt.toDate() - b.submittedAt.toDate();
        return 0;
      };
  }
};

const getGameSpecificData = (gameId, submission) => {
  console.log(`🔍 Extracting game-specific data for ${gameId}:`, submission);

  // Strip number suffix from game ID (e.g., "building-blocks1" -> "building-blocks")
  const baseGameId = gameId?.replace(/\d+$/, "") || "";
  console.log(`🔍 Base game ID: ${baseGameId}`);

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
        mistakes: submission.mistakesCount || submission.mistakes || 0, // Fix: use 'mistakes' consistently
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
        const averageTimePerRound =
          totalRounds > 0 ? timeSpent / totalRounds : 0;

        gameData = {
          hintsUsed: submission.hintsUsed || 0,
          accuracy: Math.round(accuracy * 100) / 100,
          mainCorrect: mainCorrect,
          averageTimePerRound: Math.round(averageTimePerRound),
          practiceCorrect: practiceCorrect,
          practiceRounds: practiceRounds,
          mainRounds: mainRounds,
        };
      } else {
        // Use existing calculated fields
        gameData = {
          hintsUsed: submission.hintsUsed || 0,
          accuracy: submission.accuracy || 0,
          mainCorrect: submission.mainCorrect || 0,
          averageTimePerRound: submission.averageTimePerRound || 0,
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

  console.log(
    `✅ Extracted game data for ${gameId} (${baseGameId}):`,
    gameData
  );
  return gameData;
};

const calculateRoundSummary = (participants) => {
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
};

const calculateAverageTime = (times) => {
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
};

/**
 * Initialize totalScores for all participants in a season
 * This pre-populates the scoreboard with all participants at 0 points
 */
export const initializeSeasonTotalScores = async (seasonName, participants) => {
  try {
    console.log(
      `🚀 Initializing total scores for ${participants.length} participants in season ${seasonName}`
    );

    // Prevent duplicate calls by checking if totalScores already exist
    const totalScoresRef = collection(
      notteknekteneDb,
      "seasons",
      seasonName,
      "totalScores"
    );
    const existingSnapshot = await getDocs(totalScoresRef);

    if (existingSnapshot.docs.length > 0) {
      console.log(
        `⚠️ TotalScores already exist for season ${seasonName}. Skipping initialization.`
      );
      return;
    }

    console.log(
      `✅ No existing totalScores found. Proceeding with initialization.`
    );

    // Now create new totalScores entries only for the selected participants
    const batch = writeBatch(notteknekteneDb);

    console.log(
      `👥 Creating totalScores for ${participants.length} participants:`,
      participants.map((p) => ({
        userId: p.userId,
        name: p.displayName || p.userName,
      }))
    );

    for (const participant of participants) {
      const totalScoreRef = doc(
        notteknekteneDb,
        "seasons",
        seasonName,
        "totalScores",
        participant.userId
      );

      const totalScoreData = {
        userId: participant.userId,
        name: participant.displayName || participant.userName,
        userName: participant.displayName || participant.userName,
        userEmail: participant.email,
        avatar: participant.avatar || "male_avatar_portrait_man.png",
        scores: [null, null, null, null, null, null, null, null, null, null], // Array of 10 null scores for R1-R10 (empty cells)
        sum: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      batch.set(totalScoreRef, totalScoreData);
    }

    await batch.commit();
    console.log(
      `✅ Initialized total scores for ${participants.length} participants`
    );
  } catch (error) {
    console.error("Error initializing season total scores:", error);
    console.error("Error details:", error.message, error.stack);
    throw error;
  }
};
