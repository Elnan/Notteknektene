import { useState, useCallback, useRef, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { notteknekteneDb as db } from "../firebase/firebase-config-notteknektene";

// Firebase data handling helpers
const sanitizeForFirebase = (data) => {
  if (data === null || data === undefined) return null;
  if (typeof data === "function") return null;
  if (data instanceof Date) return data;
  if (data instanceof Set) return Array.from(data);
  if (data instanceof Map) return Array.from(data.entries());
  if (Array.isArray(data)) {
    // Check if this is a 2D array (nested arrays)
    if (data.length > 0 && Array.isArray(data[0])) {
      // Flatten 2D array to 1D array with row/col indices
      const flattened = [];
      data.forEach((row, rowIndex) => {
        if (Array.isArray(row)) {
          row.forEach((cell, colIndex) => {
            flattened.push({
              row: rowIndex,
              col: colIndex,
              value: sanitizeForFirebase(cell),
            });
          });
        }
      });
      return flattened;
    }
    // Regular 1D array
    return data.map((item) => sanitizeForFirebase(item));
  }
  if (typeof data === "object" && data.constructor === Object) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      const sanitizedValue = sanitizeForFirebase(value);
      if (sanitizedValue !== null && sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue;
      }
    }
    return sanitized;
  }
  if (typeof data === "number" && (isNaN(data) || !isFinite(data))) {
    return 0;
  }
  return data;
};

const restoreFromFirebase = (data) => {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    // Check if this is a flattened 2D array (has row/col/value structure)
    if (
      data.length > 0 &&
      typeof data[0] === "object" &&
      data[0].hasOwnProperty("row") &&
      data[0].hasOwnProperty("col")
    ) {
      // Reconstruct 2D array from flattened data
      const maxRow = Math.max(...data.map((item) => item.row));
      const maxCol = Math.max(...data.map((item) => item.col));
      const grid = Array(maxRow + 1)
        .fill()
        .map(() => Array(maxCol + 1).fill(null));

      data.forEach((item) => {
        if (item.row !== undefined && item.col !== undefined) {
          grid[item.row][item.col] = restoreFromFirebase(item.value);
        }
      });

      return grid;
    }
    // Regular 1D array
    return data.map((item) => restoreFromFirebase(item));
  }
  if (typeof data === "object" && data.constructor === Object) {
    // Check if it's a Firebase object with numeric keys (converted array)
    const keys = Object.keys(data);
    if (keys.length > 0 && keys.every((key) => /^\d+$/.test(key))) {
      // Convert back to array
      const maxIndex = Math.max(...keys.map(Number));
      const array = new Array(maxIndex + 1);
      for (const [key, value] of Object.entries(data)) {
        array[Number(key)] = restoreFromFirebase(value);
      }
      return array;
    }
    // Regular object
    const restored = {};
    for (const [key, value] of Object.entries(data)) {
      restored[key] = restoreFromFirebase(value);
    }
    return restored;
  }
  return data;
};

// Helper to restore Sets from arrays
const restoreSet = (data) => {
  if (Array.isArray(data)) {
    return new Set(data);
  }
  return data;
};

// Helper to restore Maps from arrays
const restoreMap = (data) => {
  if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
    return new Map(data);
  }
  return data;
};

const flattenCompletedMinigames = (completedMinigames) => {
  if (!completedMinigames || typeof completedMinigames !== "object") {
    return {};
  }

  const flattened = {};
  for (const [key, data] of Object.entries(completedMinigames)) {
    if (data && typeof data === "object") {
      flattened[key] = {
        points: data.points || 0,
        hintUsed: data.hintUsed || 0,
        timeSpent: data.timeSpent || 0,
        completedAt: data.completedAt || Date.now(),
        // Flatten any nested arrays or objects
        ...(data.answers && { answers: sanitizeForFirebase(data.answers) }),
        ...(data.hints && { hints: sanitizeForFirebase(data.hints) }),
        ...(data.attempts && { attempts: sanitizeForFirebase(data.attempts) }),
        // Add complete game state for each mini-game
        ...(data.gameState && {
          gameState: sanitizeForFirebase(data.gameState),
        }),
      };
    }
  }
  return flattened;
};

const restoreCompletedMinigames = (data) => {
  if (!data || typeof data !== "object") {
    return {};
  }

  const restored = {};
  for (const [key, minigameData] of Object.entries(data)) {
    if (minigameData && typeof minigameData === "object") {
      restored[key] = {
        points: minigameData.points || 0,
        hintUsed: minigameData.hintUsed || 0,
        timeSpent: minigameData.timeSpent || 0,
        completedAt: minigameData.completedAt || Date.now(),
        // Restore any nested data
        ...(minigameData.answers && {
          answers: restoreFromFirebase(minigameData.answers),
        }),
        ...(minigameData.hints && {
          hints: restoreFromFirebase(minigameData.hints),
        }),
        ...(minigameData.attempts && {
          attempts: restoreFromFirebase(minigameData.attempts),
        }),
        // Restore complete game state
        ...(minigameData.gameState && {
          gameState: restoreFromFirebase(minigameData.gameState),
        }),
      };
    }
  }
  return restored;
};

const flattenHintsUsed = (hintsUsed) => {
  if (!hintsUsed || typeof hintsUsed !== "object") {
    return {};
  }

  const flattened = {};
  for (const [key, count] of Object.entries(hintsUsed)) {
    flattened[key] = typeof count === "number" ? count : 0;
  }
  return flattened;
};

