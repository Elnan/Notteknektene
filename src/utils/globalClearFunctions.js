import {
  clearAllSaveStates,
  clearSpecificGameSaves,
} from "./clearAllSaveStates.js";

/**
 * Global clear functions for easy access from browser console
 * This file should be imported in the main app to make these functions globally available
 */

// Make clear functions globally available
window.clearAllSaveStates = async (userId) => {
  const result = await clearAllSaveStates(userId);
  if (result) {
    console.log("🎉 All save states cleared successfully! Reloading page...");
    window.location.reload();
  } else {
    console.error("❌ Failed to clear some save states");
  }
  return result;
};

window.clearSpecificGameSaves = async (userId, gameTypes = []) => {
  const result = await clearSpecificGameSaves(userId, gameTypes);
  if (result) {
    console.log(
      "🎉 Specified game save states cleared successfully! Reloading page..."
    );
    window.location.reload();
  } else {
    console.error("❌ Failed to clear some save states");
  }
  return result;
};

// Convenience functions for common use cases
window.clearTriadsSaves = async (userId) => {
  return await window.clearSpecificGameSaves(userId, ["triads"]);
};

window.clearKeeperSaves = async (userId) => {
  return await window.clearSpecificGameSaves(userId, ["keeper"]);
};

window.clearLogicGridSaves = async (userId) => {
  return await window.clearSpecificGameSaves(userId, ["logic-grid"]);
};

window.clearOrderChaosSaves = async (userId) => {
  return await window.clearSpecificGameSaves(userId, ["order-chaos"]);
};

window.clearInvestigationMysterySaves = async (userId) => {
  return await window.clearSpecificGameSaves(userId, ["investigation-mystery"]);
};

// Helper function to get current user ID (if available)
window.getCurrentUserId = () => {
  // Try to get user ID from various sources
  if (window.currentUser?.uid) {
    return window.currentUser.uid;
  }

  // Check if there's a user ID in localStorage or sessionStorage
  const storedUserId =
    localStorage.getItem("currentUserId") ||
    sessionStorage.getItem("currentUserId");
  if (storedUserId) {
    return storedUserId;
  }

  // Try to get from React DevTools or global auth state
  try {
    // Check if there's a React component with auth context
    const reactRoot =
      document.querySelector("#root")?._reactInternalFiber ||
      document.querySelector("#root")?._reactInternalInstance;

    if (reactRoot) {
      // Try to find auth context in React tree
      let current = reactRoot;
      while (current) {
        if (current?.memoizedProps?.currentUser?.uid) {
          return current.memoizedProps.currentUser.uid;
        }
        if (current?.memoizedState?.currentUser?.uid) {
          return current.memoizedState.currentUser.uid;
        }
        current = current.child || current.sibling;
      }
    }
  } catch (error) {
    // Silently fail if React DevTools access fails
  }

  // Try to extract from Firebase auth state in localStorage
  try {
    const firebaseAuth = localStorage.getItem(
      "firebase:authUser:notteknektene:[DEFAULT]"
    );
    if (firebaseAuth) {
      const authData = JSON.parse(firebaseAuth);
      if (authData?.uid) {
        return authData.uid;
      }
    }
  } catch (error) {
    // Silently fail if localStorage parsing fails
  }

  console.warn("⚠️ No user ID found. You may need to provide it manually.");
  console.log("💡 Try: clearAllSaveStates('your-user-id-here')");
  return null;
};

// Super convenient function that tries to auto-detect user ID
window.clearAllMySaves = async () => {
  const userId = window.getCurrentUserId();
  if (!userId) {
    console.error(
      "❌ Could not determine user ID. Please provide it manually:"
    );
    if (import.meta.env.DEV) {
      console.log("Usage: clearAllSaveStates('your-user-id-here')");
    }
    return false;
  }

  return await window.clearAllSaveStates(userId);
};

