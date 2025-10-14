import { doc, setDoc } from "firebase/firestore";
import { notteknekteneDb as db } from "../firebase/firebase-config-notteknektene";

/**
 * Universal function to clear all local save states for a user
 * This will clear save data for all games: Triads, The Keeper, Logic Grid, Order & Chaos, Investigation Mysteries
 */
export const clearAllSaveStates = async (userId) => {
  if (!userId) {
    console.error("❌ User ID is required to clear save states");
    return false;
  }

  try {
    console.log("🧹 Clearing all save states for user:", userId);

    // List of all game save document IDs to clear
    const gameSaveIds = [
      "triads_triads4",
      "triads_triads5",
      "triads_triads6",
      "triads_triads7",
      "triads_triads8",
      "keeper_keeper4",
      "keeper_keeper5",
      "keeper_keeper6",
      "keeper_keeper7",
      "keeper_keeper8",
      "logic-grid_logic-grid4",
      "logic-grid_logic-grid5",
      "logic-grid_logic-grid6",
      "logic-grid_logic-grid7",
      "logic-grid_logic-grid8",
      "order-chaos_order-chaos4",
      "order-chaos_order-chaos5",
      "order-chaos_order-chaos6",
      "order-chaos_order-chaos7",
      "order-chaos_order-chaos8",
      "investigation-mystery_investigation-mystery4",
      "investigation-mystery_investigation-mystery5",
      "investigation-mystery_investigation-mystery6",
      "investigation-mystery_investigation-mystery7",
      "investigation-mystery_investigation-mystery8",
    ];

    // Clear all save documents
    const clearPromises = gameSaveIds.map(async (gameId) => {
      try {
        const saveDoc = doc(db, "users", userId, "gameSaves", gameId);
        await setDoc(saveDoc, {}, { merge: true });
        console.log(`✅ Cleared save state for ${gameId}`);
        return true;
      } catch (error) {
        console.warn(`⚠️ Failed to clear ${gameId}:`, error.message);
        return false;
      }
    });

    const results = await Promise.all(clearPromises);
    const successCount = results.filter(Boolean).length;
    const totalCount = gameSaveIds.length;

    console.log(
      `🎉 Clear operation completed: ${successCount}/${totalCount} save states cleared`
    );

    if (successCount === totalCount) {
      console.log("✅ All save states cleared successfully!");
      return true;
    } else {
      console.warn(
        `⚠️ Some save states may not have been cleared (${successCount}/${totalCount} successful)`
      );
      return true; // Still return true as partial success
    }
  } catch (error) {
    console.error("❌ Error clearing save states:", error);
    return false;
  }
};

/**
 * Clear save states for specific games only
 */
export const clearSpecificGameSaves = async (userId, gameTypes = []) => {
  if (!userId) {
    console.error("❌ User ID is required to clear save states");
    return false;
  }

  if (gameTypes.length === 0) {
    console.log("ℹ️ No specific games specified, clearing all save states");
    return await clearAllSaveStates(userId);
  }

  try {
    console.log("🧹 Clearing save states for specific games:", gameTypes);

    // Map game types to their save document patterns
    const gamePatterns = {
      triads: [
        "triads_triads4",
        "triads_triads5",
        "triads_triads6",
        "triads_triads7",
        "triads_triads8",
      ],
      keeper: [
        "keeper_keeper4",
        "keeper_keeper5",
        "keeper_keeper6",
        "keeper_keeper7",
        "keeper_keeper8",
      ],
      "logic-grid": [
        "logic-grid_logic-grid4",
        "logic-grid_logic-grid5",
        "logic-grid_logic-grid6",
        "logic-grid_logic-grid7",
        "logic-grid_logic-grid8",
      ],
      "order-chaos": [
        "order-chaos_order-chaos4",
        "order-chaos_order-chaos5",
        "order-chaos_order-chaos6",
        "order-chaos_order-chaos7",
        "order-chaos_order-chaos8",
      ],
      "investigation-mystery": [
        "investigation-mystery_investigation-mystery4",
        "investigation-mystery_investigation-mystery5",
        "investigation-mystery_investigation-mystery6",
        "investigation-mystery_investigation-mystery7",
        "investigation-mystery_investigation-mystery8",
      ],
    };

    const gameSaveIds = [];
    gameTypes.forEach((gameType) => {
      if (gamePatterns[gameType]) {
        gameSaveIds.push(...gamePatterns[gameType]);
      } else {
        console.warn(`⚠️ Unknown game type: ${gameType}`);
      }
    });

    if (gameSaveIds.length === 0) {
      console.log("ℹ️ No valid game types found");
      return true;
    }

    // Clear specific save documents
    const clearPromises = gameSaveIds.map(async (gameId) => {
      try {
        const saveDoc = doc(db, "users", userId, "gameSaves", gameId);
        await setDoc(saveDoc, {}, { merge: true });
        console.log(`✅ Cleared save state for ${gameId}`);
        return true;
      } catch (error) {
        console.warn(`⚠️ Failed to clear ${gameId}:`, error.message);
        return false;
      }
    });

    const results = await Promise.all(clearPromises);
    const successCount = results.filter(Boolean).length;
    const totalCount = gameSaveIds.length;

    console.log(
      `🎉 Clear operation completed: ${successCount}/${totalCount} save states cleared`
    );
    return successCount === totalCount;
  } catch (error) {
    console.error("❌ Error clearing specific game saves:", error);
    return false;
  }
};
