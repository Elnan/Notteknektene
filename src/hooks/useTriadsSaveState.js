import { useState, useCallback, useRef } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { notteknekteneDb } from "../firebase/firebase-config-notteknektene.js";
import { useAuth } from "../context/authContext";

// Helper function to flatten nested arrays for Firebase
const flattenForFirebase = (data) => {
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (Array.isArray(item)) {
        // Flatten nested arrays by converting to objects with numeric keys
        const flattened = {};
        item.forEach((subItem, index) => {
          flattened[index] = subItem;
        });
        return flattened;
      }
      return item;
    });
  }
  return data;
};

// Helper function to ensure arrays stay as arrays in Firebase
const sanitizeForFirebase = (data) => {
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (Array.isArray(item)) {
        // Handle nested arrays (like foundTriads) by flattening them
        return flattenForFirebase([item])[0];
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
        array[parseInt(key)] = data[key];
      });
      return array;
    }
  }
  return data;
};

// Helper function to restore foundTriads with proper structure
const restoreFoundTriads = (foundTriads) => {
  if (!Array.isArray(foundTriads)) return [];

  return foundTriads.map((triad) => {
    if (Array.isArray(triad)) {
      return triad.map((card) => {
        if (card && typeof card === "object") {
          return {
            number: card.number || 1,
            color: card.color || "red",
            shape: card.shape || "circle",
            shading: card.shading || "solid",
          };
        }
        return card;
      });
    } else if (triad && typeof triad === "object") {
      // Handle flattened triad (object with numeric keys)
      const cardArray = [];
      Object.keys(triad).forEach((key) => {
        if (!isNaN(parseInt(key))) {
          const card = triad[key];
          if (card && typeof card === "object") {
            cardArray[parseInt(key)] = {
              number: card.number || 1,
              color: card.color || "red",
              shape: card.shape || "circle",
              shading: card.shading || "solid",
            };
          }
        }
      });
      return cardArray;
    }
    return triad;
  });
};

// Helper function to flatten roundStates for Firebase
const flattenRoundStates = (roundStates) => {
  if (!roundStates || typeof roundStates !== "object") return {};

  const flattened = {};
  Object.keys(roundStates).forEach((key) => {
    const roundState = roundStates[key];
    if (roundState && typeof roundState === "object") {
      flattened[key] = {
        foundTriads: flattenForFirebase(roundState.foundTriads || []),
        hintsUsed: roundState.hintsUsed || 0,
      };
    }
  });
  return flattened;
};

// Helper function to restore roundStates with proper structure
const restoreRoundStates = (roundStates) => {
  if (!roundStates || typeof roundStates !== "object") return {};

  const restored = {};
  Object.keys(roundStates).forEach((key) => {
    const roundState = roundStates[key];
    if (roundState && typeof roundState === "object") {
      restored[key] = {
        foundTriads: restoreFoundTriads(roundState.foundTriads || []),
        hintsUsed: roundState.hintsUsed || 0,
      };
    }
  });
  return restored;
};

export const useTriadsSaveState = (gameId) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const saveTimeoutRef = useRef(null);
  const lastSaveStateRef = useRef(null);
  const lastSaveTimeRef = useRef(0);

  // Debounced save function to prevent race conditions
  const debouncedSave = useCallback(
    (gameState) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          // Check cooldown - don't save more than once every 3 seconds
          const now = Date.now();
          if (now - lastSaveTimeRef.current < 3000) {
            console.log("Save cooldown active, skipping save");
            setIsLoading(false);
            return;
          }

          setIsLoading(true);
          setError(null);

          if (!currentUser || !gameId) {
            console.warn("Cannot save: No user or gameId");
            return;
          }

          // Create a deep copy and sanitize the data
          const sanitizedState = {
            currentRound: gameState.currentRound,
            selectedCards: sanitizeForFirebase(gameState.selectedCards || []),
            foundTriads: flattenForFirebase(gameState.foundTriads || []),
            moveCount: gameState.moveCount,
            showRules: gameState.showRules,
            showSuccess: gameState.showSuccess,
            showVictory: gameState.showVictory,
            showHintConfirm: gameState.showHintConfirm,
            hintsUsed: gameState.hintsUsed,
            alreadyFoundMessage: gameState.alreadyFoundMessage,
            roundResults: flattenForFirebase(gameState.roundResults || []),
            completedRounds: Array.from(gameState.completedRounds || new Set()),
            roundStates: flattenRoundStates(gameState.roundStates || {}),
            showSubmitConfirm: gameState.showSubmitConfirm,
            showSubmissionSuccess: gameState.showSubmissionSuccess,
            gameStartTime: gameState.gameStartTime,
            completed: gameState.completed,
            score: gameState.score,
            attempts: gameState.attempts,
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
            `triads_${gameId}`
          );
          await setDoc(saveRef, sanitizedState, { merge: true });

          lastSaveStateRef.current = stateString;
          lastSaveTimeRef.current = Date.now();
          console.log("Triads game state saved successfully");
        } catch (err) {
          console.error("Error saving Triads game state:", err);
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
        gameState.selectedCards?.length > 0 || // Player made a selection
        gameState.foundTriads?.length > 0 || // Player found a triad
        gameState.moveCount > 0 || // Player made a move
        gameState.hintsUsed > 0 || // Hint was used
        gameState.completed || // Game completed
        gameState.showSuccess || // Round completed
        gameState.showVictory; // Game victory

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
        `triads_${gameId}`
      );
      const docSnap = await getDoc(saveRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Restore arrays from Firebase objects
        const restoredState = {
          currentRound: data.currentRound || 0,
          selectedCards: restoreFromFirebase(data.selectedCards) || [],
          foundTriads: restoreFoundTriads(data.foundTriads) || [],
          moveCount: data.moveCount || 0,
          showRules: false, // Always start with modal closed
          showSuccess: data.showSuccess || false,
          showVictory: data.showVictory || false,
          showHintConfirm: false, // Always start with hint modal closed
          hintsUsed: data.hintsUsed || 0,
          alreadyFoundMessage: data.alreadyFoundMessage || "",
          roundResults: restoreFromFirebase(data.roundResults) || [],
          completedRounds: new Set(
            restoreFromFirebase(data.completedRounds) || []
          ),
          roundStates: restoreRoundStates(data.roundStates) || {},
          showSubmitConfirm: false, // Always start with submit modal closed
          showSubmissionSuccess: data.showSubmissionSuccess || false,
          gameStartTime: data.gameStartTime || Date.now(),
          completed: data.completed || false,
          score: data.score || 0,
          attempts: data.attempts || 0,
        };

        console.log("Triads game state loaded successfully");
        return restoredState;
      } else {
        console.log("No saved Triads game state found");
        return null;
      }
    } catch (err) {
      console.error("Error loading Triads game state:", err);
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
        `triads_${gameId}`
      );
      await setDoc(saveRef, {}, { merge: false });

      lastSaveStateRef.current = null;
      console.log("Triads game state cleared successfully");
    } catch (err) {
      console.error("Error clearing Triads game state:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, gameId]);

  // Cleanup timeout on unmount
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
