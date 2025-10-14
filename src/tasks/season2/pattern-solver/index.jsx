import React, { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./PatternSolver.module.css";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import { useUniversalSaveState } from "../../../hooks/useUniversalSaveState";
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

// Shape components for rendering
const ShapeComponent = ({ shape, color, size = 60, className = "" }) => {
  const baseStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  switch (shape) {
    case "square":
      return (
        <div
          className={className}
          style={{
            ...baseStyle,
            width: size,
            height: size,
            backgroundColor: color,
            border: `3px solid #333`,
            borderRadius: "6px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        />
      );
    case "circle":
      return (
        <div
          className={className}
          style={{
            ...baseStyle,
            width: size,
            height: size,
            backgroundColor: color,
            border: `3px solid #333`,
            borderRadius: "50%",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        />
      );
    case "triangle":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          viewBox="0 0 100 100"
          style={{
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
          }}
        >
          <polygon
            points="50,10 90,85 10,85"
            fill={color}
            stroke="#333"
            strokeWidth="6"
          />
        </svg>
      );
    case "diamond":
      return (
        <div
          className={className}
          style={{
            ...baseStyle,
            width: size,
            height: size,
            backgroundColor: color,
            border: `3px solid #333`,
            borderRadius: "4px",
            transform: "rotate(45deg)",
            transformOrigin: "center center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        />
      );
    default:
      return null;
  }
};

const PatternSolver = ({ onComplete, currentGameId }) => {
  // Universal save state hook
  const {
    isLoading: saveLoading,
    hasLoadedSave,
    lastSaveTime,
    saveError,
    isSaving,
    autoSave,
    saveState,
    deleteSave,
  } = useUniversalSaveState(
    currentGameId || "pattern-solver",
    "pattern-solver"
  );

  const [currentRound, setCurrentRound] = useState(0);
  const [grid, setGrid] = useState(() => {
    // Initialize grid with preFilled data from first round
    return ROUNDS[0].preFilled.map((row) => row.map((cell) => ({ ...cell })));
  });
  const [notes, setNotes] = useState(() => {
    // Initialize notes grid - each cell can have multiple color/shape combinations
    return Array(GRID_SIZE.rows)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE.cols)
          .fill(null)
          .map(() => ({
            colors: new Set(),
            shapes: new Set(),
          }))
      );
  });
  const [selectedCell, setSelectedCell] = useState(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedShape, setSelectedShape] = useState(null);
  const [checkedClues, setCheckedClues] = useState(new Set());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [instructionsUsed, setInstructionsUsed] = useState(false);
  const [showInstructionsConfirmation, setShowInstructionsConfirmation] =
    useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const MAX_HINTS = PATTERN_SOLVER_CONFIG.maxHints;
  const [gameCompleted, setGameCompleted] = useState(false);
  const [roundsCompleted, setRoundsCompleted] = useState([]);
  const [showLogicHint, setShowLogicHint] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [roundScores, setRoundScores] = useState([]);
  const [currentScore, setCurrentScore] = useState(0);

  const [placedColors, setPlacedColors] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [boardSnapshots, setBoardSnapshots] = useState([]);
  const [roundResults, setRoundResults] = useState([]);
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState(null);

  // Game tracking and submission
  const [movesCount, setMovesCount] = useState(0);
  const [roundMoves, setRoundMoves] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());

  const currentRoundData = ROUNDS[currentRound];

  // Load saved state on mount
  useEffect(() => {
    if (hasLoadedSave && !saveLoading) {
      // Load saved state from the save system
      const loadSavedState = async () => {
        try {
          const { loadGameState } = await import(
            "../../../utils/universalSaveUtils"
          );
          const savedState = await loadGameState(
            currentGameId || "pattern-solver"
          );

          if (savedState) {
            // Debug: Log what's being loaded
            console.log("🎮 Loading saved state for Pattern Solver:", {
              currentRound: savedState.currentRound,
              roundScores: savedState.roundScores,
              boardSnapshots: savedState.boardSnapshots?.length || 0,
              roundResults: savedState.roundResults?.length || 0,
              hintsUsed: savedState.hintsUsed,
              instructionsUsed: savedState.instructionsUsed,
            });

            // Restore game state from save
            if (savedState.currentRound !== undefined)
              setCurrentRound(savedState.currentRound);
            if (savedState.grid) setGrid(savedState.grid);
            if (savedState.notes) setNotes(savedState.notes);
            if (savedState.selectedCell)
              setSelectedCell(savedState.selectedCell);
            if (savedState.isNoteMode !== undefined)
              setIsNoteMode(savedState.isNoteMode);
            if (savedState.selectedColor)
              setSelectedColor(savedState.selectedColor);
            if (savedState.selectedShape)
              setSelectedShape(savedState.selectedShape);
            if (savedState.checkedClues)
              setCheckedClues(new Set(savedState.checkedClues));
            if (savedState.hintsUsed !== undefined)
              setHintsUsed(savedState.hintsUsed);
            if (savedState.instructionsUsed !== undefined)
              setInstructionsUsed(savedState.instructionsUsed);
            if (savedState.gameCompleted !== undefined)
              setGameCompleted(savedState.gameCompleted);
            if (savedState.roundsCompleted)
              setRoundsCompleted(savedState.roundsCompleted);
            if (savedState.showLogicHint !== undefined)
              setShowLogicHint(savedState.showLogicHint);
            if (savedState.showCompletionScreen !== undefined)
              setShowCompletionScreen(savedState.showCompletionScreen);
            if (savedState.roundScores) setRoundScores(savedState.roundScores);
            if (savedState.currentScore !== undefined)
              setCurrentScore(savedState.currentScore);
            if (savedState.placedColors)
              setPlacedColors(new Set(savedState.placedColors));
            if (savedState.submitted !== undefined)
              setSubmitted(savedState.submitted);
            if (savedState.showHintModal !== undefined)
              setShowHintModal(savedState.showHintModal);
            if (savedState.boardSnapshots)
              setBoardSnapshots(savedState.boardSnapshots);
            if (savedState.roundResults)
              setRoundResults(savedState.roundResults);
            if (savedState.showSolutionModal !== undefined)
              setShowSolutionModal(savedState.showSolutionModal);
            if (savedState.selectedSolution)
              setSelectedSolution(savedState.selectedSolution);
            if (savedState.movesCount !== undefined)
              setMovesCount(savedState.movesCount);
            if (savedState.roundMoves !== undefined)
              setRoundMoves(savedState.roundMoves);
            if (savedState.roundStartTime !== undefined)
              setRoundStartTime(savedState.roundStartTime);

            console.log("🎮 Loaded saved state for Pattern Solver");
          }
        } catch (error) {
          console.error("❌ Error loading saved state:", error);
        }
      };

      loadSavedState();
    }
  }, [hasLoadedSave, saveLoading, currentGameId]);

  // Auto-save game state when it changes
  useEffect(() => {
    if (!saveLoading && hasLoadedSave !== null) {
      const gameState = {
        currentRound,
        grid,
        notes: notes.map((row) =>
          row.map((cell) => ({
            colors: Array.from(cell.colors),
            shapes: Array.from(cell.shapes),
          }))
        ),
        selectedCell,
        isNoteMode,
        selectedColor,
        selectedShape,
        checkedClues: Array.from(checkedClues),
        hintsUsed,
        instructionsUsed,
        gameCompleted,
        roundsCompleted,
        showLogicHint,
        showCompletionScreen,
        roundScores,
        currentScore,
        placedColors: Array.from(placedColors),
        submitted,
        showHintModal,
        boardSnapshots,
        roundResults,
        showSolutionModal,
        selectedSolution,
        movesCount,
        roundMoves,
        roundStartTime,
      };

      // Debug: Log what's being saved
      console.log("🎮 Auto-saving Pattern Solver state:", {
        currentRound: gameState.currentRound,
        roundScores: gameState.roundScores,
        boardSnapshots: gameState.boardSnapshots?.length || 0,
        roundResults: gameState.roundResults?.length || 0,
        hintsUsed: gameState.hintsUsed,
        instructionsUsed: gameState.instructionsUsed,
      });

      autoSave(gameState);
    }
  }, [
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
    movesCount,
    roundMoves,
    roundStartTime,
    autoSave,
    saveLoading,
    hasLoadedSave,
  ]);

  // Track game start time
  useEffect(() => {
    window.gameStartTime = Date.now();
  }, []);

  // Debug: Add functions to manage local storage (for testing)
  useEffect(() => {
    window.clearPatternSolverSave = () => {
      const gameId = currentGameId || "pattern-solver";
      const localStorageKey = `game_save_${gameId}`;
      localStorage.removeItem(localStorageKey);
      console.log(`🗑️ Cleared local storage for ${gameId}`);
      window.location.reload();
    };

    window.checkPatternSolverSave = () => {
      const gameId = currentGameId || "pattern-solver";
      const localStorageKey = `game_save_${gameId}`;
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log(`🔍 Local storage for ${gameId}:`, {
          currentRound: parsed.currentRound,
          roundScores: parsed.roundScores,
          boardSnapshots: parsed.boardSnapshots?.length || 0,
          roundResults: parsed.roundResults?.length || 0,
          hintsUsed: parsed.hintsUsed,
          instructionsUsed: parsed.instructionsUsed,
          gameCompleted: parsed.gameCompleted,
        });
      } else {
        console.log(`🔍 No local storage found for ${gameId}`);
      }
    };

    window.checkDatabaseSubmission = async () => {
      try {
        const { getCurrentSeason } = await import(
          "../../../firebase/new-database-utils.js"
        );
        const { getUserGameSubmission } = await import(
          "../../../firebase/new-database-utils.js"
        );
        const { getAuth } = await import("firebase/auth");

        const season = await getCurrentSeason();
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (season && currentUser) {
          const gameId = currentGameId || "pattern-solver";
          const existingSubmission = await getUserGameSubmission(
            season.id,
            gameId,
            currentUser.uid
          );

          if (existingSubmission && existingSubmission.completed) {
            console.log(`🔍 Database submission found for ${gameId}:`, {
              id: existingSubmission.id,
              score: existingSubmission.score,
              completed: existingSubmission.completed,
              submittedAt: existingSubmission.submittedAt,
            });
          } else {
            console.log(`🔍 No database submission found for ${gameId}`);
          }
        }
      } catch (error) {
        console.error("❌ Error checking database submission:", error);
      }
    };

    // Log the functions for easy access
    console.log("🔧 Debug functions available:");
    console.log(
      "  - window.clearPatternSolverSave() - Clear local storage and reset game"
    );
    console.log(
      "  - window.checkPatternSolverSave() - Check what's in local storage"
    );
    console.log(
      "  - window.checkDatabaseSubmission() - Check if user has already submitted to database"
    );
  }, [currentGameId]);

  // Check if grid is complete (all cells filled with both color and shape)
  const isGridCompleteCheck = useMemo(() => {
    return isGridComplete(grid);
  }, [grid]);

  // Check if grid is correct
  const isGridCorrectCheck = useCallback(() => {
    return isGridCorrect(grid, currentRoundData.solution);
  }, [grid, currentRoundData.solution]);

  // Calculate score for current round (3 points if correct, 0 if incorrect)
  // Penalties are applied at the end of the game, not per round
  const calculateScore = useCallback(() => {
    if (!isGridCorrectCheck()) return 0;
    return 3; // 3 points per round won
  }, [isGridCorrectCheck]);

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
          setSelectedCell({ row: row - 1, col });
          return;
        }
        if (e.key === "ArrowDown" && row < GRID_SIZE.rows - 1) {
          e.preventDefault();
          setSelectedCell({ row: row + 1, col });
          return;
        }
        if (e.key === "ArrowLeft" && col > 0) {
          e.preventDefault();
          setSelectedCell({ row, col: col - 1 });
          return;
        }
        if (e.key === "ArrowRight" && col < GRID_SIZE.cols - 1) {
          e.preventDefault();
          setSelectedCell({ row, col: col + 1 });
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
            if (
              !grid[row][col].color &&
              currentRoundData.preFilled[row][col].color === null
            ) {
              setSelectedCell({ row, col });
              return;
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, gameCompleted, grid, submitted, currentRoundData]);

  // Track placed colors
  useEffect(() => {
    const newPlacedColors = new Set();
    for (let row = 0; row < GRID_SIZE.rows; row++) {
      for (let col = 0; col < GRID_SIZE.cols; col++) {
        if (grid[row][col].color) {
          newPlacedColors.add(grid[row][col].color);
        }
      }
    }
    setPlacedColors(newPlacedColors);
  }, [grid]);

  // Show loading screen while save state is loading
  if (saveLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Pattern Solver</h2>
        </div>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <div>Loading game...</div>
          {hasLoadedSave && (
            <div
              style={{ marginTop: "10px", fontSize: "0.9rem", color: "#666" }}
            >
              Save data found - loading your progress...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show save error if any
  if (saveError) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Pattern Solver</h2>
        </div>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h3>Error Loading Game</h3>
          <p>There was an error loading your save data: {saveError.message}</p>
          <Button onClick={() => window.location.reload()}>Reload Game</Button>
        </div>
      </div>
    );
  }

  // Handle cell click
  const handleCellClick = (row, col) => {
    const preFilledCell = currentRoundData.preFilled[row][col];
    if (preFilledCell.color || preFilledCell.shape) {
      return; // Can't modify pre-filled cells
    }
    setSelectedCell({ row, col });
  };

  // Handle color input
  const handleColorInput = (color) => {
    if (!selectedCell) return;

    if (isNoteMode) {
      // Handle note mode - toggle color in notes
      const newNotes = [...notes];
      const cellNotes = newNotes[selectedCell.row][selectedCell.col];
      if (cellNotes.colors.has(color)) {
        cellNotes.colors.delete(color);
      } else {
        cellNotes.colors.add(color);
      }
      setNotes(newNotes);
    } else {
      // Handle fill mode - set actual color
      const newGrid = [...grid];
      newGrid[selectedCell.row][selectedCell.col] = {
        ...newGrid[selectedCell.row][selectedCell.col],
        color: color,
      };
      setGrid(newGrid);

      // Clear notes for this cell when filling
      const newNotes = [...notes];
      newNotes[selectedCell.row][selectedCell.col] = {
        colors: new Set(),
        shapes: new Set(),
      };
      setNotes(newNotes);

      // Count moves
      setMovesCount((prev) => prev + 1);
      setRoundMoves((prev) => prev + 1);

      // Auto-deselect if both color and shape are set
      if (newGrid[selectedCell.row][selectedCell.col].shape) {
        setSelectedCell(null);
      }
    }
  };

  // Handle shape input
  const handleShapeInput = (shape) => {
    if (!selectedCell) return;

    if (isNoteMode) {
      // Handle note mode - toggle shape in notes
      const newNotes = [...notes];
      const cellNotes = newNotes[selectedCell.row][selectedCell.col];
      if (cellNotes.shapes.has(shape)) {
        cellNotes.shapes.delete(shape);
      } else {
        cellNotes.shapes.add(shape);
      }
      setNotes(newNotes);
    } else {
      // Handle fill mode - set actual shape
      const newGrid = [...grid];
      newGrid[selectedCell.row][selectedCell.col] = {
        ...newGrid[selectedCell.row][selectedCell.col],
        shape: shape,
      };
      setGrid(newGrid);

      // Clear notes for this cell when filling
      const newNotes = [...notes];
      newNotes[selectedCell.row][selectedCell.col] = {
        colors: new Set(),
        shapes: new Set(),
      };
      setNotes(newNotes);

      // Count moves
      setMovesCount((prev) => prev + 1);
      setRoundMoves((prev) => prev + 1);

      // Auto-deselect if both color and shape are set
      if (newGrid[selectedCell.row][selectedCell.col].color) {
        setSelectedCell(null);
      }
    }
  };

  // Handle cell clear
  const handleClearCell = () => {
    if (selectedCell) {
      const newGrid = [...grid];
      newGrid[selectedCell.row][selectedCell.col] = {
        color: null,
        shape: null,
      };
      setGrid(newGrid);

      // Also clear notes for this cell
      const newNotes = [...notes];
      newNotes[selectedCell.row][selectedCell.col] = {
        colors: new Set(),
        shapes: new Set(),
      };
      setNotes(newNotes);

      setSelectedCell(null);
    }
  };

  // Handle hint
  const handleHint = () => {
    if (hintsUsed >= MAX_HINTS) return;
    setShowHintModal(true);
  };

  // Handle instructions confirmation
  const handleInstructionsConfirm = () => {
    if (!instructionsUsed) {
      setInstructionsUsed(true);
    }
    setShowInstructionsModal(true);
    setShowInstructionsConfirmation(false);
  };

  // Handle instructions
  const handleInstructions = () => {
    if (instructionsUsed) {
      setShowInstructionsModal(true);
    } else {
      setShowInstructionsConfirmation(true);
    }
  };

  const confirmHint = () => {
    // Find all empty cells
    const emptyCells = [];
    for (let row = 0; row < GRID_SIZE.rows; row++) {
      for (let col = 0; col < GRID_SIZE.cols; col++) {
        if (
          (!grid[row][col].color || !grid[row][col].shape) &&
          currentRoundData.preFilled[row][col].color === null
        ) {
          emptyCells.push({ row, col });
        }
      }
    }

    if (emptyCells.length > 0) {
      // Pick a random empty cell
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const { row, col } = emptyCells[randomIndex];

      const newGrid = [...grid];
      newGrid[row][col] = { ...currentRoundData.solution[row][col] };
      setGrid(newGrid);
      setHintsUsed((prev) => prev + 1);
    }

    setShowHintModal(false);
  };

  const cancelHint = () => {
    setShowHintModal(false);
  };

  // Handle clue toggle
  const handleClueToggle = (clueId) => {
    setCheckedClues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clueId)) {
        newSet.delete(clueId);
      } else {
        newSet.add(clueId);
      }
      return newSet;
    });
  };

  const handleSolutionClick = (snapshot) => {
    setSelectedSolution(snapshot);
    setShowSolutionModal(true);
  };

  const closeSolutionModal = () => {
    setShowSolutionModal(false);
    setSelectedSolution(null);
  };

  // Handle submit
  const handleSubmit = () => {
    setSubmitted(true);
    const isCorrect = isGridCorrectCheck();
    const score = calculateScore();
    setCurrentScore(score);

    // Save state on submit
    saveState({
      roundCompleted: true,
      roundNumber: currentRound + 1,
      score: score,
      isCorrect: isCorrect,
    }).catch((error) => {
      console.error("❌ Failed to save on submit:", error);
    });

    // Capture board snapshot
    const boardSnapshot = {
      playerBoard: grid.map((row) => row.map((cell) => ({ ...cell }))),
      correctBoard: currentRoundData.solution.map((row) =>
        row.map((cell) => ({ ...cell }))
      ),
      roundNumber: currentRound + 1,
      isCorrect,
      score,
      hintsUsed,
      moves: roundMoves,
      duration: Date.now() - roundStartTime,
    };

    const newBoardSnapshots = [...boardSnapshots, boardSnapshot];
    setBoardSnapshots(newBoardSnapshots);

    const newRoundResults = [...roundResults, { isCorrect, score }];
    setRoundResults(newRoundResults);

    const newRoundScores = [...roundScores, score];
    setRoundScores(newRoundScores);

    // Show result message then auto-advance to next round
    setTimeout(() => {
      if (currentRound < MAX_ROUNDS - 1) {
        // Advance to next round immediately
        const nextRound = currentRound + 1;
        setCurrentRound(nextRound);
        setGrid(() => {
          // Reset grid to pre-filled state
          return ROUNDS[nextRound].preFilled.map((row) =>
            row.map((cell) => ({ ...cell }))
          );
        });
        setNotes(() => {
          // Reset notes grid
          return Array(GRID_SIZE.rows)
            .fill(null)
            .map(() =>
              Array(GRID_SIZE.cols)
                .fill(null)
                .map(() => ({
                  colors: new Set(),
                  shapes: new Set(),
                }))
            );
        });

        setPlacedColors(new Set());
        // Don't reset hintsUsed - it should persist across rounds
        setSubmitted(false);
        setCheckedClues(new Set());
        setIsNoteMode(false);

        // Reset round-specific tracking
        setRoundMoves(0);
        setRoundStartTime(Date.now());

        // Manual save after round advancement to ensure correct state is saved
        setTimeout(() => {
          saveState({
            roundAdvanced: true,
            newRound: nextRound,
            roundScores: newRoundScores,
            boardSnapshots: newBoardSnapshots,
            roundResults: newRoundResults,
          }).catch((error) => {
            console.error("❌ Failed to save round advancement:", error);
          });
        }, 100); // Small delay to ensure state updates are applied
      } else {
        setGameCompleted(true);
        setShowCompletionScreen(true);

        // Calculate submission data
        const timeSpent = Date.now() - (window.gameStartTime || Date.now());
        const roundsWon = newRoundScores.filter((score) => score > 0).length;

        // Calculate total mistakes across all rounds
        let totalMistakes = 0;
        const rounds = [];

        // Process each round's data
        for (let i = 0; i < newRoundScores.length; i++) {
          const roundScore = newRoundScores[i];
          const roundResult = newRoundResults[i];
          const boardSnapshot = newBoardSnapshots[i];

          // Calculate mistakes for this round
          const roundMistakes = calculateMistakes(
            boardSnapshot.playerBoard,
            ROUNDS[i].solution
          );
          totalMistakes += roundMistakes;

          rounds.push({
            roundNumber: i + 1,
            won: roundScore > 0,
            score: roundScore,
            mistakes: roundMistakes,
            moves: boardSnapshot.moves || 0,
            duration: boardSnapshot.duration || 0,
          });
        }

        // Calculate final score: 3 points per round won, minus penalties
        const finalScore = Math.max(
          0,
          roundsWon * 3 - hintsUsed * 1 - (instructionsUsed ? 1 : 0)
        );

        // Prepare submission data using the new standardized system
        const submissionData = {
          score: finalScore || 0,
          roundsWon: roundsWon || 0,
          rounds: rounds || [],
          mistakesCount: totalMistakes || 0,
          hintsUsed: hintsUsed || 0,
          timeSpent: timeSpent || 0,
          instructionsUsed: instructionsUsed ? 1 : 0,
          answer: `Completed ${roundsWon}/${MAX_ROUNDS} rounds`, // Add answer field
        };

        // Debug log to check for undefined values
        console.log("🎮 Pattern Solver - Submission Data:", submissionData);
        console.log("🎮 Pattern Solver - Variables check:", {
          finalScore,
          roundsWon,
          rounds: rounds.length,
          totalMistakes,
          hintsUsed,
          timeSpent,
          instructionsUsed,
        });

        // Debug: Check the source data
        console.log("🎮 Pattern Solver - Source data check:", {
          roundScores: roundScores,
          boardSnapshots: boardSnapshots?.length || 0,
          roundResults: roundResults?.length || 0,
          newRoundScores: newRoundScores,
          newBoardSnapshots: newBoardSnapshots?.length || 0,
          newRoundResults: newRoundResults?.length || 0,
        });

        // Check for undefined values in submission data
        const undefinedFields = Object.entries(submissionData)
          .filter(([key, value]) => value === undefined)
          .map(([key]) => key);

        if (undefinedFields.length > 0) {
          console.warn(
            "⚠️ Pattern Solver - Undefined fields found:",
            undefinedFields
          );
        }

        // Save final completion
        saveState({
          completed: true,
          score: finalScore,
          submittedAt: new Date().toISOString(),
          totalMistakes: totalMistakes,
          roundsWon: roundsWon,
        }).catch((error) => {
          console.error("❌ Failed to save final completion:", error);
        });

        // Call onComplete with submission data
        if (onComplete) {
          // Use currentGameId if available, otherwise fall back to base game ID
          const gameId = currentGameId || "pattern-solver";
          onComplete(gameId, submissionData);
        }
      }
    }, 3000);
  };

  // Render grid cell
  const renderCell = (row, col) => {
    const cell = grid[row][col];
    const cellNotes = notes[row][col];
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const preFilledCell = currentRoundData.preFilled[row][col];
    const isPreFilled = preFilledCell.color || preFilledCell.shape;

    let cellClass = styles.cell;
    if (isSelected) cellClass += ` ${styles.selected}`;
    if (isPreFilled) cellClass += ` ${styles.preFilled}`;

    // Set cell background based on whether we have color only or both color and shape
    const cellStyle = {
      backgroundColor: cell.color && !cell.shape ? cell.color : "white",
      color: "#333",
    };

    const hasNotes = cellNotes.colors.size > 0 || cellNotes.shapes.size > 0;

    return (
      <div
        key={`${row}-${col}`}
        className={cellClass}
        style={cellStyle}
        onClick={() => handleCellClick(row, col)}
      >
        {cell.shape && (
          <ShapeComponent
            shape={cell.shape}
            color={cell.color || "#999"}
            size={50}
          />
        )}
        {!cell.shape && !cell.color && hasNotes && (
          <div className={styles.notes}>
            {/* Combined color-shape notes */}
            {cellNotes.shapes.size > 0 && cellNotes.colors.size > 0 && (
              <div className={styles.combinedNotes}>
                {Array.from(cellNotes.shapes).map((shape) => {
                  const colors = Array.from(cellNotes.colors);
                  if (colors.length === 1) {
                    // Single color with shape
                    return (
                      <ShapeComponent
                        key={`${shape}-${colors[0]}`}
                        shape={shape}
                        color={colors[0]}
                        size={24}
                      />
                    );
                  } else if (colors.length === 2) {
                    // Two colors with shape - diagonal split
                    return (
                      <div key={`${shape}-split`} className={styles.splitShape}>
                        <ShapeComponent
                          shape={shape}
                          color={colors[0]}
                          size={24}
                          className={styles.splitColor1}
                        />
                        <ShapeComponent
                          shape={shape}
                          color={colors[1]}
                          size={24}
                          className={styles.splitColor2}
                        />
                      </div>
                    );
                  } else {
                    // Multiple colors - use first color for now
                    return (
                      <ShapeComponent
                        key={`${shape}-${colors[0]}`}
                        shape={shape}
                        color={colors[0]}
                        size={24}
                      />
                    );
                  }
                })}
              </div>
            )}
            {/* Color-only notes (as lines) */}
            {cellNotes.colors.size > 0 && cellNotes.shapes.size === 0 && (
              <div className={styles.colorLines}>
                {Array.from(cellNotes.colors).map((color, index) => (
                  <div
                    key={color}
                    className={styles.colorLine}
                    style={{
                      backgroundColor: color,
                      top: `${index * 6}px`,
                    }}
                  />
                ))}
              </div>
            )}
            {/* Shape-only notes (gray shapes) */}
            {cellNotes.shapes.size > 0 && cellNotes.colors.size === 0 && (
              <div className={styles.shapeOnlyNotes}>
                {Array.from(cellNotes.shapes).map((shape, index) => (
                  <ShapeComponent
                    key={shape}
                    shape={shape}
                    color="#666"
                    size={24}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render color palette
  const renderColorPalette = () => {
    return (
      <div className={styles.colorPalette}>
        <h3>Colors</h3>
        <div className={styles.colorGrid}>
          {COLORS.map((color) => {
            const isFullyUsed = isColorFullyUsed(color, grid);
            return (
              <button
                key={color}
                className={`${styles.colorButton} ${isFullyUsed ? styles.fullyUsed : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorInput(color)}
                disabled={!selectedCell || isFullyUsed}
              >
                {color}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render shape palette
  const renderShapePalette = () => {
    return (
      <div className={styles.shapePalette}>
        <h3>Shapes</h3>
        <div className={styles.shapeGrid}>
          {SHAPES.map((shape) => {
            const isFullyUsed = isShapeFullyUsed(shape, grid);
            return (
              <button
                key={shape}
                className={`${styles.shapeButton} ${isFullyUsed ? styles.fullyUsed : ""}`}
                onClick={() => handleShapeInput(shape)}
                disabled={!selectedCell || isFullyUsed}
              >
                <ShapeComponent shape={shape} color="#666" size={24} />
                <span>{shape}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render clues display
  const renderClues = () => {
    return (
      <div className={styles.cluesContainer}>
        <h3>Logical Clues:</h3>
        <div className={styles.cluesList}>
          {currentRoundData.clues.map((clue) => {
            const isChecked = checkedClues.has(clue.id);

            return (
              <div
                key={clue.id}
                className={`${styles.clue} ${isChecked ? styles.checked : ""}`}
                onClick={() => handleClueToggle(clue.id)}
                title="Click to toggle check status"
              >
                <div className={styles.clueContent}>
                  <strong>Clue {clue.id}:</strong> {clue.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render a small board snapshot
  const renderBoardSnapshot = (
    board,
    title,
    isCorrect = null,
    clickHandler = null
  ) => {
    return (
      <div
        className={`${styles.boardSnapshot} ${clickHandler ? styles.clickable : ""}`}
        onClick={clickHandler}
      >
        <h4>{title}</h4>
        <div className={styles.miniGrid}>
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.miniRow}>
              {row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={styles.miniCell}
                  style={{
                    backgroundColor:
                      cell.color && !cell.shape ? cell.color : "white",
                  }}
                >
                  {cell.shape && (
                    <ShapeComponent
                      shape={cell.shape}
                      color={cell.color || "#999"}
                      size={20}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        {isCorrect !== null && (
          <div
            className={`${styles.resultBadge} ${isCorrect ? styles.correct : styles.incorrect}`}
          >
            {isCorrect ? "✓ Correct" : "✗ Incorrect"}
          </div>
        )}
        {clickHandler && (
          <div className={styles.clickHint}>Click to view details</div>
        )}
      </div>
    );
  };

  // Render completion screen
  const renderCompletionScreen = () => {
    const totalScore = roundScores.reduce((sum, score) => sum + score, 0);
    const averageScore = Math.round(totalScore / MAX_ROUNDS);
    const allRoundsCompleted = roundScores.length === MAX_ROUNDS;

    return (
      <div className={styles.completionScreen}>
        <div className={styles.completionHeader}>
          <h2>Pattern Solver Complete! </h2>
          <div className={styles.completionSubtitle}>
            {allRoundsCompleted
              ? "Congratulations! You solved all the puzzles!"
              : "Well done on completing the challenge!"}
          </div>
        </div>

        <div className={styles.scoreSummary}>
          <h3>Your Performance</h3>
          <div className={styles.performanceRow}>
            <div className={styles.roundScores}>
              <h4>Round Scores</h4>
              <div className={styles.scoreGrid}>
                {roundScores.map((score, index) => (
                  <div key={index} className={styles.roundScore}>
                    <span className={styles.roundLabel}>Round {index + 1}</span>
                    <span className={styles.roundPoints}>: {score} pts</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.totalScore}>
              <div className={styles.totalLabel}>Total Score</div>
              <div className={styles.totalPoints}>{totalScore} points</div>
              <div className={styles.averageScore}>
                Average: {averageScore} pts per round
              </div>
            </div>
          </div>
        </div>

        <div className={styles.boardSnapshots}>
          <h3>Your Solutions</h3>
          <div className={styles.snapshotsGrid}>
            {boardSnapshots.map((snapshot, index) => (
              <div key={index} className={styles.roundSnapshot}>
                <div className={styles.snapshotTitle}>
                  Round {snapshot.roundNumber}
                </div>
                <div className={styles.snapshotBoards}>
                  {renderBoardSnapshot(
                    snapshot.playerBoard,
                    "Your Solution",
                    snapshot.isCorrect
                  )}
                  {!snapshot.isCorrect && (
                    <div
                      className={`${styles.boardSnapshot} ${styles.clickable}`}
                      onClick={() => handleSolutionClick(snapshot)}
                    >
                      <h4>Correct Solution</h4>
                      <div className={styles.miniGrid}>
                        {snapshot.correctBoard.map((row, rowIndex) => (
                          <div key={rowIndex} className={styles.miniRow}>
                            {row.map((cell, colIndex) => (
                              <div
                                key={`${rowIndex}-${colIndex}`}
                                className={styles.miniCell}
                                style={{
                                  backgroundColor:
                                    cell.color && !cell.shape
                                      ? cell.color
                                      : "white",
                                }}
                              >
                                {cell.shape && (
                                  <ShapeComponent
                                    shape={cell.shape}
                                    color={cell.color || "#999"}
                                    size={20}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                      <div className={styles.clickHint}>
                        Click to view details
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.snapshotStats}>
                  <span>Score: {snapshot.score}</span>
                  <span>Hints: {snapshot.hintsUsed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.completionActions}>
          <Button
            size="large"
            variant="primary"
            onClick={() => {
              // Clear local storage and reload for fresh start
              const gameId = currentGameId || "pattern-solver";
              const localStorageKey = `game_save_${gameId}`;
              localStorage.removeItem(localStorageKey);
              console.log(
                `🗑️ Cleared local storage for fresh start: ${gameId}`
              );
              window.location.reload();
            }}
          >
            Play Again
          </Button>
        </div>

        {/* Solution Modal */}
        {showSolutionModal && selectedSolution && (
          <div className={styles.modalOverlay} onClick={closeSolutionModal}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>Round {selectedSolution.roundNumber} - Correct Solution</h2>
                <button
                  className={styles.closeButton}
                  onClick={closeSolutionModal}
                >
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.solutionGrid}>
                  <div className={styles.largeBoardSnapshot}>
                    <h3>Correct Solution</h3>
                    <div className={styles.largeGrid}>
                      {selectedSolution.correctBoard.map((row, rowIndex) => (
                        <div key={rowIndex} className={styles.largeRow}>
                          {row.map((cell, colIndex) => (
                            <div
                              key={`${rowIndex}-${colIndex}`}
                              className={styles.largeCell}
                              style={{
                                backgroundColor:
                                  cell.color && !cell.shape
                                    ? cell.color
                                    : "white",
                              }}
                            >
                              {cell.shape && (
                                <ShapeComponent
                                  shape={cell.shape}
                                  color={cell.color || "#999"}
                                  size={40}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.solutionClues}>
                    <h3>Clues for Round {selectedSolution.roundNumber}</h3>
                    <div className={styles.modalCluesList}>
                      {ROUNDS[selectedSolution.roundNumber - 1].clues.map(
                        (clue) => (
                          <div key={clue.id} className={styles.modalClue}>
                            <span className={styles.clueNumber}>
                              {clue.id}.
                            </span>
                            <span className={styles.clueText}>{clue.text}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (showCompletionScreen) {
    return renderCompletionScreen();
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.gameInfo}>
          <h2>Pattern Solver</h2>
          <div className={styles.roundInfo}>{currentRoundData.description}</div>
        </div>
        <div className={styles.stats}>
          <div>
            Round: {currentRound + 1}/{MAX_ROUNDS}
          </div>
          <div>
            Hints Used: {hintsUsed}/{MAX_HINTS}
          </div>
          {lastSaveTime && (
            <div style={{ fontSize: "0.8rem", color: "#666" }}>
              Last saved: {new Date(lastSaveTime).toLocaleTimeString()}
            </div>
          )}
          {isSaving && (
            <div style={{ fontSize: "0.8rem", color: "#666" }}>Saving...</div>
          )}
        </div>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.gridContainer}>
          <div className={styles.controls}>
            <Button
              onClick={() => setIsNoteMode(!isNoteMode)}
              variant="secondary"
              size="small"
              className={`${styles.noteModeButton} ${isNoteMode ? styles.active : ""}`}
            >
              {isNoteMode ? "Note Mode" : "Fill Mode"}
            </Button>
            <Button
              onClick={handleClearCell}
              disabled={!selectedCell}
              variant="logout"
              size="small"
              className={styles.clearButton}
            >
              Clear Cell
            </Button>
            <Button
              onClick={handleInstructions}
              variant="secondary"
              size="small"
              className={`${styles.instructionButton} ${instructionsUsed ? styles.instructionsButtonUsed : ""}`}
            >
              Instructions
              {!instructionsUsed && (
                <span className={styles.penaltyText}> (-1 point)</span>
              )}
            </Button>
            <Button
              onClick={handleHint}
              disabled={hintsUsed >= MAX_HINTS}
              variant="primary"
              size="small"
              className={styles.hintButton}
            >
              Get Hint ({MAX_HINTS - hintsUsed} left)
            </Button>
          </div>
          <div className={styles.gridWrapper}>
            <div className={styles.grid}>
              {grid.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.row}>
                  {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile selectors - show in grid container on mobile */}
          <div className={styles.mobileSelectors}>
            {renderColorPalette()}
            {renderShapePalette()}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isGridCompleteCheck}
            className={styles.submitButton}
            variant="primary"
            size="large"
          >
            Submit Solution
          </Button>
        </div>

        <div className={styles.sidebar}>
          {renderColorPalette()}
          {renderShapePalette()}
          {renderClues()}
        </div>
      </div>

      {/* Mobile clues - show outside gameArea on mobile */}
      <div className={styles.mobileClues}>{renderClues()}</div>

      {submitted && (
        <>
          <div className={styles.statusBackdrop}></div>
          <div className={styles.status}>
            {isGridCorrectCheck() ? (
              <div className={styles.success}>
                <h3>Excellent! Round {currentRound + 1} Complete!</h3>
                <p>You scored {currentScore} points</p>
                {currentRound < MAX_ROUNDS - 1 ? (
                  <p>Moving to next round...</p>
                ) : (
                  <p>Preparing final results...</p>
                )}
              </div>
            ) : (
              <div className={styles.error}>
                <h3>Not quite right!</h3>
                <p>
                  Some cells don't match the solution. You scored {currentScore}{" "}
                  points.
                </p>
                {currentRound < MAX_ROUNDS - 1 ? (
                  <p>Moving to next round...</p>
                ) : (
                  <p>Preparing final results...</p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {showHintModal && (
        <Modal isOpen={showHintModal} onClose={cancelHint} title="Use Hint?">
          <div className={styles.hintModal}>
            <p>
              Are you sure you want to use a hint? This will fill in one random
              cell with the correct answer.
            </p>
            <p>
              <strong>Note:</strong> Each hint used will reduce your score by 1
              point.
            </p>
            <p>
              <strong>Hints remaining: {MAX_HINTS - hintsUsed}</strong>
            </p>
            <div className={styles.hintButtons}>
              <Button onClick={confirmHint} variant="primary">
                Yes, Use Hint
              </Button>
              <Button onClick={cancelHint} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Instructions Confirmation Modal */}
      <Modal
        isOpen={showInstructionsConfirmation}
        onClose={() => setShowInstructionsConfirmation(false)}
        title="Confirm Instructions"
      >
        <div className={styles.hintModal}>
          <p>
            Using the instructions will result in a 1 point deduction. Are you
            sure you want to continue?
          </p>
          <div className={styles.hintButtons}>
            <Button onClick={handleInstructionsConfirm} variant="primary">
              Continue
            </Button>
            <Button
              onClick={() => setShowInstructionsConfirmation(false)}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Instructions Modal */}
      <Modal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
        title="Pattern Solver Instructions"
        className={styles.modalMedium}
      >
        <div className={styles.instructionsModal}>
          <div
            dangerouslySetInnerHTML={{
              __html: PATTERN_SOLVER_CONFIG.instructions.replace(/\n/g, "<br>"),
            }}
          />
        </div>
      </Modal>

      <div className={styles.instructions}>
        <p>
          <strong>Instructions:</strong> Click a cell to select it, then choose
          both a color and a shape. Shift between Fill Mode and Note Mode to
          track your deductions. Click the clues to check your progress.
        </p>
      </div>
    </div>
  );
};

export default PatternSolver;
