import React, { useState, useEffect, useRef } from "react";
import styles from "./WhyGame.module.css";
import Button from "../../../../components/Button";
import { WHY_DATA } from "../gameData.js";
import Modal from "../../../../components/Modal";
import modalStyles from "../../../../components/Modal.module.css";

const REGION_COLOR_COUNT = 10;

function getRegionIndex(regions, row, col) {
  return regions.findIndex((region) =>
    region.cells.some(([r, c]) => r === row && c === col)
  );
}

function isClueCell(clues, row, col) {
  return clues.some((clue) => clue.row === row && clue.col === col);
}

function getClueValue(clues, row, col) {
  const clue = clues.find((clue) => clue.row === row && clue.col === col);
  return clue ? clue.value : null;
}

function getAdjacentCells(row, col, gridSize) {
  // 8 directions
  const dirs = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];
  return dirs
    .map(([dr, dc]) => [row + dr, col + dc])
    .filter(([r, c]) => r >= 0 && r < gridSize && c >= 0 && c < gridSize);
}

const SUGURU_INSTRUCTIONS = (
  <div className={styles.modalContent}>
    <h2 className={styles.modalTitle}>How to Play</h2>
    <ul className={styles.modalList}>
      <li>
        Fill each region with the numbers 1 up to the size of the region (e.g.,
        1–5 in a 5-cell region).
      </li>
      <li>No number may repeat in a region.</li>
      <li>
        No two adjacent cells (including diagonally) may have the same number.
      </li>
      <li>
        Click a cell, then a number to fill it. Use Note Mode (N) to pencil in
        possibilities.
      </li>
      <li>Use the Erase (E) button or Backspace/Delete to clear a cell.</li>
    </ul>
    <div className={styles.modalTip}>
      Tip: You can use the keyboard for fast entry and navigation!
    </div>
  </div>
);

