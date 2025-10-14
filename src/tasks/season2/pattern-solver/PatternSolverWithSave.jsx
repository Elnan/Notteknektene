import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import styles from "./PatternSolver.module.css";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import modalStyles from "../../../components/Modal.module.css";
import SaveStateManager from "../../../components/SaveStateManager/SaveStateManager";
import { useRoundBasedSaveState } from "../../../hooks/useGameSaveState";
import {
  PATTERN_SOLVER_CONFIG,
  isColorFullyUsed,
  isShapeFullyUsed,
  calculateMistakes,
  isGridCorrect,
  isGridComplete,
} from "./gameConfig";

const GRID_SIZE = PATTERN_SOLVER_CONFIG.gridSize;
const MAX_ROUNDS = PATTERN_SOLVER_CONFIG.maxRounds;
const COLORS = PATTERN_SOLVER_CONFIG.colors;
const SHAPES = PATTERN_SOLVER_CONFIG.shapes;
const ROUNDS = PATTERN_SOLVER_CONFIG.rounds;

const PatternSolverWithSave = ({ onComplete, currentGameId }) => {
  // Initial state for the game
  const initialState = {
    currentRound: 0,
    grid: ROUNDS[0].preFilled.map((row) => row.map((cell) => ({ ...cell }))),
    notes: Array(GRID_SIZE.rows)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE.cols)
          .fill(null)
          .map(() => ({
            colors: new Set(),
            shapes: new Set(),
          }))
      ),
    selectedCell: null,
    isNoteMode: false,
    selectedColor: null,
    selectedShape: null,
    checkedClues: new Set(),
    hintsUsed: 0,
    instructionsUsed: false,
    gameCompleted: false,
    roundsCompleted: [],
    showLogicHint: false,
    showCompletionScreen: false,
    roundScores: [],
    currentScore: 0,
    placedColors: new Set(),
    submitted: false,
    showHintModal: false,
    boardSnapshots: [],
    roundResults: [],
    showSolutionModal: false,
    selectedSolution: null,
    attempts: 0,
    completed: false,
    score: 0,
  };

  // Use the save state hook with the correct game ID from GameWrapper
  const gameId = useMemo(() => {
    const id = currentGameId || "patternSolver"; // Fallback to base game ID if currentGameId not provided
    console.log(
      "🔍 PatternSolverWithSave - Using gameId:",
      id,
      "currentGameId:",
      currentGameId
    );
    return id;
  }, [currentGameId]);
  const {
    gameState,
    updateGameState,
    saveState,
    isLoading: saveLoading,
    hasLoadedSave,
    lastSaveTime,
    saveError,
  } = useRoundBasedSaveState(gameId, initialState, {
    autoSave: true,
    autoSaveInterval: 30000, // Auto-save every 30 seconds
    saveOnUnload: true,
    saveAfterEachRound: true,
    onLoad: (loadedState) => {
      // Save state loaded successfully
    },
    onSave: (savedState) => {
      console.log("Game state saved:", savedState);
    },
    onError: (error) => {
      console.error("Save state error:", error);
    },
  });

  // Extract state from gameState
  const {
    currentRound,
    grid,
    notes,
    selectedCell,
    isNoteMode,
    selectedColor,
    selectedShape,
    checkedClues,
    hintsUsed,
    instructionsUsed,
    gameCompleted,
    roundsCompleted,
    showLogicHint,
    showCompletionScreen,
    roundScores,
    currentScore,
    placedColors,
    submitted,
    showHintModal,
    boardSnapshots,
    roundResults,
    showSolutionModal,
    selectedSolution,
    attempts,
    completed,
    score,
  } = gameState;

  const currentRoundData = ROUNDS[currentRound];

  // Ensure grid is properly structured (must be before any conditional returns)
  const safeGrid = useMemo(() => {
    try {
      if (Array.isArray(grid) && grid.length > 0 && Array.isArray(grid[0])) {
        return grid;
      }
    } catch (e) {
      console.error("Grid structure error:", e);
    }
    // Fallback to fresh grid from current round
    return ROUNDS[currentRound].preFilled.map((row) =>
      row.map((cell) => ({ ...cell }))
    );
  }, [grid, currentRound]);

  // Update game state helper
  const updateGameStateHelper = useCallback(
    (updates) => {
      updateGameState((prevState) => ({
        ...prevState,
        ...updates,
      }));
    },
    [updateGameState]
  );

  // Handle loading save state
  const handleLoadSave = (loadedState) => {
    updateGameState(loadedState);
  };

  // Handle delete save
  const handleDeleteSave = () => {
    // Reset to initial state
    updateGameState(initialState);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameCompleted || submitted) return;

      if (selectedCell) {
        const { row, col } = selectedCell;

        // Color keys (1-6 for colors)
        if (e.key >= "1" && e.key <= "6") {
          const colorIndex = parseInt(e.key) - 1;
          if (colorIndex < COLORS.length) {
            handleColorInput(COLORS[colorIndex]);
          }
          return;
        }

        // Arrow keys for navigation
        if (e.key === "ArrowUp" && row > 0) {
          e.preventDefault();
          updateGameStateHelper({ selectedCell: { row: row - 1, col } });
          return;
        }
        if (e.key === "ArrowDown" && row < GRID_SIZE.rows - 1) {
          e.preventDefault();
          updateGameStateHelper({ selectedCell: { row: row + 1, col } });
          return;
        }
        if (e.key === "ArrowLeft" && col > 0) {
          e.preventDefault();
          updateGameStateHelper({ selectedCell: { row, col: col - 1 } });
          return;
        }
        if (e.key === "ArrowRight" && col < GRID_SIZE.cols - 1) {
          e.preventDefault();
          updateGameStateHelper({ selectedCell: { row, col: col + 1 } });
          return;
        }

        // Clear cell
        if (e.key === "Backspace" || e.key === "Delete") {
          handleClearCell();
          return;
        }
      }

      // Select first empty cell if none selected
      if (!selectedCell && e.key.startsWith("Arrow")) {
        for (let row = 0; row < GRID_SIZE.rows; row++) {
          for (let col = 0; col < GRID_SIZE.cols; col++) {
            if (!grid[row][col].isPreFilled) {
              updateGameStateHelper({ selectedCell: { row, col } });
              return;
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, gameCompleted, submitted, grid, updateGameStateHelper]);

  // Show loading state while save state is being loaded
  if (saveLoading || !hasLoadedSave) {
    return <div>Loading game...</div>;
  }

  // Handle color input
  const handleColorInput = (color) => {
    if (!selectedCell || submitted) return;

    const { row, col } = selectedCell;
    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));

    if (isNoteMode) {
      // Add/remove color from notes
      const newNotes = notes.map((row) =>
        row.map((cell) => ({
          colors: new Set(cell.colors),
          shapes: new Set(cell.shapes),
        }))
      );

      if (newNotes[row][col].colors.has(color)) {
        newNotes[row][col].colors.delete(color);
      } else {
        newNotes[row][col].colors.add(color);
      }

      updateGameStateHelper({ notes: newNotes });
    } else {
      // Place color on grid
      newGrid[row][col] = { ...newGrid[row][col], color };
      updateGameStateHelper({
        grid: newGrid,
        placedColors: new Set([...placedColors, color]),
      });
    }
  };

  // Handle clear cell
  const handleClearCell = () => {
    if (!selectedCell || submitted) return;

    const { row, col } = selectedCell;
    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));

    if (!newGrid[row][col].isPreFilled) {
      newGrid[row][col] = { ...newGrid[row][col], color: null, shape: null };
      updateGameStateHelper({ grid: newGrid });
    }
  };

  // Handle hint
  const handleHint = () => {
    if (hintsUsed >= 3) return;

    updateGameStateHelper({
      hintsUsed: hintsUsed + 1,
      showHintModal: true,
    });
  };

  // Handle instructions
  const handleInstructions = () => {
    if (instructionsUsed) return;

    updateGameStateHelper({
      instructionsUsed: true,
      showHintModal: true,
    });
  };

  // Handle submit
  const handleSubmit = async () => {
    updateGameStateHelper({ submitted: true });

    const isCorrect = isGridCorrect();
    const roundScore = calculateScore();

    const roundData = {
      isCorrect,
      score: roundScore,
      hintsUsed,
      roundNumber: currentRound + 1,
    };

    // Update game state with round completion
    updateGameStateHelper({
      currentScore: roundScore,
      roundScores: [...roundScores, roundScore],
      roundResults: [...roundResults, roundData],
      attempts: attempts + 1,
    });

    // Save the round completion
    await saveState({
      roundCompleted: true,
      roundNumber: currentRound + 1,
      score: roundScore,
    });

    // Auto-advance to next round after 3 seconds
    setTimeout(() => {
      if (currentRound < MAX_ROUNDS - 1) {
        const nextRound = currentRound + 1;
        updateGameStateHelper({
          currentRound: nextRound,
          grid: ROUNDS[nextRound].preFilled.map((row) =>
            row.map((cell) => ({ ...cell }))
          ),
          notes: Array(GRID_SIZE.rows)
            .fill(null)
            .map(() =>
              Array(GRID_SIZE.cols)
                .fill(null)
                .map(() => ({
                  colors: new Set(),
                  shapes: new Set(),
                }))
            ),
          selectedCell: null,
          hintsUsed: 0,
          submitted: false,
          checkedClues: new Set(),
          placedColors: new Set(),
        });
      } else {
        // Game completed
        const totalScore = [...roundScores, roundScore].reduce(
          (a, b) => a + b,
          0
        );
        updateGameStateHelper({
          gameCompleted: true,
          showCompletionScreen: true,
          completed: true,
          score: totalScore,
        });

        // Save final completion
        saveState({
          completed: true,
          score: totalScore,
          submittedAt: new Date(),
        });

        // Call onComplete callback if provided
        if (onComplete) {
          const gameId = currentGameId || "pattern-solver";
          const submissionData = {
            gameId: gameId,
            score: totalScore,
            completed: true,
            submittedAt: new Date(),
            roundScores: [...roundScores, roundScore],
            hintsUsed: hintsUsed,
            instructionsUsed: instructionsUsed ? 1 : 0,
          };
          onComplete(gameId, submissionData);
        }
      }
    }, 3000);
  };

  // Check if grid is correct
  const isGridCorrect = () => {
    // Implementation would check against currentRoundData.solution
    return true; // Placeholder
  };

  // Calculate score
  const calculateScore = () => {
    // Implementation would calculate score based on performance
    return Math.max(0, 100 - hintsUsed * 10); // Placeholder
  };

  // Show loading screen while save state is loading
  if (saveLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>Loading game...</div>
        {hasLoadedSave && (
          <div className={styles.saveInfo}>
            Save data found - loading your progress...
          </div>
        )}
      </div>
    );
  }

  // Show save error if any
  if (saveError) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Game</h2>
        <p>There was an error loading your save data: {saveError.message}</p>
        <Button onClick={() => window.location.reload()}>Reload Game</Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Save State Manager */}
      <SaveStateManager
        gameId={gameId}
        onLoadSave={handleLoadSave}
        onDeleteSave={handleDeleteSave}
        showSaveInfo={true}
      />

      {/* Game Header */}
      <div className={styles.header}>
        <h1>Pattern Solver</h1>
        <div className={styles.gameInfo}>
          <span>
            Round {currentRound + 1} of {MAX_ROUNDS}
          </span>
          <span>Score: {currentScore}</span>
          <span>Hints: {hintsUsed}/3</span>
        </div>
      </div>

      {/* Game Grid */}
      <div className={styles.gameArea}>
        {/* Grid rendering would go here */}
        <div className={styles.grid}>
          {safeGrid.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.row}>
              {Array.isArray(row) ? (
                row.map((cell, colIndex) => (
                  <div
                    key={colIndex}
                    className={`${styles.cell} ${
                      selectedCell?.row === rowIndex &&
                      selectedCell?.col === colIndex
                        ? styles.selected
                        : ""
                    }`}
                    onClick={() =>
                      updateGameStateHelper({
                        selectedCell: { row: rowIndex, col: colIndex },
                      })
                    }
                  >
                    {cell.color && (
                      <div
                        className={styles.color}
                        style={{ backgroundColor: cell.color }}
                      >
                        {cell.shape}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div>Error loading grid</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Game Controls */}
      <div className={styles.controls}>
        <Button onClick={handleHint} disabled={hintsUsed >= 3}>
          Hint ({3 - hintsUsed} left)
        </Button>
        <Button onClick={handleInstructions} disabled={instructionsUsed}>
          Instructions
        </Button>
        <Button onClick={handleSubmit} disabled={submitted}>
          Submit
        </Button>
      </div>

      {/* Save Status */}
      {lastSaveTime && (
        <div className={styles.saveStatus}>
          Last saved: {new Date(lastSaveTime).toLocaleTimeString()}
        </div>
      )}

      {/* Modals */}
      {showHintModal && (
        <Modal onClose={() => updateGameStateHelper({ showHintModal: false })}>
          <div className={modalStyles.content}>
            <h2>Hint</h2>
            <p>This is a hint for the current puzzle...</p>
          </div>
        </Modal>
      )}

      {showCompletionScreen && (
        <Modal onClose={() => {}}>
          <div className={modalStyles.content}>
            <h2>Game Completed!</h2>
            <p>Final Score: {score}</p>
            <p>Total Rounds: {MAX_ROUNDS}</p>
            <Button onClick={() => window.location.reload()}>Play Again</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PatternSolverWithSave;
