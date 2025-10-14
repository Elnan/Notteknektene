/**
 * Utility functions for handling task deadlines
 * Tasks are due every Sunday at 23:59
 */

/**
 * Get the deadline for the current week's task
 * @returns {Date} The deadline (Sunday 23:59)
 */
export const getCurrentWeekDeadline = () => {
  const now = new Date();
  const nextSunday = new Date(now);
  const daysUntilSunday = (7 - now.getDay()) % 7;

  if (daysUntilSunday === 0) {
    // Today is Sunday, check if it's before 23:59
    if (
      now.getHours() < 23 ||
      (now.getHours() === 23 && now.getMinutes() < 59)
    ) {
      // Still time left today
      nextSunday.setHours(23, 59, 59, 999);
    } else {
      // Move to next Sunday
      nextSunday.setDate(nextSunday.getDate() + 7);
      nextSunday.setHours(23, 59, 59, 999);
    }
  } else {
    // Move to next Sunday
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
    nextSunday.setHours(23, 59, 59, 999);
  }

  return nextSunday;
};

/**
 * Check if the current time is before the deadline for the current week
 * @returns {boolean} True if submission is allowed, false if deadline has passed
 */
export const isSubmissionAllowed = () => {
  const now = new Date();
  const deadline = getCurrentWeekDeadline();
  return now < deadline;
};

/**
 * Check if submission is allowed for a specific task
 * @param {string} taskId - The task ID (e.g., "building-blocks1", "the-keeper2")
 * @returns {boolean} True if submission is allowed for this specific task
 */
export const isSubmissionAllowedForTask = (taskId) => {
  try {
    // Extract week number from task ID (e.g., "building-blocks1" -> 1)
    const weekMatch = taskId.match(/(\d+)$/);
    if (!weekMatch) {
      console.warn(`Could not extract week number from taskId: ${taskId}`);
      return false;
    }

    const weekNumber = parseInt(weekMatch[1], 10);
    const now = new Date();

    // Get the deadline for this specific week
    const deadline = getWeekDeadline(weekNumber, getSeasonStartDate());

    return now < deadline;
  } catch (error) {
    console.error("Error checking task deadline:", error);
    return false;
  }
};

/**
 * Get the season start date (Monday of the current week)
 * @returns {Date} The start date of the current season week
 */
export const getSeasonStartDate = () => {
  const now = new Date();
  const monday = new Date(now);
  const daysUntilMonday = (8 - now.getDay()) % 7; // Monday is day 1

  if (daysUntilMonday === 0) {
    // Today is Monday, use today
    monday.setHours(0, 0, 0, 0);
  } else {
    // Move to previous Monday
    monday.setDate(monday.getDate() - daysUntilMonday);
    monday.setHours(0, 0, 0, 0);
  }

  return monday;
};

/**
 * Get the deadline for a specific week
 * @param {number} weekNumber - The week number (1-10 for a season)
 * @param {Date} seasonStartDate - The start date of the season
 * @returns {Date} The deadline for that week
 */
export const getWeekDeadline = (weekNumber, seasonStartDate) => {
  const startDate = new Date(seasonStartDate);
  const deadlineDate = new Date(startDate);

  // Add weeks to get to the target week
  deadlineDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);

  // Set to Sunday 23:59
  const daysUntilSunday = (7 - deadlineDate.getDay()) % 7;
  deadlineDate.setDate(deadlineDate.getDate() + daysUntilSunday);
  deadlineDate.setHours(23, 59, 59, 999);

  return deadlineDate;
};

/**
 * Check if a submission is within the deadline for a specific week
 * @param {number} weekNumber - The week number
 * @param {Date} seasonStartDate - The start date of the season
 * @param {Date} submissionTime - The time of submission (defaults to now)
 * @returns {boolean} True if submission is allowed
 */
export const isSubmissionAllowedForWeek = (
  weekNumber,
  seasonStartDate,
  submissionTime = new Date()
) => {
  const deadline = getWeekDeadline(weekNumber, seasonStartDate);
  return submissionTime < deadline;
};

/**
 * Get time remaining until deadline
 * @returns {Object} Object with days, hours, minutes, seconds remaining
 */
export const getTimeRemaining = () => {
  const now = new Date();
  const deadline = getCurrentWeekDeadline();
  const timeDiff = deadline - now;

  if (timeDiff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, expired: false };
};

/**
 * Format deadline for display
 * @returns {string} Formatted deadline string
 */
export const getFormattedDeadline = () => {
  const deadline = getCurrentWeekDeadline();
  return deadline.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
