import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { notteknekteneDb } from "./firebase-config-notteknektene.js";
import { games as defaultGames } from "../utils/gamesConfig.js";

/**
 * Migration script to move existing data to new hierarchical structure
 * Run this once to migrate all existing data
 */
export const migrateToNewStructure = async (seasonName = "SeasonTest") => {
  console.log("Starting migration to new structure...");

  try {
    // Step 1: Create the new season
    await createNewSeason(seasonName);
    console.log("✅ Created new season:", seasonName);

    // Step 2: Migrate games
    await migrateGames(seasonName);
    console.log("✅ Migrated games");

    // Step 3: Migrate user submissions
    await migrateUserSubmissions(seasonName);
    console.log("✅ Migrated user submissions");

    // Step 4: Migrate participants
    await migrateParticipants(seasonName);
    console.log("✅ Migrated participants");

    // Step 5: Calculate scores
    await calculateAllScores(seasonName);
    console.log("✅ Calculated all scores");

    console.log("🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

/**
 * Create a new season document
 */
const createNewSeason = async (seasonName) => {
  const seasonData = {
    name: seasonName,
    seasonNumber: 1,
    isActive: true,
    currentRound: 1,
    totalRounds: defaultGames.length,
    startDate: serverTimestamp(),
    description: "Migrated season from old structure",
  };

  const seasonRef = doc(notteknekteneDb, "seasons", seasonName);

  // Ensure no undefined values in season data
  const safeSeasonData = { ...seasonData };
  Object.keys(safeSeasonData).forEach((key) => {
    if (safeSeasonData[key] === undefined) {
      safeSeasonData[key] = null;
    }
  });

  await setDoc(seasonRef, {
    ...safeSeasonData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Migrate games to new structure
 */
const migrateGames = async (seasonName) => {
  // Get existing games from old structure
  const oldGamesRef = collection(notteknekteneDb, "games");
  const oldGamesSnapshot = await getDocs(oldGamesRef);

  for (let i = 0; i < defaultGames.length; i++) {
    const game = defaultGames[i];
    const gameId = `${game.id}${i + 1}`;

    // Find existing game data
    const existingGame = oldGamesSnapshot.docs.find(
      (doc) => doc.data().gameId === game.id || doc.data().roundNumber === i + 1
    );

    const gameData = {
      gameId: game.id,
      roundNumber: i + 1,
      status: existingGame
        ? existingGame.data().status || "upcoming"
        : "upcoming",
      isActive: existingGame ? existingGame.data().isActive || false : i === 0, // First game active by default
      releasedAt: existingGame ? existingGame.data().releasedAt : null,
      config: existingGame ? existingGame.data().config || {} : {},
    };

    const gameRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games",
      gameId
    );
    await setDoc(gameRef, {
      ...gameData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};

/**
 * Migrate user submissions to new structure
 */
const migrateUserSubmissions = async (seasonName) => {
  // Get existing submissions from old structure
  const oldSubmissionsRef = collection(notteknekteneDb, "submissions");
  const oldSubmissionsSnapshot = await getDocs(oldSubmissionsRef);

  // Get existing task openings from old structure
  const oldTaskOpeningsRef = collection(notteknekteneDb, "taskOpenings");
  const oldTaskOpeningsSnapshot = await getDocs(oldTaskOpeningsRef);

  // Group submissions by user and game
  const submissionsByUser = {};

  oldSubmissionsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const userId = data.userId || data.user?.uid;
    const gameId = data.gameId || data.taskId;
    const roundNumber = data.roundNumber;

    if (!submissionsByUser[userId]) {
      submissionsByUser[userId] = {};
    }

    if (!submissionsByUser[userId][gameId]) {
      submissionsByUser[userId][gameId] = {};
    }

    submissionsByUser[userId][gameId][roundNumber] = data;
  });

  // Group task openings by user and game
  const openingsByUser = {};

  oldTaskOpeningsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const userId = data.userId || data.user?.uid;
    const taskId = data.taskId;

    if (!openingsByUser[userId]) {
      openingsByUser[userId] = {};
    }

    if (!openingsByUser[userId][taskId]) {
      openingsByUser[userId][taskId] = data;
    }
  });

  // Migrate to new structure
  for (const [userId, userGames] of Object.entries(submissionsByUser)) {
    for (const [gameId, gameRounds] of Object.entries(userGames)) {
      for (const [roundNumber, submission] of Object.entries(gameRounds)) {
        const newGameId = `${gameId}${roundNumber}`;
        const opening = openingsByUser[userId]?.[gameId];

        const userData = {
          userId,
          userName:
            submission.userName ||
            submission.user?.displayName ||
            "Unknown User",
          userEmail: submission.userEmail || submission.user?.email || "",
          openedAt: opening?.openedAt || submission.submittedAt,
          submittedAt: submission.submittedAt,
          score: submission.score || 0,
          answer: submission.answer || submission.submission || "",
          attempts: submission.attempts || 1,
          timeSpent: submission.timeSpent || 0,
          hintsUsed: submission.hintsUsed || 0,
          completed: !!submission.submittedAt,
        };

        // Ensure no undefined values
        Object.keys(userData).forEach((key) => {
          if (userData[key] === undefined) {
            userData[key] = null;
          }
        });

        const userRef = doc(
          notteknekteneDb,
          "seasons",
          seasonName,
          "games",
          newGameId,
          "users",
          userId
        );
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  }
};

/**
 * Migrate participants to new structure
 */
const migrateParticipants = async (seasonName) => {
  // Get existing users from old structure
  const oldUsersRef = collection(notteknekteneDb, "users");
  const oldUsersSnapshot = await getDocs(oldUsersRef);

  for (const userDoc of oldUsersSnapshot.docs) {
    const userData = userDoc.data();

    if (userData.Participating) {
      const participantData = {
        userId: userDoc.id,
        userName: userData.name || userData.displayName || "Unknown User",
        userEmail: userData.email || "",
        participating: true,
        joinedAt: userData.createdAt || serverTimestamp(),
        totalScore: 0, // Will be calculated later
        gamesPlayed: 0, // Will be calculated later
        gamesCompleted: 0, // Will be calculated later
      };

      // Ensure no undefined values
      Object.keys(participantData).forEach((key) => {
        if (participantData[key] === undefined) {
          participantData[key] = null;
        }
      });

      const participantRef = doc(
        notteknekteneDb,
        "seasons",
        seasonName,
        "participants",
        userDoc.id
      );
      await setDoc(participantRef, {
        ...participantData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
};

/**
 * Calculate scores for all participants
 */
const calculateAllScores = async (seasonName) => {
  const participantsRef = collection(
    notteknekteneDb,
    "seasons",
    seasonName,
    "participants"
  );
  const participantsSnapshot = await getDocs(participantsRef);

  for (const participantDoc of participantsSnapshot.docs) {
    const userId = participantDoc.id;
    await calculateUserScore(seasonName, userId);
  }
};

/**
 * Calculate score for a specific user
 */
const calculateUserScore = async (seasonName, userId) => {
  const gamesRef = collection(notteknekteneDb, "seasons", seasonName, "games");
  const gamesSnapshot = await getDocs(gamesRef);

  let totalScore = 0;
  let gamesPlayed = 0;
  let gamesCompleted = 0;

  for (const gameDoc of gamesSnapshot.docs) {
    const userRef = doc(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games",
      gameDoc.id,
      "users",
      userId
    );
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.openedAt) {
        gamesPlayed++;
        if (userData.completed && userData.score) {
          totalScore += userData.score;
          gamesCompleted++;
        }
      }
    }
  }

  // Update participant record
  const participantRef = doc(
    notteknekteneDb,
    "seasons",
    seasonName,
    "participants",
    userId
  );
  await updateDoc(participantRef, {
    totalScore,
    gamesPlayed,
    gamesCompleted,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Verify migration was successful
 */
export const verifyMigration = async (seasonName = "SeasonTest") => {
  console.log("Verifying migration...");

  try {
    // Check season exists
    const seasonRef = doc(notteknekteneDb, "seasons", seasonName);
    const seasonDoc = await getDoc(seasonRef);
    console.log("✅ Season exists:", seasonDoc.exists());

    // Check games exist
    const gamesRef = collection(
      notteknekteneDb,
      "seasons",
      seasonName,
      "games"
    );
    const gamesSnapshot = await getDocs(gamesRef);
    console.log("✅ Games count:", gamesSnapshot.size);

    // Check participants exist
    const participantsRef = collection(
      notteknekteneDb,
      "seasons",
      seasonName,
      "participants"
    );
    const participantsSnapshot = await getDocs(participantsRef);
    console.log("✅ Participants count:", participantsSnapshot.size);

    // Check user submissions exist
    let totalSubmissions = 0;
    for (const gameDoc of gamesSnapshot.docs) {
      const usersRef = collection(
        notteknekteneDb,
        "seasons",
        seasonName,
        "games",
        gameDoc.id,
        "users"
      );
      const usersSnapshot = await getDocs(usersRef);
      totalSubmissions += usersSnapshot.size;
    }
    console.log("✅ Total user submissions:", totalSubmissions);

    console.log("🎉 Migration verification completed!");
  } catch (error) {
    console.error("❌ Migration verification failed:", error);
    throw error;
  }
};

/**
 * Rollback migration (if needed)
 */
export const rollbackMigration = async (seasonName = "SeasonTest") => {
  console.log("Rolling back migration...");

  try {
    const seasonRef = doc(notteknekteneDb, "seasons", seasonName);
    await deleteDoc(seasonRef);
    console.log("✅ Migration rolled back successfully!");
  } catch (error) {
    console.error("❌ Rollback failed:", error);
    throw error;
  }
};
