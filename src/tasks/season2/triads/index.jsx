import React, { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./Triads.module.css";
import rounds, { solutions, isValidTriad } from "./gameConfig";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import modalStyles from "../../../components/Modal.module.css";
import { useTriadsSaveState } from "../../../hooks/useTriadsSaveState";

// Define initial state outside component to prevent recreation on every render
const initialState = {
  currentRound: 0,
  selectedCards: [],
  foundTriads: [],
  moveCount: 0, // Global move count across all rounds
  showRules: false,
  showSuccess: false,
  showVictory: false,
  showHintConfirm: false,
  hintsUsed: 0,
  alreadyFoundMessage: "",
  roundResults: [],
  completedRounds: new Set(),
  roundStates: {},
  showSubmitConfirm: false,
  showSubmissionSuccess: false,
  gameStartTime: Date.now(),
  completed: false,
  score: 0,
  attempts: 0,
};

const Triads = ({ onComplete, currentGameId }) => {
  // Save/load functionality
  const {
    saveGameState,
    loadGameState,
    isLoading: saveLoading,
    error: saveError,
    cleanup,
  } = useTriadsSaveState(currentGameId);

  // Use regular React state
  const [gameState, setGameState] = useState(initialState);
  const [hasLoadedInitialState, setHasLoadedInitialState] = useState(false);

  const updateGameState = useCallback((newState) => {
    setGameState((prevState) => {
      return typeof newState === "function" ? newState(prevState) : newState;
    });
  }, []);

  // Load game state only once when component first mounts
  useEffect(() => {
    if (!hasLoadedInitialState) {
      const loadState = async () => {
        const savedState = await loadGameState();
        if (savedState) {
          setGameState(savedState);
          console.log("🎮 Loaded saved Triads game state");
        }
        setHasLoadedInitialState(true);
      };
      loadState();
    }
  }, [loadGameState, hasLoadedInitialState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const getTimeSpent = () => Date.now() - gameState.gameStartTime;
  const completeRound = () => {}; // No-op

  // Extract state from gameState
  const {
    currentRound,
    selectedCards,
    foundTriads,
    moveCount,
    showRules,
    showSuccess,
    showVictory,
    showHintConfirm,
    hintsUsed,
    alreadyFoundMessage,
    roundResults,
    completedRounds,
    roundStates,
    showSubmitConfirm,
    showSubmissionSuccess,
    gameStartTime,
    completed,
    score,
    attempts,
  } = gameState;

  // Simple helper to update state
  const setState = useCallback(
    (updates) => {
      updateGameState((prevState) => {
        return typeof updates === "function"
          ? updates(prevState)
          : { ...prevState, ...updates };
      });
    },
    [updateGameState]
  );

  // Track game start time for submission
  useEffect(() => {
    if (!gameStartTime) {
      setState({ gameStartTime: Date.now() });
    }
  }, [gameStartTime]);

  const currentRoundData = rounds[currentRound];
  const currentSolutions = solutions[currentRound];

  // Calculate total hints used across all rounds
  const totalHintsUsed = Object.values(roundStates).reduce(
    (sum, roundState) => sum + (roundState.hintsUsed || 0),
    0
  );

  // Check if current selection is a valid triad
  useEffect(() => {
    if (selectedCards.length === 3) {
      const [card1, card2, card3] = selectedCards;
      if (isValidTriad(card1, card2, card3)) {
        // Check if this triad hasn't been found yet using consistent key
        const currentTriadKey = createTriadKey([card1, card2, card3]);

        // Pre-compute keys for found triads to avoid repeated calculations
        const foundTriadKeys = foundTriads.map((triad) =>
          createTriadKey(triad)
        );
        const isAlreadyFound = foundTriadKeys.includes(currentTriadKey);

        if (!isAlreadyFound) {
          const newFoundTriads = [...foundTriads, [card1, card2, card3]];
          const newMoveCount = moveCount + 1;
          setState({
            foundTriads: newFoundTriads,
            moveCount: newMoveCount,
            roundStates: {
              ...roundStates,
              [currentRound]: {
                foundTriads: newFoundTriads,
                hintsUsed: hintsUsed,
              },
            },
          });
          setTimeout(() => setState({ selectedCards: [] }), 1000);

          // Save state after finding a valid triad
          saveGameState({
            ...gameState,
            foundTriads: newFoundTriads,
            moveCount: newMoveCount,
            roundStates: {
              ...roundStates,
              [currentRound]: {
                foundTriads: newFoundTriads,
                hintsUsed: hintsUsed,
              },
            },
          });
        } else {
          setState({
            alreadyFoundMessage: "This triad has already been found!",
            selectedCards: [],
          });
          setTimeout(() => {
            setState({
              alreadyFoundMessage: "",
            });
          }, 1000);
        }
      } else {
        setTimeout(() => setState({ selectedCards: [] }), 1000);
        const newMoveCount = moveCount + 1;
        setState({
          moveCount: newMoveCount,
          roundStates: {
            ...roundStates,
            [currentRound]: {
              foundTriads: foundTriads,
              hintsUsed: hintsUsed,
            },
          },
        });

        // Save state after invalid move
        saveGameState({
          ...gameState,
          moveCount: newMoveCount,
          roundStates: {
            ...roundStates,
            [currentRound]: {
              foundTriads: foundTriads,
              hintsUsed: hintsUsed,
            },
          },
        });
      }
    }
  }, [selectedCards]);

  // Check if round is complete
  useEffect(() => {
    if (
      foundTriads.length >= currentRoundData.maxTriads &&
      !completedRounds.has(currentRound)
    ) {
      // Save round results
      const roundResult = {
        round: currentRound + 1,
        moves: moveCount,
        triadsFound: foundTriads.length,
        maxTriads: currentRoundData.maxTriads,
        // Note: solutions are not saved to avoid nested arrays in Firebase
      };

      setState({
        roundResults: [...roundResults, roundResult],
        completedRounds: new Set([...completedRounds, currentRound]),
        showSuccess: true,
      });

      // Save state after round completion
      saveGameState({
        ...gameState,
        roundResults: [...roundResults, roundResult],
        completedRounds: new Set([...completedRounds, currentRound]),
        showSuccess: true,
      });
    }
  }, [
    foundTriads.length,
    currentRoundData.maxTriads,
    currentRound,
    completedRounds,
  ]);

  const handleCardClick = (card) => {
    if (selectedCards.length < 3) {
      const isAlreadySelected = selectedCards.some(
        (selected) =>
          selected.number === card.number &&
          selected.color === card.color &&
          selected.shape === card.shape &&
          selected.shading === card.shading
      );

      if (!isAlreadySelected) {
        setState({
          selectedCards: [...selectedCards, card],
        });
      } else {
        setState({
          selectedCards: selectedCards.filter(
            (selected) =>
              !(
                selected.number === card.number &&
                selected.color === card.color &&
                selected.shape === card.shape &&
                selected.shading === card.shading
              )
          ),
        });
      }
    }
  };

  const handleHint = () => {
    if (hintsUsed < 3) {
      setState({ showHintConfirm: true });
    } else {
      showHintContent();
    }
  };

  const confirmHint = () => {
    const newHintsUsed = hintsUsed + 1;
    console.log("🎯 Using hint:", {
      currentRound,
      oldHintsUsed: hintsUsed,
      newHintsUsed,
      roundStates,
    });
    setState({
      hintsUsed: newHintsUsed,
      showHintConfirm: false,
      roundStates: {
        ...roundStates,
        [currentRound]: {
          foundTriads: foundTriads,
          hintsUsed: newHintsUsed,
        },
      },
    });

    // Save state after hint usage
    saveGameState({
      ...gameState,
      hintsUsed: newHintsUsed,
      showHintConfirm: false,
      roundStates: {
        ...roundStates,
        [currentRound]: {
          foundTriads: foundTriads,
          hintsUsed: newHintsUsed,
        },
      },
    });

    // Find a triad that hasn't been found yet
    const foundTriadKeys = foundTriads.map((triad) => createTriadKey(triad));

    const availableTriad = currentSolutions.find((triad) => {
      const triadKey = createTriadKey(triad);
      return !foundTriadKeys.includes(triadKey);
    });

    if (availableTriad) {
      // Highlight the cards in the triad
      setState({ selectedCards: availableTriad });
      setTimeout(() => {
        setState({ selectedCards: [] });
      }, 2000);
    }
  };

  // Show hint content modal
  const showHintContent = () => {
    if (hintsUsed > 0) {
      // Find a triad that hasn't been found yet
      const foundTriadKeys = foundTriads.map((triad) => createTriadKey(triad));

      const availableTriad = currentSolutions.find((triad) => {
        const triadKey = createTriadKey(triad);
        return !foundTriadKeys.includes(triadKey);
      });

      if (availableTriad) {
        // Highlight the cards in the triad
        setState({ selectedCards: availableTriad });
        setTimeout(() => {
          setState({ selectedCards: [] });
        }, 2000);
      }
    }
  };

  const handleReset = () => {
    setState({
      selectedCards: [],
      foundTriads: [],
      moveCount: 0,
      hintsUsed: 0,
    });
  };

  const handleRoundChange = (roundIndex) => {
    // Save current round state before switching
    const currentRoundState = {
      foundTriads: foundTriads,
      hintsUsed: hintsUsed,
    };

    // Restore the state for the target round
    const targetRoundState = roundStates[roundIndex];
    if (targetRoundState) {
      setState({
        currentRound: roundIndex,
        foundTriads: targetRoundState.foundTriads,
        hintsUsed: targetRoundState.hintsUsed,
        selectedCards: [],
        showSuccess: false,
        roundStates: {
          ...roundStates,
          [currentRound]: currentRoundState,
        },
      });
    } else {
      // Reset for new rounds (but keep global move count)
      setState({
        currentRound: roundIndex,
        foundTriads: [],
        hintsUsed: 0,
        selectedCards: [],
        showSuccess: false,
        roundStates: {
          ...roundStates,
          [currentRound]: currentRoundState,
        },
      });
    }
  };

  // Function to submit current progress
  const submitCurrentProgress = (isComplete = false) => {
    if (onComplete) {
      // Use current gameState to ensure we have the latest data
      const currentState = gameState;
      const timeSpent = currentState.gameStartTime
        ? Date.now() - currentState.gameStartTime
        : 0;

      // Create current round result if not already saved
      const currentRoundResult = {
        round: currentState.currentRound + 1,
        moves: currentState.moveCount,
        triadsFound: currentState.foundTriads.length,
        maxTriads: rounds[currentState.currentRound].maxTriads,
        // Note: solutions are not saved to avoid nested arrays in Firebase
      };

      // Combine all round results including current round
      const allRoundResults = [...currentState.roundResults];
      if (!currentState.completedRounds.has(currentState.currentRound)) {
        allRoundResults.push(currentRoundResult);
      }

      // Calculate totals from all round results
      const totalMoves = allRoundResults.reduce(
        (sum, round) => sum + round.moves,
        0
      );
      const totalTriadsFound = allRoundResults.reduce(
        (sum, round) => sum + round.triadsFound,
        0
      );

      // Count actually completed rounds (rounds with all triads found)
      const roundsCompleted = allRoundResults.filter(
        (round) => round.triadsFound >= round.maxTriads
      ).length;

      const totalPossibleTriads = rounds.length * 4; // Each round has 4 triads

      // Calculate accuracy as percentage of triads found out of possible triads
      const accuracy =
        totalPossibleTriads > 0
          ? (totalTriadsFound / totalPossibleTriads) * 100
          : 0;

      // Calculate total hints used across all rounds
      const totalHintsUsed = Object.values(
        currentState.roundStates || {}
      ).reduce((sum, roundState) => sum + (roundState?.hintsUsed || 0), 0);

      // Calculate score: 2 points per round completed, -1 point per hint used
      const score = Math.max(0, roundsCompleted * 2 - totalHintsUsed);

      const submissionData = {
        rounds: (allRoundResults || []).map((round) => ({
          round: round?.round || 0,
          moves: round?.moves || 0,
          triadsFound: round?.triadsFound || 0,
          maxTriads: round?.maxTriads || 0,
          completed: (round?.triadsFound || 0) >= (round?.maxTriads || 0),
        })),
        totalMoves: totalMoves || 0,
        totalTriadsFound: totalTriadsFound || 0,
        roundsCompleted: roundsCompleted || 0,
        totalPossibleTriads: totalPossibleTriads || 0,
        accuracy: Math.round((accuracy || 0) * 100) / 100,
        timeSpent: timeSpent || 0,
        hintsUsed: totalHintsUsed || 0,
        completed: isComplete || false,
        score: score || 0,
      };

      // Use currentGameId if available, otherwise fall back to base game ID
      const gameId = currentGameId || "triads";

      try {
        if (onComplete) {
          onComplete(gameId, submissionData);
        }
        // Show submission success feedback
        setState({ showSubmissionSuccess: true });
        console.log("✅ Submission successful, showing success modal");
      } catch (error) {
        console.error("❌ Error in submission:", error);
        // Still show success modal even if onComplete fails
        setState({ showSubmissionSuccess: true });
      }
    }
  };

  const handleContinuePlaying = () => {
    setState({ showSuccess: false });
    // Just close the modal and continue playing the current round
  };

  const handleContinueToNextRound = () => {
    // Save current round state before moving to next round
    const currentRoundState = {
      foundTriads: foundTriads,
      hintsUsed: hintsUsed,
    };

    if (currentRound + 1 < rounds.length) {
      // Go to next round
      const nextRound = currentRound + 1;

      // Restore the state for the next round if it exists
      const nextRoundState = roundStates[nextRound];
      if (nextRoundState) {
        setState({
          currentRound: nextRound,
          foundTriads: nextRoundState.foundTriads,
          hintsUsed: nextRoundState.hintsUsed,
          selectedCards: [],
          showSuccess: false,
          roundStates: {
            ...roundStates,
            [currentRound]: currentRoundState,
          },
        });
      } else {
        // Reset for new rounds (but keep global move count)
        setState({
          currentRound: nextRound,
          foundTriads: [],
          hintsUsed: 0,
          selectedCards: [],
          showSuccess: false,
          roundStates: {
            ...roundStates,
            [currentRound]: currentRoundState,
          },
        });
      }
    } else {
      // Check if all rounds are actually completed
      const allRoundsCompleted = rounds.every((_, roundIndex) => {
        const roundState = roundStates[roundIndex];
        if (roundIndex === currentRound) {
          // Current round is completed (we just finished it)
          return foundTriads.length >= currentRoundData.maxTriads;
        } else {
          // Check if other rounds are completed
          return (
            roundState &&
            roundState.foundTriads.length >= rounds[roundIndex].maxTriads
          );
        }
      });

      if (allRoundsCompleted) {
        // All rounds completed - show victory screen and submit
        setState({
          showSuccess: false,
          showVictory: true,
          completed: true,
        });

        // Save state after game completion
        saveGameState({
          ...gameState,
          showSuccess: false,
          showVictory: true,
          completed: true,
        });

        submitCurrentProgress(true);
      } else {
        // Not all rounds completed - just show success for this round
        setState({ showSuccess: true });
      }
    }
  };

  const renderCard = (card, index) => {
    const isSelected = selectedCards.some(
      (selected) =>
        selected.number === card.number &&
        selected.color === card.color &&
        selected.shape === card.shape &&
        selected.shading === card.shading
    );

    return (
      <div
        key={index}
        className={`${styles.card} ${isSelected ? styles.selected : ""}`}
        onClick={() => handleCardClick(card)}
      >
        <div className={styles.cardContent}>
          <div className={styles.shapeContainer}>
            {Array.from({ length: card.number }, (_, index) => (
              <div
                key={index}
                className={`${styles.shape} ${styles[card.color]}`}
              >
                {getShapeSVG(card.shape, card.color, card.shading)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFoundTriad = (triad, index) => {
    return (
      <div key={index} className={styles.foundTriadGroup}>
        {triad.map((card, cardIndex) => (
          <div key={cardIndex} className={styles.foundTriadCard}>
            <div className={styles.shapeContainer}>
              {Array.from({ length: card.number }, (_, shapeIndex) => (
                <div
                  key={shapeIndex}
                  className={`${styles.shape} ${styles[card.color]}`}
                >
                  {getShapeSVG(card.shape, card.color, card.shading)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Helper function to create a consistent key for triads regardless of order
  const createTriadKey = (cards) => {
    // Sort cards by all properties to ensure consistent ordering
    const sortedCards = [...cards].sort((a, b) => {
      if (a.number !== b.number) return a.number - b.number;
      if (a.color !== b.color) return a.color.localeCompare(b.color);
      if (a.shape !== b.shape) return a.shape.localeCompare(b.shape);
      return a.shading.localeCompare(b.shading);
    });

    return sortedCards
      .map(
        (card) => `${card.number}-${card.color}-${card.shape}-${card.shading}`
      )
      .join("|");
  };

  // Helper function to check if selected cards form a valid triad for a specific attribute
  const checkAttributeValidity = (attribute) => {
    if (selectedCards.length === 0) return null;
    if (selectedCards.length === 1) return true; // Single card is always valid
    if (selectedCards.length === 2) return true; // Two cards are always valid
    if (selectedCards.length !== 3) return null;

    const values = selectedCards.map((card) => card[attribute]);
    const uniqueValues = new Set(values);

    // Valid if all same OR all different
    return uniqueValues.size === 1 || uniqueValues.size === 3;
  };

  const getShapeSVG = (shape, color, shading) => {
    const fill = shading === "solid" ? "currentColor" : "none";
    const stroke = "currentColor";
    const strokeWidth = "2";

    let patternId = null;
    if (shading === "striped") {
      patternId = `striped-${Math.random().toString(36).substr(2, 9)}`;
    }

    switch (shape) {
      case "square":
        return (
          <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            {shading === "striped" && (
              <defs>
                <pattern
                  id={patternId}
                  patternUnits="userSpaceOnUse"
                  width="4"
                  height="4"
                >
                  <line
                    x1="-8"
                    y1="-8"
                    x2="24"
                    y2="24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </pattern>
              </defs>
            )}
            <rect
              x="2"
              y="2"
              width="12"
              height="12"
              fill={shading === "striped" ? `url(#${patternId})` : fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </svg>
        );

      case "circle":
        return (
          <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            {shading === "striped" && (
              <defs>
                <pattern
                  id={patternId}
                  patternUnits="userSpaceOnUse"
                  width="4"
                  height="4"
                >
                  <line
                    x1="-8"
                    y1="-8"
                    x2="24"
                    y2="24"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
            )}
            <circle
              cx="8"
              cy="8"
              r="6"
              fill={shading === "striped" ? `url(#${patternId})` : fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </svg>
        );

      case "triangle":
        return (
          <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            {shading === "striped" && (
              <defs>
                <pattern
                  id={patternId}
                  patternUnits="userSpaceOnUse"
                  width="4"
                  height="4"
                >
                  <line
                    x1="-8"
                    y1="-8"
                    x2="24"
                    y2="24"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
            )}
            <polygon
              points="8,2 2,14 14,14"
              fill={shading === "striped" ? `url(#${patternId})` : fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </svg>
        );

      default:
        return null;
    }
  };

  const renderShape = (card) => {
    return (
      <div className={styles.shapeContainer}>
        {Array.from({ length: card.number }, (_, index) => (
          <div key={index} className={`${styles.shape} ${styles[card.color]}`}>
            {getShapeSVG(card.shape, card.color, card.shading)}
          </div>
        ))}
      </div>
    );
  };

  // Show loading screen only during initial load, not during saves
  if (saveLoading && !hasLoadedInitialState) {
    return (
      <div className={styles.triadsContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>TRIADS</h1>
        </div>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <div>Loading game...</div>
        </div>
      </div>
    );
  }

  // Show save error if any
  if (saveError) {
    return (
      <div className={styles.triadsContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>TRIADS</h1>
        </div>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h3>Error Loading Game</h3>
          <p>There was an error loading your save data: {saveError}</p>
          <Button onClick={() => window.location.reload()}>Reload Game</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.triadsContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>TRIADS</h1>
        </div>

        <div className={styles.headerButtons}>
          <Button
            onClick={() => setState({ showSubmitConfirm: true })}
            variant="secondary"
            size="small"
          >
            Submit Answer
          </Button>
          <Button
            onClick={handleHint}
            disabled={totalHintsUsed >= 3}
            variant="secondary"
            size="small"
          >
            Hint ({3 - totalHintsUsed} left)
          </Button>
          <button
            className={styles.helpButton}
            onClick={() => setState({ showRules: true })}
          >
            ?
          </button>
        </div>
      </div>

      {/* Found Triads Section */}
      <div className={styles.foundTriadsSection}>
        <div className={styles.foundTriadsHeader}>
          <span className={styles.foundTriadsLabel}>Found triads</span>
          <div className={styles.moveCounter}>Moves: {moveCount}</div>

          <div className={styles.progress}>
            {foundTriads.length}/{currentRoundData.maxTriads} Found
          </div>
        </div>
        <div className={styles.foundTriadsGrid}>
          {foundTriads.map((triad, index) => renderFoundTriad(triad, index))}
        </div>
      </div>

      {/* Game Area */}
      <div className={styles.gameArea}>
        {/* Selection Slots */}
        <div className={styles.selectionSlots}>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`${styles.selectionSlot} ${selectedCards[index] ? styles.filled : ""}`}
            >
              {selectedCards[index] && renderShape(selectedCards[index])}
            </div>
          ))}
        </div>

        {/* Attribute Labels */}
        <div className={styles.attributeLabels}>
          <div className={styles.attributeLabel}>
            Number
            {selectedCards.length > 0 && (
              <span className={styles.validationIcon}>
                {checkAttributeValidity("number") ? "✅" : "❌"}
              </span>
            )}
          </div>
          <div className={styles.attributeLabel}>
            Color
            {selectedCards.length > 0 && (
              <span className={styles.validationIcon}>
                {checkAttributeValidity("color") ? "✅" : "❌"}
              </span>
            )}
          </div>
          <div className={styles.attributeLabel}>
            Shape
            {selectedCards.length > 0 && (
              <span className={styles.validationIcon}>
                {checkAttributeValidity("shape") ? "✅" : "❌"}
              </span>
            )}
          </div>
          <div className={styles.attributeLabel}>
            Shading
            {selectedCards.length > 0 && (
              <span className={styles.validationIcon}>
                {checkAttributeValidity("shading") ? "✅" : "❌"}
              </span>
            )}
          </div>
        </div>

        {/* Already Found Message */}
        <div
          className={`${styles.alreadyFoundMessage} ${alreadyFoundMessage ? styles.visible : styles.hidden}`}
        >
          {alreadyFoundMessage}
        </div>

        {/* Cards Grid */}
        <div className={styles.cardsGrid}>
          {currentRoundData.cards.map((card, index) => renderCard(card, index))}
        </div>
      </div>

      {/* Round Navigation */}
      <div className={styles.roundNav}>
        {rounds.map((_, index) => (
          <button
            key={index}
            className={`${styles.roundButton} ${currentRound === index ? styles.active : ""}`}
            onClick={() => handleRoundChange(index)}
          >
            Round {index + 1}
          </button>
        ))}
      </div>

      {/* Rules Modal */}
      <Modal
        isOpen={showRules}
        onClose={() => setState({ showRules: false })}
        title="How to play TRIADS"
      >
        <div className={styles.rulesSection}>
          <div className={styles.rulesTitle}>Objective</div>
          <div className={styles.rulesText}>
            Create combinations of 3 cards (triads) where each feature is either
            all the same or all different.
          </div>
        </div>

        <div className={styles.rulesSection}>
          <div className={styles.rulesTitle}>Features</div>
          <div className={styles.rulesText}>
            Each feature has 3 different possibilities:
          </div>
          <ul className={styles.featuresList}>
            <li>• Color: red, green or gold</li>
            <li>• Number: 1, 2 or 3</li>
            <li>• Shading: outlined, striped or solid</li>
            <li>• Shape: square, circle or triangle</li>
          </ul>
        </div>

        <div className={styles.exampleSection}>
          <div className={styles.exampleTitle}>Examples</div>
          <div className={styles.rulesText}>
            A valid triad has each feature either all the same or all different.
            Here are two examples of correct triads:
          </div>

          {/* Example 1: All same color, different numbers */}
          <div className={styles.exampleTriad}>
            <div className={styles.exampleLabel}>
              Example 1: Same shading, different numbers, colors and shapes
            </div>
            <div className={styles.exampleCards}>
              {[
                { number: 1, color: "red", shape: "circle", shading: "solid" },
                {
                  number: 2,
                  color: "gold",
                  shape: "square",
                  shading: "solid",
                },
                {
                  number: 3,
                  color: "green",
                  shape: "triangle",
                  shading: "solid",
                },
              ].map((card, index) => (
                <div key={index} className={styles.exampleCard}>
                  <div className={styles.shapeContainer}>
                    {Array.from({ length: card.number }, (_, shapeIndex) => (
                      <div
                        key={shapeIndex}
                        className={`${styles.shape} ${styles[card.color]}`}
                      >
                        {getShapeSVG(card.shape, card.color, card.shading)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Example 2: All different colors, same number */}
          <div className={styles.exampleTriad}>
            <div className={styles.exampleLabel}>
              Example 2: Different colors and shading, same number and shape
            </div>
            <div className={styles.exampleCards}>
              {[
                {
                  number: 2,
                  color: "red",
                  shape: "triangle",
                  shading: "solid",
                },
                {
                  number: 2,
                  color: "green",
                  shape: "triangle",
                  shading: "outlined",
                },
                {
                  number: 2,
                  color: "gold",
                  shape: "triangle",
                  shading: "striped",
                },
              ].map((card, index) => (
                <div key={index} className={styles.exampleCard}>
                  <div className={styles.shapeContainer}>
                    {Array.from({ length: card.number }, (_, shapeIndex) => (
                      <div
                        key={shapeIndex}
                        className={`${styles.shape} ${styles[card.color]}`}
                      >
                        {getShapeSVG(card.shape, card.color, card.shading)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccess}
        onClose={() => setState({ showSuccess: false })}
        title="Round Complete!"
      >
        <div className={styles.successMessage}>
          Congratulations! You found all {currentRoundData.maxTriads} triads.
        </div>
        <div className={styles.successStats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{moveCount}</div>
            <div className={styles.statLabel}>Moves</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{foundTriads.length}</div>
            <div className={styles.statLabel}>Triads Found</div>
          </div>
        </div>
        <div className={styles.modalActions}>
          {currentRound + 1 < rounds.length ? (
            <Button onClick={handleContinueToNextRound}>
              Continue to Next Round
            </Button>
          ) : (
            <>
              <Button onClick={handleContinuePlaying}>Continue Playing</Button>
              <Button
                onClick={() => {
                  setState({ showSuccess: false });
                  // Use setTimeout to prevent state update conflicts
                  setTimeout(() => {
                    submitCurrentProgress(false);
                  }, 0);
                }}
                variant="secondary"
              >
                Submit Progress
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* Victory Modal */}
      <Modal
        isOpen={showVictory}
        onClose={() => setState({ showVictory: false })}
        title="Success!"
        className={modalStyles.modalWide}
      >
        <div className={styles.successMessage}>
          Congratulations! You've completed all rounds!
        </div>

        <div className={styles.victoryStats}>
          {roundResults.map((result, index) => (
            <div key={index} className={styles.roundResult}>
              <h3>Round {result.round}</h3>
              <p>Moves: {result.moves}</p>
              <p>
                Triads Found: {result.triadsFound}/{result.maxTriads}
              </p>
              <div className={styles.solutionsList}>
                <h4>Solutions:</h4>
                <div className={styles.solutionsGrid}>
                  {(result.solutions || solutions[result.round - 1] || []).map(
                    (triad, triadIndex) => (
                      <div key={triadIndex} className={styles.solutionTriad}>
                        {triad.map((card, cardIndex) => (
                          <div key={cardIndex} className={styles.solutionCard}>
                            <div className={styles.shapeContainer}>
                              {Array.from(
                                { length: card.number },
                                (_, shapeIndex) => (
                                  <div
                                    key={shapeIndex}
                                    className={`${styles.shape} ${styles[card.color]}`}
                                  >
                                    {getShapeSVG(
                                      card.shape,
                                      card.color,
                                      card.shading
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.modalActions}>
          <Button
            onClick={() => {
              setState({
                showVictory: false,
                currentRound: 0,
                selectedCards: [],
                foundTriads: [],
                moveCount: 0,
                hintsUsed: 0,
                roundResults: [],
                roundStates: {},
                completed: false,
              });
            }}
          >
            Play Again
          </Button>
        </div>
      </Modal>

      {/* Hint Confirmation Modal */}
      <Modal
        isOpen={showHintConfirm}
        onClose={() => setState({ showHintConfirm: false })}
        title="Use Hint?"
      >
        <p>Are you sure you want to use a hint?</p>
        <p>
          <strong>Hints remaining:</strong> {3 - totalHintsUsed} out of 3 total
          hints
        </p>
        <p>
          <strong>Warning:</strong> This will deduct points from your final
          score.
        </p>
        <div className={styles.modalActions}>
          <Button onClick={confirmHint} variant="primary">
            Use Hint
          </Button>
          <Button
            onClick={() => setState({ showHintConfirm: false })}
            variant="secondary"
          >
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitConfirm}
        onClose={() => setState({ showSubmitConfirm: false })}
        title="Submit Your Answer?"
      >
        <p>Are you sure you want to submit your current progress?</p>
        <p>
          <strong>Current Status:</strong>
        </p>
        <ul className={styles.submitStatusList}>
          <li>
            Round {currentRound + 1}: {foundTriads.length}/
            {currentRoundData.maxTriads} triads found
          </li>
          <li>Total rounds completed: {completedRounds.size}</li>
          <li>
            Total triads found:{" "}
            {roundResults.reduce((sum, round) => sum + round.triadsFound, 0) +
              foundTriads.length}
          </li>
        </ul>
        <p>
          <strong>Note:</strong> You can submit your answer even if you haven't
          completed all rounds. Your score will be based on your current
          progress.
        </p>
        <div className={styles.modalActions}>
          <Button
            onClick={() => {
              setState({ showSubmitConfirm: false });
              // Use setTimeout to prevent state update conflicts
              setTimeout(() => {
                submitCurrentProgress(false);
              }, 0);
            }}
            variant="primary"
          >
            Submit Answer
          </Button>
          <Button
            onClick={() => setState({ showSubmitConfirm: false })}
            variant="secondary"
          >
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Submission Success Modal */}
      <Modal
        isOpen={showSubmissionSuccess}
        onClose={() => setState({ showSubmissionSuccess: false })}
        title="Answer Submitted!"
      >
        <div className={styles.successMessage}>
          Your answer has been successfully submitted!
        </div>
        <div className={styles.successStats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>
              {Object.values(roundStates || {}).reduce(
                (sum, roundState) => sum + (roundState?.hintsUsed || 0),
                0
              )}
            </div>
            <div className={styles.statLabel}>Hints Used</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>
              {(roundResults || []).reduce(
                (sum, round) => sum + (round?.triadsFound || 0),
                0
              ) + (foundTriads?.length || 0)}
            </div>
            <div className={styles.statLabel}>Total Triads Found</div>
          </div>
        </div>
        <div className={styles.modalActions}>
          <Button
            onClick={() => setState({ showSubmissionSuccess: false })}
            variant="primary"
          >
            Continue
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Triads;
