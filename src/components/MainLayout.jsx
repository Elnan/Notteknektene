import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import ProgressBar from "./ProgressBar";
import MobileBottomNav from "./MobileBottomNav/MobileBottomNav";
import { games as defaultGames } from "../utils/gamesConfig";
import {
  getSeasonGames,
  shouldReleaseNewGame,
  releaseNextGame,
} from "../utils/seasonManager";

const MainLayout = () => {
  const [gamesList, setGamesList] = useState(defaultGames);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const loadGamesFromDatabase = async () => {
      try {
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
          // Fallback to default games if no season games found
          setGamesList(defaultGames);
        }

        // Optionally release a new game if needed
        const shouldRelease = await shouldReleaseNewGame();
        if (shouldRelease) {
          await releaseNextGame();
          const reloadedSeasonGames = await getSeasonGames();

          if (reloadedSeasonGames.length > 0) {
            const reloadedGames = reloadedSeasonGames.map((seasonGame) => {
              const baseGameId = seasonGame.gameId.replace(/\d+$/, "");
              const gameInfo = defaultGames.find((g) => g.id === baseGameId);

              if (gameInfo) {
                return {
                  ...gameInfo,
                  status: seasonGame.status || gameInfo.status,
                  isActive: seasonGame.isActive || false,
                  roundNumber: seasonGame.roundNumber,
                };
              }

              return {
                id: baseGameId,
                name: seasonGame.gameId,
                component: null,
                status: seasonGame.status || "upcoming",
                isActive: seasonGame.isActive || false,
                roundNumber: seasonGame.roundNumber,
              };
            });
            setGamesList(reloadedGames);
          }
        }
      } catch (error) {
        console.error("Error loading games:", error);
        // Fallback to default games on error
        setGamesList(defaultGames);
      }
    };

    loadGamesFromDatabase();
  }, [location.pathname]);

  const handleGameSelection = (gameIndex) => {
    const gameNumber = gameIndex + 1;
    navigate(`/games/${gameNumber}`);
  };

  return (
    <div>
      {!isMobile && <Header />}
      {!isMobile && (
        <ProgressBar games={gamesList} onGameSelect={handleGameSelection} />
      )}
      <div className={isMobile ? "mobile-content" : ""}>
        <Outlet />
      </div>
      {isMobile && (
        <MobileBottomNav games={gamesList} onGameSelect={handleGameSelection} />
      )}
    </div>
  );
};

export default MainLayout;
