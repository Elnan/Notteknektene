import React, { useState, useEffect } from "react";
import styles from "./BuildingBlocks.module.css";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import modalStyles from "../../../components/Modal.module.css";
import { BUILDING_BLOCKS_CONFIG } from "./gameConfig";

const BuildingBlocks = ({ onComplete, onBack, currentGameId }) => {
  // State management
  const [grid, setGrid] = useState(
    Array(BUILDING_BLOCKS_CONFIG.gridSize)
      .fill()
      .map(() => Array(BUILDING_BLOCKS_CONFIG.gridSize).fill(""))
  );

  // Track game start time
  useEffect(() => {
    window.gameStartTime = Date.now();
  }, []);
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [finalAnswer, setFinalAnswer] = useState("");
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [instructionsUsed, setInstructionsUsed] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmType, setConfirmType] = useState(null);
  const [currentHint, setCurrentHint] = useState(null);

  // Handle grid cell input
  const handleGridCellInput = (row, col, value) => {
    const newGrid = [...grid];
    newGrid[row][col] = value.toUpperCase();
    setGrid(newGrid);
  };

  // Handle mobile input field changes
  const handleMobileInputChange = (e) => {
    const value = e.target.value;
    if (value.length > 0) {
      const lastChar = value.slice(-1).toUpperCase();
      if (/[A-Z]/.test(lastChar)) {
        handleGridCellInput(selectedCell.row, selectedCell.col, lastChar);
        // Auto-advance to next cell
        const nextCell = getNextCell(selectedCell.row, selectedCell.col);
        if (nextCell) {
          setSelectedCell(nextCell);
        }
      }
    }
    // Clear the input after processing
    e.target.value = "";
  };

  // Handle mobile input field key events
  const handleMobileInputKeyDown = (e) => {
    if (e.key === "Backspace") {
      if (grid[selectedCell.row][selectedCell.col] === "") {
        // If current cell is empty, go to previous cell and clear it
        const prevCell = getPreviousCell(selectedCell.row, selectedCell.col);
        if (prevCell) {
          setSelectedCell(prevCell);
          handleGridCellInput(prevCell.row, prevCell.col, "");
        }
      } else {
        // Clear current cell
        handleGridCellInput(selectedCell.row, selectedCell.col, "");
      }
    }
  };

  // Handle cell selection
  const handleCellClick = (row, col) => {
    setSelectedCell({ row, col });
    // Focus the mobile input field to trigger mobile keyboard
    const mobileInput = document.getElementById("mobile-grid-input");
    if (mobileInput) {
      mobileInput.focus();
    }
  };

  // Handle keyboard input for selected cell
  const handleKeyPress = (e) => {
    e.preventDefault();

    if (e.key === "Backspace") {
      if (grid[selectedCell.row][selectedCell.col] === "") {
        // If current cell is empty, go to previous cell and clear it
        const prevCell = getPreviousCell(selectedCell.row, selectedCell.col);
        if (prevCell) {
          setSelectedCell(prevCell);
          handleGridCellInput(prevCell.row, prevCell.col, "");
        }
      } else {
        // Clear current cell
        handleGridCellInput(selectedCell.row, selectedCell.col, "");
      }
    } else if (e.key === "ArrowUp") {
      const newRow = Math.max(0, selectedCell.row - 1);
      setSelectedCell({ row: newRow, col: selectedCell.col });
    } else if (e.key === "ArrowDown") {
      const newRow = Math.min(
        BUILDING_BLOCKS_CONFIG.gridSize - 1,
        selectedCell.row + 1
      );
      setSelectedCell({ row: newRow, col: selectedCell.col });
    } else if (e.key === "ArrowLeft") {
      const newCol = Math.max(0, selectedCell.col - 1);
      setSelectedCell({ row: selectedCell.row, col: newCol });
    } else if (e.key === "ArrowRight") {
      const newCol = Math.min(
        BUILDING_BLOCKS_CONFIG.gridSize - 1,
        selectedCell.col + 1
      );
      setSelectedCell({ row: selectedCell.row, col: newCol });
    } else if (e.key.length === 1 && /[A-Za-z]/.test(e.key)) {
      handleGridCellInput(selectedCell.row, selectedCell.col, e.key);
      // Auto-advance to next cell
      const nextCell = getNextCell(selectedCell.row, selectedCell.col);
      if (nextCell) {
        setSelectedCell(nextCell);
      }
    }
  };

  // Get next cell in grid
  const getNextCell = (row, col) => {
    if (col < BUILDING_BLOCKS_CONFIG.gridSize - 1) {
      return { row, col: col + 1 };
    } else if (row < BUILDING_BLOCKS_CONFIG.gridSize - 1) {
      return { row: row + 1, col: 0 };
    }
    return null; // At the end of grid
  };

  // Get previous cell in grid
  const getPreviousCell = (row, col) => {
    if (col > 0) {
      return { row, col: col - 1 };
    } else if (row > 0) {
      return { row: row - 1, col: BUILDING_BLOCKS_CONFIG.gridSize - 1 };
    }
    return null; // At the beginning of grid
  };

  // Add keyboard event listener
  useEffect(() => {
    const handleGlobalKeyPress = (e) => {
      // Don't handle if user is typing in an input field
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }
      handleKeyPress(e);
    };

    window.addEventListener("keydown", handleGlobalKeyPress);
    return () => window.removeEventListener("keydown", handleGlobalKeyPress);
  }, [selectedCell, grid]);

  // Get current diagonal reading
  const getCurrentDiagonal = () => {
    let diagonal = "";
    for (let i = 0; i < BUILDING_BLOCKS_CONFIG.gridSize; i++) {
      if (grid[i][i]) {
        diagonal += grid[i][i];
      }
    }
    return diagonal;
  };

  // Handle final answer submission
  const handleSubmitFinalAnswer = () => {
    const isCorrect =
      finalAnswer.toUpperCase() === BUILDING_BLOCKS_CONFIG.finalAnswer;

    console.log("Final answer check:", {
      userAnswer: finalAnswer.toUpperCase(),
      expectedAnswer: BUILDING_BLOCKS_CONFIG.finalAnswer,
      isCorrect,
    });

    // Calculate time spent
    const timeSpent = Date.now() - (window.gameStartTime || Date.now());

    // Prepare submission data using the new standardized system
    const submissionData = {
      score: isCorrect ? calculatePoints() : 0,
      answer: finalAnswer.toUpperCase(),
      gridState: grid.map((row) => row.join("")).join("|"), // Convert 2D array to string
      timeSpent: timeSpent, // Pass raw time for the utility to format
      hintsUsed: hintUsed ? 1 : 0,
      instructionsUsed: instructionsUsed ? 1 : 0,
    };

    if (isCorrect) {
      setGameWon(true);
      setGameCompleted(true);
      // Use currentGameId if available, otherwise fall back to base game ID
      const gameId = currentGameId || "building-blocks";
      onComplete(gameId, submissionData);
    } else {
      setGameWon(false);
      setGameCompleted(true);
      // Use currentGameId if available, otherwise fall back to base game ID
      const gameId = currentGameId || "building-blocks";
      onComplete(gameId, submissionData);
    }
  };

  // Calculate points
  const calculatePoints = () => {
    let points = BUILDING_BLOCKS_CONFIG.basePoints;
    if (instructionsUsed) points -= BUILDING_BLOCKS_CONFIG.instructionPenalty;
    if (hintUsed) points -= BUILDING_BLOCKS_CONFIG.hintPenalty;
    return Math.max(0, points);
  };

  // Handle instructions button
  const handleInstructionsClick = () => {
    if (!instructionsUsed) {
      setConfirmType("instructions");
      setShowConfirmModal(true);
    } else {
      setShowInstructionsModal(true);
    }
  };

  // Handle hint button
  const handleHintClick = () => {
    if (!hintUsed) {
      setConfirmType("hint");
      setShowConfirmModal(true);
    } else {
      setShowHintModal(true);
    }
  };

  // Confirm using instructions or hint
  const handleConfirm = () => {
    if (confirmType === "instructions") {
      setInstructionsUsed(true);
      setShowInstructionsModal(true);
    } else if (confirmType === "hint") {
      setHintUsed(true);
      // Generate a random anagram solution and provide the diagonal hint
      const randomAnagramIndex = Math.floor(
        Math.random() * BUILDING_BLOCKS_CONFIG.anagrams.length
      );
      const anagram = BUILDING_BLOCKS_CONFIG.anagrams[randomAnagramIndex];
      setCurrentHint({
        type: "diagonal",
        revealedWord: anagram.solution,
        diagonalHint:
          "When all words are placed in the correct order, the main word will be revealed by reading diagonally from top-left to bottom-right.",
      });
      setShowHintModal(true);
    }
    setShowConfirmModal(false);
  };

  // Cancel confirmation
  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmType(null);
  };

  // Render anagram list
  const renderAnagrams = () => (
    <div className={styles.anagramsSection}>
      <div className={styles.anagramList}>
        {BUILDING_BLOCKS_CONFIG.anagrams.map((anagram, index) => (
          <span key={anagram.id} className={styles.anagramItem}>
            {anagram.scrambled}
          </span>
        ))}
      </div>
    </div>
  );

  // Render building grid
  const renderGrid = () => (
    <div className={styles.gridSection}>
      {/* Hidden mobile input field for mobile keyboard */}
      <input
        id="mobile-grid-input"
        type="text"
        className={styles.mobileInput}
        onChange={handleMobileInputChange}
        onKeyDown={handleMobileInputKeyDown}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck="false"
        maxLength="1"
      />
      <div className={styles.buildingGrid}>
        {Array.from(
          { length: BUILDING_BLOCKS_CONFIG.gridSize },
          (_, rowIndex) => (
            <div key={rowIndex} className={styles.gridRow}>
              {Array.from(
                { length: BUILDING_BLOCKS_CONFIG.gridSize },
                (_, colIndex) => {
                  const isSelected =
                    selectedCell.row === rowIndex &&
                    selectedCell.col === colIndex;
                  const letter = grid[rowIndex][colIndex];

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`${styles.gridCell} ${
                        letter ? styles.filled : ""
                      } ${isSelected ? styles.selected : ""}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {letter || ""}
                    </div>
                  );
                }
              )}
            </div>
          )
        )}
      </div>
    </div>
  );

  // Render final answer section
  const renderFinalAnswer = () => (
    <div className={styles.finalAnswerSection}>
      <input
        type="text"
        className={styles.finalAnswerInput}
        value={finalAnswer}
        onChange={(e) => setFinalAnswer(e.target.value)}
        placeholder="Final answer"
      />
      <Button onClick={handleSubmitFinalAnswer} variant="primary" size="small">
        Submit
      </Button>
    </div>
  );

  // Render results screen
  const renderResults = () => {
    const points = calculatePoints();

    return (
      <div className={styles.resultsScreen}>
        <div className={styles.resultsHeader}>
          <h2>Famous Building Results</h2>
        </div>

        {gameWon ? (
          <div className={styles.successMessage}>
            <h3>Excellent Work!</h3>
            <p>
              You successfully solved all the anagrams and discovered the famous
              building!
            </p>
            <p>
              The diagonal answer revealed:{" "}
              <strong>{BUILDING_BLOCKS_CONFIG.finalAnswer}</strong>
            </p>
            <p>
              Points earned: {points} / {BUILDING_BLOCKS_CONFIG.basePoints}
            </p>
            {instructionsUsed && <p>(-1 point for using instructions)</p>}
            {hintUsed && <p>(-1 points for using hint)</p>}
          </div>
        ) : (
          <div className={styles.failureMessage}>
            <h3>Not Quite Right</h3>
            <p>
              The correct answer was:{" "}
              <strong>{BUILDING_BLOCKS_CONFIG.finalAnswer}</strong>
            </p>
            <p>Better luck next time!</p>
            <p>Points earned: 0 / {BUILDING_BLOCKS_CONFIG.basePoints}</p>
          </div>
        )}

        <div className={styles.solutionGrid}>
          <h3>Correct Solution</h3>
          <div className={styles.correctSolution}>
            <h4>Grid Layout:</h4>
            <div className={styles.buildingGrid}>
              {[
                BUILDING_BLOCKS_CONFIG.anagrams.find(
                  (a) => a.solution === "KEYHOLE"
                )?.solution,
                BUILDING_BLOCKS_CONFIG.anagrams.find(
                  (a) => a.solution === "ARCHWAY"
                )?.solution,
                BUILDING_BLOCKS_CONFIG.anagrams.find(
                  (a) => a.solution === "STEEPLE"
                )?.solution,
                BUILDING_BLOCKS_CONFIG.anagrams.find(
                  (a) => a.solution === "CHIMNEY"
                )?.solution,
                BUILDING_BLOCKS_CONFIG.anagrams.find(
                  (a) => a.solution === "TEMPLES"
                )?.solution,
                BUILDING_BLOCKS_CONFIG.anagrams.find(
                  (a) => a.solution === "BOUDOIR"
                )?.solution,
                BUILDING_BLOCKS_CONFIG.anagrams.find(
                  (a) => a.solution === "MANSION"
                )?.solution,
              ].map((word, rowIndex) => (
                <div key={rowIndex} className={styles.gridRow}>
                  {Array.from(
                    { length: BUILDING_BLOCKS_CONFIG.gridSize },
                    (_, colIndex) => {
                      const isDiagonal = rowIndex === colIndex;
                      const letter = word[colIndex] || "";

                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`${styles.gridCell} ${styles.filled} ${
                            isDiagonal ? styles.diagonal : ""
                          }`}
                        >
                          {letter}
                        </div>
                      );
                    }
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  if (gameCompleted) {
    return renderResults();
  }

  return (
    <div className={styles.minigame}>
      <div className={styles.minigameHeader}>
        <h3>Famous Building</h3>
        <div className={styles.headerButtons}>
          <Button
            variant="secondary"
            size="small"
            onClick={handleInstructionsClick}
            className={
              instructionsUsed
                ? styles.instructionsButton + " " + styles.used
                : ""
            }
          >
            Instructions
            {!instructionsUsed && (
              <div className={styles.penaltyText}> (-1 point)</div>
            )}
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={handleHintClick}
            className={hintUsed ? styles.hintButton + " " + styles.used : ""}
          >
            Hint
            {!hintUsed && (
              <div className={styles.penaltyText}> (-1 points)</div>
            )}
          </Button>
        </div>
      </div>

      <div className={styles.gameArea}>
        {renderAnagrams()}
        {renderGrid()}
        {renderFinalAnswer()}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={handleCancel}
        title={`Use ${confirmType === "instructions" ? "Instructions" : "Hint"}?`}
      >
        <p>
          Are you sure you want to use the{" "}
          {confirmType === "instructions" ? "instructions" : "hint"}?
        </p>
        <p>
          <strong>Warning:</strong> This will deduct{" "}
          {confirmType === "instructions" ? "1" : "1"} point(s) from your final
          score.
        </p>
        <div className={modalStyles.modalButtons}>
          <Button onClick={handleConfirm} variant="primary" size="small">
            Yes, Use {confirmType === "instructions" ? "Instructions" : "Hint"}
          </Button>
          <Button onClick={handleCancel} variant="secondary" size="small">
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Instructions Modal */}
      <Modal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
        title="Instructions"
      >
        <div style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>
          {BUILDING_BLOCKS_CONFIG.instructions}
        </div>
      </Modal>

      {/* Hint Modal */}
      <Modal
        isOpen={showHintModal}
        onClose={() => setShowHintModal(false)}
        title="Hint"
      >
        <div className="hintContent">
          {currentHint && currentHint.type === "diagonal" && (
            <>
              <h4>Revealed Word:</h4>
              <p>{currentHint.revealedWord}</p>

              <h4>Strategy Hint:</h4>
              <p>{currentHint.diagonalHint}</p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BuildingBlocks;
