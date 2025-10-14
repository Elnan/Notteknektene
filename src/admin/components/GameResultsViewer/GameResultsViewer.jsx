import React, { useState, useEffect } from "react";
import {
  getCurrentSeason,
  getSeasonGamesList,
  getSeasonParticipantsList,
} from "../../../firebase/new-database-utils.js";
import { getGameSubmissions } from "../../../firebase/new-database-utils.js";
import styles from "./GameResultsViewer.module.css";

const GameResultsViewer = () => {
  const [currentSeason, setCurrentSeason] = useState(null);
  const [games, setGames] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameResults, setGameResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    loadSeasonData();
  }, []);

  const loadSeasonData = async () => {
    try {
      setLoading(true);
      const season = await getCurrentSeason();
      setCurrentSeason(season);

      if (season) {
        const [gamesData, participantsData] = await Promise.all([
          getSeasonGamesList(season.id),
          getSeasonParticipantsList(season.id),
        ]);
        setGames(gamesData);
        setParticipants(participantsData);
      }
    } catch (error) {
      console.error("Error loading season data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadGameResults = async (gameId) => {
    if (!currentSeason || !gameId) return;

    try {
      setResultsLoading(true);
      const submissions = await getGameSubmissions(currentSeason.id, gameId);
      setGameResults(submissions);
    } catch (error) {
      console.error("Error loading game results:", error);
      setGameResults([]);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    loadGameResults(game.gameId);
  };

  const getGameStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "🟢";
      case "current":
        return "🟡";
      case "upcoming":
        return "⚪";
      default:
        return "⚪";
    }
  };

  const formatScore = (submission) => {
    // Different games have different scoring methods
    const gameId = selectedGame?.gameId;

    switch (gameId) {
      case "building-blocks":
        return {
          score: submission.score || 0,
          time: submission.time || "N/A",
          hints: submission.hintsUsed || 0,
          completed: submission.completed || false,
        };

      case "number-code":
        return {
          score: submission.score || 0,
          attempts: submission.attempts || 0,
          time: submission.time
            ? `${Math.round(submission.time / 1000)}s`
            : "N/A",
          hints: submission.hintsUsed || 0,
          correctAnswers: submission.correctAnswers || 0,
        };

      case "order-chaos":
        return {
          score: submission.score || 0,
          rounds: submission.rounds || [],
          totalRounds: submission.totalRounds || 0,
          wins: submission.wins || 0,
          losses: submission.losses || 0,
        };

      case "pattern-solver":
        return {
          score: submission.score || 0,
          patterns: submission.patterns || [],
          time: submission.time
            ? `${Math.round(submission.time / 1000)}s`
            : "N/A",
          hints: submission.hintsUsed || 0,
        };

      default:
        return {
          score: submission.score || 0,
          attempts: submission.attempts || 0,
          time: submission.time
            ? `${Math.round(submission.time / 1000)}s`
            : "N/A",
          data: submission,
        };
    }
  };

  const renderGameSpecificResults = (submission) => {
    const gameId = selectedGame?.gameId;
    const scoreData = formatScore(submission);

    switch (gameId) {
      case "building-blocks":
        return (
          <div className={styles.gameSpecificResults}>
            <div className={styles.resultItem}>
              <span className={styles.label}>Completed:</span>
              <span
                className={
                  scoreData.completed ? styles.success : styles.failure
                }
              >
                {scoreData.completed ? "✅ Yes" : "❌ No"}
              </span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.label}>Answer:</span>
              <span className={styles.answer}>{scoreData.answer || "N/A"}</span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.label}>Time:</span>
              <span>{scoreData.time}</span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.label}>Hints Used:</span>
              <span>{scoreData.hints}</span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.label}>Instructions Used:</span>
              <span>{scoreData.instructionsUsed ? "Yes" : "No"}</span>
            </div>
            {scoreData.gridState && (
              <div className={styles.resultItem}>
                <span className={styles.label}>Grid State:</span>
                <div className={styles.gridDisplay}>
                  {scoreData.gridState.split("|").map((row, rowIndex) => (
                    <div key={rowIndex} className={styles.gridRow}>
                      {row.split("").map((cell, colIndex) => (
                        <span key={colIndex} className={styles.gridCell}>
                          {cell || " "}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "number-code":
        return (
          <div className={styles.gameSpecificResults}>
            <div className={styles.resultItem}>
              <span className={styles.label}>Correct Answers:</span>
              <span>{scoreData.correctAnswers}</span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.label}>Attempts:</span>
              <span>{scoreData.attempts}</span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.label}>Time:</span>
              <span>{scoreData.time}</span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.label}>Hints Used:</span>
              <span>{scoreData.hints}</span>
            </div>
          </div>
        );

      case "order-chaos":
        return (
          <div className={styles.gameSpecificResults}>
            <div className={styles.resultItem}>
              <span className={styles.label}>Wins:</span>
              <span className={styles.success}>{scoreData.wins}</span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.label}>Losses:</span>
              <span className={styles.failure}>{scoreData.losses}</span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.label}>Total Rounds:</span>
              <span>{scoreData.totalRounds}</span>
            </div>
            {scoreData.rounds && scoreData.rounds.length > 0 && (
              <div className={styles.roundsList}>
                <span className={styles.label}>Round Results:</span>
                <div className={styles.roundsGrid}>
                  {scoreData.rounds.map((round, index) => (
                    <span
                      key={index}
                      className={round.won ? styles.win : styles.loss}
                    >
                      {round.won ? "W" : "L"}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "pattern-solver":
        return (
          <div className={styles.gameSpecificResults}>
            <div className={styles.resultItem}>
              <span className={styles.label}>Patterns Solved:</span>
              <span>{scoreData.patterns?.length || 0}</span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.label}>Time:</span>
              <span>{scoreData.time}</span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.label}>Hints Used:</span>
              <span>{scoreData.hints}</span>
            </div>
          </div>
        );

      default:
        return (
          <div className={styles.gameSpecificResults}>
            <div className={styles.resultItem}>
              <span className={styles.label}>Raw Data:</span>
              <pre className={styles.rawData}>
                {JSON.stringify(scoreData.data, null, 2)}
              </pre>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading season data...</p>
      </div>
    );
  }

  if (!currentSeason) {
    return (
      <div className={styles.noSeason}>
        <h2>No Active Season</h2>
        <p>Please activate a season to view game results.</p>
      </div>
    );
  }

  return (
    <div className={styles.gameResultsViewer}>
      <div className={styles.header}>
        <h1>Game Results Viewer</h1>
        <p>View detailed results for each game in {currentSeason.name}</p>
      </div>

      <div className={styles.content}>
        {/* Games List */}
        <div className={styles.gamesList}>
          <h2>Season Games</h2>
          <div className={styles.gamesGrid}>
            {games.map((game) => (
              <div
                key={game.gameId}
                className={`${styles.gameCard} ${
                  selectedGame?.gameId === game.gameId ? styles.selected : ""
                }`}
                onClick={() => handleGameSelect(game)}
              >
                <div className={styles.gameHeader}>
                  <h3>
                    {game.gameId
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </h3>
                  <span className={styles.gameStatus}>
                    {getGameStatusColor(game.status)} {game.status}
                  </span>
                </div>
                <div className={styles.gameInfo}>
                  <p>Round: {game.roundNumber}</p>
                  <p>Active: {game.isActive ? "Yes" : "No"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results Panel */}
        {selectedGame && (
          <div className={styles.resultsPanel}>
            <div className={styles.resultsHeader}>
              <h2>
                Results:{" "}
                {selectedGame.gameId
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </h2>
              <p>
                Round {selectedGame.roundNumber} - {selectedGame.status}
              </p>
            </div>

            {resultsLoading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading results...</p>
              </div>
            ) : gameResults.length === 0 ? (
              <div className={styles.noResults}>
                <p>No submissions found for this game yet.</p>
              </div>
            ) : (
              <div className={styles.resultsList}>
                <div className={styles.resultsHeader}>
                  <h3>Player Results ({gameResults.length} submissions)</h3>
                </div>

                {gameResults
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((submission, index) => {
                    const participant = participants.find(
                      (p) => p.userId === submission.userId
                    );
                    const scoreData = formatScore(submission);

                    return (
                      <div key={submission.id} className={styles.resultCard}>
                        <div className={styles.resultHeader}>
                          <div className={styles.rankAndPlayer}>
                            <span className={styles.rank}>#{index + 1}</span>
                            <h4>
                              {participant?.displayName || submission.userId}
                            </h4>
                          </div>
                          <div className={styles.score}>
                            <span className={styles.scoreValue}>
                              {scoreData.score}
                            </span>
                            <span className={styles.scoreLabel}>points</span>
                          </div>
                        </div>

                        <div className={styles.resultDetails}>
                          <div className={styles.basicInfo}>
                            <div className={styles.resultItem}>
                              <span className={styles.label}>Player ID:</span>
                              <span>{submission.userId}</span>
                            </div>
                            <div className={styles.resultItem}>
                              <span className={styles.label}>Submitted:</span>
                              <span>
                                {(() => {
                                  const date = new Date(
                                    submission.submittedAt?.toDate
                                      ? submission.submittedAt.toDate()
                                      : submission.submittedAt
                                  );
                                  const dayOfWeek = date.toLocaleDateString(
                                    "en-US",
                                    { weekday: "short" }
                                  );
                                  const dateTime = date.toLocaleString(
                                    "no-NO",
                                    {
                                      month: "2-digit",
                                      day: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  );
                                  return `${dayOfWeek} ${dateTime}`;
                                })()}
                              </span>
                            </div>
                          </div>

                          {renderGameSpecificResults(submission)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameResultsViewer;
