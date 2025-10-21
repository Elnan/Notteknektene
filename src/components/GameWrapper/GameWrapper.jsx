import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import { useTaskOpener } from "../../hooks/useTaskOpener";
import TaskOpener from "../TaskOpener/TaskOpener";
import { saveGameSubmission } from "../../utils/gameSubmissionUtils";

const GameWrapper = ({
  taskId,
  GameComponent,
  taskName,
  taskDescription,
  gameProps = {},
}) => {
  const { isOpened, loading, handleTaskOpen } = useTaskOpener(taskId);
  const { currentUser } = useAuth();
  const [currentGameId, setCurrentGameId] = useState(null);

  // Determine the current game ID based on the taskId and current season
  useEffect(() => {
    const determineCurrentGameId = async () => {
      try {
        // Get current season
        const { getCurrentSeason, getSeasonGamesList } = await import(
          "../../firebase/new-database-utils.js"
        );
        const season = await getCurrentSeason();

        console.log("🔍 GameWrapper - Current season:", season);

        if (!season) {
          console.warn("No active season found for game ID determination");
          return;
        }

        // Get all games in the season
        const games = await getSeasonGamesList(season.id);

        // Find the game that matches the taskId (base game ID)
        const game = games.find((g) => {
          const baseGameId = g.gameId.replace(/\d+$/, ""); // Removes the round number
          return baseGameId === taskId;
        });

        if (game) {
          setCurrentGameId(game.gameId);
          console.log(`🎮 Game ID determined: ${taskId} -> ${game.gameId}`);
        } else {
          console.warn(
            `Game with taskId ${taskId} not found in current season`
          );
        }
      } catch (error) {
        console.error("Error determining current game ID:", error);
      }
    };

    determineCurrentGameId();
  }, [taskId]);

  const handleGameComplete = async (gameId, gameData) => {
    try {
      console.log(`🎮 Game completed: ${gameId}`, gameData);
      console.log(`📱 Device info:`, {
        userAgent: navigator.userAgent,
        isMobile:
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          ),
        online: navigator.onLine,
        connection: navigator.connection
          ? navigator.connection.effectiveType
          : "unknown",
      });

      // Use the currentGameId if available, otherwise fall back to the passed gameId
      const actualGameId = currentGameId || gameId;
      console.log(
        `Using game ID: ${actualGameId} (from ${currentGameId ? "currentGameId" : "passed gameId"})`
      );

      // Get current season
      const { getCurrentSeason } = await import(
        "../../firebase/new-database-utils.js"
      );
      const season = await getCurrentSeason();

      if (!season) {
        console.warn("No active season found for game completion");
        return;
      }

      // Find the game in the season
      const { getSeasonGamesList } = await import(
        "../../firebase/new-database-utils.js"
      );
      const games = await getSeasonGamesList(season.id);

      // Try to find the game by exact match first
      let game = games.find((g) => g.gameId === actualGameId);

      // If not found, try to find by base game ID (without round number)
      if (!game) {
        game = games.find((g) => {
          const baseGameId = g.gameId.replace(/\d+$/, ""); // Removes the round number
          return baseGameId === actualGameId;
        });
      }

      if (!game) {
        console.warn(`Game ${actualGameId} not found in current season`);
        console.log(
          "Available games:",
          games.map((g) => g.gameId)
        );
        return;
      }

      // Check if the game is currently active and accepting submissions
      if (!game.isActive || game.status !== "current") {
        console.warn(
          `Game ${gameId} is not active for submissions (status: ${game.status}, isActive: ${game.isActive})`
        );
        return;
      }

      // Check if user has already submitted for this game
      const { getUserGameSubmission } = await import(
        "../../firebase/new-database-utils.js"
      );
      console.log(
        `🔍 Checking existing submission for user ${currentUser.uid} in game ${game.id}`
      );
      const existingSubmission = await getUserGameSubmission(
        season.id,
        game.id,
        currentUser.uid
      );
      console.log(`📋 Existing submission:`, existingSubmission);

      if (existingSubmission && existingSubmission.completed) {
        console.log(
          `User ${currentUser.uid} has already submitted for game ${gameId} - this is a replay for fun`
        );
        // Don't return - allow the submission to proceed but mark it as a replay
        gameData.isReplay = true;
        gameData.originalSubmissionId = existingSubmission.id;
      }

      // Prepare user data
      const userData = {
        userName:
          currentUser.displayName ||
          (currentUser.email ? currentUser.email.split("@")[0] : null) ||
          "Unknown User",
        userEmail: currentUser.email || "",
      };

      // Calculate time spent if not provided
      const timeSpent =
        gameData.timeSpent ||
        (window.gameStartTime ? Date.now() - window.gameStartTime : 0);

      // Save the submission using the new standardized system
      if (gameData.isReplay) {
        console.log(
          "🎮 This is a replay for fun - saving locally only, not to database"
        );
        // For replays, we don't save to database, just log it
        console.log("🎮 Replay submission:", {
          gameId: game.gameId,
          score: gameData.score,
          isReplay: true,
          originalSubmissionId: gameData.originalSubmissionId,
        });
      } else {
        console.log(
          `💾 Attempting to save submission for user ${currentUser.uid}:`,
          {
            seasonId: season.id,
            gameId: game.gameId,
            userData,
            gameData: {
              score: gameData.score,
              timeSpent,
              attempts: gameData.attempts || 1,
            },
          }
        );

        const submissionResult = await saveGameSubmission(
          season.id,
          game.gameId, // Use the full game ID with round number
          currentUser.uid,
          gameData,
          userData,
          {
            timeSpent,
            attempts: gameData.attempts || 1,
          }
        );

        console.log(`📊 Submission result:`, submissionResult);

        // Verify submission was actually saved
        if (!submissionResult || !submissionResult.success) {
          throw new Error("Submission save returned unsuccessful result");
        }

        console.log(`✅ Game submission verified and recorded for ${gameId}`);
      }
    } catch (error) {
      console.error("❌ CRITICAL: Error recording game completion:", error);

      // Check if it's a non-participating user error
      const isNonParticipatingError = error.message.includes(
        "not participating in the current season"
      );

      if (isNonParticipatingError) {
        // Show friendly message to non-participating user but still allow them to see their result
        console.log(
          "ℹ️ User is not participating in the current season - showing result but not saving"
        );
        alert(
          "You are not participating in the current season. Your result has been calculated but will not be saved to the database."
        );
        // Continue to victory screen to show their result
        return;
      }

      // Check if it's a network error (common on mobile)
      const isNetworkError =
        error.code === "unavailable" ||
        error.message.includes("network") ||
        error.message.includes("timeout") ||
        !navigator.onLine;

      if (isNetworkError) {
        // Try to retry submission once for network errors
        console.log("🔄 Network error detected, attempting retry...");
        try {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

          const retryResult = await saveGameSubmission(
            season.id,
            game.gameId,
            currentUser.uid,
            gameData,
            userData,
            {
              timeSpent,
              attempts: gameData.attempts || 1,
            }
          );

          if (retryResult && retryResult.success) {
            console.log(`✅ Game submission succeeded on retry for ${gameId}`);
            return; // Success, continue with victory screen
          }
        } catch (retryError) {
          console.error("❌ Retry also failed:", retryError);
        }
      }

      // Show error to user and prevent victory screen
      const errorMessage = isNetworkError
        ? "Network error: Please check your connection and try again."
        : `Submission failed: ${error.message}. Please try again.`;

      alert(errorMessage);

      // Don't show victory screen if submission failed
      return;
    }
  };

  return (
    <TaskOpener
      taskName={taskName}
      taskDescription={taskDescription}
      onTaskOpen={handleTaskOpen}
      isOpened={isOpened}
      loading={loading}
    >
      <GameComponent
        {...gameProps}
        onComplete={handleGameComplete}
        currentGameId={currentGameId}
      />
    </TaskOpener>
  );
};

export default GameWrapper;
