import React, { useState, useEffect } from "react";
import {
  setupTestSeason,
  cleanupTestSeason,
  testGameProgression,
  testUserParticipation,
  runComprehensiveTest,
  quickTest,
} from "../../../utils/testSeasonSetup.js";
import {
  runComprehensiveDatabaseTest,
  setupTestSeason as setupDatabaseTestSeason,
  cleanupTestData,
} from "../../../utils/comprehensiveDatabaseTest.js";
import {
  getCurrentSeason,
  getSeasonGamesList,
  getSeasonParticipantsList,
  getSeasonLeaderboard,
} from "../../../firebase/new-database-utils.js";
import GameResultsViewer from "../GameResultsViewer/GameResultsViewer.jsx";
import styles from "./TestDashboard.module.css";

const TestDashboard = () => {
  const [currentSeason, setCurrentSeason] = useState(null);
  const [seasonGames, setSeasonGames] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = async () => {
    try {
      setLoading(true);
      const season = await getCurrentSeason();
      setCurrentSeason(season);

      if (season) {
        const [games, participantsList, leaderboardData] = await Promise.all([
          getSeasonGamesList(season.id),
          getSeasonParticipantsList(season.id),
          getSeasonLeaderboard(season.id),
        ]);

        setSeasonGames(games);
        setParticipants(participantsList);
        setLeaderboard(leaderboardData);
      }
    } catch (error) {
      console.error("Error loading test data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTestResult = (test, status, message) => {
    setTestResults((prev) => [
      ...prev,
      {
        id: Date.now(),
        test,
        status,
        message,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const runTest = async (testFunction, testName) => {
    try {
      setLoading(true);
      addTestResult(testName, "running", "Test in progress...");

      await testFunction();

      addTestResult(testName, "success", "Test completed successfully!");
      await loadTestData(); // Refresh data
    } catch (error) {
      console.error(`Error running ${testName}:`, error);
      addTestResult(testName, "error", `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runDatabaseTest = async () => {
    try {
      setLoading(true);
      addTestResult(
        "Database Test",
        "running",
        "Running comprehensive database test..."
      );

      const results = await runComprehensiveDatabaseTest();

      if (results.success) {
        addTestResult("Database Test", "success", "All database tests passed!");
      } else {
        addTestResult(
          "Database Test",
          "error",
          `Database tests failed: ${results.errors?.length || 0} errors`
        );
      }

      await loadTestData(); // Refresh data after test
    } catch (error) {
      addTestResult(
        "Database Test",
        "error",
        `Database test failed: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const clearLocalStorage = () => {
    try {
      // Clear all localStorage
      localStorage.clear();

      // Also clear specific game saves
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("game_save_") || key.includes("notteknektene")) {
          localStorage.removeItem(key);
        }
      });

      addTestResult(
        "Clear Storage",
        "success",
        "Local storage cleared successfully!"
      );
    } catch (error) {
      addTestResult(
        "Clear Storage",
        "error",
        `Failed to clear storage: ${error.message}`
      );
    }
  };

  const isTestSeason = currentSeason?.name === "TestSeason2024";

  return (
    <div className={styles.testDashboard}>
      <div className={styles.header}>
        <h1>🧪 Test Dashboard</h1>
        <p>Comprehensive testing tools for season management</p>
      </div>

      <div className={styles.content}>
        {/* Test Controls */}
        <div className={styles.testControls}>
          <h2>Test Controls</h2>
          <div className={styles.testButtons}>
            <button
              className={styles.testButton}
              onClick={() => runTest(quickTest, "Quick Test")}
              disabled={loading}
            >
              ⚡ Quick Test
            </button>
            <button
              className={styles.testButton}
              onClick={() => runTest(setupTestSeason, "Setup Test Season")}
              disabled={loading}
            >
              🧪 Setup Test Season
            </button>
            <button
              className={styles.testButton}
              onClick={() =>
                runTest(testUserParticipation, "User Participation")
              }
              disabled={loading || !isTestSeason}
            >
              👥 Test Users
            </button>
            <button
              className={styles.testButton}
              onClick={() => runTest(testGameProgression, "Game Progression")}
              disabled={loading || !isTestSeason}
            >
              🔄 Test Progression
            </button>
            <button
              className={styles.testButton}
              onClick={() => runTest(runComprehensiveTest, "Full Test Suite")}
              disabled={loading}
            >
              🚀 Full Test Suite
            </button>
            <button
              className={styles.testButton}
              onClick={runDatabaseTest}
              disabled={loading}
            >
              🗄️ Database Test
            </button>
            <button
              className={`${styles.testButton} ${styles.dangerButton}`}
              onClick={() => runTest(cleanupTestSeason, "Cleanup")}
              disabled={loading}
            >
              🗑️ Cleanup Test
            </button>
            <button
              className={`${styles.testButton} ${styles.dangerButton}`}
              onClick={clearLocalStorage}
              disabled={loading}
            >
              🧹 Clear Local Storage
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className={styles.testResults}>
          <div className={styles.resultsHeader}>
            <h2>Test Results</h2>
            <button className={styles.clearButton} onClick={clearTestResults}>
              Clear Results
            </button>
          </div>
          <div className={styles.resultsList}>
            {testResults.length === 0 ? (
              <p className={styles.noResults}>
                No test results yet. Run a test to see results here.
              </p>
            ) : (
              testResults.map((result) => (
                <div
                  key={result.id}
                  className={`${styles.resultItem} ${styles[result.status]}`}
                >
                  <span className={styles.resultTest}>{result.test}</span>
                  <span className={styles.resultMessage}>{result.message}</span>
                  <span className={styles.resultTime}>{result.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Current Season Status */}
        <div className={styles.seasonStatus}>
          <h2>Current Season Status</h2>
          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : currentSeason ? (
            <div className={styles.seasonInfo}>
              <div className={styles.seasonHeader}>
                <h3>{currentSeason.name}</h3>
                <span
                  className={`${styles.status} ${currentSeason.isActive ? styles.active : styles.inactive}`}
                >
                  {currentSeason.isActive ? "🟢 Active" : "⚪ Inactive"}
                </span>
              </div>
              <p>{currentSeason.description}</p>
              <div className={styles.seasonStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Current Round:</span>
                  <span className={styles.statValue}>
                    {currentSeason.currentRound || 1}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Total Games:</span>
                  <span className={styles.statValue}>{seasonGames.length}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Participants:</span>
                  <span className={styles.statValue}>
                    {participants.length}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.noSeason}>
              <p>No active season found.</p>
              <button
                className={styles.setupButton}
                onClick={() => runTest(setupTestSeason, "Setup Test Season")}
                disabled={loading}
              >
                Setup Test Season
              </button>
            </div>
          )}
        </div>

        {/* Games Overview */}
        {currentSeason && (
          <div className={styles.gamesOverview}>
            <h2>Games Overview</h2>
            <div className={styles.gamesGrid}>
              {seasonGames.map((game) => (
                <div
                  key={game.id}
                  className={`${styles.gameCard} ${game.isActive ? styles.activeGame : ""}`}
                >
                  <div className={styles.gameHeader}>
                    <h4>{game.gameId}</h4>
                    <span className={styles.gameRound}>
                      Round {game.roundNumber}
                    </span>
                  </div>
                  <div className={styles.gameStatus}>
                    <span className={`${styles.status} ${styles[game.status]}`}>
                      {game.status}
                    </span>
                    {game.isActive && (
                      <span className={styles.activeIndicator}>🟢 Active</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Preview */}
        {leaderboard.length > 0 && (
          <div className={styles.leaderboardPreview}>
            <h2>Leaderboard Preview</h2>
            <div className={styles.leaderboardList}>
              {leaderboard.slice(0, 5).map((entry, index) => (
                <div key={entry.userId} className={styles.leaderboardEntry}>
                  <span className={styles.rank}>#{index + 1}</span>
                  <span className={styles.userName}>{entry.userName}</span>
                  <span className={styles.score}>
                    {entry.totalScore || 0} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Results Viewer */}
        {currentSeason && (
          <div className={styles.gameResultsSection}>
            <h2>Detailed Game Results</h2>
            <GameResultsViewer seasonName={currentSeason.id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TestDashboard;
