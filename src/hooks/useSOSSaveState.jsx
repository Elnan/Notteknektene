import { useState, useCallback, useRef } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { notteknekteneDb } from "../../firebase/firebase-config-notteknektene.js";
import { useAuth } from "../../context/authContext";

const GRID_SIZE = 10;

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

export const useSOSSaveState = (gameId) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const saveTimeoutRef = useRef(null);
  const lastSaveStateRef = useRef(null);

  // Debounced save function to prevent race conditions
  const debouncedSave = useCallback(
    (gameState) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setIsLoading(true);
          setError(null);

          if (!currentUser || !gameId) {
            console.warn("Cannot save: No user or gameId");
            return;
          }

          // Create a deep copy and sanitize the data
          const sanitizedState = {
            grid: sanitizeForFirebase(gameState.grid),
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
            highlightedCells: sanitizeForFirebase(gameState.highlightedCells),
            roundSummaries: sanitizeForFirebase(gameState.roundSummaries),
            capturedBoardImages: sanitizeForFirebase(
              gameState.capturedBoardImages
            ),
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
            `sos_${gameId}`
          );
          await setDoc(saveRef, sanitizedState, { merge: true });

          lastSaveStateRef.current = stateString;
          console.log("SOS game state saved successfully");
        } catch (err) {
          console.error("Error saving SOS game state:", err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }, 500); // 500ms debounce
    },
    [currentUser, gameId]
  );

  // Save function for player/AI moves
  const saveGameState = useCallback(
    (gameState) => {
      // Only save on actual moves, not on UI state changes
      if (gameState.currentPlayer === "player" || gameState.lastMove) {
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
            restoreFromFirebase(data.grid) ||
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
          roundSummaries: restoreFromFirebase(data.roundSummaries) || [],
          capturedBoardImages:
            restoreFromFirebase(data.capturedBoardImages) || [],
        };

        // Ensure grid is properly formatted as 2D array
        if (restoredState.grid && Array.isArray(restoredState.grid)) {
          // If grid is 1D array, convert to 2D
          if (restoredState.grid.length === GRID_SIZE * GRID_SIZE) {
            const newGrid = Array(GRID_SIZE)
              .fill(null)
              .map(() => Array(GRID_SIZE).fill(null));
            for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
              const row = Math.floor(i / GRID_SIZE);
              const col = i % GRID_SIZE;
              newGrid[row][col] = restoredState.grid[i];
            }
            restoredState.grid = newGrid;
          }
        }

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
