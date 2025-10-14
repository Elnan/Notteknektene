import { useState, useCallback, useRef } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { notteknekteneDb } from "../firebase/firebase-config-notteknektene.js";
import { useAuth } from "../context/authContext";

// Helper function to flatten moveHistory for Firebase
const flattenMoveHistory = (moveHistory) => {
  if (!Array.isArray(moveHistory)) return [];

  return moveHistory
    .filter(
      (move) =>
        move &&
        move.from &&
        move.to &&
        Array.isArray(move.from) &&
        Array.isArray(move.to)
    )
    .map((move, index) => ({
      index,
      fromX: move.from[0],
      fromY: move.from[1],
      toX: move.to[0],
      toY: move.to[1],
      moveNumber: move.move,
    }));
};

// Helper function to restore moveHistory from Firebase
const restoreMoveHistory = (flattenedHistory) => {
  if (!Array.isArray(flattenedHistory)) return [];

  return flattenedHistory.map((move) => ({
    from: [move.fromX, move.fromY],
    to: [move.toX, move.toY],
    move: move.moveNumber,
  }));
};

// Helper function to ensure arrays stay as arrays in Firebase
const sanitizeForFirebase = (data) => {
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (Array.isArray(item)) {
        // Handle nested arrays (like moveHistory)
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

export const useKeeperSaveState = (gameId) => {
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
            phase: gameState.phase,
            playerPos: gameState.playerPos,
            keeperPos: gameState.keeperPos,
            moves: gameState.moves,
            visitedCells: Array.from(gameState.visitedCells || new Set()),
            gameWon: gameState.gameWon,
            gameLost: gameState.gameLost,
            attempts: gameState.attempts,
            activatedPlates: Array.from(gameState.activatedPlates || new Set()),
            exitRevealed: gameState.exitRevealed,
            moveHistory: flattenMoveHistory(gameState.moveHistory || []),
            repetitiveMoveCount: gameState.repetitiveMoveCount,
            hintUsed: gameState.hintUsed,
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
            `keeper_${gameId}`
          );
          await setDoc(saveRef, sanitizedState, { merge: true });

          lastSaveStateRef.current = stateString;
          lastSaveTimeRef.current = Date.now();
          console.log("Keeper game state saved successfully");
        } catch (err) {
          console.error("Error saving Keeper game state:", err);
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
        gameState.moves > 0 || // Player made a move
        gameState.attempts > 1 || // Player made an attempt
        gameState.gameWon || // Game won
        gameState.gameLost || // Game lost
        gameState.activatedPlates?.size > 0 || // Pressure plates activated
        gameState.exitRevealed || // Exit revealed
        gameState.hintUsed; // Hint was used

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
        `keeper_${gameId}`
      );
      const docSnap = await getDoc(saveRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Restore arrays from Firebase objects
        const restoredState = {
          phase: data.phase || "game",
          playerPos: data.playerPos || [0, 0],
          keeperPos: data.keeperPos || [6, 6],
          moves: data.moves || 0,
          visitedCells: restoreSet(data.visitedCells),
          gameWon: data.gameWon || false,
          gameLost: data.gameLost || false,
          attempts: data.attempts || 1,
          activatedPlates: restoreSet(data.activatedPlates),
          exitRevealed: data.exitRevealed || false,
          moveHistory: restoreMoveHistory(data.moveHistory) || [],
          repetitiveMoveCount: data.repetitiveMoveCount || 0,
          hintUsed: data.hintUsed || false,
          gameStartTime: data.gameStartTime || Date.now(),
        };

        console.log("Keeper game state loaded successfully");
        return restoredState;
      } else {
        console.log("No saved Keeper game state found");
        return null;
      }
    } catch (err) {
      console.error("Error loading Keeper game state:", err);
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
        `keeper_${gameId}`
      );
      await setDoc(saveRef, {}, { merge: false });

      lastSaveStateRef.current = null;
      console.log("Keeper game state cleared successfully");
    } catch (err) {
      console.error("Error clearing Keeper game state:", err);
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
