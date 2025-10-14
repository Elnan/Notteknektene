import { useState, useEffect, useCallback, useRef } from "react";
import {
  saveGameState,
  loadGameState,
  deleteGameState,
} from "../utils/universalSaveUtils";

/**
 * Universal save state hook that works with any game
 * Provides automatic save/load functionality without changing game behavior
 */
export const useUniversalSaveState = (gameId, gameType = "unknown") => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedSave, setHasLoadedSave] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const saveTimeoutRef = useRef(null);
  const lastSaveStateRef = useRef(null);
  const saveInProgressRef = useRef(false);

  // Load game state on mount
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setIsLoading(true);
        setSaveError(null);

        // Check if user has already submitted this game to database
        const checkDatabaseSubmission = async () => {
          try {
            const { getCurrentSeason } = await import(
              "../firebase/new-database-utils.js"
            );
            const { getUserGameSubmission } = await import(
              "../firebase/new-database-utils.js"
            );
            const { getAuth } = await import("firebase/auth");

            const season = await getCurrentSeason();
            const auth = getAuth();
            const currentUser = auth.currentUser;

            if (season && currentUser) {
              const existingSubmission = await getUserGameSubmission(
                season.id,
                gameId,
                currentUser.uid
              );

              if (existingSubmission && existingSubmission.completed) {
                console.log(
                  "🎮 User has already submitted this game to database - clearing local storage"
                );
                // Clear local storage since user has already submitted
                const { deleteGameState } = await import(
                  "../utils/universalSaveUtils"
                );
                await deleteGameState(gameId);
                return null;
              }
            }
          } catch (error) {
            console.warn("Could not check database submission status:", error);
          }
          return null;
        };

        // Check database first
        await checkDatabaseSubmission();

        const savedState = await loadGameState(gameId);

        if (savedState) {
          console.log("🎮 Loaded save for", gameId, savedState);
          setHasLoadedSave(true);
          setLastSaveTime(savedState.lastSaved);
          return savedState;
        } else {
          console.log("🎮 Starting fresh", gameType, "game");
          setHasLoadedSave(false);
          return null;
        }
      } catch (error) {
        console.error("❌ Error loading save:", error);
        setSaveError(error);
        setHasLoadedSave(false);
        return null;
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialState();
  }, [gameId, gameType]);

  // Auto-save function with debouncing
  const autoSave = useCallback(
    async (gameState) => {
      if (saveInProgressRef.current) return;

      // Debounce saves - only save if state actually changed
      const stateString = JSON.stringify(gameState);
      if (lastSaveStateRef.current === stateString) return;

      lastSaveStateRef.current = stateString;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          saveInProgressRef.current = true;
          setIsSaving(true);
          setSaveError(null);

          const saveData = {
            ...gameState,
            gameId,
            gameType,
            lastSaved: new Date().toISOString(),
            version: "1.0",
          };

          await saveGameState(gameId, saveData);
          setLastSaveTime(saveData.lastSaved);

          console.log("💾 Auto-saved", gameType, "game");
        } catch (error) {
          console.error("❌ Auto-save failed:", error);
          setSaveError(error);
        } finally {
          setIsSaving(false);
          saveInProgressRef.current = false;
        }
      }, 2000); // 2 second debounce
    },
    [gameId, gameType]
  );

  // Manual save function
  const saveState = useCallback(
    async (additionalData = {}) => {
      try {
        saveInProgressRef.current = true;
        setIsSaving(true);
        setSaveError(null);

        const saveData = {
          ...additionalData,
          gameId,
          gameType,
          lastSaved: new Date().toISOString(),
          version: "1.0",
        };

        await saveGameState(gameId, saveData);
        setLastSaveTime(saveData.lastSaved);

        console.log("💾 Manual save completed for", gameType);
        return { success: true };
      } catch (error) {
        console.error("❌ Manual save failed:", error);
        setSaveError(error);
        return { success: false, error };
      } finally {
        setIsSaving(false);
        saveInProgressRef.current = false;
      }
    },
    [gameId, gameType]
  );

  // Delete save function
  const deleteSave = useCallback(async () => {
    try {
      await deleteGameState(gameId);
      setHasLoadedSave(false);
      setLastSaveTime(null);
      setSaveError(null);
      console.log("🗑️ Save deleted for", gameId);
      return { success: true };
    } catch (error) {
      console.error("❌ Delete save failed:", error);
      setSaveError(error);
      return { success: false, error };
    }
  }, [gameId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    hasLoadedSave,
    lastSaveTime,
    saveError,
    isSaving,
    autoSave,
    saveState,
    deleteSave,
  };
};
