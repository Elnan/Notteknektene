import React, { useState, useRef } from "react";
import styles from "./SumGrid.module.css";
import puzzles, { getSolutionGrid } from "./gameConfig";
import OnScreenKeyboard from "../../../components/OnScreenKeyboard";
import Modal from "../../../components/Modal";
import TaskOpener from "../../../components/TaskOpener/TaskOpener";
import { useTaskOpener } from "../../../hooks/useTaskOpener";

const GRID_SIZE = 5;
const EMPTY_CELL = "";
const NUMBER_KEYS = [
  ["1", "2", "3", "4", "5"],
  ["6", "7", "8", "9", "0"],
  ["←", "Clear"],
];

function getInitialGrid() {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(EMPTY_CELL));
}

function checkColumnSums(grid, colSums) {
  const colStatus = Array(GRID_SIZE)
    .fill("")
    .map((_, j) => {
      const column = grid.map((row) => row[j]);
      const allFilled = column.every((cell) => cell !== EMPTY_CELL);
      if (!allFilled) return ""; // Only check complete columns

      const sum = column.reduce((acc, val) => acc + Number(val), 0);
      return sum === colSums[j] ? "correct" : "incorrect";
    });
  return colStatus;
}

function isSolved(grid, solution) {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (Number(grid[i][j]) !== solution[i][j]) return false;
    }
  }
  return true;
}