// ULTRA SIMPLE: Clear Firebase save data directly
window.clearAllSaves = async () => {
  if (import.meta.env.DEV) {
    console.log("🧹 Clearing Firebase save data...");
  }

  try {
    // Import Firebase functions
    const { doc, setDoc } = await import("firebase/firestore");
    const { notteknekteneDb } = await import(
      "../firebase/firebase-config-notteknektene.js"
    );
    const db = notteknekteneDb;

    // Get all possible user IDs from localStorage
    const allKeys = Object.keys(localStorage);
    const userIds = new Set();

    // Extract user IDs from localStorage
    allKeys.forEach((key) => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data?.uid) {
          userIds.add(data.uid);
        }
        if (data && typeof data === "object") {
          Object.values(data).forEach((value) => {
            if (value?.uid) {
              userIds.add(value.uid);
            }
          });
        }
      } catch (error) {
        const value = localStorage.getItem(key);
        if (typeof value === "string") {
          const uidMatches = value.match(/[a-zA-Z0-9]{20,}/g);
          if (uidMatches) {
            uidMatches.forEach((uid) => {
              if (uid.length >= 20 && uid.length <= 30) {
                userIds.add(uid);
              }
            });
          }
        }
      }
    });

    // Note: No hardcoded user IDs for security

    if (import.meta.env.DEV) {
      console.log("🔍 Found user IDs:", Array.from(userIds));
    }

    // Clear all game saves for all users
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

    const clearPromises = [];
    Array.from(userIds).forEach((userId) => {
      gameSaveIds.forEach((gameId) => {
        const saveDoc = doc(db, "users", userId, "gameSaves", gameId);
        clearPromises.push(setDoc(saveDoc, {}, { merge: true }));
      });
    });

    await Promise.all(clearPromises);
    console.log("✅ Firebase save data cleared");

    // Also clear localStorage
    localStorage.clear();
    sessionStorage.clear();
    console.log("✅ Browser storage cleared");

    console.log("🔄 Reloading page...");
    window.location.reload();
  } catch (error) {
    console.error("❌ Error clearing saves:", error);
    console.log("🔄 Reloading anyway...");
    window.location.reload();
  }
};

// Helper function to find and display user ID
window.findMyUserId = () => {
  console.log("🔍 Searching for your user ID...");

  // Check localStorage for Firebase auth
  const firebaseKeys = Object.keys(localStorage).filter(
    (key) => key.includes("firebase:authUser") || key.includes("currentUserId")
  );

  console.log("📋 Found auth-related localStorage keys:", firebaseKeys);

  firebaseKeys.forEach((key) => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (data?.uid) {
        console.log(`✅ Found user ID in ${key}:`, data.uid);
        return data.uid;
      }
    } catch (error) {
      console.log(`❌ Could not parse ${key}:`, error.message);
    }
  });

  // Check sessionStorage
  const sessionKeys = Object.keys(sessionStorage).filter(
    (key) => key.includes("currentUserId") || key.includes("user")
  );

  if (sessionKeys.length > 0) {
    console.log("📋 Found auth-related sessionStorage keys:", sessionKeys);
    sessionKeys.forEach((key) => {
      const value = sessionStorage.getItem(key);
      console.log(`📄 ${key}:`, value);
    });
  }

  // Check if there's a user object in global scope
  if (window.currentUser) {
    console.log("✅ Found window.currentUser:", window.currentUser);
  }

  console.log("💡 If you found your user ID above, use it like this:");
  console.log("clearAllSaveStates('your-user-id-here')");

  return null;
};

console.log("🧹 Global clear functions loaded! Available commands:");
console.log(
  "• clearAllSaves() - 🚀 ULTIMATE: Clear all saves (tries everything to find user ID)"
);
console.log(
  "• findMyUserId() - Find your user ID in localStorage/sessionStorage"
);
console.log("• clearAllMySaves() - Clear all saves (auto-detects user ID)");
console.log("• clearAllSaveStates(userId) - Clear all saves for specific user");
console.log(
  "• clearSpecificGameSaves(userId, ['triads', 'keeper']) - Clear specific games"
);
console.log("• clearTriadsSaves(userId) - Clear only Triads saves");
console.log("• clearKeeperSaves(userId) - Clear only The Keeper saves");
console.log("• clearLogicGridSaves(userId) - Clear only Logic Grid saves");
console.log("• clearOrderChaosSaves(userId) - Clear only Order & Chaos saves");
console.log(
  "• clearInvestigationMysterySaves(userId) - Clear only Investigation Mysteries saves"
);