const restoreHintsUsed = (data) => {
  if (!data || typeof data !== "object") {
    return {};
  }

  const restored = {};
  for (const [key, count] of Object.entries(data)) {
    restored[key] = typeof count === "number" ? count : 0;
  }
  return restored;
};

export const useInvestigationMysterySaveState = (gameId, userId) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const lastSaveStateRef = useRef("");
  const saveTimeoutRef = useRef(null);
  const lastSaveTimeRef = useRef(0);

  // Debounced save function with cooldown
  const debouncedSave = useCallback(
    (gameState) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      const now = Date.now();
      const timeSinceLastSave = now - lastSaveTimeRef.current;
      const cooldownTime = 3000; // 3 seconds cooldown

      const saveDelay =
        timeSinceLastSave < cooldownTime
          ? cooldownTime - timeSinceLastSave
          : 2000; // 2 second delay

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setSaveLoading(true);
          setError(null);

          // Sanitize and flatten data for Firebase
          const sanitizedState = {
            gameState: gameState.gameState || "overview",
            completedMinigames: sanitizeForFirebase(
              flattenCompletedMinigames(gameState.completedMinigames)
            ),
            score: gameState.score || 0,
            hintsUsed: sanitizeForFirebase(
              flattenHintsUsed(gameState.hintsUsed)
            ),
            gameCompleted: gameState.gameCompleted || false,
            isSubmitted: gameState.isSubmitted || false,
            isSubmitting: gameState.isSubmitting || false,
            showSuccessMessage: gameState.showSuccessMessage || false,
            submissionError: gameState.submissionError || null,
            gameStartTime: gameState.gameStartTime || Date.now(),
            // Add submission tracking
            submittedAt: gameState.submittedAt || null,
            submissionData: sanitizeForFirebase(
              gameState.submissionData || null
            ),
            timestamp: Date.now(),
            version: "2.0", // Updated version for enhanced save system
          };

          // Only save if state has actually changed
          const stateString = JSON.stringify(sanitizedState);
          if (lastSaveStateRef.current === stateString) {
            setSaveLoading(false);
            return;
          }

          lastSaveStateRef.current = stateString;
          lastSaveTimeRef.current = Date.now();

          // Debug: Check for nested arrays before saving
          const checkForNestedArrays = (obj, path = "") => {
            if (Array.isArray(obj)) {
              for (let i = 0; i < obj.length; i++) {
                if (Array.isArray(obj[i])) {
                  console.error(
                    `❌ Nested array found at ${path}[${i}]:`,
                    obj[i]
                  );
                  return false;
                }
                if (typeof obj[i] === "object" && obj[i] !== null) {
                  if (!checkForNestedArrays(obj[i], `${path}[${i}]`)) {
                    return false;
                  }
                }
              }
            } else if (typeof obj === "object" && obj !== null) {
              for (const [key, value] of Object.entries(obj)) {
                if (
                  !checkForNestedArrays(value, path ? `${path}.${key}` : key)
                ) {
                  return false;
                }
              }
            }
            return true;
          };

          if (!checkForNestedArrays(sanitizedState)) {
            console.error(
              "❌ Found nested arrays in sanitized state, aborting save"
            );
            setSaveLoading(false);
            return;
          }

          const saveDoc = doc(
            db,
            "users",
            userId,
            "gameSaves",
            `investigation-mystery_${gameId}`
          );
          await setDoc(saveDoc, sanitizedState, { merge: true });

          console.log("Investigation Mystery game state saved successfully");
          setSaveLoading(false);
        } catch (err) {
          console.error("Error saving Investigation Mystery game state:", err);
          setError(err.message);
          setSaveLoading(false);
        }
      }, saveDelay);
    },
    [gameId, userId]
  );

  const saveGameState = useCallback(
    (gameState) => {
      debouncedSave(gameState);
    },
    [debouncedSave]
  );

  const loadGameState = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const saveDoc = doc(
        db,
        "users",
        userId,
        "gameSaves",
        `investigation-mystery_${gameId}`
      );
      const docSnap = await getDoc(saveDoc);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Restore the game state
        const restoredState = {
          gameState: data.gameState || "overview",
          completedMinigames: restoreCompletedMinigames(
            data.completedMinigames
          ),
          score: data.score || 0,
          hintsUsed: restoreHintsUsed(data.hintsUsed),
          gameCompleted: data.gameCompleted || false,
          isSubmitted: data.isSubmitted || false,
          isSubmitting: data.isSubmitting || false,
          showSuccessMessage: data.showSuccessMessage || false,
          submissionError: data.submissionError || null,
          gameStartTime: data.gameStartTime || Date.now(),
          // Restore submission tracking
          submittedAt: data.submittedAt || null,
          submissionData: data.submissionData || null,
        };

        console.log("Investigation Mystery game state loaded successfully");
        return restoredState;
      } else {
        console.log("No saved Investigation Mystery game state found");
        return null;
      }
    } catch (err) {
      console.error("Error loading Investigation Mystery game state:", err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [gameId, userId]);

  const clearSaveState = useCallback(async () => {
    try {
      const saveDoc = doc(
        db,
        "users",
        userId,
        "gameSaves",
        `investigation-mystery_${gameId}`
      );
      await setDoc(saveDoc, {}, { merge: true });
      console.log("Investigation Mystery save state cleared");
    } catch (err) {
      console.error("Error clearing Investigation Mystery save state:", err);
      setError(err.message);
    }
  }, [gameId, userId]);

  const cleanup = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isLoading,
    error,
    saveLoading,
    saveGameState,
    loadGameState,
    clearSaveState,
    cleanup,
  };
};
