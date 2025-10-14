import {
  recordGameOpening,
  recordGameSubmissionData,
  getUserGameSubmission,
  getGameUsers,
  getGameSubmissions,
  addSeasonParticipant,
  getSeasonParticipantsList,
  updateSeasonParticipant,
  calculateUserSeasonScore,
} from "../firebase/new-database-utils.js";
import { isSubmissionAllowedForTask } from "./deadlineUtils.js";

/**
 * Record when a user opens a task/game
 */
export const recordTaskOpening = async (taskId, userId, userName) => {
  try {
    // Get current season
    const { getCurrentSeason } = await import(
      "../firebase/new-database-utils.js"
    );
    const season = await getCurrentSeason();

    if (!season) {
      console.warn("No active season found");
      return;
    }

    // Find the game in the season
    const { getSeasonGamesList } = await import(
      "../firebase/new-database-utils.js"
    );
    const games = await getSeasonGamesList(season.id);

    // Try to find the game by exact match first
    let game = games.find((g) => g.gameId === taskId);

    // If not found, try to find by base game ID (without round number)
    if (!game) {
      game = games.find((g) => {
        const baseGameId = g.gameId.replace(/\d+$/, ""); // Remove round number
        return baseGameId === taskId;
      });
    }

    if (!game) {
      console.warn(`Game ${taskId} not found in current season`);
      return;
    }

    const userData = {
      userId,
      userName,
      userEmail: "", // Will be filled by the calling function if available
    };

    await recordGameOpening(season.id, game.id, userData);
    console.log(`Recorded task opening: ${taskId} for user ${userId}`);
  } catch (error) {
    console.error("Error recording task opening:", error);
    throw error;
  }
};

/**
 * Get task opening history for a user
 */
export const getTaskOpeningHistory = async (userId) => {
  try {
    const { getCurrentSeason, getSeasonGamesList } = await import(
      "../firebase/new-database-utils.js"
    );
    const season = await getCurrentSeason();

    if (!season) {
      console.warn("No active season found");
      return [];
    }

    const games = await getSeasonGamesList(season.id);
    const history = [];

    for (const game of games) {
      const submission = await getUserGameSubmission(
        season.id,
        game.id,
        userId
      );
      if (submission?.openedAt) {
        history.push({
          taskId: game.gameId,
          roundNumber: game.roundNumber,
          openedAt: submission.openedAt,
          completed: submission.completed,
        });
      }
    }

    return history;
  } catch (error) {
    console.error("Error getting task opening history:", error);
    return [];
  }
};

/**
 * Check if a user has opened a specific task
 */
export const hasTaskBeenOpened = async (taskId, userId) => {
  try {
    const { getCurrentSeason, getSeasonGamesList } = await import(
      "../firebase/new-database-utils.js"
    );
    const season = await getCurrentSeason();

    if (!season) {
      console.warn("No active season found");
      return false;
    }

    const games = await getSeasonGamesList(season.id);

    // Try to find the game by exact match first
    let game = games.find((g) => g.gameId === taskId);

    // If not found, try to find by base game ID (without round number)
    if (!game) {
      game = games.find((g) => {
        const baseGameId = g.gameId.replace(/\d+$/, ""); // Remove round number
        return baseGameId === taskId;
      });
    }

    if (!game) {
      console.warn(`Game ${taskId} not found in current season`);
      return false;
    }

    const submission = await getUserGameSubmission(season.id, game.id, userId);
    return !!submission?.openedAt;
  } catch (error) {
    console.error("Error checking if task has been opened:", error);
    return false;
  }
};

/**
 * Get all users who opened a specific task
 */
export const getUsersWhoOpenedTask = async (taskId) => {
  try {
    const { getCurrentSeason, getSeasonGamesList } = await import(
      "../firebase/new-database-utils.js"
    );
    const season = await getCurrentSeason();

    if (!season) {
      console.warn("No active season found");
      return [];
    }

    const games = await getSeasonGamesList(season.id);

    // Try to find the game by exact match first
    let game = games.find((g) => g.gameId === taskId);

    // If not found, try to find by base game ID (without round number)
    if (!game) {
      game = games.find((g) => {
        const baseGameId = g.gameId.replace(/\d+$/, ""); // Remove round number
        return baseGameId === taskId;
      });
    }

    if (!game) {
      console.warn(`Game ${taskId} not found in current season`);
      return [];
    }

    const users = await getGameUsers(season.id, game.id);
    return users.map((user) => ({
      userId: user.userId,
      userName: user.userName,
      openedAt: user.openedAt,
      completed: user.completed,
    }));
  } catch (error) {
    console.error("Error getting users who opened task:", error);
    return [];
  }
};

/**
 * Record a game submission
 */
export const recordGameSubmission = async (
  taskId,
  submissionData,
  userId,
  userName
) => {
  try {
    // Check if submission is allowed for this specific task (before its deadline)
    if (!isSubmissionAllowedForTask(taskId)) {
      throw new Error(
        `Submission deadline has passed for task ${taskId}. This submission will not be recorded.`
      );
    }

    const { getCurrentSeason, getSeasonGamesList } = await import(
      "../firebase/new-database-utils.js"
    );
    const season = await getCurrentSeason();

    if (!season) {
      console.warn("No active season found");
      return;
    }

    const games = await getSeasonGamesList(season.id);

    // Try to find the game by exact match first
    let game = games.find((g) => g.gameId === taskId);

    // If not found, try to find by base game ID (without round number)
    if (!game) {
      game = games.find((g) => {
        const baseGameId = g.gameId.replace(/\d+$/, ""); // Remove round number
        return baseGameId === taskId;
      });
    }

    if (!game) {
      console.warn(`Game ${taskId} not found in current season`);
      return;
    }

    const userData = {
      userId,
      userName,
      userEmail: "", // Will be filled by the calling function if available
      score: submissionData.score || 0,
      answer: submissionData.answer || submissionData.submission || "",
      attempts: submissionData.attempts || 1,
      timeSpent: submissionData.timeSpent || 0,
      hintsUsed: submissionData.hintsUsed || 0,
      submittedAt: new Date(), // Record the exact submission time
    };

    await recordGameSubmissionData(
      season.id,
      game.id,
      userData.userId,
      userData
    );

    // Update user's season score
    await calculateUserSeasonScore(season.id, userId);

    console.log(`Recorded game submission: ${taskId} for user ${userId}`);
  } catch (error) {
    console.error("Error recording game submission:", error);
    throw error;
  }
};

