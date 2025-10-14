/**
 * Universal save utilities for any game
 * Handles serialization, storage, and retrieval of game states
 */

// Safe JSON stringify that handles circular references and complex objects
const safeStringify = (obj) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, val) => {
    if (val != null && typeof val === "object") {
      if (seen.has(val)) {
        return "[Circular]";
      }
      seen.add(val);
    }

    // Handle Sets
    if (val instanceof Set) {
      return Array.from(val);
    }

    // Handle Maps
    if (val instanceof Map) {
      return Object.fromEntries(val);
    }

    // Handle Dates
    if (val instanceof Date) {
      return val.toISOString();
    }

    return val;
  });
};

// Safe JSON parse with fallback
const safeParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.warn("Failed to parse JSON:", error);
    return fallback;
  }
};

// Local storage helpers
const getLocalStorageKey = (gameId) => `game_save_${gameId}`;

const saveToLocalStorage = (gameId, gameState) => {
  try {
    const serialized = safeStringify(gameState);
    localStorage.setItem(getLocalStorageKey(gameId), serialized);
    console.log("💾 Saved to localStorage:", gameId);
    return true;
  } catch (error) {
    console.error("❌ Failed to save to localStorage:", error);
    return false;
  }
};

const loadFromLocalStorage = (gameId) => {
  try {
    const serialized = localStorage.getItem(getLocalStorageKey(gameId));
    if (!serialized) {
      console.log("🆕 No save found for", gameId);
      return null;
    }

    const gameState = safeParse(serialized);
    if (gameState) {
      console.log("📁 Loaded from localStorage:", gameId);
      return gameState;
    }
    return null;
  } catch (error) {
    console.error("❌ Failed to load from localStorage:", error);
    return null;
  }
};

const deleteFromLocalStorage = (gameId) => {
  try {
    localStorage.removeItem(getLocalStorageKey(gameId));
    console.log("🗑️ Deleted from localStorage:", gameId);
    return true;
  } catch (error) {
    console.error("❌ Failed to delete from localStorage:", error);
    return false;
  }
};

// Firebase helpers (using existing SaveStateContext)
const saveToFirebase = async (gameId, gameState) => {
  try {
    // Import SaveStateContext dynamically to avoid circular dependencies
    const { saveGameStateToFirebase } = await import(
      "../context/SaveStateContext"
    );

    if (typeof saveGameStateToFirebase === "function") {
      await saveGameStateToFirebase(gameId, gameState);
      console.log("🔥 Saved to Firebase:", gameId);
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Failed to save to Firebase:", error);
    return false;
  }
};

const loadFromFirebase = async (gameId) => {
  try {
    // Import SaveStateContext dynamically to avoid circular dependencies
    const { loadGameStateFromFirebase } = await import(
      "../context/SaveStateContext"
    );

    if (typeof loadGameStateFromFirebase === "function") {
      const gameState = await loadGameStateFromFirebase(gameId);
      if (gameState) {
        console.log("🔥 Loaded from Firebase:", gameId);
        return gameState;
      }
    }
    return null;
  } catch (error) {
    console.error("❌ Failed to load from Firebase:", error);
    return null;
  }
};

const deleteFromFirebase = async (gameId) => {
  try {
    // Import SaveStateContext dynamically to avoid circular dependencies
    const { deleteGameStateFromFirebase } = await import(
      "../context/SaveStateContext"
    );

    if (typeof deleteGameStateFromFirebase === "function") {
      await deleteGameStateFromFirebase(gameId);
      console.log("🔥 Deleted from Firebase:", gameId);
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Failed to delete from Firebase:", error);
    return false;
  }
};

// Main save function - saves to both local and Firebase
export const saveGameState = async (gameId, gameState) => {
  try {
    // Always save to localStorage first (fast, reliable)
    const localSuccess = saveToLocalStorage(gameId, gameState);

    // Try to save to Firebase in background (don't wait for it)
    saveToFirebase(gameId, gameState).catch((error) => {
      console.warn("Firebase save failed (non-critical):", error);
    });

    return localSuccess;
  } catch (error) {
    console.error("❌ Save failed:", error);
    throw error;
  }
};

// Main load function - tries local first, then Firebase
export const loadGameState = async (gameId) => {
  try {
    // Try localStorage first (fastest)
    const localState = loadFromLocalStorage(gameId);
    if (localState) {
      return localState;
    }

    // Fallback to Firebase
    const firebaseState = await loadFromFirebase(gameId);
    if (firebaseState) {
      // Cache in localStorage for next time
      saveToLocalStorage(gameId, firebaseState);
      return firebaseState;
    }

    console.log("🆕 No save found for", gameId, "starting fresh");
    return null;
  } catch (error) {
    console.error("❌ Load failed:", error);
    return null;
  }
};

// Main delete function - deletes from both local and Firebase
export const deleteGameState = async (gameId) => {
  try {
    const localSuccess = deleteFromLocalStorage(gameId);

    // Try Firebase (don't wait for it)
    deleteFromFirebase(gameId).catch((error) => {
      console.warn("Firebase delete failed (non-critical):", error);
    });

    return localSuccess;
  } catch (error) {
    console.error("❌ Delete failed:", error);
    throw error;
  }
};

// Utility to check if save exists
export const hasGameSave = (gameId) => {
  try {
    const serialized = localStorage.getItem(getLocalStorageKey(gameId));
    return serialized !== null;
  } catch (error) {
    return false;
  }
};

// Utility to get save info without loading full state
export const getSaveInfo = (gameId) => {
  try {
    const serialized = localStorage.getItem(getLocalStorageKey(gameId));
    if (!serialized) return null;

    const gameState = safeParse(serialized);
    if (!gameState) return null;

    return {
      gameId: gameState.gameId,
      gameType: gameState.gameType,
      lastSaved: gameState.lastSaved,
      version: gameState.version,
    };
  } catch (error) {
    return null;
  }
};

