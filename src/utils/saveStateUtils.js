/**
 * Utility functions for save state management
 */

/**
 * Serialize game state for storage
 * Handles complex objects like Sets, Maps, Dates, etc.
 * @param {Object} gameState - The game state to serialize
 * @returns {Object} - Serialized game state
 */
export const serializeGameState = (gameState) => {
  if (!gameState) return null;

  const serialized = {};

  for (const [key, value] of Object.entries(gameState)) {
    if (value === null || value === undefined) {
      serialized[key] = value;
    } else if (value instanceof Set) {
      serialized[key] = {
        __type: "Set",
        value: Array.from(value),
      };
    } else if (value instanceof Map) {
      serialized[key] = {
        __type: "Map",
        value: Array.from(value.entries()),
      };
    } else if (value instanceof Date) {
      serialized[key] = {
        __type: "Date",
        value: value.toISOString(),
      };
    } else if (Array.isArray(value)) {
      serialized[key] = value.map((item) => {
        if (item instanceof Set) {
          return { __type: "Set", value: Array.from(item) };
        } else if (item instanceof Map) {
          return { __type: "Map", value: Array.from(item.entries()) };
        } else if (item instanceof Date) {
          return { __type: "Date", value: item.toISOString() };
        } else if (typeof item === "object" && item !== null) {
          return serializeGameState(item);
        }
        return item;
      });
    } else if (typeof value === "object") {
      serialized[key] = serializeGameState(value);
    } else {
      serialized[key] = value;
    }
  }

  return serialized;
};

/**
 * Deserialize game state from storage
 * Restores complex objects like Sets, Maps, Dates, etc.
 * @param {Object} serializedState - The serialized game state
 * @returns {Object} - Deserialized game state
 */
export const deserializeGameState = (serializedState) => {
  if (!serializedState) return null;

  const deserialized = {};

  for (const [key, value] of Object.entries(serializedState)) {
    if (value === null || value === undefined) {
      deserialized[key] = value;
    } else if (typeof value === "object" && value.__type) {
      switch (value.__type) {
        case "Set":
          deserialized[key] = new Set(value.value);
          break;
        case "Map":
          deserialized[key] = new Map(value.value);
          break;
        case "Date":
          deserialized[key] = new Date(value.value);
          break;
        default:
          deserialized[key] = value;
      }
    } else if (Array.isArray(value)) {
      deserialized[key] = value.map((item) => {
        if (typeof item === "object" && item !== null && item.__type) {
          switch (item.__type) {
            case "Set":
              return new Set(item.value);
            case "Map":
              return new Map(item.value);
            case "Date":
              return new Date(item.value);
            default:
              return item;
          }
        } else if (typeof item === "object" && item !== null) {
          return deserializeGameState(item);
        }
        return item;
      });
    } else if (typeof value === "object") {
      deserialized[key] = deserializeGameState(value);
    } else {
      deserialized[key] = value;
    }
  }

  return deserialized;
};

/**
 * Create a save state key for a specific game and user
 * @param {string} gameId - The game identifier
 * @param {string} userId - The user identifier
 * @returns {string} - Save state key
 */
export const createSaveStateKey = (gameId, userId) => {
  return `${gameId}_${userId}`;
};

/**
 * Extract game state from save data
 * @param {Object} saveData - The complete save data from Firebase
 * @returns {Object} - The game state object
 */
export const extractGameState = (saveData) => {
  if (!saveData || !saveData.gameState) return null;
  return deserializeGameState(saveData.gameState);
};

/**
 * Prepare game state for saving
 * @param {Object} gameState - The current game state
 * @param {Object} additionalData - Additional data to include
 * @returns {Object} - Prepared save data
 */
export const prepareSaveData = (gameState, additionalData = {}) => {
  return {
    gameState: serializeGameState(gameState),
    ...additionalData,
  };
};

/**
 * Validate game state before saving
 * @param {Object} gameState - The game state to validate
 * @returns {boolean} - Whether the state is valid
 */
export const validateGameState = (gameState) => {
  if (!gameState || typeof gameState !== "object") {
    return false;
  }

  // Check for circular references
  try {
    JSON.stringify(gameState);
  } catch (error) {
    console.warn("Game state contains circular references:", error);
    return false;
  }

  return true;
};

/**
 * Get a summary of the game state for display
 * @param {Object} gameState - The game state
 * @returns {Object} - Summary information
 */
export const getGameStateSummary = (gameState) => {
  if (!gameState) return null;

  const summary = {
    hasState: true,
    keys: Object.keys(gameState),
    size: JSON.stringify(gameState).length,
    timestamp: new Date().toISOString(),
  };

  // Add specific game state information if available
  if (gameState.currentRound !== undefined) {
    summary.currentRound = gameState.currentRound;
  }
  if (gameState.score !== undefined) {
    summary.score = gameState.score;
  }
  if (gameState.completed !== undefined) {
    summary.completed = gameState.completed;
  }
  if (gameState.hintsUsed !== undefined) {
    summary.hintsUsed = gameState.hintsUsed;
  }

  return summary;
};

/**
 * Create a backup of the current game state
 * @param {Object} gameState - The current game state
 * @returns {Object} - Backup data
 */
export const createGameStateBackup = (gameState) => {
  return {
    state: serializeGameState(gameState),
    timestamp: new Date().toISOString(),
    version: "1.0",
  };
};

/**
 * Restore game state from backup
 * @param {Object} backup - The backup data
 * @returns {Object} - Restored game state
 */
export const restoreGameStateFromBackup = (backup) => {
  if (!backup || !backup.state) {
    throw new Error("Invalid backup data");
  }
  return deserializeGameState(backup.state);
};
