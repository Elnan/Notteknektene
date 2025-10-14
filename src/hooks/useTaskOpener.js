import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { hasTaskBeenOpened, recordTaskOpening } from "../utils/taskTracking.js";

// Helper function to check if a task is completed (released but not live)
const isTaskCompleted = async (taskId) => {
  try {
    const { getCurrentSeason, getSeasonGamesList } = await import(
      "../firebase/new-database-utils.js"
    );
    const season = await getCurrentSeason();

    if (!season) {
      return false;
    }

    const games = await getSeasonGamesList(season.id);

    // Try to find the game by exact match first
    let game = games.find((g) => g.gameId === taskId);

    // If not found, try to find by base game ID (without round number)
    if (!game) {
      game = games.find((g) => {
        const baseGameId = g.gameId.replace(/\d+$/, ""); // Removes the round number
        return baseGameId === taskId;
      });
    }

    if (!game) {
      return false;
    }

    // A task is "completed" if it has been released (status: "completed") but is not currently active
    return game.status === "completed" && !game.isActive;
  } catch (error) {
    console.error("Error checking if task is completed:", error);
    return false;
  }
};

export const useTaskOpener = (taskId) => {
  const [isOpened, setIsOpened] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const checkTaskStatus = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Check if the task has been manually opened
        const hasOpened = await hasTaskBeenOpened(taskId, currentUser.uid);

        // If not manually opened, check if it's a completed task (should auto-open)
        if (!hasOpened) {
          const isCompletedTask = await isTaskCompleted(taskId);
          if (isCompletedTask) {
            console.log(`🎮 Auto-opening completed task: ${taskId}`);
            setIsOpened(true);
            setLoading(false);
            return;
          }
        }

        setIsOpened(hasOpened);
      } catch (error) {
        console.error("Error checking task status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkTaskStatus();
  }, [taskId, currentUser]);

  const handleTaskOpen = async () => {
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }

    try {
      const userName = currentUser.displayName || currentUser.email;
      await recordTaskOpening(taskId, currentUser.uid, userName);
      setIsOpened(true);
    } catch (error) {
      console.error("Error recording task opening:", error);
    }
  };

  return {
    isOpened,
    loading,
    handleTaskOpen,
  };
};
