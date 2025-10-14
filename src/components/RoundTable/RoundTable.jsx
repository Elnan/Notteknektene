import React, { useState, useEffect } from "react";
import { getRoundTable } from "../../firebase/new-database-utils.js";
import styles from "./RoundTable.module.css";

const RoundTable = ({ seasonName, roundNumber, onClose }) => {
  const [roundTable, setRoundTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRoundTable();
  }, [seasonName, roundNumber]);

  const loadRoundTable = async () => {
    try {
      setLoading(true);
      const data = await getRoundTable(seasonName, roundNumber);
      setRoundTable(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderGameSpecificMetrics = (participant) => {
    const { gameId } = roundTable;

    switch (gameId) {
      case "building-blocks":
        return (
          <div className={styles.gameSpecificMetrics}>
            <span className={styles.metric}>
              <strong>Answer:</strong> {participant.answer || "N/A"}
            </span>
          </div>
        );

      case "number-code":
        return (
          <div className={styles.gameSpecificMetrics}>
            <span className={styles.metric}>
              <strong>Mistakes:</strong> {participant.mistakes || 0}
            </span>
          </div>
        );

      case "order-chaos":
        return (
          <div className={styles.gameSpecificMetrics}>
            <span className={styles.metric}>
              <strong>Wins:</strong> {participant.wins || 0}
            </span>
            <span className={styles.metric}>
              <strong>Losses:</strong> {participant.losses || 0}
            </span>
          </div>
        );

      case "pattern-solver":
        return (
          <div className={styles.gameSpecificMetrics}>
            <span className={styles.metric}>
              <strong>Rounds Won:</strong> {participant.roundsWon || 0}
            </span>
            <span className={styles.metric}>
              <strong>Mistakes:</strong> {participant.mistakesCount || 0}
            </span>
          </div>
        );

      case "investigation-mystery":
        return (
          <div className={styles.gameSpecificMetrics}>
            <span className={styles.metric}>
              <strong>Rounds Won:</strong> {participant.roundsWon || 0}
            </span>
            <span className={styles.metric}>
              <strong>Completed:</strong> {participant.roundsCompleted || 0}/
              {participant.totalRounds || 5}
            </span>
          </div>
        );

      case "logic-grid":
        return (
          <div className={styles.gameSpecificMetrics}>
            <span className={styles.metric}>
              <strong>Accuracy:</strong> {participant.accuracy || 0}%
            </span>
            <span className={styles.metric}>
              <strong>Correct:</strong> {participant.correctPlacements || 0}
            </span>
          </div>
        );

      case "pattern-matrix":
        return (
          <div className={styles.gameSpecificMetrics}>
            <span className={styles.metric}>
              <strong>Accuracy:</strong> {participant.accuracy || 0}%
            </span>
            <span className={styles.metric}>
              <strong>Main Correct:</strong> {participant.mainCorrect || 0}
            </span>
          </div>
        );

      case "the-keeper":
        return (
          <div className={styles.gameSpecificMetrics}>
            <span className={styles.metric}>
              <strong>Attempts:</strong> {participant.attempts || 1}
            </span>
            <span className={styles.metric}>
              <strong>Moves:</strong> {participant.moves || 0}
            </span>
          </div>
        );

      case "sos":
        return (
          <div className={styles.gameSpecificMetrics}>
            <span className={styles.metric}>
              <strong>Wins:</strong> {participant.playerWins || 0}
            </span>
            <span className={styles.metric}>
              <strong>Player Score:</strong> {participant.totalPlayerScore || 0}
            </span>
          </div>
        );

      case "triads":
        return (
          <div className={styles.gameSpecificMetrics}>
            <span className={styles.metric}>
              <strong>Completed:</strong> {participant.roundsCompleted || 0}/3
            </span>
            <span className={styles.metric}>
              <strong>Accuracy:</strong> {participant.accuracy || 0}%
            </span>
            <span className={styles.metric}>
              <strong>Triads Found:</strong> {participant.totalTriadsFound || 0}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  if (loading) {
    return (
      <div className={styles.roundTableOverlay}>
        <div className={styles.roundTable}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading round table...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.roundTableOverlay}>
        <div className={styles.roundTable}>
          <div className={styles.error}>
            <h2>Error Loading Round Table</h2>
            <p>{error}</p>
            <button onClick={onClose} className={styles.closeButton}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!roundTable) {
    return (
      <div className={styles.roundTableOverlay}>
        <div className={styles.roundTable}>
          <div className={styles.error}>
            <h2>Round Table Not Found</h2>
            <p>No results found for round {roundNumber}</p>
            <button onClick={onClose} className={styles.closeButton}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.roundTableOverlay} onClick={onClose}>
      <div className={styles.roundTable} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Round {roundNumber} Results</h1>
          <h2>{roundTable.gameName}</h2>
          <p className={styles.dateRange}>
            {formatDate(roundTable.startDate)} -{" "}
            {formatDate(roundTable.endDate)}
          </p>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        {/* Summary Statistics */}
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Participants:</span>
            <span className={styles.summaryValue}>
              {roundTable.summary.totalParticipants}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Average Score:</span>
            <span className={styles.summaryValue}>
              {roundTable.summary.averageScore}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Best Score:</span>
            <span className={styles.summaryValue}>
              {roundTable.summary.bestScore}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Average Time:</span>
            <span className={styles.summaryValue}>
              {roundTable.summary.averageTime}
            </span>
          </div>
        </div>

        {/* Participants Table */}
        <div className={styles.participantsTable}>
          <div className={styles.tableHeader}>
            <div className={styles.rankColumn}>Rank</div>
            <div className={styles.playerColumn}>Player</div>
            <div className={styles.scoreColumn}>Score</div>
            <div className={styles.hintsColumn}>Hints</div>
            <div className={styles.instructionsColumn}>Instructions</div>
          </div>

          <div className={styles.tableBody}>
            {roundTable.participants.map((participant) => (
              <div key={participant.userId} className={styles.participantRow}>
                <div className={styles.rankColumn}>
                  <span className={styles.rankIcon}>
                    {getRankIcon(participant.rank)}
                  </span>
                </div>
                <div className={styles.playerColumn}>
                  <div className={styles.playerInfo}>
                    <span className={styles.playerName}>
                      {participant.userName}
                    </span>
                    <span className={styles.playerEmail}>
                      {participant.userEmail}
                    </span>
                  </div>
                  {renderGameSpecificMetrics(participant)}
                </div>
                <div className={styles.scoreColumn}>
                  <span className={styles.score}>{participant.score}</span>
                </div>
                <div className={styles.hintsColumn}>
                  <span className={styles.hints}>{participant.hintsUsed}</span>
                </div>
                <div className={styles.instructionsColumn}>
                  <span className={styles.instructions}>
                    {participant.instructionsUsed ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p>Round table will be visible for one week after the round ends</p>
        </div>
      </div>
    </div>
  );
};

export default RoundTable;
