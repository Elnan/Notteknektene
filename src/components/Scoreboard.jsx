import React, { useEffect, useState, useContext } from "react";
import { getDocs, collection } from "firebase/firestore";
import { notteknekteneDb } from "../firebase/firebase-config-notteknektene";
import { TaskContext } from "../context/TaskContext";
import {
  getCurrentSeason,
  getMostRecentSeason,
  getSeasonRoundTables,
  getRoundTable,
  createRoundTable,
  getSeasonTotalScores,
  getSeasonGamesList,
} from "../firebase/new-database-utils.js";
import styles from "./Scoreboard.module.css";
import Button from "./Button";

const NUM_ROUNDS = 10;

const getRankClass = (rank) => {
  if (rank === 1) return styles.gold;
  if (rank === 2) return styles.silver;
  if (rank === 3) return styles.bronze;
  return styles.normalRank;
};

const Scoreboard = () => {
  const [view, setView] = useState("round");
  const [currentRoundTable, setCurrentRoundTable] = useState(null);
  const [totalScores, setTotalScores] = useState([]);
  const [userAvatars, setUserAvatars] = useState({});
  const [loading, setLoading] = useState(true);
  const [seasonGames, setSeasonGames] = useState([]);
  const { roundNumber } = useContext(TaskContext);

  // Move fetchCurrentRoundTable outside useEffect so it can be accessed by manual refresh
  const fetchCurrentRoundTable = async () => {
    try {
      setLoading(true);

      // Get current season (or most recent if none active)
      let season = await getCurrentSeason();
      if (!season) {
        season = await getMostRecentSeason();
      }
      if (!season) {
        console.log("No season found");
        setLoading(false);
        return;
      }

      // Get all round tables for the season
      const roundTables = await getSeasonRoundTables(season.id);

      let targetRoundTable = null;

      // If season is completed, show the final round table
      if (season.isCompleted && season.finalRoundNumber) {
        console.log(
          `🏁 Season completed - showing final round table for round ${season.finalRoundNumber}`
        );
        targetRoundTable = roundTables.find(
          (rt) => rt.roundNumber === season.finalRoundNumber
        );

        // If final round table doesn't exist, try to create it
        if (!targetRoundTable) {
          try {
            targetRoundTable = await createRoundTable(
              season.id,
              season.finalRoundNumber
            );
          } catch (error) {
            console.error("Error creating final round table:", error);
          }
        }
      } else {
        // For active seasons, show the previous round (which should have results)
        const currentActiveRound = season.currentRound || roundNumber;
        const previousRoundNumber = currentActiveRound - 1;

        if (previousRoundNumber > 0) {
          // First, try to get the existing round table for the previous round
          targetRoundTable = roundTables.find(
            (rt) => rt.roundNumber === previousRoundNumber
          );

          // If round table doesn't exist, try to create it
          if (!targetRoundTable) {
            try {
              targetRoundTable = await createRoundTable(
                season.id,
                previousRoundNumber
              );
            } catch (error) {
              // In a real season, this shouldn't happen, but for testing we can fallback
              // to the most recent round table that exists
              if (roundTables.length > 0) {
                targetRoundTable = roundTables[0];
              }
            }
          }
        }
      }

      setCurrentRoundTable(targetRoundTable);
    } catch (error) {
      console.error("Error fetching current round table:", error);
    } finally {
      setLoading(false);
    }
  };

  // Move fetchTotalScores outside useEffect so it can be accessed by manual refresh
  const fetchTotalScores = async () => {
    try {
      let currentSeason = await getCurrentSeason();
      if (!currentSeason) {
        currentSeason = await getMostRecentSeason();
      }
      if (!currentSeason) {
        setTotalScores([]);
        return;
      }

      const totalScoresData = await getSeasonTotalScores(currentSeason.id);
      setTotalScores(totalScoresData);
    } catch (error) {
      console.error("Error fetching total scores:", error);
      setTotalScores([]);
    }
  };

  // Load season games to check which rounds need round tables
  const fetchSeasonGames = async () => {
    try {
      let currentSeason = await getCurrentSeason();
      if (!currentSeason) {
        currentSeason = await getMostRecentSeason();
      }
      if (!currentSeason) {
        setSeasonGames([]);
        return;
      }

      const games = await getSeasonGamesList(currentSeason.id);
      setSeasonGames(games);
    } catch (error) {
      console.error("Error fetching season games:", error);
      setSeasonGames([]);
    }
  };

  // Manually create round table for a specific round
  const handleCreateRoundTable = async (roundNumber) => {
    try {
      let currentSeason = await getCurrentSeason();
      if (!currentSeason) {
        currentSeason = await getMostRecentSeason();
      }
      if (!currentSeason) {
        alert("No season found");
        return;
      }

      await createRoundTable(currentSeason.id, roundNumber);

      // Refresh data
      await fetchCurrentRoundTable();
      await fetchTotalScores();

      alert(`✅ Round table created for round ${roundNumber}`);
    } catch (error) {
      console.error("Error creating round table:", error);
      alert(`Error creating round table: ${error.message}`);
    }
  };

  useEffect(() => {
    const fetchUserAvatars = async () => {
      try {
        const usersCollection = collection(notteknekteneDb, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const avatarsMap = {};
        usersSnapshot.docs.forEach((doc) => {
          const userData = doc.data();
          if (userData.displayName && userData.avatar) {
            avatarsMap[userData.displayName] = userData.avatar;
          }
        });
        setUserAvatars(avatarsMap);
      } catch (error) {
        console.error("Error fetching user avatars:", error);
      }
    };

    fetchUserAvatars();
    fetchCurrentRoundTable();
    fetchTotalScores();
    fetchSeasonGames();
  }, [roundNumber]);

  // Add effect to refresh round table when season changes
  useEffect(() => {
    const checkSeasonChanges = async () => {
      try {
        const season = await getCurrentSeason();
        if (season && season.currentRound !== roundNumber) {
          fetchCurrentRoundTable();
        }
      } catch (error) {
        console.error("Error checking season changes:", error);
      }
    };

    // Check for season changes every 30 seconds
    const interval = setInterval(checkSeasonChanges, 30000);

    return () => clearInterval(interval);
  }, [roundNumber]);

  // Transform new round table data to use the actual game-specific fields
  const transformedRoundTable =
    currentRoundTable?.participants?.map((participant) => {
      return {
        id: participant.userId || participant.id,
        name: participant.userName || participant.name,
        score: Math.round(participant.score || 0), // Round to whole number
        // Include all game-specific data with proper fallbacks
        hintsUsed: Boolean(participant.hintsUsed || participant.hintUsed || 0), // Convert to boolean
        instructionsUsed: Boolean(
          participant.instructionsUsed || participant.instructionUsed || 0
        ), // Convert to boolean
        mistakes: Math.round(participant.mistakes || 0), // Round to whole number
        wins: Math.round(participant.wins || 0),
        losses: Math.round(participant.losses || 0),
        roundsWon: Math.round(participant.roundsWon || 0),
        roundsCompleted: Math.round(participant.roundsCompleted || 0),
        accuracy: Math.round(participant.accuracy || 0),
        correctPlacements: Math.round(participant.correctPlacements || 0),
        mainCorrect: Math.round(participant.mainCorrect || 0),
        averageTimePerRound: Math.round(participant.averageTimePerRound || 0),
        attempts: Math.round(participant.attempts || 0),
        moves: Math.round(participant.moves || 0),
        playerWins: Math.round(participant.playerWins || 0),
        totalPlayerScore: Math.round(participant.totalPlayerScore || 0),
        totalAiScore: Math.round(participant.totalAiScore || 0),
        totalTriadsFound: Math.round(participant.totalTriadsFound || 0),
        totalMoves: Math.round(participant.totalMoves || 0),
        submittedAt: participant.submittedAt
          ? (() => {
              const date = new Date(
                participant.submittedAt.toDate
                  ? participant.submittedAt.toDate()
                  : participant.submittedAt
              );
              const dayOfWeek = date.toLocaleDateString("en-US", {
                weekday: "short",
              });
              const dateTime = date.toLocaleString("no-NO", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });
              return `${dayOfWeek} ${dateTime}`;
            })()
          : "N/A",
      };
    }) || [];

  // Sort roundTable by score (descending)
  const sortedRoundTable = [...transformedRoundTable].sort((a, b) => {
    if (a.score === 0 && b.score !== 0) return 1;
    if (b.score === 0 && a.score !== 0) return -1;
    return b.score - a.score;
  });

  // Sort totalScores by scores
  const sortedTotalScores = [...totalScores].sort((a, b) => {
    const totalPointsA =
      a.sum || a.scores.reduce((acc, score) => acc + score, 0);
    const totalPointsB =
      b.sum || b.scores.reduce((acc, score) => acc + score, 0);
    return totalPointsB - totalPointsA;
  });

  const handleViewChange = (newView) => {
    setView(newView);
  };

  // Add manual refresh function for debugging
  const handleManualRefresh = async () => {
    try {
      await fetchCurrentRoundTable();
      await fetchTotalScores();
    } catch (error) {
      console.error("❌ Manual refresh failed:", error);
    }
  };

  // Get game-specific table configuration
  const getGameTableConfig = (gameId) => {
    // Strip number suffix from game ID (e.g., "pattern-solver4" -> "pattern-solver")
    const baseGameId = gameId?.replace(/\d+$/, "") || "";

    switch (baseGameId) {
      case "building-blocks":
        return {
          headers: [
            "#",
            "",
            "Name",
            "Score",
            "Hints Used",
            "Instructions Used",
            "Submitted",
          ],
          columns: ["score", "hintsUsed", "instructionsUsed", "submittedAt"],
        };
      case "number-code":
        return {
          headers: [
            "#",
            "",
            "Name",
            "Score",
            "Hints Used",
            "Instructions Used",
            "Mistakes",
            "Submitted",
          ],
          columns: [
            "score",
            "hintsUsed",
            "instructionsUsed",
            "mistakes",
            "submittedAt",
          ],
        };
      case "order-chaos":
        return {
          headers: [
            "#",
            "",
            "Name",
            "Score",
            "Instructions Used",
            "Wins",
            "Losses",
            "Submitted",
          ],
          columns: [
            "score",
            "instructionsUsed",
            "wins",
            "losses",
            "submittedAt",
          ],
        };
      case "pattern-solver":
        return {
          headers: [
            "#",
            "",
            "Name",
            "Score",
            "Hints Used",
            "Instructions Used",
            "Rounds Won",
            "Mistakes",
            "Submitted",
          ],
          columns: [
            "score",
            "hintsUsed",
            "instructionsUsed",
            "roundsWon",
            "mistakes",
            "submittedAt",
          ],
        };
      case "investigation-mystery":
        return {
          headers: [
            "#",
            "",
            "Name",
            "Score",
            "Hints Used",
            "Rounds Won",
            "Rounds Completed",
            "Submitted",
          ],
          columns: [
            "score",
            "hintsUsed",
            "roundsWon",
            "roundsCompleted",
            "submittedAt",
          ],
        };
      case "logic-grid":
        return {
          headers: [
            "#",
            "",
            "Name",
            "Score",
            "Hints Used",
            "Accuracy",
            "Correct Placements",
            "Submitted",
          ],
          columns: [
            "score",
            "hintsUsed",
            "accuracy",
            "correctPlacements",
            "submittedAt",
          ],
        };
      case "pattern-matrix":
        return {
          headers: [
            "#",
            "",
            "Name",
            "Score",
            "Accuracy",
            "# Correct",
            "Avg Time/Round",
            "Submitted",
          ],
          columns: [
            "score",
            "accuracy",
            "mainCorrect",
            "averageTimePerRound",
            "submittedAt",
          ],
        };
      case "the-keeper":
        return {
          headers: ["#", "", "Name", "Score", "Attempts", "Moves", "Submitted"],
          columns: ["score", "attempts", "moves", "submittedAt"],
        };
      case "sos":
        return {
          headers: [
            "#",
            "",
            "Name",
            "Score",
            "Hints Used",
            "Instructions Used",
            "Player Wins",
            "Total Player Score",
            "Total AI Score",
            "Submitted",
          ],
          columns: [
            "score",
            "hintsUsed",
            "instructionsUsed",
            "playerWins",
            "totalPlayerScore",
            "totalAiScore",
            "submittedAt",
          ],
        };
      case "triads":
        return {
          headers: [
            "#",
            "",
            "Name",
            "Score",
            "Hints Used",
            "Rounds Completed",
            "Accuracy",
            "Total Triads",
            "Total Moves",
            "Submitted",
          ],
          columns: [
            "score",
            "hintsUsed",
            "roundsCompleted",
            "accuracy",
            "totalTriadsFound",
            "totalMoves",
            "submittedAt",
          ],
        };
      default:
        console.warn(`Unknown game ID: ${gameId}, base: ${baseGameId}`);
        return {
          headers: ["#", "", "Name", "Score", "Submitted"],
          columns: ["score", "submittedAt"],
        };
    }
  };

  // Get the current game configuration
  const gameConfig = getGameTableConfig(currentRoundTable?.gameId);

  // Get CSS class for ranking position
  const getRankClass = (rank) => {
    switch (rank) {
      case 1:
        return styles.gold;
      case 2:
        return styles.silver;
      case 3:
        return styles.bronze;
      default:
        return styles.normalRank;
    }
  };

  return (
    <div className={styles.scoreboardWrapper}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>
          {view === "round"
            ? currentRoundTable
              ? `Round ${currentRoundTable.roundNumber} - ${currentRoundTable.gameName}`
              : roundNumber > 1
                ? `Round ${roundNumber - 1}`
                : "Round 0"
            : "Scoreboard"}
        </h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            variant="primary"
            size="small"
            onClick={() => setView(view === "round" ? "total" : "round")}
            className={styles.buttonContainer}
          >
            {view === "round" ? "Total" : "Round"}
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={async () => {
              await fetchTotalScores();
              await fetchCurrentRoundTable();
              await fetchSeasonGames();
            }}
            className={styles.buttonContainer}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className={styles.tableScroll}>
        {view === "round" ? (
          <>
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Loading round results...</p>
              </div>
            ) : currentRoundTable ? (
              <>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {gameConfig.headers.map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRoundTable.map((row, index) => (
                      <tr
                        key={row.id}
                        className={index === 0 ? styles.fastest : ""}
                      >
                        <td className={getRankClass(index + 1)}>{index + 1}</td>
                        <td className={styles.avatarCell}>
                          <img
                            src={
                              userAvatars[row.name]
                                ? `/avatars/${userAvatars[row.name]}`
                                : "/defaultAvatar.webp"
                            }
                            alt={`${row.name}'s avatar`}
                            className={styles.tableAvatar}
                            onError={(e) => {
                              e.target.src = "/defaultAvatar.webp";
                            }}
                          />
                        </td>
                        <td>{row.name}</td>
                        <td>{row.score}</td>
                        {gameConfig.columns.slice(1).map((column, colIndex) => {
                          // Handle different column types based on game
                          let displayValue;

                          if (column === "submittedAt") {
                            displayValue = row[column];
                          } else if (column === "hintsUsed") {
                            // Check if this is a multi-hint game
                            const isMultiHintGame = [
                              "pattern-solver",
                              "investigation-mystery",
                              "logic-grid",
                              "triads",
                            ].includes(
                              currentRoundTable?.gameId?.replace(/\d+$/, "")
                            );

                            if (isMultiHintGame) {
                              // Display as number for multi-hint games
                              displayValue = Math.round(row[column] || 0);
                            } else {
                              // Display as checkbox for single-hint games
                              displayValue = (
                                <input
                                  type="checkbox"
                                  checked={row[column]}
                                  readOnly
                                  disabled
                                />
                              );
                            }
                          } else if (column === "instructionsUsed") {
                            // Display as checkbox for instructions (only shown for games that have instructions)
                            displayValue = (
                              <input
                                type="checkbox"
                                checked={row[column]}
                                readOnly
                                disabled
                              />
                            );
                          } else if (column === "accuracy") {
                            // Display accuracy as percentage with % symbol
                            displayValue = `${Math.round(row[column] || 0)}%`;
                          } else {
                            // Display as whole number for numeric values (wins, losses, mistakes, etc.)
                            displayValue = Math.round(row[column] || 0);
                          }

                          return <td key={colIndex}>{displayValue}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Debug: Show raw data if game config fails */}
                {gameConfig.columns.length <= 2 && (
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "10px",
                      background: "#f0f0f0",
                      borderRadius: "5px",
                    }}
                  >
                    <strong>
                      Debug: Raw Participant Data (Game Config Failed)
                    </strong>
                    <pre style={{ fontSize: "12px", overflow: "auto" }}>
                      {JSON.stringify(
                        currentRoundTable.participants?.[0] || {},
                        null,
                        2
                      )}
                    </pre>

                    {/* Fallback table showing all available data */}
                    <div style={{ marginTop: "10px" }}>
                      <strong>Fallback Table (All Available Data):</strong>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          marginTop: "10px",
                        }}
                      >
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Avatar</th>
                            <th>Name</th>
                            {currentRoundTable.participants?.[0] &&
                              Object.keys(currentRoundTable.participants[0])
                                .filter(
                                  (key) =>
                                    ![
                                      "userId",
                                      "id",
                                      "userName",
                                      "name",
                                    ].includes(key)
                                )
                                .map((key) => <th key={key}>{key}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {currentRoundTable.participants?.map(
                            (participant, index) => (
                              <tr key={participant.userId || participant.id}>
                                <td>{index + 1}</td>
                                <td>
                                  <img
                                    src={
                                      userAvatars[
                                        participant.userName || participant.name
                                      ]
                                        ? `/avatars/${userAvatars[participant.userName || participant.name]}`
                                        : "/defaultAvatar.webp"
                                    }
                                    alt={`${participant.userName || participant.name}'s avatar`}
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "50%",
                                    }}
                                  />
                                </td>
                                <td>
                                  {participant.userName || participant.name}
                                </td>
                                {Object.keys(participant)
                                  .filter(
                                    (key) =>
                                      ![
                                        "userId",
                                        "id",
                                        "userName",
                                        "name",
                                      ].includes(key)
                                  )
                                  .map((key) => (
                                    <td key={key}>
                                      {typeof participant[key] === "object" &&
                                      participant[key]?.toDate
                                        ? participant[key]
                                            .toDate()
                                            .toLocaleDateString()
                                        : participant[key]?.toString() || "N/A"}
                                    </td>
                                  ))}
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <p>No results available for this round</p>
                <p>Wait until a round is completed</p>
              </div>
            )}
          </>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th></th>
                <th>Name</th>
                {Array.from({ length: NUM_ROUNDS }, (_, i) => (
                  <th key={i}>{`R${i + 1}`}</th>
                ))}
                <th>Sum</th>
              </tr>
            </thead>
            <tbody>
              {sortedTotalScores.map((row, idx) => (
                <tr key={row.id}>
                  <td className={getRankClass(idx + 1)}>{idx + 1}</td>
                  <td className={styles.avatarCell}>
                    <img
                      src={
                        userAvatars[row.name]
                          ? `/avatars/${userAvatars[row.name]}`
                          : "/defaultAvatar.webp"
                      }
                      alt={`${row.name}'s avatar`}
                      className={styles.tableAvatar}
                    />
                  </td>
                  <td>{row.name}</td>
                  {Array.from({ length: NUM_ROUNDS }, (_, i) => {
                    const roundNumber = i + 1;

                    // Check if this round has been completed (status is 'completed', not 'current')
                    const isRoundCompleted = seasonGames.some(
                      (game) =>
                        game.roundNumber === roundNumber &&
                        game.status === "completed"
                    );

                    // Check if this round is currently active
                    const isCurrentRound = seasonGames.some(
                      (game) =>
                        game.roundNumber === roundNumber &&
                        game.status === "current"
                    );

                    // Determine what to display
                    let displayValue = "";
                    if (row.scores[i] !== undefined) {
                      // Player has a score for this round
                      displayValue = row.scores[i];
                    } else if (isRoundCompleted) {
                      // Round is completed, but player didn't submit
                      displayValue = 0;
                    } else {
                      // Round is current or hasn't been played yet - show empty
                      displayValue = "";
                    }

                    return <td key={i}>{displayValue}</td>;
                  })}
                  <td>
                    {row.sum ||
                      row.scores.reduce((acc, score) => acc + score, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Scoreboard;
