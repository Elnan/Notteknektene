import { useState, useCallback, useRef } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { notteknekteneDb } from "../firebase/firebase-config-notteknektene.js";
import { useAuth } from "../context/authContext";

const GRID_SIZE = 10;

// Helper function to flatten 2D grid to 1D for Firebase storage
const flattenGrid = (grid) => {
  if (Array.isArray(grid) && grid.length > 0 && Array.isArray(grid[0])) {
    // 2D array - flatten to 1D
    return grid.flat();
  }
  return grid;
};

// Helper function to reconstruct 2D grid from 1D array
const reconstructGrid = (flatGrid, size = GRID_SIZE) => {
  if (Array.isArray(flatGrid) && flatGrid.length === size * size) {
    // 1D array - reconstruct to 2D
    const grid = [];
    for (let row = 0; row < size; row++) {
      grid[row] = [];
      for (let col = 0; col < size; col++) {
        grid[row][col] = flatGrid[row * size + col];
      }
    }
    return grid;
  }
  return flatGrid;
};

// Helper function to ensure arrays stay as arrays in Firebase
const sanitizeForFirebase = (data) => {
  if (Array.isArray(data)) {
    return data.map((item) =>
      Array.isArray(item) ? item.map((cell) => cell) : item
    );
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

// Helper function to restore round summaries with reconstructed boards
const restoreRoundSummaries = (roundSummaries) => {
  if (!Array.isArray(roundSummaries)) return [];

  return roundSummaries.map((summary) => {
    if (summary && summary.board && Array.isArray(summary.board)) {
      // If board is flattened (1D array), reconstruct to 2D
      if (summary.board.length === GRID_SIZE * GRID_SIZE) {
        const reconstructedBoard = [];
        for (let row = 0; row < GRID_SIZE; row++) {
          reconstructedBoard[row] = [];
          for (let col = 0; col < GRID_SIZE; col++) {
            reconstructedBoard[row][col] = summary.board[row * GRID_SIZE + col];
          }
        }
        return {
          ...summary,
          board: reconstructedBoard,
        };
      }
    }
    return summary;
  });
};

export const useSOSSaveState = (gameId) => {
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
            grid: flattenGrid(gameState.grid), // Flatten 2D grid to 1D for Firebase
            currentPlayer: gameState.currentPlayer,
            selectedSymbol: gameState.selectedSymbol,
            cursorPosition: gameState.cursorPosition,
            playerScore: gameState.playerScore,
            aiScore: gameState.aiScore,
            roundWins: gameState.roundWins,
            currentRound: gameState.currentRound,
            gamePhase: gameState.gamePhase,
            lastMove: gameState.lastMove,
            hintUsed: gameState.hintUsed,
            instructionsUsed: gameState.instructionsUsed,
            highlightedCells: Array.isArray(gameState.highlightedCells)
              ? gameState.highlightedCells.flat()
              : [],
            roundSummaries: Array.isArray(gameState.roundSummaries)
              ? gameState.roundSummaries.map((summary) => ({
                  ...summary,
                  board: Array.isArray(summary.board)
                    ? summary.board.flat()
                    : summary.board,
                }))
              : [],
            capturedBoardImages: Array.isArray(gameState.capturedBoardImages)
              ? gameState.capturedBoardImages.flat()
              : [],
            timestamp: Date.now(),
            version: "1.0",
          };

          // Debug: Check for nested arrays
          const hasNestedArrays = (obj, path = "") => {
            if (Array.isArray(obj)) {
              return obj.some((item, index) => {
                if (Array.isArray(item)) {
                  console.error(
                    `Nested array found at ${path}[${index}]:`,
                    item
                  );
                  return true;
                }
                return hasNestedArrays(item, `${path}[${index}]`);
              });
            }
            if (obj && typeof obj === "object") {
              return Object.keys(obj).some((key) =>
                hasNestedArrays(obj[key], `${path}.${key}`)
              );
            }
            return false;
          };

          if (hasNestedArrays(sanitizedState, "sanitizedState")) {
            console.error(
              "Nested arrays detected in sanitized state:",
              sanitizedState
            );
            setIsLoading(false);
            return;
          }

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
            `sos_${gameId}`
          );
          await setDoc(saveRef, sanitizedState, { merge: true });

          lastSaveStateRef.current = stateString;
          lastSaveTimeRef.current = Date.now();
          console.log("SOS game state saved successfully");
        } catch (err) {
          console.error("Error saving SOS game state:", err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }, 2000); // 2 second debounce to prevent rate limiting
    },
    [currentUser, gameId]
  );

  // Save function for player/AI moves
  const saveGameState = useCallback(
    (gameState) => {
      // Only save on important state changes to reduce Firebase load
      const shouldSave =
        gameState.lastMove || // Player/AI made a move
        gameState.gamePhase === "roundEnd" || // Round completed
        gameState.gamePhase === "gameEnd" || // Game completed
        gameState.hintUsed || // Hint was used
        gameState.instructionsUsed; // Instructions were used

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
        `sos_${gameId}`
      );
      const docSnap = await getDoc(saveRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Restore arrays from Firebase objects
        const restoredState = {
          grid:
            reconstructGrid(restoreFromFirebase(data.grid)) ||
            Array(GRID_SIZE)
              .fill(null)
              .map(() => Array(GRID_SIZE).fill(null)),
          currentPlayer: data.currentPlayer || "player",
          selectedSymbol: data.selectedSymbol || "S",
          cursorPosition: data.cursorPosition || { row: 0, col: 0 },
          playerScore: data.playerScore || 0,
          aiScore: data.aiScore || 0,
          roundWins: data.roundWins || { player: 0, ai: 0 },
          currentRound: data.currentRound || 1,
          gamePhase: data.gamePhase || "playing",
          lastMove: data.lastMove || null,
          hintUsed: data.hintUsed || false,
          instructionsUsed: data.instructionsUsed || false,
          highlightedCells: restoreFromFirebase(data.highlightedCells) || [],
          roundSummaries:
            restoreRoundSummaries(restoreFromFirebase(data.roundSummaries)) ||
            [],
          capturedBoardImages:
            restoreFromFirebase(data.capturedBoardImages) || [],
        };

        console.log("SOS game state loaded successfully");
        return restoredState;
      } else {
        console.log("No saved SOS game state found");
        return null;
      }
    } catch (err) {
      console.error("Error loading SOS game state:", err);
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
        `sos_${gameId}`
      );
      await setDoc(saveRef, {}, { merge: false });

      lastSaveStateRef.current = null;
      console.log("SOS game state cleared successfully");
    } catch (err) {
      console.error("Error clearing SOS game state:", err);
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
