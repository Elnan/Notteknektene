import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaListOl,
  FaBook,
  FaTimes,
  FaUser,
  FaSignOutAlt,
  FaTrash,
} from "react-icons/fa";
import styles from "./MobileBottomNav.module.css";
import { games as defaultGames } from "../../utils/gamesConfig";
import { useAuth } from "../../context/authContext";

const MobileBottomNav = ({ games = defaultGames, onGameSelect }) => {
  const [isGameSelectorOpen, setIsGameSelectorOpen] = useState(false);
  const [liveGameIndex, setLiveGameIndex] = useState(0);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

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
    setIsGameSelectorOpen(false);

    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    if (onGameSelect) {
      onGameSelect(index);
    }
  };

  const toggleGameSelector = () => {
    setIsGameSelectorOpen(!isGameSelectorOpen);

    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleClearStorage = () => {
    try {
      // Clear all localStorage
      localStorage.clear();

      // Also clear specific game saves
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("game_save_") || key.includes("notteknektene")) {
          localStorage.removeItem(key);
        }
      });

      // Show confirmation
      alert("Local storage cleared! All game progress has been reset.");

      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (error) {
      console.error("Failed to clear storage:", error);
      alert("Failed to clear storage. Please try again.");
    }
  };

  // Check if this is your Gmail account (replace with your actual email)
  const isYourAccount = currentUser?.email === "olavelnan@gmail.com";

  // Close game selector when clicking outside or pressing Escape
  useEffect(() => {
    if (!isGameSelectorOpen) return;

    const handleClickOutside = (event) => {
      const gameSelector = document.querySelector(
        `.${styles.gameSelectorOverlay}`
      );
      const centerButton = document.querySelector(`.${styles.centerButton}`);

      if (
        gameSelector &&
        !gameSelector.contains(event.target) &&
        centerButton &&
        !centerButton.contains(event.target)
      ) {
        setIsGameSelectorOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsGameSelectorOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isGameSelectorOpen]);

  // Determine what to show in the center button
  const getCenterButtonContent = () => {
    if (location.pathname.includes("/games/")) {
      return selectedGameIndex + 1;
    }
    return "NK";
  };

  return (
    <div className={styles.mobileBottomNav}>
      {/* Left: Scoreboard/Table button */}
      <Link to="/scoreboard" className={styles.navButton}>
        <FaListOl className={styles.navIcon} />
        <span className={styles.navText}>Table</span>
      </Link>

      {/* Center: Game selector */}
      <div className={styles.gameSelectorContainer}>
        <button
          className={styles.centerButton}
          onClick={toggleGameSelector}
          aria-label="Select game"
        >
          <span className={styles.centerButtonText}>
            {getCenterButtonContent()}
          </span>
        </button>

        {/* Game selector overlay */}
        {isGameSelectorOpen && (
          <div className={styles.gameSelectorOverlay}>
            <div className={styles.gameSelector}>
              <button
                className={styles.closeButton}
                onClick={() => setIsGameSelectorOpen(false)}
                aria-label="Close game selector"
              >
                X
              </button>

              {/* Game numbers */}
              <div className={styles.gameNumbersContainer}>
                {games.map((game, index) => {
                  const isLive = index === liveGameIndex;
                  const isSelected = index === selectedGameIndex;

                  return (
                    <button
                      key={game.name}
                      className={`${styles.gameOption} ${
                        isLive ? styles.live : ""
                      } ${isSelected ? styles.selected : ""}`}
                      onClick={() => handleGameSelect(index)}
                    >
                      <span className={styles.gameNumber}>{index + 1}</span>
                      {isLive && <span className={styles.liveBadge}>LIVE</span>}
                    </button>
                  );
                })}
              </div>

              {/* User info section */}
              {currentUser && (
                <div className={styles.userInfoSection}>
                  <div className={styles.userInfo}>
                    <FaUser className={styles.userIcon} />
                    <div className={styles.userDetails}>
                      <span className={styles.userName}>
                        {currentUser.displayName || currentUser.email}
                      </span>
                      <span className={styles.userEmail}>
                        {currentUser.email}
                      </span>
                    </div>
                  </div>

                  {/* Clear storage button - only for your account */}
                  {isYourAccount && (
                    <button
                      className={styles.clearStorageButton}
                      onClick={handleClearStorage}
                      aria-label="Clear local storage"
                    >
                      <FaTrash className={styles.clearStorageIcon} />
                      <span>Clear Storage</span>
                    </button>
                  )}

                  <button
                    className={styles.logoutButton}
                    onClick={handleLogout}
                    aria-label="Logout"
                  >
                    <FaSignOutAlt className={styles.logoutIcon} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: Rules button */}
      <Link to="/rules" className={styles.navButton}>
        <FaBook className={styles.navIcon} />
        <span className={styles.navText}>Rules</span>
      </Link>
    </div>
  );
};

export default MobileBottomNav;
