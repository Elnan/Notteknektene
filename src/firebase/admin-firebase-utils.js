import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { notteknekteneDb } from "./firebase-config-notteknektene.js";

// ===== USER MANAGEMENT =====

export const getAllUsers = async () => {
  const usersCollection = collection(notteknekteneDb, "users");
  const usersSnapshot = await getDocs(usersCollection);
  return usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const updateUserAdminStatus = async (userId, isAdmin) => {
  const userRef = doc(notteknekteneDb, "users", userId);
  await updateDoc(userRef, {
    isAdmin: isAdmin,
    updatedAt: serverTimestamp(),
  });
};

export const updateUserParticipation = async (userId, participating) => {
  const userRef = doc(notteknekteneDb, "users", userId);
  await updateDoc(userRef, {
    Participating: participating,
    updatedAt: serverTimestamp(),
  });
};

export const deleteUser = async (userId) => {
  const userRef = doc(notteknekteneDb, "users", userId);
  await deleteDoc(userRef);
};

// ===== SEASON MANAGEMENT =====

export const createSeason = async (seasonData) => {
  const seasonsCollection = collection(notteknekteneDb, "seasons");
  const seasonRef = await addDoc(seasonsCollection, {
    ...seasonData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return seasonRef.id;
};

export const getCurrentSeason = async () => {
  const seasonsCollection = collection(notteknekteneDb, "seasons");
  const q = query(seasonsCollection, where("isActive", "==", true), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  };
};

export const updateSeason = async (seasonId, updates) => {
  const seasonRef = doc(notteknekteneDb, "seasons", seasonId);
  await updateDoc(seasonRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const getAllSeasons = async () => {
  const seasonsCollection = collection(notteknekteneDb, "seasons");
  const q = query(seasonsCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// ===== GAME MANAGEMENT =====

export const updateGameSchedule = async (seasonId, gameId, scheduleData) => {
  const gameRef = doc(notteknekteneDb, `seasons/${seasonId}/games`, gameId);
  await updateDoc(gameRef, {
    ...scheduleData,
    updatedAt: serverTimestamp(),
  });
};

export const setLiveGame = async (seasonId, gameId) => {
  const batch = writeBatch(notteknekteneDb);

  // Set all games to inactive
  const gamesCollection = collection(
    notteknekteneDb,
    `seasons/${seasonId}/games`
  );
  const gamesSnapshot = await getDocs(gamesCollection);

  gamesSnapshot.docs.forEach((gameDoc) => {
    const gameRef = doc(
      notteknekteneDb,
      `seasons/${seasonId}/games`,
      gameDoc.id
    );
    batch.update(gameRef, { isLive: false });
  });

  // Set the selected game to live
  const liveGameRef = doc(notteknekteneDb, `seasons/${seasonId}/games`, gameId);
  batch.update(liveGameRef, {
    isLive: true,
    activatedAt: serverTimestamp(),
  });

  await batch.commit();
};

export const getLiveGame = async (seasonId) => {
  const gamesCollection = collection(
    notteknekteneDb,
    `seasons/${seasonId}/games`
  );
  const q = query(gamesCollection, where("isLive", "==", true), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  };
};

// ===== SCORE MANAGEMENT =====

export const overrideUserScore = async (userId, gameId, newScore, reason) => {
  const scoreRef = doc(notteknekteneDb, `users/${userId}/scores`, gameId);

  // Create score override record
  const overrideData = {
    originalScore: null, // Will be filled if score exists
    newScore: newScore,
    reason: reason,
    overriddenBy: "admin", // TODO: Get actual admin user
    overriddenAt: serverTimestamp(),
  };

  // Check if score already exists
  const existingScore = await getDoc(scoreRef);
  if (existingScore.exists()) {
    overrideData.originalScore = existingScore.data().score;
  }

  // Update the score
  await setDoc(
    scoreRef,
    {
      score: newScore,
      isOverridden: true,
      overrideData: overrideData,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Log the override
  const overrideLogRef = doc(collection(notteknekteneDb, "scoreOverrides"));
  await setDoc(overrideLogRef, {
    userId: userId,
    gameId: gameId,
    ...overrideData,
  });
};

export const getScoreOverrides = async (userId = null) => {
  const overridesCollection = collection(notteknekteneDb, "scoreOverrides");
  let q = query(overridesCollection, orderBy("overriddenAt", "desc"));

  if (userId) {
    q = query(
      overridesCollection,
      where("userId", "==", userId),
      orderBy("overriddenAt", "desc")
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const getUserScores = async (userId) => {
  const scoresCollection = collection(
    notteknekteneDb,
    `users/${userId}/scores`
  );
  const snapshot = await getDocs(scoresCollection);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// ===== GAME CONFIGURATION =====

// ===== ANALYTICS =====

export const getSeasonStats = async (seasonId) => {
  const usersCollection = collection(notteknekteneDb, "users");
  const q = query(usersCollection, where("Participating", "==", true));
  const usersSnapshot = await getDocs(q);

  const stats = {
    totalParticipants: usersSnapshot.size,
    activeParticipants: 0,
    totalSubmissions: 0,
    averageScore: 0,
  };

  let totalScore = 0;
  let submissionCount = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();

    // Check if user has been active in the last 7 days
    if (
      userData.lastActive &&
      userData.lastActive.toDate() >
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ) {
      stats.activeParticipants++;
    }

    // Get user's scores for this season
    const scoresCollection = collection(
      notteknekteneDb,
      `users/${userId}/scores`
    );
    const scoresSnapshot = await getDocs(scoresCollection);

    scoresSnapshot.docs.forEach((scoreDoc) => {
      const scoreData = scoreDoc.data();
      if (scoreData.seasonId === seasonId) {
        totalScore += scoreData.score || 0;
        submissionCount++;
      }
    });
  }

  stats.totalSubmissions = submissionCount;
  stats.averageScore = submissionCount > 0 ? totalScore / submissionCount : 0;

  return stats;
};

// ===== UTILITY FUNCTIONS =====

export const getNextMonday = () => {
  const now = new Date();
  const daysUntilMonday = (8 - now.getDay()) % 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
};

export const formatDate = (date) => {
  if (date instanceof Date) {
    return date.toISOString();
  }
  if (date && date.toDate) {
    return date.toDate().toISOString();
  }
  return date;
};

// ===== GAME MANAGEMENT =====

export const getAllGames = async () => {
  try {
    // Import the actual games from gamesConfig
    const { games } = await import("../utils/gamesConfig.js");

    // Transform the games to match the expected format
    return games.map((game) => ({
      id: game.id,
      name: game.name,
      description: game.description,
      type: getGameType(game.id),
      difficulty: getGameDifficulty(game.id),
      path: `tasks/season2/${game.id}`,
      icon: getGameIcon(game.id),
    }));
  } catch (error) {
    console.error("Error loading games:", error);
    return [];
  }
};

// Helper functions to determine game metadata
const getGameType = (gameId) => {
  const typeMap = {
    "building-blocks": "Puzzle",
    "number-code": "Puzzle",
    "order-chaos": "Strategy",
    "pattern-solver": "Puzzle",
    "investigation-mystery": "Mystery",
    "logic-grid": "Puzzle",
    "pattern-matrix": "Puzzle",
    "the-keeper": "Memory",
    sos: "Strategy",
    triads: "Puzzle",
  };
  return typeMap[gameId] || "Puzzle";
};

const getGameDifficulty = (gameId) => {
  const difficultyMap = {
    "building-blocks": "Medium",
    "number-code": "Hard",
    "order-chaos": "Medium",
    "pattern-solver": "Medium",
    "investigation-mystery": "Hard",
    "logic-grid": "Medium",
    "pattern-matrix": "Hard",
    "the-keeper": "Easy",
    sos: "Medium",
    triads: "Medium",
  };
  return difficultyMap[gameId] || "Medium";
};

const getGameIcon = (gameId) => {
  const iconMap = {
    "building-blocks": "🧱",
    "number-code": "🔐",
    "order-chaos": "⚖️",
    "pattern-solver": "🎨",
    "investigation-mystery": "🔍",
    "logic-grid": "🧩",
    "pattern-matrix": "🔲",
    "the-keeper": "👁️",
    sos: "🆘",
    triads: "🔺",
  };
  return iconMap[gameId] || "🎮";
};

export const getGameConfig = async (gameId) => {
  try {
    const configRef = doc(notteknekteneDb, "gameConfigs", gameId);
    const configDoc = await getDoc(configRef);

    if (configDoc.exists()) {
      return configDoc.data().config;
    }

    // If no config in database, try to load from file system
    // This would require server-side implementation
    return null;
  } catch (error) {
    console.error("Error getting game config:", error);
    return null;
  }
};

export const saveGameConfig = async (gameId, config) => {
  try {
    const configRef = doc(notteknekteneDb, "gameConfigs", gameId);
    await setDoc(configRef, {
      gameId,
      config,
      updatedAt: serverTimestamp(),
      updatedBy: "admin", // TODO: Get actual admin user
    });
    return true;
  } catch (error) {
    console.error("Error saving game config:", error);
    return false;
  }
};

export const updateSeasonGames = async (seasonId, games) => {
  try {
    const seasonRef = doc(notteknekteneDb, "seasons", seasonId);
    await updateDoc(seasonRef, {
      games,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating season games:", error);
    return false;
  }
};

export const deleteSeason = async (seasonId) => {
  try {
    const seasonRef = doc(notteknekteneDb, "seasons", seasonId);
    await deleteDoc(seasonRef);
    return true;
  } catch (error) {
    console.error("Error deleting season:", error);
    return false;
  }
};

// ===== USER NAME FIXING =====

export const fixMissingUserNames = async () => {
  try {
    const users = await getAllUsers();
    const updates = [];

    for (const user of users) {
      const userData = user;
      let needsUpdate = false;
      let updateData = {};

      // Check if user has no displayName but has email
      if (!userData.displayName && userData.email) {
        // Extract name from email (before @ symbol)
        const emailName = userData.email.split("@")[0];

        // Clean up the name (capitalize first letter, replace dots with spaces)
        const cleanName = emailName
          .split(".")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");

        updateData.displayName = cleanName;
        needsUpdate = true;
      }

      // Also check if name field exists but displayName doesn't
      if (userData.name && !userData.displayName) {
        updateData.displayName = userData.name;
        needsUpdate = true;
      }

      // If we have updates to make, add to the list
      if (needsUpdate) {
        updates.push({
          userId: user.id,
          updateData: {
            ...updateData,
            updatedAt: serverTimestamp(),
            nameFixed: true,
          },
        });
      }
    }

    // Apply updates in batches to avoid conflicts
    const batch = writeBatch(notteknekteneDb);
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit

    for (const update of updates) {
      const userRef = doc(notteknekteneDb, "users", update.userId);
      batch.update(userRef, update.updateData);
      batchCount++;

      // Commit batch when it reaches the limit
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batchCount = 0;
      }
    }

    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
    }

    return {
      success: true,
      updatedUsers: updates.length,
      message: `Successfully updated ${updates.length} user names`,
    };
  } catch (error) {
    console.error("Error fixing user names:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to update user names",
    };
  }
};

export const getUserNameStatus = async () => {
  try {
    const users = await getAllUsers();
    const stats = {
      total: users.length,
      withDisplayName: 0,
      withoutDisplayName: 0,
      withEmailOnly: 0,
      needsFixing: [],
    };

    for (const user of users) {
      if (user.displayName) {
        stats.withDisplayName++;
      } else {
        stats.withoutDisplayName++;

        if (user.email) {
          stats.withEmailOnly++;
          stats.needsFixing.push({
            id: user.id,
            email: user.email,
            currentName: user.displayName || user.name || "No name set",
          });
        }
      }
    }

    return stats;
  } catch (error) {
    console.error("Error getting user name status:", error);
    return null;
  }
};