const WhyGame = ({ onComplete, onBack, onHint, savedGameState }) => {
  const gridSize = WHY_DATA.why.gridSize;
  const { regions, clues, solution } = WHY_DATA.why.levels[0];

  // Initialize grid with clues filled in
  const [grid, setGrid] = useState(() => {
    const g = Array(gridSize)
      .fill()
      .map(() => Array(gridSize).fill(null));
    for (const clue of clues) {
      g[clue.row][clue.col] = clue.value;
    }
    return g;
  });
  const [notes, setNotes] = useState(
    Array(gridSize)
      .fill()
      .map(() =>
        Array(gridSize)
          .fill()
          .map(() => new Set())
      )
  );
  const [selectedCell, setSelectedCell] = useState(null);
  const [noteMode, setNoteMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [keyboardActive, setKeyboardActive] = useState(false);
  const [victory, setVictory] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  // Find an empty cell and get its correct value
  const getHintCell = () => {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (isCellEditable(row, col) && !grid[row][col]) {
          return { row, col, value: solution[row][col] };
        }
      }
    }
    return null;
  };

  const boardRef = useRef(null);

  // Track game start time
  useEffect(() => {
    setGameStartTime(Date.now());
  }, []);

  // ===== RESTORE SAVED STATE =====
  useEffect(() => {
    if (savedGameState && savedGameState.gameState) {
      const { gameState } = savedGameState;

      // Restore game state
      if (gameState.grid) {
        // Handle both 2D array and flattened array
        if (Array.isArray(gameState.grid) && gameState.grid.length > 0) {
          if (Array.isArray(gameState.grid[0])) {
            // Regular 2D array
            setGrid(gameState.grid);
          } else if (
            typeof gameState.grid[0] === "object" &&
            gameState.grid[0].hasOwnProperty("row")
          ) {
            // Flattened array - reconstruct 2D grid
            const maxRow = Math.max(...gameState.grid.map((item) => item.row));
            const maxCol = Math.max(...gameState.grid.map((item) => item.col));
            const reconstructedGrid = Array(maxRow + 1)
              .fill()
              .map(() => Array(maxCol + 1).fill(null));

            gameState.grid.forEach((item) => {
              if (item.row !== undefined && item.col !== undefined) {
                reconstructedGrid[item.row][item.col] = item.value;
              }
            });

            setGrid(reconstructedGrid);
          }
        }
      }
      if (gameState.notes) {
        // Handle both 2D array of Sets and flattened array
        if (Array.isArray(gameState.notes) && gameState.notes.length > 0) {
          if (Array.isArray(gameState.notes[0])) {
            // Regular 2D array
            setNotes(
              gameState.notes.map((row) => {
                if (Array.isArray(row)) {
                  return row.map((cell) => {
                    if (Array.isArray(cell)) {
                      return new Set(cell);
                    }
                    return new Set();
                  });
                }
                return [];
              })
            );
          } else if (
            typeof gameState.notes[0] === "object" &&
            gameState.notes[0].hasOwnProperty("row")
          ) {
            // Flattened array - reconstruct 2D grid of Sets
            const maxRow = Math.max(...gameState.notes.map((item) => item.row));
            const maxCol = Math.max(...gameState.notes.map((item) => item.col));
            const reconstructedNotes = Array(maxRow + 1)
              .fill()
              .map(() =>
                Array(maxCol + 1)
                  .fill()
                  .map(() => new Set())
              );

            gameState.notes.forEach((item) => {
              if (
                item.row !== undefined &&
                item.col !== undefined &&
                item.value
              ) {
                if (Array.isArray(item.value)) {
                  reconstructedNotes[item.row][item.col] = new Set(item.value);
                } else {
                  reconstructedNotes[item.row][item.col] = new Set();
                }
              }
            });

            setNotes(reconstructedNotes);
          }
        }
      }
      if (gameState.selectedCell) setSelectedCell(gameState.selectedCell);
      if (gameState.noteMode !== undefined) setNoteMode(gameState.noteMode);
      if (gameState.history) setHistory(gameState.history);
      // Only restore victory state if the game was actually completed
      if (savedGameState.completed && gameState.victory !== undefined) {
        setVictory(gameState.victory);
      }
    }
  }, [savedGameState]);

  // Calculate time spent on this mini-game
  const getTimeSpent = () => {
    return gameStartTime ? Date.now() - gameStartTime : 0;
  };

  // Helper to calculate points for this game
  const getPoints = () => {
    const basePoints = 2; // 2 points per round completed
    return Math.max(0, basePoints - (hintUsed ? 1 : 0));
  };

  // Complete the mini-game with detailed data
  const completeGame = () => {
    const timeSpent = getTimeSpent();
    const points = getPoints();

    const gameData = {
      points: points,
      hintUsed: hintUsed ? 1 : 0,
      timeSpent: timeSpent,
      completed: victory,
      // Include complete game state for save/load
      gameState: {
        grid,
        notes: notes.map((row) => row.map((cell) => Array.from(cell))), // Convert Sets to Arrays
        selectedCell,
        noteMode,
        history,
        victory,
      },
    };

    onComplete("why", gameData);
  };

  // Focus management for keyboard/mouse
  useEffect(() => {
    if (keyboardActive && boardRef.current) {
      boardRef.current.focus();
    }
  }, [keyboardActive, selectedCell]);

  // Remove focus and cell highlight when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (boardRef.current && !boardRef.current.contains(e.target)) {
        // Don't clear selection when clicking on game controls (buttons)
        const isGameControl =
          e.target.closest("button") ||
          e.target.closest('[role="button"]') ||
          e.target.closest(".buttonRow") ||
          e.target.closest(".buttonRowControls");
        if (!isGameControl) {
          setKeyboardActive(false);
          setSelectedCell(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Helper: find first editable cell
  const findFirstEditableCell = () => {
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (isCellEditable(r, c)) return [r, c];
      }
    }
    return null;
  };

  // Helper: find next editable cell in a direction
  const findNextEditableCell = (row, col, dr, dc) => {
    let nr = row + dr;
    let nc = col + dc;
    while (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
      if (isCellEditable(nr, nc)) return [nr, nc];
      nr += dr;
      nc += dc;
    }
    return [row, col]; // If no editable cell found, stay
  };

  // Global keydown: if not focused and arrow key pressed, refocus board and select cell
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (
        document.activeElement !== boardRef.current &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        setKeyboardActive(true);
        setSelectedCell((sel) => sel || findFirstEditableCell());
        if (boardRef.current) boardRef.current.focus();
        // Only preventDefault if we actually focus/select the grid
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [keyboardActive]);

  // Victory check
  useEffect(() => {
    if (checkVictory()) setVictory(true);
    else setVictory(false);
    // eslint-disable-next-line
  }, [grid]);

  // When the player wins, show the victory screen and pass points to onComplete
  useEffect(() => {
    if (victory) {
      completeGame();
    }
    // eslint-disable-next-line
  }, [victory]);

  const isCellEditable = (row, col) => !isClueCell(clues, row, col);

  const handleCellClick = (row, col) => {
    if (isCellEditable(row, col)) {
      setSelectedCell([row, col]);
      setKeyboardActive(true);
      if (boardRef.current) boardRef.current.focus();
    }
  };

  const handleNumberInput = (number) => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    if (!isCellEditable(row, col)) {
      return;
    }
    setHistory((prev) => [
      {
        grid: grid.map((r) => [...r]),
        notes: notes.map((r) => r.map((s) => new Set([...s]))),
      },
      ...prev,
    ]);
    if (noteMode) {
      const newNotes = notes.map((r) => r.map((s) => new Set([...s])));
      if (newNotes[row][col].has(number)) {
        newNotes[row][col].delete(number);
      } else {
        newNotes[row][col].add(number);
      }
      setNotes(newNotes);
    } else {
      const newGrid = grid.map((r) => [...r]);
      newGrid[row][col] = newGrid[row][col] === number ? null : Number(number);
      setGrid(newGrid);
    }
  };

  // Erase cell content (fill or notes)
  const handleErase = () => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    if (!isCellEditable(row, col)) {
      return;
    }
    setHistory((prev) => [
      {
        grid: grid.map((r) => [...r]),
        notes: notes.map((r) => r.map((s) => new Set([...s]))),
      },
      ...prev,
    ]);
    if (noteMode) {
      const newNotes = notes.map((r) => r.map((s) => new Set([...s])));
      newNotes[row][col] = new Set();
      setNotes(newNotes);
    } else {
      const newGrid = grid.map((r) => [...r]);
      newGrid[row][col] = null;
      setGrid(newGrid);
    }
  };

  const handleKeyDown = (e) => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    if (["1", "2", "3", "4", "5"].includes(e.key)) {
      handleNumberInput(Number(e.key));
      e.preventDefault();
    } else if (e.key === "Backspace" || e.key === "Delete") {
      handleErase();
      e.preventDefault();
    } else if (e.key === "e" || e.key === "E") {
      handleErase();
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setSelectedCell(findNextEditableCell(row, col, -1, 0));
      setKeyboardActive(true);
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      setSelectedCell(findNextEditableCell(row, col, 1, 0));
      setKeyboardActive(true);
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      setSelectedCell(findNextEditableCell(row, col, 0, -1));
      setKeyboardActive(true);
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      setSelectedCell(findNextEditableCell(row, col, 0, 1));
      setKeyboardActive(true);
      e.preventDefault();
    } else if (e.key.toLowerCase() === "n") {
      setNoteMode((n) => !n);
      e.preventDefault();
    }
  };

  const handleReset = () => {
    setGrid(
      Array(gridSize)
        .fill()
        .map(() => Array(gridSize).fill(null))
    );
    setNotes(
      Array(gridSize)
        .fill()
        .map(() =>
          Array(gridSize)
            .fill()
            .map(() => new Set())
        )
    );
    setSelectedCell(null);
    setHistory([]);
  };

  // Suguru victory check
  function checkVictory() {
    // 1. Each region contains 1..region size, no repeats
    for (const region of regions) {
      const numbers = region.cells.map(([r, c]) => grid[r][c]);
      if (numbers.some((n) => !n || typeof n !== "number")) {
        // console.log("Region fail (not all numbers):", numbers);
        return false;
      }
      const unique = new Set(numbers);
      if (unique.size !== region.cells.length) {
        // console.log("Region fail (duplicate):", numbers);
        return false;
      }
      for (let i = 1; i <= region.cells.length; ++i) {
        if (!unique.has(i)) {
          // console.log("Region fail (missing number):", numbers, "missing", i);
          return false;
        }
      }
    }
    // 2. No two adjacent (including diagonally) cells have the same number
    for (let r = 0; r < gridSize; ++r) {
      for (let c = 0; c < gridSize; ++c) {
        if (!grid[r][c]) continue;
        for (const [ar, ac] of getAdjacentCells(r, c, gridSize)) {
          if (grid[ar][ac] === grid[r][c]) {
            // console.log("Adjacent duplicate at", r, c, "and", ar, ac, "value", grid[r][c]);
            return false;
          }
        }
      }
    }
    return true;
  }

  // --- Render ---
  const renderCell = (row, col) => {
    const regionIdx = getRegionIndex(regions, row, col);
    const regionClass = styles[`region${(regionIdx % REGION_COLOR_COUNT) + 1}`];
    const isClue = isClueCell(clues, row, col);
    const clueValue = isClue ? getClueValue(clues, row, col) : null;
    const isSelected =
      selectedCell && selectedCell[0] === row && selectedCell[1] === col;
    let cellClass = styles.cell;
    if (regionClass) cellClass += ` ${regionClass}`;
    if (isSelected) cellClass += ` ${styles.selected}`;
    if (isClue) cellClass += ` ${styles.clueCell}`;

    // Thicker region borders
    const borderStyle = {};
    const directions = [
      { dr: -1, dc: 0, style: "borderTop" },
      { dr: 0, dc: 1, style: "borderRight" },
      { dr: 1, dc: 0, style: "borderBottom" },
      { dr: 0, dc: -1, style: "borderLeft" },
    ];
    directions.forEach(({ dr, dc, style }) => {
      const nr = row + dr;
      const nc = col + dc;
      const neighborRegionIdx = getRegionIndex(regions, nr, nc);
      if (
        nr < 0 ||
        nr >= gridSize ||
        nc < 0 ||
        nc >= gridSize ||
        neighborRegionIdx !== regionIdx
      ) {
        borderStyle[style] = "4px solid #222";
      } else {
        borderStyle[style] = "1px solid #d0d0d0";
      }
    });

    return (
      <div
        key={`${row}-${col}`}
        className={cellClass}
        aria-readonly={isClue ? "true" : undefined}
        onClick={() => {
          handleCellClick(row, col);
        }}
        style={{ ...borderStyle }}
      >
        {isClue ? (
          <span className={styles.clueValue}>{clueValue}</span>
        ) : grid[row][col] ? (
          <span className={styles.number}>{grid[row][col]}</span>
        ) : (
          <div className={styles.notes}>
            {Array.from({ length: gridSize }, (_, i) => i + 1).map((num) => (
              <span
                key={num}
                className={`${styles.note} ${notes[row][col].has(num) ? styles.noteActive : ""}`}
              >
                {notes[row][col].has(num) ? num : ""}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper to focus grid after button click
  const focusGrid = () => {
    if (boardRef.current) boardRef.current.focus();
  };

  // Victory screen as modal
  const renderVictoryScreen = () => {
    const points = getPoints();
    return (
      <Modal
        isOpen={victory}
        onClose={() => {}} // Prevent closing the victory modal
        title="Case Solved!"
        className={modalStyles.modalWide}
      >
        <div className={styles.whySuccess}>
          <h4>You solved the Suguru puzzle!</h4>
          <p>
            Points earned: {points} / 2{hintUsed ? " (hint used)" : ""}
          </p>
        </div>
        <div className={modalStyles.modalButtons}>
          <Button variant="secondary" size="small" onClick={onBack}>
            Back to Overview
          </Button>
        </div>
      </Modal>
    );
  };

  return (
    <div className={`${styles.minigame} ${styles.minigameFlex}`}>
      {/* How to Play Modal */}
      {showHowTo && (
        <div className={styles.modal} onClick={() => setShowHowTo(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button
              aria-label="Close"
              onClick={() => setShowHowTo(false)}
              className={styles.modalClose}
            >
              ×
            </button>
            {SUGURU_INSTRUCTIONS}
          </div>
        </div>
      )}
      {/* Hint Modal using shared Modal component */}
      <Modal
        isOpen={showHintModal}
        onClose={() => setShowHintModal(false)}
        title="Use Hint?"
      >
        <p>Are you sure you want to use a hint?</p>
        <p>
          <strong>Warning:</strong> Using a hint will prevent you from earning
          points for this mini-game.
        </p>
        <div className={modalStyles.modalButtons}>
          <Button
            onClick={() => {
              const hintCell = getHintCell();
              if (hintCell) {
                const newGrid = [...grid];
                newGrid[hintCell.row][hintCell.col] = hintCell.value;
                setGrid(newGrid);
                setHintUsed(true);
                // Call the parent component's hint handler
                if (onHint) {
                  onHint(0); // Use hint index 0 for the first hint
                }
                setShowHintModal(false);
              }
            }}
            variant="primary"
            size="small"
          >
            Yes, Show Hint
          </Button>
          <Button
            onClick={() => setShowHintModal(false)}
            variant="secondary"
            size="small"
          >
            Cancel
          </Button>
        </div>
      </Modal>
      <div className={styles.minigameHeader}>
        <div className={styles.headerFlex}>
          <div className={styles.headerLeft}>
            <h3>Why</h3>
          </div>
          <div className={styles.headerCenter}>
            <h4 className={styles.whyQuestion}>
              Why did they do it? You must fill in the blanks.
            </h4>
          </div>
          <div className={styles.headerRight}>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowHintModal(true)}
            >
              Hint
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={onBack}
              className={styles.backButton}
            >
              Back to Overview
            </Button>
          </div>
        </div>
      </div>
      <div className={styles.howToButtonWrapper}>
        <button
          aria-label="How to Play"
          onClick={() => setShowHowTo(true)}
          className={styles.howToButton}
        >
          ?
        </button>
      </div>
      <div
        className={styles.gridLayout}
        tabIndex={0}
        ref={boardRef}
        onKeyDown={(e) => {
          setKeyboardActive(true);
          handleKeyDown(e);
        }}
      >
        {Array.from({ length: gridSize }).map((_, row) =>
          Array.from({ length: gridSize }).map((_, col) => renderCell(row, col))
        )}
      </div>
      <div className={styles.buttonRow}>
        {[1, 2, 3, 4, 5].map((num) => (
          <Button
            key={num}
            size="small"
            variant="secondary"
            onMouseDown={() => {
              if (selectedCell) {
                console.log(
                  "Number button clicked:",
                  num,
                  "selectedCell:",
                  selectedCell
                );
                handleNumberInput(num);
                focusGrid();
              } else {
                console.log("Number button clicked but no cell selected:", num);
              }
            }}
            disabled={!selectedCell}
            style={{ minWidth: 40 }}
          >
            {num}
          </Button>
        ))}
      </div>
      <div className={styles.buttonRowControls}>
        <Button
          onClick={() => {
            setNoteMode((n) => !n);
            focusGrid();
          }}
          variant={noteMode ? "primary" : "secondary"}
          size="small"
        >
          {noteMode ? "Note Mode (N)" : "Normal Mode (N)"}
        </Button>
        <Button
          onMouseDown={() => {
            if (selectedCell) {
              console.log("Erase button clicked, selectedCell:", selectedCell);
              handleErase();
              focusGrid();
            } else {
              console.log("Erase button clicked but no cell selected");
            }
          }}
          disabled={!selectedCell}
          variant="secondary"
          size="small"
        >
          Erase (E)
        </Button>
        <Button onClick={handleReset} variant="secondary" size="small">
          Reset Grid
        </Button>
      </div>

      {/* Victory Modal */}
      {renderVictoryScreen()}
    </div>
  );
};

export default WhyGame;
