import React, { useState, useEffect } from "react";
import {
  getAllUsers,
  getUserScores,
  overrideUserScore,
  getScoreOverrides,
  getCurrentSeason,
} from "../../../firebase/admin-firebase-utils";
import styles from "./ScoreManagement.module.css";

const ScoreManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userScores, setUserScores] = useState([]);
  const [scoreOverrides, setScoreOverrides] = useState([]);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterParticipating, setFilterParticipating] = useState(false);

  // Override form state
  const [overrideForm, setOverrideForm] = useState({
    gameId: "",
    newScore: "",
    reason: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [usersData, season, overrides] = await Promise.all([
        getAllUsers(),
        getCurrentSeason(),
        getScoreOverrides(),
      ]);

      setUsers(usersData);
      setCurrentSeason(season);
      setScoreOverrides(overrides);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    try {
      const scores = await getUserScores(user.id);
      setUserScores(scores);
    } catch (error) {
      console.error("Error loading user scores:", error);
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();

    if (
      !selectedUser ||
      !overrideForm.gameId ||
      !overrideForm.newScore ||
      !overrideForm.reason
    ) {
      alert("Please fill in all fields");
      return;
    }

    const newScore = parseInt(overrideForm.newScore);
    if (isNaN(newScore) || newScore < 0) {
      alert("Please enter a valid score (0 or higher)");
      return;
    }

    try {
      await overrideUserScore(
        selectedUser.id,
        overrideForm.gameId,
        newScore,
        overrideForm.reason
      );

      // Reset form and reload data
      setOverrideForm({ gameId: "", newScore: "", reason: "" });
      await loadData();
      if (selectedUser) {
        await handleUserSelect(selectedUser);
      }

      alert("Score override applied successfully!");
    } catch (error) {
      console.error("Error overriding score:", error);
      alert("Error applying score override");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterParticipating || user.Participating;
    return matchesSearch && matchesFilter;
  });

  const getGameName = (gameId) => {
    // This would need to be connected to actual game data
    // For now, return the gameId
    return gameId;
  };

  const formatDate = (date) => {
    if (!date) return "Unknown";
    if (date.toDate) {
      return date.toDate().toLocaleString();
    }
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading score management...</p>
      </div>
    );
  }

  return (
    <div className={styles.scoreManagement}>
      <div className={styles.header}>
        <h1>Score Management</h1>
        <button className={styles.refreshButton} onClick={loadData}>
          🔄 Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <label className={styles.filterLabel}>
            <input
              type="checkbox"
              checked={filterParticipating}
              onChange={(e) => setFilterParticipating(e.target.checked)}
            />
            Show only participating users
          </label>
        </div>
      </div>

      <div className={styles.content}>
        {/* User List */}
        <div className={styles.userSection}>
          <h2>Users ({filteredUsers.length})</h2>
          <div className={styles.userList}>
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`${styles.userCard} ${selectedUser?.id === user.id ? styles.selected : ""}`}
                onClick={() => handleUserSelect(user)}
              >
                <div className={styles.userInfo}>
                  <h3>{user.displayName || user.email}</h3>
                  <p>{user.email}</p>
                  <span
                    className={`${styles.participationStatus} ${user.Participating ? styles.participating : styles.notParticipating}`}
                  >
                    {user.Participating ? "Participating" : "Not Participating"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Details and Score Override */}
        {selectedUser && (
          <div className={styles.userDetails}>
            <h2>
              Score Management for{" "}
              {selectedUser.displayName || selectedUser.email}
            </h2>

            {/* Current Scores */}
            <div className={styles.currentScores}>
              <h3>Current Scores</h3>
              {userScores.length > 0 ? (
                <div className={styles.scoresList}>
                  {userScores.map((score) => (
                    <div key={score.id} className={styles.scoreItem}>
                      <div className={styles.scoreInfo}>
                        <span className={styles.gameName}>
                          {getGameName(score.id)}
                        </span>
                        <span className={styles.scoreValue}>{score.score}</span>
                        {score.isOverridden && (
                          <span className={styles.overrideBadge}>
                            Overridden
                          </span>
                        )}
                      </div>
                      {score.overrideData && (
                        <div className={styles.overrideInfo}>
                          <small>
                            Overridden:{" "}
                            {formatDate(score.overrideData.overriddenAt)} -
                            Reason: {score.overrideData.reason}
                          </small>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No scores found for this user.</p>
              )}
            </div>

            {/* Score Override Form */}
            <div className={styles.overrideForm}>
              <h3>Override Score</h3>
              <form onSubmit={handleOverrideSubmit}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Game:</label>
                    <select
                      value={overrideForm.gameId}
                      onChange={(e) =>
                        setOverrideForm({
                          ...overrideForm,
                          gameId: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select a game...</option>
                      {currentSeason?.games?.map((game) => (
                        <option key={game.id} value={game.id}>
                          {game.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>New Score:</label>
                    <input
                      type="number"
                      min="0"
                      value={overrideForm.newScore}
                      onChange={(e) =>
                        setOverrideForm({
                          ...overrideForm,
                          newScore: e.target.value,
                        })
                      }
                      placeholder="Enter new score"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Reason for Override:</label>
                  <textarea
                    value={overrideForm.reason}
                    onChange={(e) =>
                      setOverrideForm({
                        ...overrideForm,
                        reason: e.target.value,
                      })
                    }
                    placeholder="Explain why this score is being overridden..."
                    required
                    rows="3"
                  />
                </div>

                <button type="submit" className={styles.overrideButton}>
                  Apply Override
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Override History */}
      <div className={styles.overrideHistory}>
        <h2>Recent Score Overrides</h2>
        <div className={styles.overridesList}>
          {scoreOverrides.slice(0, 10).map((override) => (
            <div key={override.id} className={styles.overrideItem}>
              <div className={styles.overrideHeader}>
                <span className={styles.overrideUser}>
                  {users.find((u) => u.id === override.userId)?.displayName ||
                    override.userId}
                </span>
                <span className={styles.overrideGame}>
                  {getGameName(override.gameId)}
                </span>
                <span className={styles.overrideScore}>
                  {override.originalScore !== null
                    ? `${override.originalScore} → `
                    : ""}
                  {override.newScore}
                </span>
              </div>
              <div className={styles.overrideDetails}>
                <p>
                  <strong>Reason:</strong> {override.reason}
                </p>
                <p>
                  <strong>Date:</strong> {formatDate(override.overriddenAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScoreManagement;