const SumGrid = () => {
  const [round, setRound] = useState(0);
  const [grid, setGrid] = useState(getInitialGrid());
  const [selected, setSelected] = useState({ row: 0, col: 0 });
  const [moveCount, setMoveCount] = useState(0);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const inputRefs = useRef([]);

  // Task opener hook
  const { isOpened, handleTaskOpen } = useTaskOpener("sum-grid");

  const puzzle = puzzles[round];
  const solution = getSolutionGrid(puzzle);
  const colStatus = checkColumnSums(grid, puzzle.colSums);

  // Focus management for keyboard input
  React.useEffect(() => {
    if (inputRefs.current[selected.row * GRID_SIZE + selected.col]) {
      inputRefs.current[selected.row * GRID_SIZE + selected.col].focus();
    }
  }, [selected]);

  // Handle input (keyboard or on-screen)
  const handleInput = (value) => {
    if (value === "←" || value === "Clear") {
      // Erase, do not increment move count
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[selected.row][selected.col] = "";
        return next;
      });
      return;
    }
    // Only allow numbers, up to 2 digits
    if (/^\d$/.test(value)) {
      const prev = grid[selected.row][selected.col] || "";
      let newValue = prev.length < 2 ? prev + value : value;
      if (Number(newValue) > 99) newValue = value; // Max 2 digits
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[selected.row][selected.col] = newValue;
        return next;
      });
      setMoveCount((c) => c + 1);
    }
  };

  // Keyboard input
  const handleKeyDown = (e, rowIdx, colIdx) => {
    if (e.key === "ArrowUp" && rowIdx > 0)
      setSelected({ row: rowIdx - 1, col: colIdx });
    else if (e.key === "ArrowDown" && rowIdx < GRID_SIZE - 1)
      setSelected({ row: rowIdx + 1, col: colIdx });
    else if (e.key === "ArrowLeft" && colIdx > 0)
      setSelected({ row: rowIdx, col: colIdx - 1 });
    else if (e.key === "ArrowRight" && colIdx < GRID_SIZE - 1)
      setSelected({ row: rowIdx, col: colIdx + 1 });
    else if (e.key === "Backspace" || e.key === "Delete") {
      // Only erase, do not increment move count
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[rowIdx][colIdx] = "";
        return next;
      });
    }
  };

  // Hint logic
  const handleHint = () => setShowHintModal(true);
  const confirmHint = () => {
    // Find a random empty cell and fill it with the correct value
    const emptyCells = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j] === EMPTY_CELL) emptyCells.push([i, j]);
      }
    }
    if (emptyCells.length === 0) return;
    const [i, j] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[i][j] = solution[i][j].toString();
      return next;
    });
    setHintUsed(true);
    setMoveCount((c) => c + 1);
    setShowHintModal(false);
  };

  // Reset
  const handleReset = () => {
    setGrid(getInitialGrid());
    setMoveCount(0);
    setHintUsed(false);
    setShowSuccess(false);
  };

  // Round navigation
  const handleRoundChange = (idx) => {
    setRound(idx);
    setGrid(getInitialGrid());
    setMoveCount(0);
    setHintUsed(false);
    setShowSuccess(false);
  };

  // Check for win
  React.useEffect(() => {
    if (isSolved(grid, solution)) {
      setShowSuccess(true);
    }
  }, [grid, solution]);

  const gameContent = (
    <div className={styles.sumGridContainer}>
      <div className={styles.roundNav}>
        {puzzles.map((_, idx) => (
          <button
            key={idx}
            className={
              styles.roundButton + (round === idx ? " " + styles.active : "")
            }
            onClick={() => handleRoundChange(idx)}
            disabled={round === idx}
          >
            Runde {idx + 1}
          </button>
        ))}
      </div>
      <div className={styles.moveCounter}>Trekk: {moveCount}</div>
      <div className={styles.controls}>
        <button
          className={styles.hintButton}
          onClick={handleHint}
          disabled={hintUsed}
        >
          Hint
        </button>
        <button className={styles.resetButton} onClick={handleReset}>
          Nullstill
        </button>
      </div>
      <div className={styles.grid}>
        {/* Top row: empty cell, then column numbers */}
        <div></div>
        {puzzle.colNumbers.map((num, j) => (
          <div key={"col-num-" + j} className={styles.numberLabel}>
            {num}
          </div>
        ))}

        {/* Grid rows */}
        {grid.map((row, i) => [
          // Row number
          <div key={"row-num-" + i} className={styles.numberLabel}>
            {puzzle.rowNumbers[i]}
          </div>,
          // Cells
          ...row.map((cell, j) => (
            <input
              key={i + "-" + j}
              className={styles.cell}
              value={cell}
              maxLength={2}
              onFocus={() => setSelected({ row: i, col: j })}
              onChange={(e) => {
                let val = e.target.value.replace(/[^\d]/g, "");
                if (val.length > 2) val = val.slice(0, 2);
                setGrid((prev) => {
                  const next = prev.map((row) => [...row]);
                  next[i][j] = val;
                  return next;
                });
                if (val !== "") setMoveCount((c) => c + 1);
              }}
              onKeyDown={(e) => handleKeyDown(e, i, j)}
              ref={(el) => (inputRefs.current[i * GRID_SIZE + j] = el)}
              tabIndex={0}
              aria-label={`Rad ${i + 1}, Kolonne ${j + 1}`}
              autoComplete="off"
            />
          )),
        ])}

        {/* Bottom row: empty cell, then column sums */}
        <div></div>
        {puzzle.colSums.map((sum, j) => (
          <div
            key={"col-sum-" + j}
            className={
              styles.colSum +
              (colStatus[j] === "correct"
                ? " " + styles.correct
                : colStatus[j] === "incorrect"
                  ? " " + styles.incorrect
                  : "")
            }
          >
            {sum}
          </div>
        ))}
      </div>
      <OnScreenKeyboard
        keys={NUMBER_KEYS}
        onKeyPress={handleInput}
        disabledKeys={[]}
        pressedKey={null}
        inPlayKeys={[]}
        keyStates={{}}
      />
      {/* Hint Modal */}
      {showHintModal && (
        <Modal onClose={() => setShowHintModal(false)}>
          <div>
            <h3>Er du sikker på at du vil bruke et hint?</h3>
            <p>Et riktig tall vil bli avslørt på brettet.</p>
            <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
              <button className={styles.hintButton} onClick={confirmHint}>
                Ja, vis hint
              </button>
              <button
                className={styles.resetButton}
                onClick={() => setShowHintModal(false)}
              >
                Avbryt
              </button>
            </div>
          </div>
        </Modal>
      )}
      {/* Success Modal */}
      {showSuccess && (
        <Modal onClose={() => setShowSuccess(false)}>
          <div>
            <h2>Gratulerer!</h2>
            <p>Du løste oppgaven på {moveCount} trekk.</p>
            <button
              className={styles.hintButton}
              onClick={() => setShowSuccess(false)}
            >
              Lukk
            </button>
          </div>
        </Modal>
      )}
    </div>
  );

  return (
    <TaskOpener
      taskName="Sum Grid"
      taskDescription="Fyll ut rutenettet slik at summen av tallene i hver kolonne matcher det oppgitte tallet. Bruk tallene som er gitt for hver rad og kolonne som hint."
      onTaskOpen={handleTaskOpen}
      isOpened={isOpened}
    >
      {gameContent}
    </TaskOpener>
  );
};

export default SumGrid;
