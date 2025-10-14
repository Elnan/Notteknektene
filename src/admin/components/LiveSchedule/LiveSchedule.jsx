import React, { useState, useEffect } from "react";
import {
  getCurrentSeasonInfo,
  getSeasonGames,
  getCurrentActiveGame,
  manuallyReleaseGame,
  getNextMonday,
} from "../../../utils/seasonManager";
import { games as defaultGames } from "../../../utils/gamesConfig";
import styles from "./LiveSchedule.module.css";

const LiveSchedule = () => {
  const [currentSeason, setCurrentSeason] = useState(null);
  const [liveGame, setLiveGameState] = useState(null);
  const [seasonGames, setSeasonGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [nextMonday, setNextMonday] = useState(null);

  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = async () => {
    try {
      setLoading(true);

      const season = await getCurrentSeasonInfo();
      setCurrentSeason(season);

      if (season) {
        const live = await getCurrentActiveGame();
        setLiveGameState(live);

        // Load season games
        const games = await getSeasonGames();
        setSeasonGames(games);
      }

      setNextMonday(getNextMonday());
    } catch (error) {
      console.error("Error loading schedule data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetLiveGame = async (roundNumber) => {
    try {
      await manuallyReleaseGame(roundNumber);
      await loadScheduleData(); // Refresh data
      alert(`Game ${roundNumber} set as live successfully!`);
    } catch (error) {
      console.error("Error setting live game:", error);
      alert("Error updating live game");
    }
  };

  const toggleAutoSchedule = () => {
    setAutoSchedule(!autoSchedule);
  };

  const getGameStatus = (game) => {
    if (game.status === "current") return "🟢 Live";
    if (game.status === "completed") return "✅ Completed";
    if (game.status === "upcoming") return "⏳ Upcoming";
    return "❓ Unknown";
  };

  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date.toDate()).toLocaleString();
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className={styles.liveSchedule}>
      <div className={styles.header}>
        <h1>Live Schedule Management</h1>
        <p>
          Control which game is currently live and manage the release schedule
        </p>
      </div>

      {/* Current Status */}
      <div className={styles.currentStatus}>
        <h2>Current Status</h2>
        <div className={styles.statusGrid}>
          <div className={styles.statusCard}>
            <h3>Season</h3>
            <p>
              {currentSeason
                ? `Season ${currentSeason.seasonNumber}`
                : "No season"}
            </p>
            <p>
              Status:{" "}
              <span
                className={
                  currentSeason?.isActive ? styles.active : styles.inactive
                }
              >
                {currentSeason?.isActive ? "Active" : "Inactive"}
              </span>
            </p>
          </div>

          <div className={styles.statusCard}>
            <h3>Current Round</h3>
            <p>{currentSeason?.currentRound || "None"}</p>
            <p>Total Rounds: {currentSeason?.totalRounds || 0}</p>
          </div>

          <div className={styles.statusCard}>
            <h3>Live Game</h3>
            {liveGame ? (
              <>
                <p className={styles.liveGameName}>
                  Round {liveGame.roundNumber}
                </p>
                <p className={styles.liveGameTime}>
                  Released: {formatDate(liveGame.releasedAt)}
                </p>
              </>
            ) : (
              <p className={styles.noLiveGame}>No live game</p>
            )}
          </div>

          <div className={styles.statusCard}>
            <h3>Next Release</h3>
            <p>
              {nextMonday ? nextMonday.toLocaleDateString() : "Not scheduled"}
            </p>
            <p>Auto-schedule: {autoSchedule ? "Enabled" : "Disabled"}</p>
          </div>
        </div>
      </div>

      {/* Auto Schedule Control */}
      <div className={styles.autoSchedule}>
        <h2>Automatic Schedule</h2>
        <div className={styles.autoScheduleControl}>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={autoSchedule}
              onChange={toggleAutoSchedule}
            />
            <span className={styles.slider}></span>
          </label>
          <div className={styles.autoScheduleInfo}>
            <h3>Automatic Game Release</h3>
            <p>
              When enabled, new games will be automatically released every
              Monday at 00:00. You can still manually override this schedule.
            </p>
          </div>
        </div>
      </div>

      {/* Game Schedule */}
      <div className={styles.gameSchedule}>
        <h2>Game Schedule</h2>
        <div className={styles.gamesList}>
          {seasonGames.length > 0 ? (
            seasonGames.map((seasonGame) => {
              // Find the game info from defaultGames using the base game ID
              const baseGameId = seasonGame.gameId.replace(/\d+$/, ""); // Remove round number
              const gameInfo = defaultGames.find((g) => g.id === baseGameId);
              const gameName = gameInfo ? gameInfo.name : seasonGame.gameId;
              const gameId = gameInfo ? gameInfo.id : baseGameId;

              const status = getGameStatus(seasonGame);
              const isLive = seasonGame.status === "current";

              return (
                <div key={seasonGame.gameId} className={styles.gameCard}>
                  <div className={styles.gameHeader}>
                    <div className={styles.gameInfo}>
                      <h3>{gameName}</h3>
                      <p>Round {seasonGame.roundNumber}</p>
                    </div>
                    <div className={styles.gameStatus}>
                      <span className={isLive ? styles.liveIndicator : ""}>
                        {status}
                      </span>
                    </div>
                  </div>

                  <div className={styles.gameDetails}>
                    <p>ID: {gameId}</p>
                    {seasonGame.releasedAt && (
                      <p>Released: {formatDate(seasonGame.releasedAt)}</p>
                    )}
                  </div>

                  <div className={styles.gameActions}>
                    {!isLive && (
                      <button
                        className={styles.setLiveButton}
                        onClick={() =>
                          handleSetLiveGame(seasonGame.roundNumber)
                        }
                      >
                        Set as Live
                      </button>
                    )}
                    {isLive && (
                      <span className={styles.liveIndicator}>
                        Currently Live
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p>No games found for this season.</p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className={styles.instructions}>
        <h2>Instructions</h2>
        <div className={styles.instructionGrid}>
          <div className={styles.instructionCard}>
            <h3>🟢 Live Game</h3>
            <p>The currently active game that players can access and play.</p>
          </div>
          <div className={styles.instructionCard}>
            <h3>✅ Completed</h3>
            <p>Games that have been released and are now in the past.</p>
          </div>
          <div className={styles.instructionCard}>
            <h3>⏳ Upcoming</h3>
            <p>Games that are scheduled for future release.</p>
          </div>
          <div className={styles.instructionCard}>
            <h3>🎮 Manual Release</h3>
            <p>
              Click "Set as Live" to manually release a game before its
              scheduled time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSchedule;
