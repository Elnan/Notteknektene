import { useState, useCallback, useRef } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { notteknekteneDb } from "../firebase/firebase-config-notteknektene.js";
import { useAuth } from "../context/authContext";

// Helper function to ensure arrays stay as arrays in Firebase
const sanitizeForFirebase = (data) => {
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (Array.isArray(item)) {
        // Handle nested arrays (like 2D board)
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

// Helper function to restore 2D board from Firebase
const restoreBoard = (boardData) => {
  if (
    Array.isArray(boardData) &&
    boardData.length > 0 &&
    Array.isArray(boardData[0])
  ) {
    // Already a 2D array
    return boardData;
  }

  if (Array.isArray(boardData)) {
    // 1D array, need to reconstruct 2D
    const BOARD_SIZE = 6; // Assuming 6x6 board
    const board = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      board[row] = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        const index = row * BOARD_SIZE + col;
        board[row][col] = boardData[index] || null;
      }
    }
    return board;
  }

  return Array(6)
    .fill(null)
    .map(() => Array(6).fill(null));
};

// Helper function to flatten 2D board for Firebase
const flattenBoard = (board) => {
  if (!Array.isArray(board) || board.length === 0) return [];

  return board.flat();
};

// Helper function to flatten roundSummaries for Firebase
const flattenRoundSummaries = (roundSummaries) => {
  if (!Array.isArray(roundSummaries)) return [];

  return roundSummaries.map((summary, index) => ({
    index,
    board: flattenBoard(summary.board || []),
    result: summary.result,
    resultClass: summary.resultClass,
  }));
};

// Helper function to restore roundSummaries from Firebase
const restoreRoundSummaries = (flattenedSummaries) => {
  if (!Array.isArray(flattenedSummaries)) return [];

  return flattenedSummaries.map((summary) => ({
    board: restoreBoard(summary.board),
    result: summary.result,
    resultClass: summary.resultClass,
  }));
};

export const useOrderChaosSaveState = (gameId) => {
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
            board: flattenBoard(gameState.board || []),
            currentPlayer: gameState.currentPlayer,
            selectedSymbol: gameState.selectedSymbol,
            cursorPosition: gameState.cursorPosition,
            gameOver: gameState.gameOver,
            winner: gameState.winner,
            currentRound: gameState.currentRound,
            roundScores: sanitizeForFirebase(gameState.roundScores || []),
            totalScore: gameState.totalScore,
            gameCompleted: gameState.gameCompleted,
            movesCount: gameState.movesCount,
            roundMoves: gameState.roundMoves,
            roundStartTime: gameState.roundStartTime,
            showResultModal: gameState.showResultModal,
            resultMsg: gameState.resultMsg,
            resultClass: gameState.resultClass,
            roundSummaries: flattenRoundSummaries(
              gameState.roundSummaries || []
            ),
            instructionsUsed: gameState.instructionsUsed,
            gameStartTime: gameState.gameStartTime,
            // Save calculated submission data (only if not undefined)
            ...(gameState.submissionWins !== undefined && {
              submissionWins: gameState.submissionWins,
            }),
            ...(gameState.submissionLosses !== undefined && {
              submissionLosses: gameState.submissionLosses,
            }),
            ...(gameState.submissionRounds && {
              submissionRounds: sanitizeForFirebase(gameState.submissionRounds),
            }),
            ...(gameState.submissionFinalScore !== undefined && {
              submissionFinalScore: gameState.submissionFinalScore,
            }),
            ...(gameState.submissionTimeSpent !== undefined && {
              submissionTimeSpent: gameState.submissionTimeSpent,
            }),
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
            `order-chaos_${gameId}`
          );
          await setDoc(saveRef, sanitizedState, { merge: true });

          lastSaveStateRef.current = stateString;
          lastSaveTimeRef.current = Date.now();
          console.log("Order & Chaos game state saved successfully");
        } catch (err) {
          console.error("Error saving Order & Chaos game state:", err);
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
        gameState.movesCount > 0 || // Player made a move
        gameState.gameOver || // Game ended
        gameState.currentRound > 1 || // Round progressed
        gameState.gameCompleted || // Game completed
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
        `order-chaos_${gameId}`
      );
      const docSnap = await getDoc(saveRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Restore arrays from Firebase objects
        const restoredState = {
          board: restoreBoard(data.board),
          currentPlayer: data.currentPlayer || "chaos",
          selectedSymbol: data.selectedSymbol || "X",
          cursorPosition: data.cursorPosition || { row: 0, col: 0 },
          gameOver: data.gameOver || false,
          winner: data.winner,
          currentRound: data.currentRound || 1,
          roundScores: restoreFromFirebase(data.roundScores) || [],
          totalScore: data.totalScore || 0,
          gameCompleted: data.gameCompleted || false,
          movesCount: data.movesCount || 0,
          roundMoves: data.roundMoves || 0,
          roundStartTime: data.roundStartTime || Date.now(),
          showResultModal: data.showResultModal || false,
          resultMsg: data.resultMsg || "",
          resultClass: data.resultClass || "",
          roundSummaries: restoreRoundSummaries(data.roundSummaries) || [],
          instructionsUsed: data.instructionsUsed || false,
          gameStartTime: data.gameStartTime || Date.now(),
          // Restore calculated submission data (with fallbacks)
          submissionWins: data.submissionWins,
          submissionLosses: data.submissionLosses,
          submissionRounds: data.submissionRounds
            ? restoreFromFirebase(data.submissionRounds)
            : undefined,
          submissionFinalScore: data.submissionFinalScore,
          submissionTimeSpent: data.submissionTimeSpent,
        };

        console.log("Order & Chaos game state loaded successfully");
        return restoredState;
      } else {
        console.log("No saved Order & Chaos game state found");
        return null;
      }
    } catch (err) {
      console.error("Error loading Order & Chaos game state:", err);
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
        `order-chaos_${gameId}`
      );
      await setDoc(saveRef, {}, { merge: false });

      lastSaveStateRef.current = null;
      console.log("Order & Chaos game state cleared successfully");
    } catch (err) {
      console.error("Error clearing Order & Chaos game state:", err);
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
