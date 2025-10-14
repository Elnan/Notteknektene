import { useState, useEffect, useCallback, useRef } from "react";
import { useSaveState } from "../context/SaveStateContext";

/**
 * Custom hook for managing game save states
 * @param {string} gameId - The unique identifier for the game
 * @param {Object} initialState - The initial state for the game
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoSave - Whether to auto-save on state changes
 * @param {number} options.autoSaveInterval - Auto-save interval in milliseconds (default: 30000)
 * @param {boolean} options.saveOnUnload - Whether to save when the component unmounts
 * @param {Function} options.onLoad - Callback when save state is loaded
 * @param {Function} options.onSave - Callback when save state is saved
 * @param {Function} options.onError - Callback when an error occurs
 */
export const useGameSaveState = (gameId, initialState, options = {}) => {
  const {
    autoSave = true,
    autoSaveInterval = 30000,
    saveOnUnload = true,
    onLoad,
    onSave,
    onError,
  } = options;

  const {
    saveGameState,
    loadGameState,
    hasSaveState,
    getSaveStateInfo,
    autoSave: contextAutoSave,
  } = useSaveState();

  const [gameState, setGameState] = useState(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedSave, setHasLoadedSave] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const autoSaveTimeoutRef = useRef(null);
  const lastStateRef = useRef(initialState);

  // Load save state on mount
  useEffect(() => {
    const loadSaveState = async () => {
      try {
        setIsLoading(true);
        setSaveError(null);

        // Always try to load save state, regardless of hasSaveState check
        const savedState = await loadGameState(gameId);

        if (savedState) {
          // Ensure the state is properly applied
          setGameState(savedState);
          setHasLoadedSave(true);
          setLastSaveTime(new Date());

          if (onLoad) {
            onLoad(savedState);
          }
        } else {
          // Ensure initial state is set
          setGameState(initialState);
        }
      } catch (error) {
        console.error(`Error loading save state for ${gameId}:`, error);
        setSaveError(error);
        if (onError) {
          onError(error);
        }
        // Fall back to initial state on error
        setGameState(initialState);
      } finally {
        setIsLoading(false);
      }
    };

    loadSaveState();
  }, [gameId, loadGameState, onLoad, onError]); // Removed initialState from dependencies

  // Auto-save functionality
  const scheduleAutoSave = useCallback(() => {
    if (!autoSave || !autoSaveInterval) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const success = await contextAutoSave(gameId, gameState, {
          timeSpent: getTimeSpent(),
          hintsUsed: gameState.hintsUsed || 0,
          attempts: gameState.attempts || 0,
          completed: gameState.completed || false,
          score: gameState.score || null,
          answer: gameState.answer || null,
        });

        if (success) {
          setLastSaveTime(new Date());
          if (onSave) {
            onSave(gameState);
          }
        }
      } catch (error) {
        console.error(`Auto-save error for ${gameId}:`, error);
        setSaveError(error);
        if (onError) {
          onError(error);
        }
      }
    }, autoSaveInterval);
  }, [
    gameId,
    gameState,
    autoSave,
    autoSaveInterval,
    contextAutoSave,
    onSave,
    onError,
  ]);

  // Track time spent
  const startTimeRef = useRef(Date.now());
  const getTimeSpent = useCallback(() => {
    return Math.floor((Date.now() - startTimeRef.current) / 1000);
  }, []);

  // Update game state with auto-save
  const updateGameState = useCallback(
    (newState) => {
      setGameState((prevState) => {
        const updatedState =
          typeof newState === "function" ? newState(prevState) : newState;
        lastStateRef.current = updatedState;

        // Schedule auto-save if state changed significantly and we're not in loading state
        if (
          JSON.stringify(prevState) !== JSON.stringify(updatedState) &&
          !isLoading
        ) {
          scheduleAutoSave();
        }

        return updatedState;
      });
    },
    [scheduleAutoSave, isLoading]
  );

  // Manual save function
  const saveState = useCallback(
    async (additionalData = {}) => {
      try {
        setSaveError(null);

        const success = await saveGameState(gameId, gameState, {
          timeSpent: getTimeSpent(),
          hintsUsed: gameState.hintsUsed || 0,
          attempts: gameState.attempts || 0,
          completed: gameState.completed || false,
          score: gameState.score || null,
          answer: gameState.answer || null,
          ...additionalData,
        });

        if (success) {
          setLastSaveTime(new Date());
          if (onSave) {
            onSave(gameState);
          }
        }

        return success;
      } catch (error) {
        console.error(`Manual save error for ${gameId}:`, error);
        setSaveError(error);
        if (onError) {
          onError(error);
        }
        return false;
      }
    },
    [gameId, gameState, saveGameState, getTimeSpent, onSave, onError]
  );

  // Save on component unmount
  useEffect(() => {
    if (!saveOnUnload) return;

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Final save on unmount
      saveGameState(gameId, lastStateRef.current, {
        timeSpent: getTimeSpent(),
        hintsUsed: lastStateRef.current.hintsUsed || 0,
        attempts: lastStateRef.current.attempts || 0,
        completed: lastStateRef.current.completed || false,
        score: lastStateRef.current.score || null,
        answer: lastStateRef.current.answer || null,
      }).catch((error) => {
        console.error(`Final save error for ${gameId}:`, error);
      });
    };
  }, [gameId, saveOnUnload, saveGameState, getTimeSpent]);

  // Save state info
  const saveInfo = getSaveStateInfo(gameId);

  return {
    // State
    gameState,
    isLoading,
    hasLoadedSave,
    lastSaveTime,
    saveError,
    saveInfo,

    // Actions
    updateGameState,
    saveState,

    // Utilities
    getTimeSpent,
    hasSaveState: () => hasSaveState(gameId),
  };
};

/**
 * Hook for managing round-based games with save states
 * @param {string} gameId - The unique identifier for the game
 * @param {Object} initialState - The initial state for the game
 * @param {Object} options - Configuration options
 */
export const useRoundBasedSaveState = (gameId, initialState, options = {}) => {
  const { saveAfterEachRound = true, ...otherOptions } = options;

  const saveStateHook = useGameSaveState(gameId, initialState, otherOptions);

  // Save after completing a round
  const completeRound = useCallback(
    async (roundData) => {
      const updatedState = {
        ...saveStateHook.gameState,
        currentRound: (saveStateHook.gameState.currentRound || 0) + 1,
        roundScores: [
          ...(saveStateHook.gameState.roundScores || []),
          roundData.score,
        ],
        roundResults: [
          ...(saveStateHook.gameState.roundResults || []),
          roundData,
        ],
        lastRoundCompleted: new Date(),
      };

      saveStateHook.updateGameState(updatedState);

      if (saveAfterEachRound) {
        await saveStateHook.saveState({
          roundCompleted: true,
          roundNumber: updatedState.currentRound - 1,
        });
      }
    },
    [saveStateHook, saveAfterEachRound]
  );

  return {
    ...saveStateHook,
    completeRound,
  };
};
