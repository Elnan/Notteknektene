import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styles from "./ProgressBar.module.css";
import { games as defaultGames } from "../utils/gamesConfig";

const ProgressBar = ({ games = defaultGames, onGameSelect }) => {
  const [liveGameIndex, setLiveGameIndex] = useState(0);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const location = useLocation();

  // Determine this week's live game from status
  useEffect(() => {
    const weeklyLiveIdx = games.findIndex((g) => g.status === "current");
    setLiveGameIndex(weeklyLiveIdx !== -1 ? weeklyLiveIdx : 0);
  }, [games]);

  // Determine selected game from URL param (1-indexed in URL)
  useEffect(() => {
    // Check for pretty URL first (e.g., /games/3)
    const pathParts = location.pathname.split("/");
    const gameIdFromPath = pathParts[pathParts.length - 1];

    if (gameIdFromPath && !isNaN(parseInt(gameIdFromPath))) {
      const idx = parseInt(gameIdFromPath, 10) - 1;
      if (idx >= 0 && idx < games.length) {
        setSelectedGameIndex(idx);
        return;
      }
    }

    // Fallback to query parameter (e.g., ?game=3)
    const urlParams = new URLSearchParams(location.search);
    const gameParam = urlParams.get("game");
    if (gameParam !== null) {
      const idx = parseInt(gameParam, 10) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < games.length) {
        setSelectedGameIndex(idx);
        return;
      }
    }

    // Default selection = live game
    setSelectedGameIndex((idx) =>
      Number.isInteger(idx) ? idx : liveGameIndex
    );
  }, [location.pathname, location.search, games.length, liveGameIndex]);

  const handleGameSelect = (index) => {
    setSelectedGameIndex(index);
    if (onGameSelect) {
      onGameSelect(index);
    }
  };

  return (
    <div className={styles.progressBarContainer}>
      <div className={styles.progressBar}>
        {games.map((game, idx) => {
          const isLive = idx === liveGameIndex;
          const isSelected = idx === selectedGameIndex;
          const className = [
            styles.segment,
            styles[game.status],
            isLive ? styles.live : "",
            isSelected ? styles.selected : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={game.name}
              className={className}
              onClick={() => handleGameSelect(idx)}
              aria-current={isSelected ? "step" : undefined}
            >
              <span className={styles.number}>{idx + 1}</span>
              {isLive && <span className={styles.activeBadge}>LIVE</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
