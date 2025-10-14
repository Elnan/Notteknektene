import React, { useState, useEffect, useCallback } from "react";
import styles from "./InvestigationMystery.module.css";
import Button from "../../../components/Button";
import WhenWhereGame from "./components/WhenWhereGame";
import WhatGame from "./components/WhatGame";
import HowGame from "./components/HowGame";
import WhyGame from "./components/WhyGame";
import WhoGame from "./components/WhoGame";
import {
  MYSTERIES,
  POINTS_PER_QUESTION,
  MAX_SCORE,
  MAX_HINTS_PER_MINIGAME,
} from "./gameData";
import { useAuth } from "../../../context/authContext";
import { useInvestigationMysterySaveState } from "../../../hooks/useInvestigationMysterySaveState";

const InvestigationMystery = ({ onComplete, currentGameId }) => {
  const { currentUser } = useAuth();
  const [currentMystery] = useState(MYSTERIES[0]);
  const [gameState, setGameState] = useState("overview"); // overview, when-where, what, how, why, who, completed
  const [completedMinigames, setCompletedMinigames] = useState({}); // { key: { points, hintUsed, timeSpent, ... } }
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState({});
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);

  // Investigation Mystery save state hook
  const {
    isLoading: saveLoading,
    error: saveError,
    saveLoading: isSaving,
    saveGameState,
    loadGameState,
    clearSaveState,
    cleanup,
  } = useInvestigationMysterySaveState(
    currentGameId || "investigation-mystery",
    currentUser?.uid
  );

  // Track if initial state has been loaded
  const [hasLoadedInitialState, setHasLoadedInitialState] = useState(false);

  // Track game start time for total time calculation
  useEffect(() => {
    window.gameStartTime = Date.now();
  }, []);

  // Load saved state on mount
  useEffect(() => {
    const loadState = async () => {
      if (currentUser?.uid) {
        const savedState = await loadGameState();
        if (savedState) {
          // Always load to overview, not inside a mini-game
          setGameState("overview");
          setCompletedMinigames(savedState.completedMinigames);
          setScore(savedState.score);
          setHintsUsed(savedState.hintsUsed);
          setGameCompleted(savedState.gameCompleted);
          setIsSubmitted(savedState.isSubmitted);
          setIsSubmitting(savedState.isSubmitting);
          setShowSuccessMessage(savedState.showSuccessMessage);
          setSubmissionError(savedState.submissionError);
          setSubmittedAt(savedState.submittedAt);
          setSubmissionData(savedState.submissionData);
          if (savedState.gameStartTime) {
            window.gameStartTime = savedState.gameStartTime;
          }
          console.log(
            "🎮 Loaded saved Investigation Mystery game state - returning to overview"
          );
        }
        setHasLoadedInitialState(true);
      }
    };

    loadState();
  }, [loadGameState, currentUser?.uid]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Make clearSaveState globally available for testing
  useEffect(() => {
    window.clearInvestigationMysterySave = async () => {
      await clearSaveState();
      window.location.reload();
    };
    return () => {
      delete window.clearInvestigationMysterySave;
    };
  }, [clearSaveState]);

  // Add temporary clear save button for testing
  const handleClearSave = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear all save data? This cannot be undone."
      )
    ) {
      await clearSaveState();
      window.location.reload();
    }
  };

  // Helper function to sanitize data for Firebase submission
  const sanitizeForSubmission = (data) => {
    if (data === null || data === undefined) return null;
    if (Array.isArray(data)) {
      return data.map((item) => sanitizeForSubmission(item));
    }
    if (typeof data === "object") {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        // Skip gameState fields as they contain complex nested data
        if (key === "gameState") {
          continue;
        }
        // Skip other complex nested structures
        if (
          key === "grid" ||
          key === "notes" ||
          key === "dotConnections" ||
          key === "history"
        ) {
          continue;
        }
        sanitized[key] = sanitizeForSubmission(value);
      }
      return sanitized;
    }
    return data;
  };

  // Handle "Play Again" functionality
  const handlePlayAgain = useCallback(() => {
    if (isSubmitted) {
      // Clear all save data and reset game
      clearSaveState();
      setGameState("overview");
      setCompletedMinigames({});
      setScore(0);
      setHintsUsed({});
      setGameCompleted(false);
      setIsSubmitted(false);
      setIsSubmitting(false);
      setShowSuccessMessage(false);
      setSubmissionError(null);
      setSubmittedAt(null);
      setSubmissionData(null);
      window.gameStartTime = Date.now();
    }
  }, [isSubmitted, clearSaveState]);

  // Check if user has already submitted
  useEffect(() => {
    const checkExistingSubmission = async () => {
      if (!currentUser) return;

      try {
        const { getCurrentSeason, getSeasonGamesList, getUserGameSubmission } =
          await import("../../../firebase/new-database-utils.js");

        const season = await getCurrentSeason();
        if (!season) return;

        const games = await getSeasonGamesList(season.id);
        const investigationGame = games.find((g) =>
          g.gameId.includes("investigation-mystery")
        );

        if (!investigationGame) return;

        const existingSubmission = await getUserGameSubmission(
          season.id,
          investigationGame.id,
          currentUser.uid
        );

        if (existingSubmission && existingSubmission.completed) {
          console.log("✅ User has already submitted this game");
          setIsSubmitted(true);
        }
      } catch (error) {
        console.error("Error checking existing submission:", error);
      }
    };

    checkExistingSubmission();
  }, [currentUser]);

  // Check if all mini-games are completed
  useEffect(() => {
    console.log(
      `🔍 Checking completion: ${Object.keys(completedMinigames).length}/5 games completed`
    );
    console.log(`📋 Completed games:`, Object.keys(completedMinigames));

    // There are 5 minigames: what, when-where, how, why, who
    if (Object.keys(completedMinigames).length === 5) {
      console.log(`🎉 All 5 mini-games completed! Ready for submission.`);
      setGameCompleted(true);
      setGameState("completed");
    }
    // Update score
    const total = Object.values(completedMinigames)
      .map((v) =>
        typeof v === "object" && v !== null && "points" in v
          ? v.points
          : typeof v === "number"
            ? v
            : 0
      )
      .reduce((a, b) => a + b, 0);
    setScore(total);
  }, [completedMinigames]);

  const handleHint = (minigame, hintIndex) => {
    const key = `${minigame}-${hintIndex}`;
    if ((hintsUsed[minigame] || 0) < MAX_HINTS_PER_MINIGAME) {
      setHintsUsed((prev) => {
        const updated = {
          ...prev,
          [minigame]: (prev[minigame] || 0) + 1,
        };

        // Save game state after hint usage
        saveGameState({
          gameState,
          completedMinigames,
          score,
          hintsUsed: updated,
          gameCompleted,
          isSubmitted,
          isSubmitting,
          showSuccessMessage,
          submissionError,
          submittedAt,
          submissionData,
          gameStartTime: window.gameStartTime,
        });

        return updated;
      });
    }
  };

  const completeMinigame = useCallback(
    (minigameName, result) => {
      // result can be a number (legacy) or { points, hintUsed, timeSpent, ... }
      console.log(`🎮 Mini-game completed: ${minigameName}`, result);
      console.log(
        `📊 Current completed games:`,
        Object.keys(completedMinigames)
      );
      setCompletedMinigames((prev) => {
        const updated = { ...prev, [minigameName]: result };
        console.log(`📊 Updated completed games:`, Object.keys(updated));

        // Save game state after minigame completion
        saveGameState({
          gameState,
          completedMinigames: updated,
          score,
          hintsUsed,
          gameCompleted,
          isSubmitted,
          isSubmitting,
          showSuccessMessage,
          submissionError,
          submittedAt,
          submissionData,
          gameStartTime: window.gameStartTime,
        });

        return updated;
      });
    },
    [
      completedMinigames,
      gameState,
      score,
      hintsUsed,
      gameCompleted,
      isSubmitted,
      isSubmitting,
      showSuccessMessage,
      submissionError,
      saveGameState,
    ]
  );

  const prepareAndSubmitGameData = async () => {
    console.log("🎯 Preparing submission data for Investigation Mysteries");
    console.log("🎯 Current completedMinigames:", completedMinigames);

    // Check if already submitted
    if (isSubmitted) {
      console.log("❌ Game has already been submitted");
      setSubmissionError(
        "This investigation has already been submitted successfully!"
      );
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    // Get the actual game ID from the database
    try {
      const { getCurrentSeason } = await import(
        "../../../firebase/new-database-utils.js"
      );
      const { getSeasonGamesList } = await import(
        "../../../firebase/new-database-utils.js"
      );

      const season = await getCurrentSeason();
      if (!season) {
        console.error("❌ No active season found");
        setSubmissionError(
          "No active season found. Please contact an administrator."
        );
        return;
      }

      const games = await getSeasonGamesList(season.id);
      const investigationGame = games.find((g) =>
        g.gameId.includes("investigation-mystery")
      );

      if (!investigationGame) {
        console.error("❌ Investigation Mystery game not found in season");
        setSubmissionError(
          "Investigation Mystery game not found in current season."
        );
        return;
      }

      console.log(
        `🎯 Found Investigation Mystery game: ${investigationGame.gameId}`
      );

      const totalTimeSpent = window.gameStartTime
        ? Date.now() - window.gameStartTime
        : 0;
      const totalHintsUsed = Object.values(hintsUsed).reduce(
        (sum, count) => sum + count,
        0
      );

      // Prepare rounds array with detailed information for each mini-game
      const rounds = [];
      const minigameOrder = ["what", "when-where", "how", "why", "who"];

      minigameOrder.forEach((minigameKey, index) => {
        const minigameData = completedMinigames[minigameKey];
        if (minigameData) {
          const roundData = {
            roundNumber: index + 1,
            minigame: minigameKey,
            opened: true,
            completed: true,
            points:
              typeof minigameData === "object"
                ? minigameData.points
                : minigameData,
            hintUsed: hintsUsed[minigameKey] || 0,
            timeSpent:
              typeof minigameData === "object"
                ? minigameData.timeSpent || 0
                : 0,
          };

          // Add mini-game specific data (flatten arrays for Firebase compatibility)
          if (typeof minigameData === "object") {
            // Handle arrays by converting them to strings
            Object.entries(minigameData).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                if (key === "guessCombinations" && minigameKey === "who") {
                  // Special handling for Who game guess combinations
                  // Convert each guess array to a readable string
                  roundData[key] = value
                    .map((guess) => guess.join(" + "))
                    .join(" | ");
                } else {
                  // Convert other arrays to comma-separated strings
                  roundData[key] = value.join(",");
                }
              } else if (key === "gameState") {
                // Skip the gameState field entirely for submission - it contains complex nested data
                // The gameState is only needed for save/load, not for submission
                console.log(
                  `🎯 Skipping gameState for ${minigameKey} in submission data`
                );
              } else {
                roundData[key] = value;
              }
            });
          }

          rounds.push(roundData);
          console.log(
            `🎯 Round ${index + 1} (${minigameKey}) data:`,
            roundData
          );
        }
      });

      const submissionData = {
        score: score,
        rounds: rounds,
        totalRounds: 5,
        roundsCompleted: rounds.length,
        roundsWon: rounds.filter((r) => r.points > 0).length,
        totalHintsUsed: totalHintsUsed,
        totalTimeSpent: totalTimeSpent,
      };

      // Sanitize the submission data to remove any nested arrays or complex objects
      const sanitizedSubmissionData = sanitizeForSubmission(submissionData);

      console.log("🎯 Submission data prepared:", submissionData);
      console.log("🎯 Sanitized submission data:", sanitizedSubmissionData);
      console.log(
        `🎯 Calling onComplete with gameId: ${investigationGame.gameId}`
      );

      if (onComplete) {
        console.log("✅ onComplete function exists, calling it...");
        onComplete(investigationGame.gameId, sanitizedSubmissionData);
        setIsSubmitted(true);
        setShowSuccessMessage(true);
        setSubmissionError(null);

        // Save final completion state (without the problematic submissionData)
        saveGameState({
          gameState,
          completedMinigames,
          score,
          hintsUsed,
          gameCompleted: true,
          isSubmitted: true,
          isSubmitting: false,
          showSuccessMessage: true,
          submissionError: null,
          submittedAt: Date.now(),
          // Don't save submissionData as it contains nested arrays
          gameStartTime: window.gameStartTime,
        });

        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        console.error("❌ onComplete function is not available!");
        setSubmissionError(
          "Submission function not available. Please refresh the page and try again."
        );
      }
    } catch (error) {
      console.error("❌ Error preparing submission data:", error);
      setSubmissionError(
        "Failed to submit investigation results. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render overview/central mystery board
  const renderOverview = () => {
    const minigames = [
      {
        key: "what",
        name: "What",
        description: "What is the stolen artifact?",
        icon: "🔍",
      },
      {
        key: "when-where",
        name: "When & Where",
        description: "Where and when is the artifact from?",
        icon: "📸",
      },
      {
        key: "how",
        name: "How",
        description: "Connect the dots to understand how the thief stole it?",
        icon: "🔐",
      },
      {
        key: "why",
        name: "Why",
        description: "Solve the logic grid puzzle to understand the motive.",
        icon: "🧩",
      },
      {
        key: "who",
        name: "Who",
        description: "Find the connections to solve who did it ",
        icon: "👥",
      },
    ];

    return (
      <div className={styles.overview}>
        <div className={styles.mysteryHeader}>
          <h2>{currentMystery.title}</h2>
          <p>{currentMystery.description}</p>
          {/* Temporary clear save button for testing */}
          <Button
            variant="secondary"
            size="small"
            onClick={handleClearSave}
            style={{
              marginTop: "10px",
              backgroundColor: "#ff6b6b",
              color: "white",
            }}
          >
            🗑️ Clear Save (Testing)
          </Button>
        </div>

        <div className={styles.progressBoard}>
          <h3>Investigation Progress</h3>
          <div className={styles.scoreDisplay}>Score: {score} / 12 points</div>

          <div className={styles.minigameGrid}>
            {minigames.map((minigame) => {
              const isCompleted = completedMinigames.hasOwnProperty(
                minigame.key
              );
              const isAvailable = true; // All mini-games are always available

              console.log(
                `🎮 Mini-game ${minigame.key}: completed=${isCompleted}`,
                completedMinigames[minigame.key]
              );

              return (
                <div
                  key={minigame.key}
                  className={`${styles.minigameCard} ${
                    isCompleted ? styles.completed : ""
                  }`}
                  onClick={() => {
                    if (isAvailable) {
                      setGameState(minigame.key);
                    }
                  }}
                >
                  <div className={styles.minigameIcon}>{minigame.icon}</div>
                  <h4>{minigame.name}</h4>
                  <p>{minigame.description}</p>
                  {isCompleted ? (
                    <div className={styles.completedBadge}>✓ Solved</div>
                  ) : (
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => setGameState(minigame.key)}
                    >
                      Investigate
                    </Button>
                  )}
                </div>
              );
            })}

            {/* Manual Submit Button as 6th card */}
            <div
              className={`${styles.minigameCard} ${styles.submitCard} ${isSubmitted ? styles.submitted : ""} ${isSubmitting ? styles.submitting : ""}`}
            >
              <div className={styles.minigameIcon}>
                {isSubmitted ? "✅" : "📤"}
              </div>
              <h4>{isSubmitted ? "Results Submitted" : "Submit Results"}</h4>
              <p>
                {isSubmitted
                  ? "Your investigation results have been submitted successfully!"
                  : "Submit your investigation results and complete the case"}
              </p>
              {showSuccessMessage && (
                <div className={styles.successMessage}>
                  🎉 Submission successful! Your results have been recorded.
                </div>
              )}
              {submissionError && (
                <div className={styles.errorMessage}>❌ {submissionError}</div>
              )}
              {isSubmitted ? (
                <div className={styles.submittedBadge}>✓ Submitted</div>
              ) : (
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => {
                    if (isSubmitted) {
                      console.log("❌ Game already submitted");
                      setSubmissionError(
                        "This investigation has already been submitted successfully!"
                      );
                      return;
                    }
                    console.log("📤 Manual submission triggered");
                    prepareAndSubmitGameData();
                  }}
                  disabled={isSubmitted || isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Case"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render completion screen
  const renderCompletion = () => {
    return (
      <div className={styles.completion}>
        <div className={styles.completionHeader}>
          <h2>Investigation Complete!</h2>
          <div className={styles.finalScore}>
            Final Score: {score} / 12 points
          </div>
        </div>

        <div className={styles.caseResults}>
          <h3>Case Summary: {currentMystery.title}</h3>
          <div className={styles.solutionGrid}>
            <div className={styles.solutionItem}>
              <strong>When:</strong> 1957
            </div>
            <div className={styles.solutionItem}>
              <strong>Where:</strong> United Kingdom
            </div>
            <div className={styles.solutionItem}>
              <strong>What:</strong> SCROLL (ancient scroll)
            </div>
            <div className={styles.solutionItem}>
              <strong>How:</strong> Security bypass sequence completed
            </div>
            <div className={styles.solutionItem}>
              <strong>Why:</strong> Suguru puzzle solved
            </div>
            <div className={styles.solutionItem}>
              <strong>Who:</strong> Connections puzzle completed
            </div>
          </div>
        </div>

        <div className={styles.completionActions}>
          <Button
            variant="secondary"
            size="large"
            onClick={() => setGameState("overview")}
          >
            Back to Overview
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={() => {
              if (isSubmitted) {
                console.log("❌ Game already submitted");
                setSubmissionError(
                  "This investigation has already been submitted successfully!"
                );
                return;
              }
              console.log("🔄 Manual submission triggered");
              prepareAndSubmitGameData();
            }}
            disabled={isSubmitted || isSubmitting}
            style={{ marginLeft: "10px" }}
          >
            {isSubmitting
              ? "Submitting..."
              : isSubmitted
                ? "Already Submitted"
                : "Submit Results"}
          </Button>
        </div>

        {showSuccessMessage && (
          <div className={styles.successMessage}>
            🎉 Submission successful! Your investigation results have been
            recorded.
          </div>
        )}
        {submissionError && (
          <div className={styles.errorMessage}>❌ {submissionError}</div>
        )}

        {/* Play Again button - only show after official submission */}
        {isSubmitted && (
          <div style={{ marginTop: "20px" }}>
            <Button
              variant="secondary"
              onClick={handlePlayAgain}
              style={{ marginRight: "10px" }}
            >
              🔄 Play Again
            </Button>
            <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "10px" }}>
              Start a new investigation (this will clear your current progress)
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render current state based on gameState
  const renderCurrentState = () => {
    switch (gameState) {
      case "overview":
        return renderOverview();
      case "when-where":
        return (
          <WhenWhereGame
            onComplete={completeMinigame}
            onBack={() => setGameState("overview")}
            onHint={(hintIndex) => handleHint("when-where", hintIndex)}
            savedGameState={completedMinigames["when-where"]}
          />
        );
      case "what":
        return (
          <WhatGame
            onComplete={completeMinigame}
            onBack={() => setGameState("overview")}
            onHint={(hintIndex) => handleHint("what", hintIndex)}
            savedGameState={completedMinigames["what"]}
          />
        );
      case "how":
        return (
          <HowGame
            onComplete={completeMinigame}
            onBack={() => setGameState("overview")}
            onHint={(hintIndex) => handleHint("how", hintIndex)}
            savedGameState={completedMinigames["how"]}
          />
        );
      case "why":
        return (
          <WhyGame
            onComplete={completeMinigame}
            onBack={() => setGameState("overview")}
            onHint={(hintIndex) => handleHint("why", hintIndex)}
            savedGameState={completedMinigames["why"]}
          />
        );
      case "who":
        return (
          <WhoGame
            onComplete={completeMinigame}
            onBack={() => setGameState("overview")}
            onHint={(hintIndex) => handleHint("who", hintIndex)}
            savedGameState={completedMinigames["who"]}
          />
        );
      case "completed":
        return renderCompletion();
      default:
        return renderOverview();
    }
  };

  // Show loading screen during initial load
  if (saveLoading && !hasLoadedInitialState) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingScreen}>
          <h2>Loading Investigation...</h2>
          <p>Please wait while we load your progress.</p>
        </div>
      </div>
    );
  }

  // Show error screen if there's a save error
  if (saveError) {
    return (
      <div className={styles.container}>
        <div className={styles.errorScreen}>
          <h2>Error Loading Game</h2>
          <p>There was an error loading your save data: {saveError}</p>
          <Button
            onClick={async () => {
              await clearSaveState();
              window.location.reload();
            }}
            variant="secondary"
            size="small"
            style={{ backgroundColor: "#ff4444", color: "white" }}
          >
            Clear Save
          </Button>
        </div>
      </div>
    );
  }

  return <div className={styles.container}>{renderCurrentState()}</div>;
};

export default InvestigationMystery;
