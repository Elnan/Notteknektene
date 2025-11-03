import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";

/**
 * Hook to check if the current user has submitted an answer for a game
 * @param {string} gameId - The full game ID (e.g., "patternSolver8")
 * @param {string} taskId - The base game ID (e.g., "pattern-solver") - used as fallback
 * @param {number} trigger - Optional trigger value to force re-check (increment to trigger)
 * @returns {{ hasSubmitted: boolean, isChecking: boolean, submissionData: object | null }}
 */
export const useSubmissionStatus = (gameId, taskId = null, trigger = 0) => {
  const { currentUser } = useAuth();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [submissionData, setSubmissionData] = useState(null);

  useEffect(() => {
    const checkSubmissionStatus = async () => {
      if (!currentUser || (!gameId && !taskId)) {
        setIsChecking(false);
        return;
      }

      try {
        setIsChecking(true);

        // Import Firebase utilities
        const { getCurrentSeason, getSeasonGamesList, getUserGameSubmission } =
          await import("../firebase/new-database-utils.js");

        // Get current season
        const season = await getCurrentSeason();
        if (!season) {
          console.warn("No active season found for submission check");
          setHasSubmitted(false);
          setIsChecking(false);
          return;
        }

        // Determine the actual game document ID
        // Note: getUserGameSubmission needs game.id (document ID), not game.gameId
        let actualGameId = null;

        if (gameId) {
          // If gameId is provided, find the game document to get its ID
          const games = await getSeasonGamesList(season.id);
          const game = games.find(
            (g) => g.gameId === gameId || g.id === gameId
          );

          if (game) {
            actualGameId = game.id; // Use the document ID
          }
        }

        // If we don't have gameId but have taskId, try to resolve it
        if (!actualGameId && taskId) {
          const games = await getSeasonGamesList(season.id);
          const game = games.find((g) => {
            const baseGameId = g.gameId.replace(/\d+$/, ""); // Remove round number
            return baseGameId === taskId;
          });

          if (game) {
            actualGameId = game.id; // Use the game document ID (game.id, not game.gameId)
          }
        }

        if (!actualGameId) {
          setHasSubmitted(false);
          setIsChecking(false);
          return;
        }

        // Check for existing submission
        const submission = await getUserGameSubmission(
          season.id,
          actualGameId,
          currentUser.uid
        );

        if (submission && submission.completed && submission.submittedAt) {
          setHasSubmitted(true);
          setSubmissionData(submission);
        } else {
          setHasSubmitted(false);
          setSubmissionData(null);
        }
      } catch (error) {
        console.error("Error checking submission status:", error);
        setHasSubmitted(false);
        setSubmissionData(null);
      } finally {
        setIsChecking(false);
      }
    };

    checkSubmissionStatus();
  }, [currentUser, gameId, taskId, trigger]);

  return { hasSubmitted, isChecking, submissionData };
};
