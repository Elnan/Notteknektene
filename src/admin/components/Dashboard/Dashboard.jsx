import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentSeasonInfo,
  getSeasonGames,
  getCurrentActiveGame,
} from "../../../utils/seasonManager";
import { getAllTaskStats } from "../../../utils/adminUtils";
import styles from "./Dashboard.module.css";

const Dashboard = ({ setRefreshFunction }) => {
  const [currentSeason, setCurrentSeason] = useState(null);
  const [seasonGames, setSeasonGames] = useState([]);
  const [taskStats, setTaskStats] = useState([]);
  const [liveGame, setLiveGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
    // Pass the refresh function to the parent component
    if (setRefreshFunction) {
      setRefreshFunction(() => loadDashboardData);
    }
  }, [setRefreshFunction]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load current season
      const season = await getCurrentSeasonInfo();
      setCurrentSeason(season);

      if (season) {
        // Load season games
        const games = await getSeasonGames();
        setSeasonGames(games);

        // Load live game
        const live = await getCurrentActiveGame();
        setLiveGame(live);
      }

      // Load task statistics
      const stats = await getAllTaskStats();
      setTaskStats(stats);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalOpenings = () => {
    return taskStats.reduce((sum, stat) => sum + stat.totalOpenings, 0);
  };

  const getActivePlayers = () => {
    const uniqueUsers = new Set();
    taskStats.forEach((stat) => {
      stat.users.forEach((user) => uniqueUsers.add(user.userId));
    });
    return uniqueUsers.size;
  };

  const quickActions = [
    {
      title: "Manage Users",
      description: "View player statistics and task openings",
      icon: "👥",
      path: "/admin/users",
      color: "#4299e1",
    },
    {
      title: "Game Schedule",
      description: "Control which game is currently live",
      icon: "🎮",
      path: "/admin/schedule",
      color: "#48bb78",
    },
    {
      title: "Score Management",
      description: "View and manage game submissions",
      icon: "🏆",
      path: "/admin/scores",
      color: "#ed8936",
    },
    {
      title: "Season Settings",
      description: "Configure season parameters",
      icon: "⚙️",
      path: "/admin/seasons",
      color: "#9f7aea",
    },
  ];

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Current Season Status */}
      <div className={styles.seasonStatus}>
        <h2>Current Season</h2>
        {currentSeason ? (
          <div className={styles.seasonInfo}>
            <div className={styles.seasonCard}>
              <h3>Season {currentSeason.seasonNumber}</h3>
              <p>
                Status:{" "}
                <span
                  className={
                    currentSeason.isActive ? styles.active : styles.inactive
                  }
                >
                  {currentSeason.isActive ? "Active" : "Inactive"}
                </span>
              </p>
              <p>Current Round: {currentSeason.currentRound}</p>
              <p>Total Rounds: {currentSeason.totalRounds}</p>
              {currentSeason.startDate && (
                <p>
                  Start:{" "}
                  {new Date(currentSeason.startDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {liveGame && (
              <div className={styles.liveGameCard}>
                <h3>🎮 Live Game</h3>
                <p>Round {liveGame.roundNumber}</p>
                <p>
                  Released:{" "}
                  {liveGame.releasedAt
                    ? new Date(liveGame.releasedAt).toLocaleString()
                    : "Unknown"}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.noSeason}>
            <p>No active season found</p>
            <button
              className={styles.createSeasonButton}
              onClick={() => navigate("/admin/seasons")}
            >
              Create Season
            </button>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className={styles.stats}>
        <h2>Season Statistics</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <h3>{getActivePlayers()}</h3>
              <p>Active Players</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📝</div>
            <div className={styles.statContent}>
              <h3>{getTotalOpenings()}</h3>
              <p>Total Task Openings</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎮</div>
            <div className={styles.statContent}>
              <h3>{seasonGames.length}</h3>
              <p>Games in Season</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <h3>{currentSeason?.currentRound || 0}</h3>
              <p>Current Round</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task Opening Statistics */}
      <div className={styles.taskStats}>
        <h2>Task Opening Statistics</h2>
        <div className={styles.taskStatsGrid}>
          {taskStats.map((stat) => (
            <div key={stat.taskId} className={styles.taskStatCard}>
              <h4>{stat.taskId.replace("-", " ").toUpperCase()}</h4>
              <p>Openings: {stat.totalOpenings}</p>
              <p>Players: {stat.users.length}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <div
              key={index}
              className={styles.actionCard}
              onClick={() => navigate(action.path)}
              style={{ borderLeftColor: action.color }}
            >
              <div className={styles.actionIcon}>{action.icon}</div>
              <div className={styles.actionContent}>
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
