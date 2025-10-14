// Utility functions for ranking and user management

/**
 * Get the rank of a user in a list of scores
 * @param {Array} scoresList - Array of score objects
 * @param {string} userName - Name of the user to find rank for
 * @returns {number|null} - Rank of the user (1-indexed) or null if not found
 */
export const getUserRank = (scoresList, userName) => {
  if (!scoresList || !userName) return null;

  // Sort scores by total score in descending order
  const sortedScores = [...scoresList].sort((a, b) => {
    const scoreA = a.totalScore || a.score || 0;
    const scoreB = b.totalScore || b.score || 0;
    return scoreB - scoreA;
  });

  // Find the user's position (1-indexed)
  const userIndex = sortedScores.findIndex(
    (score) => score.userName === userName || score.displayName === userName
  );

  return userIndex >= 0 ? userIndex + 1 : null;
};

/**
 * Get the total rank of a user across all rounds
 * @param {Array} totalScoresList - Array of total score objects
 * @param {string} userName - Name of the user to find rank for
 * @returns {number|null} - Total rank of the user (1-indexed) or null if not found
 */
export const getTotalRank = (totalScoresList, userName) => {
  return getUserRank(totalScoresList, userName);
};
