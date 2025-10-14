import React from "react";
import styles from "./HowGame.module.css";

const HintGridPreview = ({ size, dots, solutionPath }) => {
  // Build a grid with dots and yellow path
  const grid = Array(size)
    .fill()
    .map(() => Array(size).fill(null));

  // Place dots
  dots.forEach((dot) => {
    const [startRow, startCol] = dot.start;
    const [endRow, endCol] = dot.end;
    grid[startRow][startCol] = { type: "dot", color: dot.color };
    grid[endRow][endCol] = { type: "dot", color: dot.color };
  });

  // Place yellow path
  solutionPath.forEach(({ row, col }) => {
    if (!grid[row][col]) {
      grid[row][col] = { type: "path", color: "yellow" };
    }
  });

  // Render grid
  return (
    <div
      className={styles.grid}
      style={{
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gridTemplateRows: `repeat(${size}, 1fr)`,
        maxWidth: 300,
        maxHeight: 300,
        margin: "0 auto",
        pointerEvents: "none",
        opacity: 0.9,
      }}
    >
      {grid.map((rowArr, rowIdx) =>
        rowArr.map((cell, colIdx) => {
          let cellClass = styles.cell;
          if (cell) {
            if (cell.type === "dot")
              cellClass += ` ${styles.dot} ${styles[cell.color]}`;
            if (cell.type === "path")
              cellClass += ` ${styles.path} ${styles[cell.color]}`;
          }
          return <div key={`${rowIdx}-${colIdx}`} className={cellClass}></div>;
        })
      )}
    </div>
  );
};

export default HintGridPreview;
