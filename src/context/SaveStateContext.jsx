import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { useAuth } from "./authContext";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { notteknekteneApp } from "../firebase/firebase-config-notteknektene";
import {
  serializeGameState,
  deserializeGameState,
  validateGameState,
  prepareSaveData,
} from "../utils/saveStateUtils";

const SaveStateContext = createContext();

export const useSaveState = () => {
  const context = useContext(SaveStateContext);
  if (!context) {
    throw new Error("useSaveState must be used within a SaveStateProvider");
  }
  return context;
};

export const SaveStateProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [saveStates, setSaveStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastSaveTime, setLastSaveTime] = useState({});

  const db = getFirestore(notteknekteneApp);

  // Load all save states for the current user
  useEffect(() => {
    if (currentUser) {
      loadAllSaveStates();
    } else {
      setSaveStates({});
      setLoading(false);
    }
  }, [currentUser]);

  const loadAllSaveStates = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Get current season using the proper function
      const { getCurrentSeason } = await import(
        "../firebase/new-database-utils.js"
      );
      const season = await getCurrentSeason();

      if (!season) {
        console.warn("No active season found");
        setLoading(false);
        return;
      }

      const seasonId = season.id;

      // Get all games in the season
      const gamesCollection = collection(db, "seasons", seasonId, "games");
      const gamesSnapshot = await getDocs(gamesCollection);

      const allSaveStates = {};
      const saveTimes = {};

      for (const gameDoc of gamesSnapshot.docs) {
        const gameId = gameDoc.id;
        const gameData = gameDoc.data();

        // Get user's save state for this game
        const userSaveStateDoc = await getDoc(
          doc(
            db,
            "seasons",
            seasonId,
            "games",
            gameId,
            "users",
            currentUser.uid
          )
        );

        if (userSaveStateDoc.exists()) {
          const saveData = userSaveStateDoc.data();
          allSaveStates[gameId] = {
            ...saveData,
            gameId,
            seasonId,
            lastModified: saveData.lastModified?.toDate?.() || new Date(),
          };
          saveTimes[gameId] = saveData.lastModified?.toDate?.() || new Date();
        }
      }

      setSaveStates(allSaveStates);
      setLastSaveTime(saveTimes);
    } catch (error) {
      console.error("Error loading save states:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save game state
  const saveGameState = useCallback(
    async (gameId, gameState, options = {}) => {
      if (!currentUser) {
        console.warn("Cannot save game state: No user logged in");
        return false;
      }

      // Validate game state before saving
      if (!validateGameState(gameState)) {
        console.warn("Invalid game state, cannot save");
        return false;
      }

      // Get current season using the proper function
      const { getCurrentSeason } = await import(
        "../firebase/new-database-utils.js"
      );
      const season = await getCurrentSeason();

      console.log("🔍 SaveStateContext - Current season:", season);

      if (!season) {
        console.warn("No active season found for saving");
        return false;
      }

      const seasonId = season.id;

      try {
        const now = new Date();

        // Debug: Log the path we're trying to write to
        const savePath = `seasons/${seasonId}/games/${gameId}/users/${currentUser.uid}`;
        console.log("Attempting to save to path:", savePath);
        console.log("Current user:", currentUser.uid);
        console.log("Season ID:", seasonId);
        console.log("Game ID:", gameId);

        // Serialize the game state
        const serializedGameState = serializeGameState(gameState);

        const saveData = {
          userId: currentUser.uid,
          userName: currentUser.displayName || currentUser.email,
          userEmail: currentUser.email,
          gameId,
          seasonId,
          gameState: serializedGameState,
          lastModified: now,
          openedAt: options.openedAt || now,
          timeSpent: options.timeSpent || 0,
          hintsUsed: options.hintsUsed || 0,
          attempts: options.attempts || 0,
          completed: options.completed || false,
          score: options.score || null,
          answer: options.answer || null,
          submittedAt: options.submittedAt || null,
          autoSave: options.autoSave || false,
        };

        // Save to Firebase
        await setDoc(
          doc(
            db,
            "seasons",
            seasonId,
            "games",
            gameId,
            "users",
            currentUser.uid
          ),
          saveData
        );

        // Update local state
        setSaveStates((prev) => ({
          ...prev,
          [gameId]: saveData,
        }));

        setLastSaveTime((prev) => ({
          ...prev,
          [gameId]: now,
        }));

        return true;
      } catch (error) {
        console.error("Error saving game state:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          gameId,
          userId: currentUser?.uid,
          seasonId,
        });
        return false;
      }
    },
    [currentUser]
  );

  // Load game state
  const loadGameState = useCallback(
    async (gameId) => {
      if (!currentUser) {
        console.warn("Cannot load game state: No user logged in");
        return null;
      }

      // Get current season using the proper function
      const { getCurrentSeason } = await import(
        "../firebase/new-database-utils.js"
      );
      const season = await getCurrentSeason();

      if (!season) {
        console.warn("No active season found for loading");
        return null;
      }

      const seasonId = season.id;

      try {
        const saveStateDoc = await getDoc(
          doc(
            db,
            "seasons",
            seasonId,
            "games",
            gameId,
            "users",
            currentUser.uid
          )
        );

        if (saveStateDoc.exists()) {
          const saveData = saveStateDoc.data();
          // Deserialize the game state
          const deserializedState = deserializeGameState(saveData.gameState);
          return deserializedState;
        }

        return null;
      } catch (error) {
        console.error("Error loading game state:", error);
        console.error("Load error details:", {
          code: error.code,
          message: error.message,
          gameId,
          userId: currentUser?.uid,
          seasonId,
        });
        return null;
      }
    },
    [currentUser]
  );

  // Delete save state
  const deleteSaveState = async (gameId) => {
    if (!currentUser) return false;

    // Get current season dynamically
    const possibleSeasons = ["Test5", "SeasonTest", "Season1", "Season2"];
    let seasonId = null;

    for (const seasonName of possibleSeasons) {
      const seasonDoc = await getDoc(doc(db, "seasons", seasonName));
      if (seasonDoc.exists()) {
        seasonId = seasonDoc.id;
        break;
      }
    }

    if (!seasonId) {
      console.warn("No active season found for deleting");
      return false;
    }

    try {
      await deleteDoc(
        doc(db, "seasons", seasonId, "games", gameId, "users", currentUser.uid)
      );

      // Update local state
      setSaveStates((prev) => {
        const newStates = { ...prev };
        delete newStates[gameId];
        return newStates;
      });

      setLastSaveTime((prev) => {
        const newTimes = { ...prev };
        delete newTimes[gameId];
        return newTimes;
      });

      console.log(`Save state deleted for ${gameId}`);
      return true;
    } catch (error) {
      console.error("Error deleting save state:", error);
      return false;
    }
  };

  // Check if user has a save state for a game
  const hasSaveState = (gameId) => {
    return saveStates[gameId] !== undefined;
  };

  // Get save state info (without the actual game state)
  const getSaveStateInfo = (gameId) => {
    return saveStates[gameId]
      ? {
          lastModified: saveStates[gameId].lastModified,
          timeSpent: saveStates[gameId].timeSpent,
          hintsUsed: saveStates[gameId].hintsUsed,
          attempts: saveStates[gameId].attempts,
          completed: saveStates[gameId].completed,
          score: saveStates[gameId].score,
          openedAt: saveStates[gameId].openedAt,
        }
      : null;
  };

  // Auto-save wrapper function
  const autoSave = async (gameId, gameState, options = {}) => {
    return await saveGameState(gameId, gameState, {
      ...options,
      autoSave: true,
    });
  };

  // Get all save states for the current user
  const getAllSaveStates = () => {
    return saveStates;
  };

  // Check if a game is in progress (has save state but not completed)
  const isGameInProgress = (gameId) => {
    const saveState = saveStates[gameId];
    return saveState && !saveState.completed;
  };

  // Get games that are in progress
  const getInProgressGames = () => {
    return Object.keys(saveStates).filter((gameId) => isGameInProgress(gameId));
  };

  const value = {
    saveStates,
    loading,
    lastSaveTime,
    saveGameState,
    loadGameState,
    deleteSaveState,
    hasSaveState,
    getSaveStateInfo,
    autoSave,
    getAllSaveStates,
    isGameInProgress,
    getInProgressGames,
    refreshSaveStates: loadAllSaveStates,
  };

  return (
    <SaveStateContext.Provider value={value}>
      {children}
    </SaveStateContext.Provider>
  );
};
