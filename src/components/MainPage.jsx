import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { games as defaultGames } from "../utils/gamesConfig";
import GameWrapper from "./GameWrapper/GameWrapper";
import { getSeasonGames } from "../utils/seasonManager";
import styles from "./MainPage.module.css";

const MainPage = () => {
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [gamesList, setGamesList] = useState(defaultGames);
  const [loading, setLoading] = useState(true);
  const { gameId } = useParams();

  // Load games from database and handle URL parameter
  useEffect(() => {
    const loadGamesAndSetIndex = async () => {
      try {
        setLoading(true);

        // Load games from database in their custom order
        const seasonGames = await getSeasonGames();

        if (seasonGames.length > 0) {
          // Use the custom order from the database
          const updatedGames = seasonGames.map((seasonGame) => {
            // Find the game info from defaultGames using the base game ID
            const baseGameId = seasonGame.gameId.replace(/\d+$/, ""); // Remove round number
            const gameInfo = defaultGames.find((g) => g.id === baseGameId);

            if (gameInfo) {
              return {
                ...gameInfo,
                status: seasonGame.status || gameInfo.status,
                isActive: seasonGame.isActive || false,
                roundNumber: seasonGame.roundNumber,
              };
            }

            // Fallback if game not found in defaultGames
            return {
              id: baseGameId,
              name: seasonGame.gameId,
              component: null,
              status: seasonGame.status || "upcoming",
              isActive: seasonGame.isActive || false,
              roundNumber: seasonGame.roundNumber,
            };
          });
          setGamesList(updatedGames);
        } else {
          // No active season - show empty games list
          setGamesList([]);
        }

        // Handle URL parameter for game selection
        if (gameId) {
          const gameIndex = parseInt(gameId) - 1; // Convert 1-indexed to 0-indexed
          if (
            !isNaN(gameIndex) &&
            gameIndex >= 0 &&
            gameIndex <
              (seasonGames.length > 0
                ? seasonGames.length
                : defaultGames.length)
          ) {
            setCurrentGameIndex(gameIndex);
          }
        }
      } catch (error) {
        console.error("Error loading games:", error);
        // No active season or error - show empty games list
        setGamesList([]);
      } finally {
        setLoading(false);
      }
    };

    loadGamesAndSetIndex();
  }, [gameId]);

  const currentGame = gamesList[currentGameIndex];

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading game...</p>
      </div>
    );
  }

  // Check if there are no games (no active season)
  if (gamesList.length === 0) {
    return (
      <div className={styles.error}>
        <h2>No Active Season</h2>
        <p>
          There is currently no active season. Please wait for an administrator
          to start a new season.
        </p>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className={styles.error}>
        <h2>Game Not Found</h2>
        <p>The requested game could not be found.</p>
      </div>
    );
  }

  // Check if the game is available (current or completed)
  const isGameAvailable =
    currentGame.status === "current" || currentGame.status === "completed";

  if (!isGameAvailable) {
    return (
      <div className={styles.gameNotAvailable}>
        <p>This game is not available yet.</p>
      </div>
    );
  }

  const WrappedGameComponent = () => (
    <GameWrapper
      GameComponent={currentGame.component}
      taskId={currentGame.id}
      taskName={currentGame.name}
      taskDescription={currentGame.description}
    />
  );

  return (
    <div className={styles.mainPage}>
      <div className={styles.gameContainer}>
        <WrappedGameComponent />
      </div>
    </div>
  );
};

export default MainPage;
