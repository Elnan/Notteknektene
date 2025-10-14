import { fixDatabaseState } from "./seasonManager.js";
import { getUsersWhoOpenedTask } from "./taskTracking.js";

/**
 * Admin utility to fix database state
 */
export const runDatabaseFix = async () => {
  try {
    console.log("Starting database fix...");
    const result = await fixDatabaseState();
    if (result) {
      console.log("✅ Database fix completed successfully");
    } else {
      console.log("❌ Database fix failed");
    }
    return result;
  } catch (error) {
    console.error("Error running database fix:", error);
    return false;
  }
};

/**
 * Get task opening statistics for admin view
 */
export const getTaskOpeningStats = async (taskId) => {
  try {
    const users = await getUsersWhoOpenedTask(taskId);

    return {
      taskId,
      totalOpenings: users.length,
      users: users.map((user) => ({
        name: user.userName,
        firstOpened: user.firstOpenedAt?.toDate?.() || user.firstOpenedAt,
        userId: user.userId,
      })),
    };
  } catch (error) {
    console.error("Error getting task opening stats:", error);
    return { taskId, totalOpenings: 0, users: [] };
  }
};

/**
 * Get all task opening statistics
 */
export const getAllTaskStats = async () => {
  try {
    const taskIds = [
      "number-code",
      "order-chaos",
      "pattern-matrix",
      "logic-grid",
      "investigation-mystery",
      "building-blocks",
      "sum-grid",
      "the-keeper",
      "pattern-solver",
      "triads",
    ];

    const stats = await Promise.all(
      taskIds.map((taskId) => getTaskOpeningStats(taskId))
    );

    return stats;
  } catch (error) {
    console.error("Error getting all task stats:", error);
    return [];
  }
};
