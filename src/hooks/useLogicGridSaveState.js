import { useState, useCallback, useRef } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { notteknekteneDb } from "../firebase/firebase-config-notteknektene.js";
import { useAuth } from "../context/authContext";

// Helper function to ensure arrays stay as arrays in Firebase
const sanitizeForFirebase = (data) => {
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (Array.isArray(item)) {
        // Handle nested arrays
        return item.map((subItem) => subItem);
      }
      return item;
    });
  }
  return data;
};

// Helper function to restore arrays from Firebase objects
const restoreFromFirebase = (data) => {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    // Convert object back to array if it has numeric keys
    const keys = Object.keys(data).filter((key) => !isNaN(parseInt(key)));
    if (keys.length > 0) {
      const maxIndex = Math.max(...keys.map((key) => parseInt(key)));
      const array = new Array(maxIndex + 1).fill(null);
      keys.forEach((key) => {
        const index = parseInt(key);
        array[index] = data[key];
      });
      return array;
    }
  }
  return data;
};

// Helper function to restore Set from array
const restoreSet = (data) => {
  if (Array.isArray(data)) {
    return new Set(data);
  }
  return new Set();
};

// Helper function to flatten Set for Firebase
const flattenSet = (set) => {
  if (set instanceof Set) {
    return Array.from(set);
  }
  return [];
};

// Helper function to sanitize gridState object for Firebase
const sanitizeGridState = (gridState) => {
  if (!gridState || typeof gridState !== "object") return {};

  const sanitized = {};
  Object.keys(gridState).forEach((key) => {
    const value = gridState[key];
    // Ensure values are numbers (0, 1, 2)
    if (typeof value === "number" && value >= 0 && value <= 2) {
      sanitized[key] = value;
    }
  });
  return sanitized;
};

export const useLogicGridSaveState = (gameId) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs for debouncing and preventing race conditions
  const saveTimeoutRef = useRef(null);
  const lastSaveStateRef = useRef(null);
  const lastSaveTimeRef = useRef(0);

  // Debounced save function to prevent rate limiting
  const debouncedSave = useCallback(
    (gameState) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setIsLoading(true);
          setError(null);

          if (!currentUser || !gameId) {
            console.warn("Cannot save: No user or gameId");
            setIsLoading(false);
            return;
          }

          // Create a deep copy and sanitize the data
          const sanitizedState = {
            gridState: sanitizeGridState(gameState.gridState || {}),
            selectedClues: Array.from(gameState.selectedClues || new Set()),
            hintsUsed: gameState.hintsUsed || 0,
            gameCompleted: gameState.gameCompleted || false,
            showSolution: gameState.showSolution || false,
            score: gameState.score || 0,
            capturedGridImage: gameState.capturedGridImage || null,
            gameStartTime: gameState.gameStartTime,
            timestamp: Date.now(),
            version: "1.0",
          };

          // Only save if state has actually changed
          const stateString = JSON.stringify(sanitizedState);
          if (lastSaveStateRef.current === stateString) {
            setIsLoading(false);
            return;
          }

          const saveRef = doc(
            notteknekteneDb,
            "users",
            currentUser.uid,
            "gameSaves",
            `logic-grid_${gameId}`
          );
          await setDoc(saveRef, sanitizedState, { merge: true });

          lastSaveStateRef.current = stateString;
          lastSaveTimeRef.current = Date.now();
          console.log("Logic Grid game state saved successfully");
        } catch (err) {
          console.error("Error saving Logic Grid game state:", err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }, 2000); // 2 second debounce to prevent rate limiting
    },
    [currentUser, gameId]
  );

  // Save function for player moves
  const saveGameState = useCallback(
    (gameState) => {
      // Only save on important state changes to reduce Firebase load
      const shouldSave =
        Object.keys(gameState.gridState || {}).length > 0 || // Grid has been modified
        (gameState.selectedClues?.size || 0) > 0 || // Clues have been selected
        gameState.hintsUsed > 0 || // Hint was used
        gameState.gameCompleted || // Game completed
        gameState.showSolution; // Solution is shown

      if (shouldSave) {
        debouncedSave(gameState);
      }
    },
    [debouncedSave]
  );

  // Load function
  const loadGameState = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!currentUser || !gameId) {
        console.warn("Cannot load: No user or gameId");
        return null;
      }

      const saveRef = doc(
        notteknekteneDb,
        "users",
        currentUser.uid,
        "gameSaves",
        `logic-grid_${gameId}`
      );
      const docSnap = await getDoc(saveRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Restore arrays from Firebase objects
        const restoredState = {
          gridState: data.gridState || {},
          selectedClues: restoreSet(data.selectedClues),
          hintsUsed: data.hintsUsed || 0,
          gameCompleted: data.gameCompleted || false,
          showSolution: data.showSolution || false,
          score: data.score || 0,
          capturedGridImage: data.capturedGridImage || null,
          gameStartTime: data.gameStartTime || Date.now(),
        };

        console.log("Logic Grid game state loaded successfully");
        return restoredState;
      } else {
        console.log("No saved Logic Grid game state found");
        return null;
      }
    } catch (err) {
      console.error("Error loading Logic Grid game state:", err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, gameId]);

  // Clear save function
  const clearSaveState = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!currentUser || !gameId) {
        console.warn("Cannot clear: No user or gameId");
        return;
      }

      const saveRef = doc(
        notteknekteneDb,
        "users",
        currentUser.uid,
        "gameSaves",
        `logic-grid_${gameId}`
      );
      await setDoc(saveRef, {}, { merge: false });

      lastSaveStateRef.current = null;
      console.log("Logic Grid game state cleared successfully");
    } catch (err) {
      console.error("Error clearing Logic Grid game state:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, gameId]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  }, []);

  return {
    saveGameState,
    loadGameState,
    clearSaveState,
    isLoading,
    error,
    cleanup,
  };
};