/**
 * Get all submissions for a specific task
 */
export const getTaskSubmissions = async (taskId) => {
  try {
    const { getCurrentSeason, getSeasonGamesList } = await import(
      "../firebase/new-database-utils.js"
    );
    const season = await getCurrentSeason();

    if (!season) {
      console.warn("No active season found");
      return [];
    }

    const games = await getSeasonGamesList(season.id);

    // Try to find the game by exact match first
    let game = games.find((g) => g.gameId === taskId);

    // If not found, try to find by base game ID (without round number)
    if (!game) {
      game = games.find((g) => {
        const baseGameId = g.gameId.replace(/\d+$/, ""); // Remove round number
        return baseGameId === taskId;
      });
    }

    if (!game) {
      console.warn(`Game ${taskId} not found in current season`);
      return [];
    }

    const submissions = await getGameSubmissions(season.id, game.gameId);
    return submissions.map((submission) => ({
      userId: submission.userId,
      userName: submission.userName,
      score: submission.score,
      answer: submission.answer,
      attempts: submission.attempts,
      timeSpent: submission.timeSpent,
      hintsUsed: submission.hintsUsed,
      submittedAt: submission.submittedAt,
    }));
  } catch (error) {
    console.error("Error getting task submissions:", error);
    return [];
  }
};

/**
 * Add user as season participant
 */
export const addUserAsParticipant = async (userId, userData) => {
  try {
    const { getCurrentSeason } = await import(
      "../firebase/new-database-utils.js"
    );
    const season = await getCurrentSeason();

    if (!season) {
      console.warn("No active season found");
      return;
    }

    const participantData = {
      userId,
      userName: userData.name || userData.displayName || "Unknown User",
      userEmail: userData.email || "",
      participating: true,
    };

    await addSeasonParticipant(season.id, participantData);
    console.log(`Added user ${userId} as participant in season ${season.id}`);
  } catch (error) {
    console.error("Error adding user as participant:", error);
    throw error;
  }
};

/**
 * Get all season participants
 */
export const getSeasonParticipants = async () => {
  try {
    const { getCurrentSeason } = await import(
      "../firebase/new-database-utils.js"
    );
    const season = await getCurrentSeason();

    if (!season) {
      console.warn("No active season found");
      return [];
    }

    const participants = await getSeasonParticipantsList(season.id);
    return participants.map((participant) => ({
      userId: participant.userId,
      userName: participant.userName,
      userEmail: participant.userEmail,
      participating: participant.participating,
      totalScore: participant.totalScore || 0,
      gamesPlayed: participant.gamesPlayed || 0,
      gamesCompleted: participant.gamesCompleted || 0,
      joinedAt: participant.joinedAt,
    }));
  } catch (error) {
    console.error("Error getting season participants:", error);
    return [];
  }
};

/**
 * Check if a user can still submit to a specific game
 * @param {string} taskId - The task/game ID
 * @returns {Object} Object with canSubmit boolean and deadline info
 */
export const canUserSubmitToGame = async (taskId) => {
  try {
    const { getCurrentSeason, getSeasonGamesList } = await import(
      "../firebase/new-database-utils.js"
    );
    const season = await getCurrentSeason();

    if (!season) {
      return { canSubmit: false, reason: "No active season found" };
    }

    const games = await getSeasonGamesList(season.id);

    // Try to find the game by exact match first
    let game = games.find((g) => g.gameId === taskId);

    // If not found, try to find by base game ID (without round number)
    if (!game) {
      game = games.find((g) => {
        const baseGameId = g.gameId.replace(/\d+$/, ""); // Remove round number
        return baseGameId === taskId;
      });
    }

    if (!game) {
      return { canSubmit: false, reason: "Game not found in current season" };
    }

    const isAllowed = isSubmissionAllowedForTask(taskId);

    // Get the deadline for this specific task
    const weekMatch = taskId.match(/(\d+)$/);
    let deadline = null;
    if (weekMatch) {
      const weekNumber = parseInt(weekMatch[1], 10);
      const { getWeekDeadline, getSeasonStartDate } = await import(
        "./deadlineUtils.js"
      );
      deadline = getWeekDeadline(weekNumber, getSeasonStartDate());
    }

    return {
      canSubmit: isAllowed,
      reason: isAllowed ? "Submission allowed" : "Deadline has passed",
      deadline: deadline,
      gameStatus: game.status,
    };
  } catch (error) {
    console.error("Error checking submission status:", error);
    return { canSubmit: false, reason: "Error checking submission status" };
  }
};

/**
 * Update user participation status
 */
export const updateUserParticipation = async (userId, participating) => {
  try {
    const { getCurrentSeason } = await import(
      "../firebase/new-database-utils.js"
    );
    const season = await getCurrentSeason();

    if (!season) {
      console.warn("No active season found");
      return;
    }

    await updateSeasonParticipant(season.id, userId, { participating });
    console.log(
      `Updated participation status for user ${userId}: ${participating}`
    );
  } catch (error) {
    console.error("Error updating user participation:", error);
    throw error;
  }
};
